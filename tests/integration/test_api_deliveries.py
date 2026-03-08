import uuid

import pytest
from django.utils import timezone

from apps.attempts.models import Attempt
from apps.deliveries.models import Delivery
from tests.factories import create_attempt, create_delivery, create_endpoint, create_event, create_tenant


@pytest.mark.django_db
class TestDeliveryList:
    def test_list_deliveries(self, auth_client, delivery):
        response = auth_client.get("/v1/deliveries")
        assert response.status_code == 200
        assert len(response.json()["results"]) >= 1
        assert "has_more" in response.json()

    def test_filter_by_status(self, auth_client, tenant, event, endpoint):
        create_delivery(tenant, event, endpoint, status=Delivery.Status.DELIVERED)
        create_delivery(tenant, event, endpoint, status=Delivery.Status.FAILED)

        response = auth_client.get("/v1/deliveries?status=DELIVERED")
        assert response.status_code == 200
        for d in response.json()["results"]:
            assert d["status"] == "DELIVERED"

    def test_filter_by_endpoint_id(self, auth_client, tenant, event, endpoint):
        create_delivery(tenant, event, endpoint)

        response = auth_client.get(f"/v1/deliveries?endpoint_id=ep_{endpoint.id}")
        assert response.status_code == 200
        for d in response.json()["results"]:
            assert d["endpoint_id"] == f"ep_{endpoint.id}"

    def test_search(self, auth_client, tenant, endpoint):
        event = create_event(tenant, type="order.completed")
        create_delivery(tenant, event, endpoint)

        response = auth_client.get("/v1/deliveries?search=order.completed")
        assert response.status_code == 200
        assert len(response.json()["results"]) >= 1

    def test_cursor_pagination(self, auth_client, tenant, event, endpoint):
        for _ in range(5):
            create_delivery(tenant, event, endpoint)

        response = auth_client.get("/v1/deliveries?limit=2")
        assert response.status_code == 200
        body = response.json()
        assert len(body["results"]) == 2
        assert body["has_more"] is True
        assert body["next_cursor"] is not None

        response2 = auth_client.get(f"/v1/deliveries?limit=2&cursor={body['next_cursor']}")
        assert response2.status_code == 200
        assert len(response2.json()["results"]) == 2


@pytest.mark.django_db
class TestDeliveryDetail:
    def test_get_delivery_with_attempts(self, auth_client, tenant, delivery):
        create_attempt(tenant, delivery, attempt_number=1)

        response = auth_client.get(f"/v1/deliveries/del_{delivery.id}")
        assert response.status_code == 200
        body = response.json()
        assert body["id"] == f"del_{delivery.id}"
        assert len(body["attempts"]) == 1
        assert body["attempts"][0]["id"].startswith("att_")

    def test_get_nonexistent(self, auth_client):
        response = auth_client.get(f"/v1/deliveries/del_{uuid.uuid4()}")
        assert response.status_code == 404


@pytest.mark.django_db
class TestDeliveryCancel:
    def test_cancel_non_terminal(self, auth_client, tenant, event, endpoint):
        delivery = create_delivery(tenant, event, endpoint, status=Delivery.Status.PENDING)

        response = auth_client.post(f"/v1/deliveries/del_{delivery.id}/cancel")
        assert response.status_code == 200
        assert response.json()["status"] == "cancelled"
        assert response.json()["delivery_id"].startswith("del_")

        delivery.refresh_from_db()
        assert delivery.status == Delivery.Status.CANCELLED

    def test_cancel_terminal_fails(self, auth_client, tenant, event, endpoint):
        delivery = create_delivery(
            tenant, event, endpoint,
            status=Delivery.Status.DELIVERED,
            terminal_at=timezone.now(),
        )

        response = auth_client.post(f"/v1/deliveries/del_{delivery.id}/cancel")
        assert response.status_code == 409
