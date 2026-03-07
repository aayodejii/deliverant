import pytest
from datetime import timedelta
from unittest.mock import patch

from django.utils import timezone

from apps.deliveries.models import Delivery
from apps.deliveries.state_machine import (
    BACKOFF_SCHEDULE,
    DeliveryStateMachine,
    compute_next_attempt,
)
from tests.factories import create_delivery, create_endpoint, create_event, create_tenant


@pytest.fixture
def setup(db):
    tenant = create_tenant()
    endpoint = create_endpoint(tenant)
    event = create_event(tenant)
    return tenant, endpoint, event


class TestSchedule:
    def test_pending_to_scheduled(self, setup):
        tenant, endpoint, event = setup
        delivery = create_delivery(tenant, event, endpoint, status=Delivery.Status.PENDING)

        result = DeliveryStateMachine.schedule(delivery)

        assert result.status == Delivery.Status.SCHEDULED
        assert result.next_attempt_at is not None
        assert result.first_scheduled_at is not None

    def test_rejects_non_pending(self, setup):
        tenant, endpoint, event = setup
        delivery = create_delivery(tenant, event, endpoint, status=Delivery.Status.SCHEDULED)

        with pytest.raises(ValueError, match="Cannot schedule"):
            DeliveryStateMachine.schedule(delivery)

    def test_preserves_first_scheduled_at(self, setup):
        tenant, endpoint, event = setup
        earlier = timezone.now() - timedelta(hours=1)
        delivery = create_delivery(
            tenant, event, endpoint,
            status=Delivery.Status.PENDING,
            first_scheduled_at=earlier,
        )

        result = DeliveryStateMachine.schedule(delivery)

        assert result.first_scheduled_at == earlier


class TestAcquireLease:
    def test_scheduled_to_in_progress(self, setup):
        tenant, endpoint, event = setup
        delivery = create_delivery(tenant, event, endpoint, status=Delivery.Status.SCHEDULED)

        result = DeliveryStateMachine.acquire_lease(delivery)

        assert result.status == Delivery.Status.IN_PROGRESS
        assert result.lease_id is not None
        assert result.lease_expires_at is not None
        assert result.next_attempt_at is None

    def test_rejects_paused_endpoint(self, setup):
        tenant, endpoint, event = setup
        endpoint.pause()
        delivery = create_delivery(tenant, event, endpoint, status=Delivery.Status.SCHEDULED)

        with pytest.raises(ValueError, match="paused endpoint"):
            DeliveryStateMachine.acquire_lease(delivery)

    def test_rejects_non_scheduled(self, setup):
        tenant, endpoint, event = setup
        delivery = create_delivery(tenant, event, endpoint, status=Delivery.Status.PENDING)

        with pytest.raises(ValueError, match="Cannot acquire lease"):
            DeliveryStateMachine.acquire_lease(delivery)


class TestCompleteSuccess:
    def test_in_progress_to_delivered(self, setup):
        tenant, endpoint, event = setup
        delivery = create_delivery(tenant, event, endpoint, status=Delivery.Status.IN_PROGRESS)

        result = DeliveryStateMachine.complete_success(delivery)

        assert result.status == Delivery.Status.DELIVERED
        assert result.terminal_at is not None
        assert result.next_attempt_at is None
        assert result.lease_id is None

    def test_rejects_non_in_progress(self, setup):
        tenant, endpoint, event = setup
        delivery = create_delivery(tenant, event, endpoint, status=Delivery.Status.SCHEDULED)

        with pytest.raises(ValueError, match="Cannot mark delivery"):
            DeliveryStateMachine.complete_success(delivery)


