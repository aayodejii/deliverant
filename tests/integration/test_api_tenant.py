import pytest
from rest_framework.test import APIClient


@pytest.mark.django_db
class TestTenantInfo:
    def test_returns_tenant_info(self, auth_client, tenant):
        response = auth_client.get("/v1/tenant")
        assert response.status_code == 200
        body = response.json()
        assert body["id"] == str(tenant.id)
        assert body["name"] == tenant.name
        assert "api_keys" in body
        assert len(body["api_keys"]) >= 1

    def test_requires_auth(self):
        client = APIClient()
        assert client.get("/v1/tenant").status_code == 401
