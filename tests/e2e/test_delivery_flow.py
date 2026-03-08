"""
E2E test: full delivery lifecycle.

Ingest event → scheduler picks up → worker delivers → SUCCESS

Uses Celery eager mode and mocked HTTP to simulate the full flow
without external dependencies.
"""
from unittest.mock import patch, MagicMock

import pytest
from rest_framework.test import APIClient

from apps.api.prefixed_ids import from_prefixed
from apps.deliveries.models import Delivery
from apps.attempts.models import Attempt
from tests.factories import create_api_key, create_endpoint, create_tenant


@pytest.mark.django_db
class TestDeliveryFlow:
    def test_happy_path(self, settings):
        settings.CELERY_TASK_ALWAYS_EAGER = True
        settings.CELERY_TASK_EAGER_PROPAGATES = True

        tenant = create_tenant("e2e-tenant")
        _, raw_key = create_api_key(tenant)
        endpoint = create_endpoint(tenant, url="https://webhook.example.com/hook")

        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {raw_key}")

        response = client.post("/v1/events", {
            "type": "order.created",
            "payload": {"order_id": 42, "amount": 99.99},
            "endpoint_ids": [f"ep_{endpoint.id}"],
            "idempotency_key": "e2e-test-key",
        }, format="json")

        assert response.status_code == 202
        prefixed_delivery_id = response.json()["deliveries"][0]["delivery_id"]
        assert prefixed_delivery_id.startswith("del_")
        delivery_id = from_prefixed(prefixed_delivery_id, "del_")

        delivery = Delivery.objects.get(id=delivery_id)
        assert delivery.status == Delivery.Status.PENDING

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.headers = {"content-type": "application/json"}
        mock_response.text = '{"received": true}'

        with patch("workers.delivery.httpx.Client") as mock_client:
            mock_client.return_value.__enter__ = MagicMock(return_value=MagicMock(
                post=MagicMock(return_value=mock_response)
            ))
            mock_client.return_value.__exit__ = MagicMock(return_value=False)

            with patch("workers.delivery.execute_delivery") as mock_execute:
                mock_execute.delay = MagicMock()

                from workers.scheduler import schedule_due_deliveries
                result = schedule_due_deliveries()

                assert result["scheduled"] >= 1

            delivery.refresh_from_db()
            assert delivery.status == Delivery.Status.SCHEDULED

            from workers.delivery import execute_delivery
            exec_result = execute_delivery(delivery_id)

        assert exec_result["status"] == "completed"
        assert exec_result["outcome"] == "SUCCESS"

        delivery.refresh_from_db()
        assert delivery.status == Delivery.Status.DELIVERED
        assert delivery.terminal_at is not None

        attempt = Attempt.objects.filter(delivery=delivery).first()
        assert attempt is not None
        assert attempt.outcome == Attempt.Outcome.SUCCESS
        assert attempt.http_status == 200

        detail_response = client.get(f"/v1/deliveries/del_{delivery_id}")
        assert detail_response.status_code == 200
        assert detail_response.json()["status"] == "DELIVERED"
        assert len(detail_response.json()["attempts"]) == 1
