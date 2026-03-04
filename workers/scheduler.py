import logging

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from apps.deliveries.models import Delivery
from apps.deliveries.state_machine import DeliveryStateMachine
from deliverant.celery import app
from workers import kill_switch
from apps.endpoints.models import Endpoint
from workers.metrics import backlog_size, endpoint_success_rate

logger = logging.getLogger("workers.scheduler")


@app.task
def schedule_due_deliveries():
    if kill_switch.is_active():
        logger.info("Scheduler skipped due to kill switch")
        return {"status": "skipped", "reason": "kill_switch_active"}

    now = timezone.now()

    with transaction.atomic():
        pending_deliveries = Delivery.objects.filter(
            status=Delivery.Status.PENDING
        ).select_related("endpoint")[:100]

        scheduled_count = 0
        for delivery in pending_deliveries:
            if delivery.endpoint.status == delivery.endpoint.Status.ACTIVE:
                try:
                    DeliveryStateMachine.schedule(delivery)
                    scheduled_count += 1
                except Exception as e:
                    logger.error("Error scheduling delivery", extra={
                        "delivery_id": str(delivery.id),
                        "error": str(e),
                    })

    dispatched_count = 0
    scheduled_deliveries = Delivery.objects.filter(
        status=Delivery.Status.SCHEDULED,
        next_attempt_at__lte=now
    ).select_related("endpoint")[:100]

    for delivery in scheduled_deliveries:
        if delivery.endpoint.status != delivery.endpoint.Status.ACTIVE:
            continue

        in_flight_count = Delivery.objects.filter(
            endpoint=delivery.endpoint,
            status=Delivery.Status.IN_PROGRESS
        ).count()

        if in_flight_count >= settings.MAX_ENDPOINT_CONCURRENCY:
            continue

        from workers.delivery import execute_delivery
        execute_delivery.delay(str(delivery.id))
        dispatched_count += 1

    pending_count = Delivery.objects.filter(status=Delivery.Status.PENDING).count()
    scheduled_remaining = Delivery.objects.filter(status=Delivery.Status.SCHEDULED).count()
    in_progress_count = Delivery.objects.filter(status=Delivery.Status.IN_PROGRESS).count()
    backlog_size.labels(status="PENDING").set(pending_count)
    backlog_size.labels(status="SCHEDULED").set(scheduled_remaining)
    backlog_size.labels(status="IN_PROGRESS").set(in_progress_count)

    for ep in Endpoint.objects.filter(status=Endpoint.Status.ACTIVE):
        total = Delivery.objects.filter(endpoint=ep, status__in=[
            Delivery.Status.DELIVERED, Delivery.Status.FAILED,
            Delivery.Status.EXPIRED,
        ]).count()
        if total > 0:
            success = Delivery.objects.filter(endpoint=ep, status=Delivery.Status.DELIVERED).count()
            endpoint_success_rate.labels(
                endpoint_id=str(ep.id),
                endpoint_name=ep.name,
            ).set(success / total)

    if scheduled_count > 0 or dispatched_count > 0:
        logger.info("Scheduler cycle completed", extra={
            "scheduled": scheduled_count,
            "dispatched": dispatched_count,
            "backlog_pending": pending_count,
            "backlog_scheduled": scheduled_remaining,
        })

    return {
        "scheduled": scheduled_count,
        "dispatched": dispatched_count,
    }
