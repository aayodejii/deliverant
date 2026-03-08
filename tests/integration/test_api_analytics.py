import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.deliveries.models import Delivery
from tests.factories import (
    create_attempt,
    create_delivery,
    create_endpoint,
    create_event,
    create_tenant,
)


@pytest.mark.django_db
class TestDeliveryVolume:
    def test_returns_hourly_buckets(self, auth_client, tenant, event, endpoint):
        create_delivery(tenant, event, endpoint, status=Delivery.Status.DELIVERED)
        create_delivery(tenant, event, endpoint, status=Delivery.Status.FAILED)

        response = auth_client.get("/v1/analytics/delivery-volume")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert "hour" in data[0]
        assert "total" in data[0]
        assert "delivered" in data[0]
        assert "failed" in data[0]

    def test_requires_auth(self):
        client = APIClient()
        assert client.get("/v1/analytics/delivery-volume").status_code == 401


@pytest.mark.django_db
class TestSuccessRate:
    def test_returns_rate_per_hour(self, auth_client, tenant, event, endpoint):
        create_delivery(tenant, event, endpoint, status=Delivery.Status.DELIVERED)
        create_delivery(tenant, event, endpoint, status=Delivery.Status.FAILED)

        response = auth_client.get("/v1/analytics/success-rate")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert "rate" in data[0]
        assert "total" in data[0]


@pytest.mark.django_db
class TestLatencyDistribution:
    def test_returns_bucket_counts(self, auth_client, tenant, event, endpoint):
        delivery = create_delivery(tenant, event, endpoint)
        create_attempt(tenant, delivery, latency_ms=50)
        create_attempt(tenant, delivery, attempt_number=2, latency_ms=250)

        response = auth_client.get("/v1/analytics/latency-distribution")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 7
        assert all("bucket" in b and "count" in b for b in data)


@pytest.mark.django_db
class TestEndpointHealth:
    def test_returns_per_endpoint_stats(self, auth_client, tenant, event, endpoint):
        create_delivery(tenant, event, endpoint, status=Delivery.Status.DELIVERED)

        response = auth_client.get("/v1/analytics/endpoint-health")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert data[0]["endpoint_id"] == f"ep_{endpoint.id}"
        assert "success_rate" in data[0]
        assert "total" in data[0]
