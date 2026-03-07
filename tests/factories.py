import hashlib
import json
import uuid

from apps.attempts.models import Attempt
from apps.deliveries.models import Delivery
from apps.endpoints.models import Endpoint
from apps.events.models import Event
from apps.tenants.models import APIKey, Tenant


def create_tenant(name=None):
    return Tenant.objects.create(name=name or f"tenant-{uuid.uuid4().hex[:8]}")


def create_api_key(tenant, name="test-key"):
    return APIKey.objects.create_key(tenant=tenant, name=name)


def create_endpoint(tenant, **kwargs):
    defaults = {
        "name": f"endpoint-{uuid.uuid4().hex[:8]}",
        "url": "https://example.com/webhook",
    }
    defaults.update(kwargs)
    return Endpoint.objects.create(tenant=tenant, **defaults)


def create_event(tenant, **kwargs):
    payload = kwargs.pop("payload", {"key": "value"})
    payload_json = json.dumps(payload)
    defaults = {
        "type": "test.event",
        "payload_json": payload_json,
        "payload_hash": hashlib.sha256(payload_json.encode()).hexdigest(),
    }
    defaults.update(kwargs)
    return Event.objects.create(tenant=tenant, **defaults)


def create_delivery(tenant, event, endpoint, **kwargs):
    defaults = {
        "mode": Delivery.Mode.RELIABLE,
        "status": Delivery.Status.PENDING,
    }
    defaults.update(kwargs)
    return Delivery.objects.create(
        tenant=tenant, event=event, endpoint=endpoint, **defaults
    )


def create_attempt(tenant, delivery, **kwargs):
    from django.utils import timezone

    now = timezone.now()
    defaults = {
        "attempt_number": 1,
        "started_at": now,
        "ended_at": now,
        "latency_ms": 100,
        "outcome": Attempt.Outcome.SUCCESS,
        "request_payload_hash": delivery.event.payload_hash,
    }
    defaults.update(kwargs)
    return Attempt.objects.create(tenant=tenant, delivery=delivery, **defaults)
