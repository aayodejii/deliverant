from django.db import transaction
from django.utils import timezone

from apps.attempts.models import Attempt
from apps.deliveries.models import Delivery
from apps.deliveries.state_machine import DeliveryStateMachine
from deliverant.celery import app


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

        except Exception as e:
            print(f"Error recovering delivery {delivery.id}: {e}")

    return {"recovered": recovered_count}
