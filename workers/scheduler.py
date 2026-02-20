from django.conf import settings
from django.db import transaction
from django.utils import timezone

from apps.deliveries.models import Delivery
from apps.deliveries.state_machine import DeliveryStateMachine
from deliverant.celery import app
from workers import kill_switch


@app.task
def schedule_due_deliveries():
    if kill_switch.is_active():
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
                    print(f"Error scheduling delivery {delivery.id}: {e}")

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

    return {
        "scheduled": scheduled_count,
        "dispatched": dispatched_count,
    }
