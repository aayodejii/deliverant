import pytest
from django.core.cache import cache
from rest_framework.test import APIClient

from tests.factories import (
    create_api_key,
    create_delivery,
    create_endpoint,
    create_event,
    create_tenant,
)


@pytest.fixture
def tenant(db):
    return create_tenant("test-tenant")


@pytest.fixture
def api_key(tenant):
    key, raw = create_api_key(tenant)
    return key, raw


@pytest.fixture
def endpoint(tenant):
    return create_endpoint(tenant)


@pytest.fixture
def event(tenant):
    return create_event(tenant)


@pytest.fixture
def delivery(tenant, event, endpoint):
    return create_delivery(tenant, event, endpoint)


@pytest.fixture
def auth_client(api_key):
    _, raw = api_key
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {raw}")
    return client


@pytest.fixture(autouse=True)
def flush_redis():
    cache.clear()
    yield
    cache.clear()


@pytest.fixture
def celery_eager(settings):
    settings.CELERY_TASK_ALWAYS_EAGER = True
    settings.CELERY_TASK_EAGER_PROPAGATES = True
