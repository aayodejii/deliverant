import logging

from django.db import transaction
from django.utils import timezone

from apps.attempts.models import Attempt
from apps.deliveries.models import Delivery
from apps.deliveries.state_machine import DeliveryStateMachine
from deliverant.celery import app

logger = logging.getLogger("workers.lease")


@app.task
def recover_expired_leases():
    """Recover deliveries with expired leases (crashed workers)."""
    now = timezone.now()

    expired_deliveries = Delivery.objects.filter(
        status=Delivery.Status.IN_PROGRESS,
        lease_expires_at__lt=now
    ).select_related("tenant")[:100]

    recovered_count = 0

    for delivery in expired_deliveries:
        try:
            with transaction.atomic():
                delivery = Delivery.objects.select_for_update().get(id=delivery.id)

                if delivery.status != Delivery.Status.IN_PROGRESS:
                    continue

                attempt_number = delivery.attempts_count + 1

                Attempt.objects.create(
                    tenant=delivery.tenant,
                    delivery=delivery,
                    attempt_number=attempt_number,
                    started_at=delivery.updated_at,
                    ended_at=now,
                    latency_ms=None,
                    outcome=Attempt.Outcome.RETRYABLE_FAILURE,
                    classification=Attempt.Classification.WORKER_CRASH_OR_UNKNOWN,
                    http_status=None,
                    response_headers_json=None,
                    response_body_snippet=None,
                    error_detail="Worker crashed or lease expired",
                    request_payload_hash=delivery.event.payload_hash,
                )

                DeliveryStateMachine.recover_lease(delivery)
                recovered_count += 1

                logger.warning("Recovered expired lease", extra={
                    "delivery_id": str(delivery.id),
                    "tenant_id": str(delivery.tenant_id),
                    "attempt_number": attempt_number,
                })

        except Exception as e:
            logger.error("Error recovering delivery", extra={
                "delivery_id": str(delivery.id),
                "error": str(e),
            })

    if recovered_count > 0:
        logger.info("Lease recovery completed", extra={"recovered": recovered_count})

    return {"recovered": recovered_count}
