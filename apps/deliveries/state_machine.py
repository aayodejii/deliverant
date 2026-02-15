import random
import uuid
from datetime import timedelta

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from apps.deliveries.models import Delivery


BACKOFF_SCHEDULE = [
    5,      # Attempt 1: 5 seconds
    30,     # Attempt 2: 30 seconds
    120,    # Attempt 3: 2 minutes
    600,    # Attempt 4: 10 minutes
    1800,   # Attempt 5: 30 minutes
    7200,   # Attempt 6: 2 hours
    21600,  # Attempt 7: 6 hours
    43200,  # Attempt 8: 12 hours
    64800,  # Attempt 9: 18 hours
    86400,  # Attempt 10-12: 24 hours
]


def compute_next_attempt(attempt_number):
    """Compute next attempt time with exponential backoff and full jitter."""
    base_delay = BACKOFF_SCHEDULE[min(attempt_number - 1, len(BACKOFF_SCHEDULE) - 1)]
    jittered_delay = random.uniform(0, base_delay)
    return timezone.now() + timedelta(seconds=jittered_delay)


class DeliveryStateMachine:
    """Manages delivery state transitions."""

    @staticmethod
    @transaction.atomic
    def schedule(delivery):
        """Transition from PENDING to SCHEDULED."""
        if delivery.status != Delivery.Status.PENDING:
            raise ValueError(f"Cannot schedule delivery in {delivery.status} state")

        delivery.status = Delivery.Status.SCHEDULED
        delivery.next_attempt_at = timezone.now()

        if delivery.first_scheduled_at is None:
            delivery.first_scheduled_at = timezone.now()

        delivery.save(update_fields=["status", "next_attempt_at", "first_scheduled_at", "updated_at"])
        return delivery

    @staticmethod
    @transaction.atomic
    def acquire_lease(delivery):
        """Transition from SCHEDULED to IN_PROGRESS with lease."""
        if delivery.status != Delivery.Status.SCHEDULED:
            raise ValueError(f"Cannot acquire lease for delivery in {delivery.status} state")

        if delivery.endpoint.status != delivery.endpoint.Status.ACTIVE:
            raise ValueError("Cannot acquire lease for paused endpoint")

        delivery.status = Delivery.Status.IN_PROGRESS
        delivery.lease_id = uuid.uuid4()
        delivery.lease_expires_at = timezone.now() + timedelta(seconds=settings.LEASE_DURATION_SECONDS)
        delivery.next_attempt_at = None

        delivery.save(update_fields=["status", "lease_id", "lease_expires_at", "next_attempt_at", "updated_at"])
        return delivery

    @staticmethod
    @transaction.atomic
    def complete_success(delivery):
        """Transition from IN_PROGRESS to DELIVERED."""
        if delivery.status != Delivery.Status.IN_PROGRESS:
            raise ValueError(f"Cannot mark delivery as delivered in {delivery.status} state")

        delivery.status = Delivery.Status.DELIVERED
        delivery.terminal_at = timezone.now()
        delivery.terminal_reason = "Delivered successfully"
        delivery.next_attempt_at = None
        delivery.lease_id = None
        delivery.lease_expires_at = None

        delivery.save(update_fields=[
            "status", "terminal_at", "terminal_reason", "next_attempt_at",
            "lease_id", "lease_expires_at", "updated_at"
        ])
        return delivery

    @staticmethod
    @transaction.atomic
    def complete_retryable(delivery, attempt_number):
        """Transition from IN_PROGRESS to SCHEDULED for retry."""
        if delivery.status != Delivery.Status.IN_PROGRESS:
            raise ValueError(f"Cannot retry delivery in {delivery.status} state")

        delivery.attempts_count = attempt_number
        delivery.last_attempt_at = timezone.now()
        delivery.lease_id = None
        delivery.lease_expires_at = None

        if delivery.attempts_count >= settings.MAX_ATTEMPTS:
            delivery.status = Delivery.Status.FAILED
            delivery.terminal_at = timezone.now()
            delivery.terminal_reason = f"Max attempts ({settings.MAX_ATTEMPTS}) reached"
            delivery.next_attempt_at = None
        else:
            ttl_exceeded = DeliveryStateMachine._check_ttl_exceeded(delivery)
            if ttl_exceeded:
                delivery.status = Delivery.Status.EXPIRED
                delivery.terminal_at = timezone.now()
                delivery.terminal_reason = "TTL exceeded"
                delivery.next_attempt_at = None
            else:
                delivery.status = Delivery.Status.SCHEDULED
                delivery.next_attempt_at = compute_next_attempt(delivery.attempts_count + 1)

        delivery.save(update_fields=[
            "status", "attempts_count", "last_attempt_at", "next_attempt_at",
            "terminal_at", "terminal_reason", "lease_id", "lease_expires_at", "updated_at"
        ])
        return delivery

    @staticmethod
    @transaction.atomic
    def complete_non_retryable(delivery, reason="Non-retryable failure"):
        """Transition from IN_PROGRESS to FAILED."""
        if delivery.status != Delivery.Status.IN_PROGRESS:
            raise ValueError(f"Cannot fail delivery in {delivery.status} state")

        delivery.status = Delivery.Status.FAILED
        delivery.terminal_at = timezone.now()
        delivery.terminal_reason = reason
        delivery.next_attempt_at = None
        delivery.lease_id = None
        delivery.lease_expires_at = None

        delivery.save(update_fields=[
            "status", "terminal_at", "terminal_reason", "next_attempt_at",
            "lease_id", "lease_expires_at", "updated_at"
        ])
        return delivery

    @staticmethod
    @transaction.atomic
    def expire(delivery, reason="TTL exceeded"):
        """Transition to EXPIRED."""
        if delivery.is_terminal:
            raise ValueError(f"Cannot expire delivery in terminal state {delivery.status}")

        delivery.status = Delivery.Status.EXPIRED
        delivery.terminal_at = timezone.now()
        delivery.terminal_reason = reason
        delivery.next_attempt_at = None
        delivery.lease_id = None
        delivery.lease_expires_at = None

        delivery.save(update_fields=[
            "status", "terminal_at", "terminal_reason", "next_attempt_at",
            "lease_id", "lease_expires_at", "updated_at"
        ])
        return delivery

    @staticmethod
    @transaction.atomic
    def cancel(delivery, reason="Cancelled by user"):
        """Transition to CANCELLED."""
        if delivery.is_terminal:
            raise ValueError(f"Cannot cancel delivery in terminal state {delivery.status}")

        delivery.status = Delivery.Status.CANCELLED
        delivery.terminal_at = timezone.now()
        delivery.terminal_reason = reason
        delivery.next_attempt_at = None
        delivery.lease_id = None
        delivery.lease_expires_at = None

        delivery.save(update_fields=[
            "status", "terminal_at", "terminal_reason", "next_attempt_at",
            "lease_id", "lease_expires_at", "updated_at"
        ])
        return delivery

    @staticmethod
    @transaction.atomic
    def recover_lease(delivery):
        """Recover from crashed worker - transition IN_PROGRESS back to SCHEDULED."""
        if delivery.status != Delivery.Status.IN_PROGRESS:
            raise ValueError(f"Cannot recover lease for delivery in {delivery.status} state")

        delivery.status = Delivery.Status.SCHEDULED
        delivery.next_attempt_at = timezone.now() + timedelta(seconds=settings.LEASE_RECOVERY_DELAY_SECONDS)
        delivery.lease_id = None
        delivery.lease_expires_at = None

        delivery.save(update_fields=[
            "status", "next_attempt_at", "lease_id", "lease_expires_at", "updated_at"
        ])
        return delivery

    @staticmethod
    def _check_ttl_exceeded(delivery):
        """Check if delivery TTL has been exceeded, accounting for endpoint pause time."""
        if delivery.first_scheduled_at is None:
            return False

        ttl = timedelta(hours=settings.MAX_DELIVERY_TTL_HOURS)
        elapsed = timezone.now() - delivery.first_scheduled_at

        if delivery.endpoint.paused_at:
            pause_duration = timezone.now() - delivery.endpoint.paused_at
            elapsed -= pause_duration

        return elapsed > ttl
