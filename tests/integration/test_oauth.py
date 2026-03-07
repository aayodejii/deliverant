import pytest
from django.conf import settings
from rest_framework.test import APIClient

from apps.tenants.models import APIKey, Tenant, User


@pytest.mark.django_db
class TestOAuthProvision:
    def get_client(self):
        client = APIClient()
        client.credentials(HTTP_X_INTERNAL_SECRET=settings.INTERNAL_API_SECRET)
        return client

    def test_creates_user_and_tenant(self):
        client = self.get_client()
        response = client.post("/v1/auth/oauth-provision", {
            "email": "test@example.com",
            "name": "Test User",
            "provider": "google",
            "provider_account_id": "google-123",
        }, format="json")

        assert response.status_code == 200
        body = response.json()
        assert "api_key" in body
        assert "tenant_id" in body
        assert "user_id" in body

        assert User.objects.filter(email="test@example.com").exists()
        assert Tenant.objects.filter(id=body["tenant_id"]).exists()

    def test_idempotent_second_call(self):
        client = self.get_client()
        data = {
            "email": "test2@example.com",
            "name": "Test User",
            "provider": "github",
            "provider_account_id": "github-456",
        }

        r1 = client.post("/v1/auth/oauth-provision", data, format="json")
        r2 = client.post("/v1/auth/oauth-provision", data, format="json")

        assert r1.status_code == 200
        assert r2.status_code == 200
        assert r1.json()["tenant_id"] == r2.json()["tenant_id"]
        assert r1.json()["user_id"] == r2.json()["user_id"]
        assert r1.json()["api_key"] != r2.json()["api_key"]

    def test_revokes_previous_oauth_key(self):
        client = self.get_client()
        data = {
            "email": "revoke@example.com",
            "name": "Revoke Test",
            "provider": "google",
            "provider_account_id": "google-revoke",
        }

        r1 = client.post("/v1/auth/oauth-provision", data, format="json")
        r2 = client.post("/v1/auth/oauth-provision", data, format="json")

        tenant_id = r1.json()["tenant_id"]
        active_keys = APIKey.objects.filter(
            tenant_id=tenant_id, name="oauth-dashboard", status=APIKey.Status.ACTIVE
        ).count()
        assert active_keys == 1

    def test_rejects_invalid_secret(self):
        client = APIClient()
        client.credentials(HTTP_X_INTERNAL_SECRET="wrong-secret")
        response = client.post("/v1/auth/oauth-provision", {
            "email": "test@example.com",
            "name": "Test",
            "provider": "google",
            "provider_account_id": "123",
        }, format="json")
        assert response.status_code == 403

    def test_rejects_missing_fields(self):
        client = self.get_client()
        response = client.post("/v1/auth/oauth-provision", {
            "email": "test@example.com",
        }, format="json")
        assert response.status_code == 400


@pytest.mark.django_db
class TestRevokeSession:
    def test_revokes_current_key(self, auth_client, api_key):
        key_obj, _ = api_key

        response = auth_client.post("/v1/auth/revoke-session")
        assert response.status_code == 200
        assert response.json()["ok"] is True

        key_obj.refresh_from_db()
        assert key_obj.status == APIKey.Status.REVOKED

    def test_requires_auth(self):
        client = APIClient()
        assert client.post("/v1/auth/revoke-session").status_code == 401
