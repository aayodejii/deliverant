import pytest


@pytest.mark.django_db
class TestKillSwitchAPI:
    def test_get_status(self, auth_client):
        response = auth_client.get("/v1/kill-switch")
        assert response.status_code == 200
        assert response.json()["active"] is False

    def test_activate(self, auth_client):
        response = auth_client.post("/v1/kill-switch", {"active": True}, format="json")
        assert response.status_code == 200
        assert response.json()["active"] is True

    def test_deactivate(self, auth_client):
        auth_client.post("/v1/kill-switch", {"active": True}, format="json")

        response = auth_client.post("/v1/kill-switch", {"active": False}, format="json")
        assert response.status_code == 200
        assert response.json()["active"] is False

    def test_state_persists(self, auth_client):
        auth_client.post("/v1/kill-switch", {"active": True}, format="json")

        response = auth_client.get("/v1/kill-switch")
        assert response.json()["active"] is True
