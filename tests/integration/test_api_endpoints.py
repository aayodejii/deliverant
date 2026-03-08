import uuid

import pytest
from rest_framework.test import APIClient

from apps.endpoints.models import Endpoint
from tests.factories import create_api_key, create_endpoint, create_tenant


@pytest.mark.django_db
class TestEndpointsCRUD:
    def test_list_endpoints(self, auth_client, tenant, endpoint):
        response = auth_client.get("/v1/endpoints")
        assert response.status_code == 200
        assert len(response.json()) >= 1

    def test_create_endpoint(self, auth_client, tenant):
        data = {
            "name": "new-endpoint",
            "url": "https://example.com/hook",
        }

        response = auth_client.post("/v1/endpoints", data, format="json")
        assert response.status_code == 201
        assert response.json()["name"] == "new-endpoint"
        assert response.json()["id"].startswith("ep_")
        assert Endpoint.objects.filter(tenant=tenant, name="new-endpoint").exists()

    def test_get_endpoint(self, auth_client, endpoint):
        response = auth_client.get(f"/v1/endpoints/ep_{endpoint.id}")
        assert response.status_code == 200
        assert response.json()["id"] == f"ep_{endpoint.id}"

    def test_get_nonexistent_endpoint(self, auth_client):
        response = auth_client.get(f"/v1/endpoints/ep_{uuid.uuid4()}")
        assert response.status_code == 404

    def test_update_endpoint(self, auth_client, endpoint):
        response = auth_client.patch(
            f"/v1/endpoints/ep_{endpoint.id}",
            {"name": "updated-name"},
            format="json",
        )
        assert response.status_code == 200
        assert response.json()["name"] == "updated-name"

    def test_delete_endpoint(self, auth_client, endpoint):
        response = auth_client.delete(f"/v1/endpoints/ep_{endpoint.id}")
        assert response.status_code == 204
        assert not Endpoint.objects.filter(id=endpoint.id).exists()

    def test_pause_resume(self, auth_client, endpoint):
        response = auth_client.patch(
            f"/v1/endpoints/ep_{endpoint.id}",
            {"status": "PAUSED"},
            format="json",
        )
        assert response.status_code == 200
        assert response.json()["status"] == "PAUSED"

        endpoint.refresh_from_db()
        assert endpoint.paused_at is not None

        response = auth_client.patch(
            f"/v1/endpoints/ep_{endpoint.id}",
            {"status": "ACTIVE"},
            format="json",
        )
        assert response.status_code == 200
        assert response.json()["status"] == "ACTIVE"

        endpoint.refresh_from_db()
        assert endpoint.paused_at is None

    def test_tenant_isolation(self, auth_client):
        other_tenant = create_tenant("other-tenant")
        other_endpoint = create_endpoint(other_tenant, name="other-ep")

        response = auth_client.get(f"/v1/endpoints/ep_{other_endpoint.id}")
        assert response.status_code == 404

        response = auth_client.get("/v1/endpoints")
        ep_ids = [ep["id"] for ep in response.json()]
        assert f"ep_{other_endpoint.id}" not in ep_ids
