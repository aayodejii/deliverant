import uuid

import pytest

from apps.deliveries.models import Delivery
from apps.replays.models import DeliveryBatch, DeliveryBatchItem
from tests.factories import create_delivery, create_endpoint, create_event, create_tenant


@pytest.mark.django_db
class TestReplayCreate:
    def test_creates_replay_batch(self, auth_client, tenant, event, endpoint):
        delivery = create_delivery(tenant, event, endpoint, status=Delivery.Status.DELIVERED)

        response = auth_client.post("/v1/replays", {
            "delivery_ids": [str(delivery.id)],
            "dry_run": False,
        }, format="json")

        assert response.status_code == 201
        body = response.json()
        assert body["created_deliveries"] == 1
        assert body["dry_run"] is False
        assert DeliveryBatch.objects.filter(id=body["batch_id"]).exists()
        assert DeliveryBatchItem.objects.filter(batch_id=body["batch_id"]).count() == 1

    def test_dry_run(self, auth_client, tenant, event, endpoint):
        delivery = create_delivery(tenant, event, endpoint)

        initial_count = Delivery.objects.count()

        response = auth_client.post("/v1/replays", {
            "delivery_ids": [str(delivery.id)],
            "dry_run": True,
        }, format="json")

        assert response.status_code == 201
        assert response.json()["dry_run"] is True
        assert Delivery.objects.count() == initial_count

    def test_missing_delivery_ids(self, auth_client):
        response = auth_client.post("/v1/replays", {
            "delivery_ids": [str(uuid.uuid4())],
            "dry_run": False,
        }, format="json")
        assert response.status_code == 404

    def test_exceeds_max_batch_size(self, auth_client, settings):
        ids = [str(uuid.uuid4()) for _ in range(settings.MAX_REPLAY_BATCH_SIZE + 1)]

        response = auth_client.post("/v1/replays", {
            "delivery_ids": ids,
            "dry_run": False,
        }, format="json")
        assert response.status_code == 400
