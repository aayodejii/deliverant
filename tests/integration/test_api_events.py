import uuid
from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.api.prefixed_ids import from_prefixed
from apps.deliveries.models import Delivery
from apps.events.models import Event
from tests.factories import create_api_key, create_delivery, create_endpoint, create_event, create_tenant


@pytest.mark.django_db
class TestEventCreate:
    def test_requires_auth(self):
        client = APIClient()
        response = client.post("/v1/events", {}, format="json")
        assert response.status_code == 401

    def test_creates_event_and_deliveries(self, auth_client, tenant, endpoint):
        data = {
            "type": "order.created",
            "payload": {"order_id": 1},
            "endpoint_ids": [f"ep_{endpoint.id}"],
            "idempotency_key": "test-key-1",
        }

        response = auth_client.post("/v1/events", data, format="json")

        assert response.status_code == 202
        body = response.json()
        assert "event_id" in body
        assert body["event_id"].startswith("evt_")
        assert len(body["deliveries"]) == 1
        assert body["deliveries"][0]["created"] is True
        assert body["deliveries"][0]["delivery_id"].startswith("del_")

        event_uuid = from_prefixed(body["event_id"], "evt_")
        delivery_uuid = from_prefixed(body["deliveries"][0]["delivery_id"], "del_")
        assert Event.objects.filter(id=event_uuid).exists()
        assert Delivery.objects.filter(id=delivery_uuid).exists()

    def test_validates_endpoint_ids_belong_to_tenant(self, auth_client):
        other_tenant = create_tenant("other")
        other_endpoint = create_endpoint(other_tenant)

        data = {
            "type": "test.event",
            "payload": {"key": "value"},
            "endpoint_ids": [f"ep_{other_endpoint.id}"],
        }

        response = auth_client.post("/v1/events", data, format="json")
        assert response.status_code == 400

    def test_missing_endpoint_ids(self, auth_client):
        response = auth_client.post("/v1/events", {
            "type": "test.event",
            "payload": {"key": "value"},
        }, format="json")
        assert response.status_code == 400

    def test_invalid_endpoint_ids(self, auth_client):
        response = auth_client.post("/v1/events", {
            "type": "test.event",
            "payload": {"key": "value"},
            "endpoint_ids": [f"ep_{uuid.uuid4()}"],
        }, format="json")
        assert response.status_code == 400

    def test_idempotency_returns_existing(self, auth_client, tenant, endpoint):
        data = {
            "type": "order.created",
            "payload": {"order_id": 1},
            "endpoint_ids": [f"ep_{endpoint.id}"],
            "idempotency_key": "idem-key-1",
        }

        r1 = auth_client.post("/v1/events", data, format="json")
        r2 = auth_client.post("/v1/events", data, format="json")

        assert r1.status_code == 202
        assert r2.status_code == 202
        assert r2.json()["deliveries"][0]["created"] is False
        assert r1.json()["deliveries"][0]["delivery_id"] == r2.json()["deliveries"][0]["delivery_id"]

    def test_idempotency_conflict_different_payload(self, auth_client, tenant, endpoint):
        ep_id = f"ep_{endpoint.id}"

        auth_client.post("/v1/events", {
            "type": "order.created",
            "payload": {"version": 1},
            "endpoint_ids": [ep_id],
            "idempotency_key": "conflict-key",
        }, format="json")

        response = auth_client.post("/v1/events", {
            "type": "order.created",
            "payload": {"version": 2},
            "endpoint_ids": [ep_id],
            "idempotency_key": "conflict-key",
        }, format="json")

        assert response.status_code == 409

    def test_idempotency_key_reuse_outside_window(self, auth_client, tenant, endpoint):
        ep_id = f"ep_{endpoint.id}"

        r1 = auth_client.post("/v1/events", {
            "type": "order.created",
            "payload": {"order_id": 1},
            "endpoint_ids": [ep_id],
            "idempotency_key": "reuse-key",
        }, format="json")

        delivery_uuid = from_prefixed(r1.json()["deliveries"][0]["delivery_id"], "del_")
        old_delivery = Delivery.objects.get(id=delivery_uuid)
        old_delivery.created_at = timezone.now() - timedelta(hours=73)
        old_delivery.save(update_fields=["created_at"])

        r2 = auth_client.post("/v1/events", {
            "type": "order.created",
            "payload": {"order_id": 1},
            "endpoint_ids": [ep_id],
            "idempotency_key": "reuse-key",
        }, format="json")

        assert r2.status_code == 202
        assert r2.json()["deliveries"][0]["created"] is True
        new_delivery_uuid = from_prefixed(r2.json()["deliveries"][0]["delivery_id"], "del_")
        new_delivery = Delivery.objects.get(id=new_delivery_uuid)
        assert new_delivery.idempotency_key_reused is True

    def test_basic_mode_deterministic_dedup(self, auth_client, tenant, endpoint):
        data = {
            "type": "order.created",
            "payload": {"order_id": 1},
            "endpoint_ids": [f"ep_{endpoint.id}"],
        }

        r1 = auth_client.post("/v1/events", data, format="json")
        r2 = auth_client.post("/v1/events", data, format="json")

        assert r1.status_code == 202
        assert r2.status_code == 202
        assert r2.json()["deliveries"][0]["created"] is False

    def test_payload_exceeds_max_size(self, auth_client, tenant, endpoint):
        data = {
            "type": "test.event",
            "payload": {"data": "x" * 300000},
            "endpoint_ids": [f"ep_{endpoint.id}"],
        }

        response = auth_client.post("/v1/events", data, format="json")
        assert response.status_code == 400
