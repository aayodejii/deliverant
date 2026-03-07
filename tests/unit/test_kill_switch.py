import pytest

from workers.kill_switch import activate, deactivate, is_active


@pytest.mark.django_db
class TestKillSwitch:
    def test_default_inactive(self):
        assert is_active() is False

    def test_activate(self):
        activate()
        assert is_active() is True

    def test_deactivate(self):
        activate()
        deactivate()
        assert is_active() is False

    def test_double_activate(self):
        activate()
        activate()
        assert is_active() is True

    def test_deactivate_when_already_inactive(self):
        deactivate()
        assert is_active() is False
