from django.core.cache import cache

KILL_SWITCH_KEY = "deliverant:kill_switch"


def is_active():
    return cache.get(KILL_SWITCH_KEY) == "1"


def activate():
    cache.set(KILL_SWITCH_KEY, "1", timeout=None)


def deactivate():
    cache.delete(KILL_SWITCH_KEY)
