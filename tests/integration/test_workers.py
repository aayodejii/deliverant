from datetime import timedelta
from unittest.mock import patch, MagicMock

import pytest
from django.utils import timezone

from apps.attempts.models import Attempt
from apps.deliveries.models import Delivery
from apps.deliveries.state_machine import DeliveryStateMachine
from tests.factories import create_delivery, create_endpoint, create_event, create_tenant
from workers import kill_switch


@pytest.fixture
def setup(db):
    tenant = create_tenant()
    endpoint = create_endpoint(tenant, url="https://httpbin.org/post")
    event = create_event(tenant)
    return tenant, endpoint, event


@pytest.mark.django_db
class TestExecuteDelivery:
    def test_successful_delivery(self, setup, celery_eager):
        tenant, endpoint, event = setup
        delivery = create_delivery(tenant, event, endpoint, status=Delivery.Status.SCHEDULED)

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.headers = {"content-type": "application/json"}
        mock_response.text = '{"ok": true}'

        with patch("workers.delivery.httpx.Client") as mock_client:
            mock_client.return_value.__enter__ = MagicMock(return_value=MagicMock(
                post=MagicMock(return_value=mock_response)
            ))
            mock_client.return_value.__exit__ = MagicMock(return_value=False)

            from workers.delivery import execute_delivery
            result = execute_delivery(str(delivery.id))

        assert result["status"] == "completed"
        assert result["outcome"] == "SUCCESS"

        delivery.refresh_from_db()
        assert delivery.status == Delivery.Status.DELIVERED
        assert Attempt.objects.filter(delivery=delivery).count() == 1

    def test_respects_kill_switch(self, setup, celery_eager):
        tenant, endpoint, event = setup
        delivery = create_delivery(tenant, event, endpoint, status=Delivery.Status.SCHEDULED)

        kill_switch.activate()

        from workers.delivery import execute_delivery
        result = execute_delivery(str(delivery.id))

        assert result["status"] == "skipped"
        assert result["reason"] == "kill_switch_active"

    def test_retryable_failure(self, setup, celery_eager):
        tenant, endpoint, event = setup
        delivery = create_delivery(
            tenant, event, endpoint,
            status=Delivery.Status.SCHEDULED,
            first_scheduled_at=timezone.now(),
        )

        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_response.headers = {}
        mock_response.text = "Internal Server Error"

        with patch("workers.delivery.httpx.Client") as mock_client:
            mock_client.return_value.__enter__ = MagicMock(return_value=MagicMock(
                post=MagicMock(return_value=mock_response)
            ))
            mock_client.return_value.__exit__ = MagicMock(return_value=False)

            from workers.delivery import execute_delivery
            result = execute_delivery(str(delivery.id))

        assert result["outcome"] == "RETRYABLE_FAILURE"

        delivery.refresh_from_db()
        assert delivery.status == Delivery.Status.SCHEDULED

    def test_non_retryable_failure(self, setup, celery_eager):
        tenant, endpoint, event = setup
        delivery = create_delivery(tenant, event, endpoint, status=Delivery.Status.SCHEDULED)

        mock_response = MagicMock()
        mock_response.status_code = 400
        mock_response.headers = {}
        mock_response.text = "Bad Request"

        with patch("workers.delivery.httpx.Client") as mock_client:
            mock_client.return_value.__enter__ = MagicMock(return_value=MagicMock(
                post=MagicMock(return_value=mock_response)
            ))
            mock_client.return_value.__exit__ = MagicMock(return_value=False)

            from workers.delivery import execute_delivery
            result = execute_delivery(str(delivery.id))

        assert result["outcome"] == "NON_RETRYABLE_FAILURE"

        delivery.refresh_from_db()
        assert delivery.status == Delivery.Status.FAILED

    def test_network_error(self, setup, celery_eager):
        tenant, endpoint, event = setup
        delivery = create_delivery(
            tenant, event, endpoint,
            status=Delivery.Status.SCHEDULED,
            first_scheduled_at=timezone.now(),
        )

        with patch("workers.delivery.httpx.Client") as mock_client:
            mock_client.return_value.__enter__ = MagicMock(return_value=MagicMock(
                post=MagicMock(side_effect=ConnectionError("Connection refused"))
            ))
            mock_client.return_value.__exit__ = MagicMock(return_value=False)

            from workers.delivery import execute_delivery
            result = execute_delivery(str(delivery.id))

        assert result["outcome"] == "RETRYABLE_FAILURE"
        attempt = Attempt.objects.filter(delivery=delivery).first()
        assert attempt.classification == Attempt.Classification.NETWORK_ERROR