class TestCompleteRetryable:
    def test_in_progress_to_scheduled(self, setup):
        tenant, endpoint, event = setup
        delivery = create_delivery(
            tenant, event, endpoint,
            status=Delivery.Status.IN_PROGRESS,
            first_scheduled_at=timezone.now(),
        )

        result = DeliveryStateMachine.complete_retryable(delivery, 1)

        assert result.status == Delivery.Status.SCHEDULED
        assert result.attempts_count == 1
        assert result.next_attempt_at is not None
        assert result.lease_id is None

    def test_max_attempts_to_failed(self, setup, settings):
        tenant, endpoint, event = setup
        delivery = create_delivery(
            tenant, event, endpoint,
            status=Delivery.Status.IN_PROGRESS,
            first_scheduled_at=timezone.now(),
        )

        result = DeliveryStateMachine.complete_retryable(delivery, settings.MAX_ATTEMPTS)

        assert result.status == Delivery.Status.FAILED
        assert "Max attempts" in result.terminal_reason
        assert result.terminal_at is not None

    def test_ttl_exceeded_to_expired(self, setup, settings):
        tenant, endpoint, event = setup
        delivery = create_delivery(
            tenant, event, endpoint,
            status=Delivery.Status.IN_PROGRESS,
            first_scheduled_at=timezone.now() - timedelta(hours=settings.MAX_DELIVERY_TTL_HOURS + 1),
        )

        result = DeliveryStateMachine.complete_retryable(delivery, 1)

        assert result.status == Delivery.Status.EXPIRED
        assert result.terminal_reason == "TTL exceeded"


class TestCompleteNonRetryable:
    def test_in_progress_to_failed(self, setup):
        tenant, endpoint, event = setup
        delivery = create_delivery(tenant, event, endpoint, status=Delivery.Status.IN_PROGRESS)

        result = DeliveryStateMachine.complete_non_retryable(delivery, "HTTP 400")

        assert result.status == Delivery.Status.FAILED
        assert result.terminal_reason == "HTTP 400"
        assert result.terminal_at is not None
        assert result.lease_id is None


class TestCancel:
    def test_cancel_non_terminal(self, setup):
        tenant, endpoint, event = setup
        for status in [Delivery.Status.PENDING, Delivery.Status.SCHEDULED, Delivery.Status.IN_PROGRESS]:
            delivery = create_delivery(tenant, event, endpoint, status=status)
            result = DeliveryStateMachine.cancel(delivery)
            assert result.status == Delivery.Status.CANCELLED
            assert result.terminal_at is not None

    def test_rejects_terminal_states(self, setup):
        tenant, endpoint, event = setup
        for status in [Delivery.Status.DELIVERED, Delivery.Status.FAILED, Delivery.Status.EXPIRED, Delivery.Status.CANCELLED]:
            delivery = create_delivery(tenant, event, endpoint, status=status)
            with pytest.raises(ValueError, match="terminal state"):
                DeliveryStateMachine.cancel(delivery)


class TestRecoverLease:
    def test_in_progress_to_scheduled(self, setup, settings):
        tenant, endpoint, event = setup
        delivery = create_delivery(tenant, event, endpoint, status=Delivery.Status.IN_PROGRESS)

        result = DeliveryStateMachine.recover_lease(delivery)

        assert result.status == Delivery.Status.SCHEDULED
        assert result.next_attempt_at is not None
        assert result.lease_id is None
        assert result.lease_expires_at is None


class TestBackoff:
    def test_jitter_within_bounds(self):
        for attempt in range(1, 11):
            base_delay = BACKOFF_SCHEDULE[min(attempt - 1, len(BACKOFF_SCHEDULE) - 1)]
            for _ in range(50):
                result = compute_next_attempt(attempt)
                delta = (result - timezone.now()).total_seconds()
                assert 0 <= delta <= base_delay + 1

    def test_attempt_beyond_schedule_uses_max(self):
        max_delay = BACKOFF_SCHEDULE[-1]
        for _ in range(20):
            result = compute_next_attempt(15)
            delta = (result - timezone.now()).total_seconds()
            assert 0 <= delta <= max_delay + 1

    def test_schedule_length(self):
        assert len(BACKOFF_SCHEDULE) == 10

    def test_schedule_is_increasing(self):
        for i in range(1, len(BACKOFF_SCHEDULE)):
            assert BACKOFF_SCHEDULE[i] >= BACKOFF_SCHEDULE[i - 1]