@pytest.mark.django_db
class TestScheduleDueDeliveries:
    def test_schedules_pending_deliveries(self, setup, celery_eager):
        tenant, endpoint, event = setup
        delivery = create_delivery(tenant, event, endpoint, status=Delivery.Status.PENDING)

        with patch("workers.delivery.execute_delivery") as mock_task:
            mock_task.delay = MagicMock()
            from workers.scheduler import schedule_due_deliveries
            result = schedule_due_deliveries()

        assert result["scheduled"] >= 1

        delivery.refresh_from_db()
        assert delivery.status == Delivery.Status.SCHEDULED

    def test_skips_paused_endpoints(self, setup, celery_eager):
        tenant, endpoint, event = setup
        endpoint.pause()
        delivery = create_delivery(tenant, event, endpoint, status=Delivery.Status.PENDING)

        with patch("workers.delivery.execute_delivery") as mock_task:
            mock_task.delay = MagicMock()
            from workers.scheduler import schedule_due_deliveries
            schedule_due_deliveries()

        delivery.refresh_from_db()
        assert delivery.status == Delivery.Status.PENDING

    def test_respects_concurrency_limit(self, setup, settings, celery_eager):
        tenant, endpoint, event = setup

        for _ in range(settings.MAX_ENDPOINT_CONCURRENCY):
            create_delivery(tenant, event, endpoint, status=Delivery.Status.IN_PROGRESS)

        delivery = create_delivery(
            tenant, event, endpoint,
            status=Delivery.Status.SCHEDULED,
            next_attempt_at=timezone.now() - timedelta(seconds=5),
        )

        with patch("workers.delivery.execute_delivery") as mock_task:
            mock_task.delay = MagicMock()
            from workers.scheduler import schedule_due_deliveries
            schedule_due_deliveries()

        assert mock_task.delay.call_count == 0


@pytest.mark.django_db
class TestRecoverExpiredLeases:
    def test_recovers_expired_leases(self, setup, celery_eager):
        tenant, endpoint, event = setup
        delivery = create_delivery(
            tenant, event, endpoint,
            status=Delivery.Status.IN_PROGRESS,
            lease_expires_at=timezone.now() - timedelta(seconds=60),
            first_scheduled_at=timezone.now() - timedelta(hours=1),
        )

        from workers.lease import recover_expired_leases
        result = recover_expired_leases()

        assert result["recovered"] == 1

        delivery.refresh_from_db()
        assert delivery.status == Delivery.Status.SCHEDULED
        assert delivery.lease_id is None

    def test_creates_crash_attempt(self, setup, celery_eager):
        tenant, endpoint, event = setup
        delivery = create_delivery(
            tenant, event, endpoint,
            status=Delivery.Status.IN_PROGRESS,
            lease_expires_at=timezone.now() - timedelta(seconds=60),
            first_scheduled_at=timezone.now() - timedelta(hours=1),
        )

        from workers.lease import recover_expired_leases
        recover_expired_leases()

        attempt = Attempt.objects.filter(delivery=delivery).first()
        assert attempt is not None
        assert attempt.classification == Attempt.Classification.WORKER_CRASH_OR_UNKNOWN
        assert attempt.outcome == Attempt.Outcome.RETRYABLE_FAILURE
