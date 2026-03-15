import hashlib
import json
import random
import uuid
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.attempts.models import Attempt
from apps.deliveries.models import Delivery
from apps.endpoints.models import Endpoint
from apps.events.models import Event
from apps.tenants.models import APIKey, Tenant

TENANT_NAME = "acme-corp"

ENDPOINTS = [
    {
        "name": "Payment Processor",
        "url": "https://payments.acme.io/webhooks",
        "status": Endpoint.Status.ACTIVE,
        "failure_rate": 0.04,
    },
    {
        "name": "Order Service",
        "url": "https://orders.acme.io/events",
        "status": Endpoint.Status.ACTIVE,
        "failure_rate": 0.10,
    },
    {
        "name": "Notification Hub",
        "url": "https://notify.acme.io/hooks",
        "status": Endpoint.Status.ACTIVE,
        "failure_rate": 0.22,
    },
    {
        "name": "Analytics Sink",
        "url": "https://ingest.acme.io/pipeline",
        "status": Endpoint.Status.PAUSED,
        "failure_rate": 0.30,
    },
]

EVENT_SPECS = [
    ("order.created", lambda: {"order_id": f"ord_{uuid.uuid4().hex[:8]}", "amount": round(random.uniform(9.99, 999.99), 2), "currency": "USD", "customer_id": f"cus_{uuid.uuid4().hex[:8]}"}),
    ("order.updated", lambda: {"order_id": f"ord_{uuid.uuid4().hex[:8]}", "status": random.choice(["processing", "shipped", "out_for_delivery"])}),
    ("order.completed", lambda: {"order_id": f"ord_{uuid.uuid4().hex[:8]}", "total": round(random.uniform(9.99, 999.99), 2)}),
    ("order.cancelled", lambda: {"order_id": f"ord_{uuid.uuid4().hex[:8]}", "reason": random.choice(["customer_request", "payment_failed", "out_of_stock"])}),
    ("payment.succeeded", lambda: {"payment_id": f"pay_{uuid.uuid4().hex[:8]}", "amount": round(random.uniform(9.99, 999.99), 2), "currency": "USD", "method": random.choice(["card", "bank_transfer", "wallet"])}),
    ("payment.failed", lambda: {"payment_id": f"pay_{uuid.uuid4().hex[:8]}", "reason": random.choice(["insufficient_funds", "card_declined", "expired_card"])}),
    ("payment.refunded", lambda: {"payment_id": f"pay_{uuid.uuid4().hex[:8]}", "amount": round(random.uniform(5.00, 200.00), 2), "reason": "customer_request"}),
    ("user.registered", lambda: {"user_id": f"usr_{uuid.uuid4().hex[:8]}", "email": f"user{random.randint(1000, 9999)}@example.com", "plan": random.choice(["free", "pro", "enterprise"])}),
    ("user.verified", lambda: {"user_id": f"usr_{uuid.uuid4().hex[:8]}", "method": random.choice(["email", "sms"])}),
    ("subscription.activated", lambda: {"subscription_id": f"sub_{uuid.uuid4().hex[:8]}", "plan": random.choice(["starter", "growth", "enterprise"]), "billing_cycle": random.choice(["monthly", "annual"])}),
    ("subscription.renewed", lambda: {"subscription_id": f"sub_{uuid.uuid4().hex[:8]}", "amount": round(random.uniform(29.00, 299.00), 2)}),
    ("subscription.cancelled", lambda: {"subscription_id": f"sub_{uuid.uuid4().hex[:8]}", "reason": random.choice(["user_request", "payment_failed", "plan_expired"])}),
]

FAILURE_SCENARIOS = [
    (500, Attempt.Outcome.RETRYABLE_FAILURE, Attempt.Classification.HTTP_5XX_RETRYABLE, '{"error": "Internal Server Error"}'),
    (503, Attempt.Outcome.RETRYABLE_FAILURE, Attempt.Classification.HTTP_5XX_RETRYABLE, '{"error": "Service Unavailable", "retry_after": 30}'),
    (429, Attempt.Outcome.RETRYABLE_FAILURE, Attempt.Classification.RATE_LIMITED, '{"error": "Too Many Requests", "retry_after": 60}'),
    (None, Attempt.Outcome.RETRYABLE_FAILURE, Attempt.Classification.TIMEOUT, None),
    (None, Attempt.Outcome.RETRYABLE_FAILURE, Attempt.Classification.NETWORK_ERROR, None),
    (400, Attempt.Outcome.NON_RETRYABLE_FAILURE, Attempt.Classification.HTTP_4XX_PERMANENT, '{"error": "Bad Request", "message": "Invalid payload schema"}'),
    (410, Attempt.Outcome.NON_RETRYABLE_FAILURE, Attempt.Classification.HTTP_4XX_PERMANENT, '{"error": "Gone", "message": "Endpoint has been removed"}'),
]


def _make_event(tenant, event_time):
    event_type, payload_fn = random.choice(EVENT_SPECS)
    payload = payload_fn()
    payload_json = json.dumps(payload)
    payload_hash = hashlib.sha256(payload_json.encode()).hexdigest()
    event = Event.objects.create(
        tenant=tenant,
        type=event_type,
        payload_json=payload_json,
        payload_hash=payload_hash,
    )
    Event.objects.filter(pk=event.pk).update(created_at=event_time)
    return event, payload_hash


def _create_delivered(tenant, endpoint, event_time, payload_hash, event):
    latency = random.randint(30, 350)
    delivery_time = event_time + timedelta(seconds=random.randint(1, 8))
    delivery = Delivery.objects.create(
        tenant=tenant,
        event=event,
        endpoint=endpoint,
        mode=Delivery.Mode.RELIABLE,
        status=Delivery.Status.DELIVERED,
        attempts_count=1,
        terminal_at=delivery_time,
        first_scheduled_at=event_time + timedelta(seconds=1),
        last_attempt_at=delivery_time,
    )
    Delivery.objects.filter(pk=delivery.pk).update(created_at=event_time)
    attempt = Attempt.objects.create(
        tenant=tenant,
        delivery=delivery,
        attempt_number=1,
        started_at=delivery_time,
        ended_at=delivery_time + timedelta(milliseconds=latency),
        latency_ms=latency,
        outcome=Attempt.Outcome.SUCCESS,
        http_status=200,
        response_headers_json={"content-type": "application/json"},
        response_body_snippet='{"received": true}',
        request_payload_hash=payload_hash,
    )
    Attempt.objects.filter(pk=attempt.pk).update(created_at=delivery_time)
    return delivery, attempt


def _create_failed(tenant, endpoint, event_time, payload_hash, event, num_attempts=None):
    if num_attempts is None:
        num_attempts = random.randint(3, 8)
    elapsed = timedelta(0)
    delivery = Delivery.objects.create(
        tenant=tenant,
        event=event,
        endpoint=endpoint,
        mode=Delivery.Mode.RELIABLE,
        status=Delivery.Status.FAILED,
        attempts_count=num_attempts,
        terminal_at=event_time + timedelta(minutes=random.randint(30, 180)),
        terminal_reason="max_attempts_reached",
        first_scheduled_at=event_time + timedelta(seconds=5),
        last_attempt_at=event_time + timedelta(minutes=random.randint(20, 90)),
    )
    Delivery.objects.filter(pk=delivery.pk).update(created_at=event_time)
    attempts = []
    for attempt_num in range(1, num_attempts + 1):
        backoff = min(5 * (2 ** (attempt_num - 1)), 3600)
        elapsed += timedelta(seconds=backoff + random.randint(0, 20))
        attempt_time = event_time + elapsed
        is_last = attempt_num == num_attempts
        scenario = random.choice(FAILURE_SCENARIOS[5:]) if is_last else random.choice(FAILURE_SCENARIOS[:5])
        http_status, outcome, classification, response_body = scenario
        latency = random.randint(80, 25000) if http_status is None else random.randint(50, 800)
        attempt = Attempt.objects.create(
            tenant=tenant,
            delivery=delivery,
            attempt_number=attempt_num,
            started_at=attempt_time,
            ended_at=attempt_time + timedelta(milliseconds=latency),
            latency_ms=latency,
            outcome=outcome,
            classification=classification,
            http_status=http_status,
            response_body_snippet=response_body,
            request_payload_hash=payload_hash,
        )
        Attempt.objects.filter(pk=attempt.pk).update(created_at=attempt_time)
        attempts.append(attempt)
    return delivery, attempts


class Command(BaseCommand):
    help = "Seed the database with realistic demo data for screenshots"

    def add_arguments(self, parser):
        parser.add_argument(
            "--flush",
            action="store_true",
            help="Remove existing demo tenant before seeding",
        )

    def handle(self, *args, **options):
        if options["flush"]:
            count, _ = Tenant.objects.filter(name=TENANT_NAME).delete()
            self.stdout.write(f"Flushed demo tenant and {count} related records.")

        if Tenant.objects.filter(name=TENANT_NAME).exists():
            self.stdout.write(
                self.style.WARNING(
                    f"Demo tenant '{TENANT_NAME}' already exists. Use --flush to reset."
                )
            )
            return

        random.seed(42)
        now = timezone.now()

        tenant = Tenant.objects.create(name=TENANT_NAME)
        _, raw_key = APIKey.objects.create_key(tenant=tenant, name="demo-key")

        endpoints = []
        for spec in ENDPOINTS:
            ep = Endpoint.objects.create(
                tenant=tenant,
                name=spec["name"],
                url=spec["url"],
                status=spec["status"],
            )
            if spec["status"] == Endpoint.Status.PAUSED:
                Endpoint.objects.filter(pk=ep.pk).update(
                    paused_at=now - timedelta(days=3)
                )
            endpoints.append((ep, spec["failure_rate"]))

        active_endpoints = [(ep, fr) for ep, fr in endpoints if ep.status == Endpoint.Status.ACTIVE]
        deliveries_created = 0
        attempts_created = 0

        # --- Phase 1: Historical data (days 2-30) ---
        for day_offset in range(30, 1, -1):
            base = 4 + (30 - day_offset) // 5
            daily_count = random.randint(base, base + 5)
            for _ in range(daily_count):
                seconds_offset = random.randint(0, 86399)
                event_time = now - timedelta(days=day_offset, seconds=seconds_offset)
                endpoint, failure_rate = random.choice(endpoints)
                if endpoint.status == Endpoint.Status.PAUSED and day_offset <= 3:
                    continue
                event, payload_hash = _make_event(tenant, event_time)
                if random.random() < failure_rate:
                    d, atts = _create_failed(tenant, endpoint, event_time, payload_hash, event)
                    attempts_created += len(atts)
                else:
                    d, att = _create_delivered(tenant, endpoint, event_time, payload_hash, event)
                    attempts_created += 1
                deliveries_created += 1

        # --- Phase 2: Last 24 hours — dense data for charts ---
        # Distribute ~80 deliveries across 24 hours with realistic hour-by-hour volume
        hour_volumes = [
            2, 1, 1, 1, 2, 3,   # 00-05 (overnight quiet)
            4, 6, 7, 8, 9, 8,   # 06-11 (morning ramp)
            7, 8, 7, 6, 6, 7,   # 12-17 (afternoon steady)
            6, 5, 4, 4, 3, 2,   # 18-23 (evening taper)
        ]
        for hours_ago, count in enumerate(reversed(hour_volumes)):
            for i in range(count):
                minutes_offset = random.randint(0, 59)
                seconds_offset = random.randint(0, 59)
                event_time = now - timedelta(hours=hours_ago + 1) + timedelta(minutes=minutes_offset, seconds=seconds_offset)
                endpoint, failure_rate = random.choice(active_endpoints)
                event, payload_hash = _make_event(tenant, event_time)
                if random.random() < failure_rate:
                    d, atts = _create_failed(tenant, endpoint, event_time, payload_hash, event, num_attempts=random.randint(2, 5))
                    attempts_created += len(atts)
                else:
                    d, att = _create_delivered(tenant, endpoint, event_time, payload_hash, event)
                    attempts_created += 1
                deliveries_created += 1

        # --- Phase 3: Very recent — guaranteed FAILED, PENDING, SCHEDULED visible at top of list ---
        recent_specs = [
            # (minutes_ago, status, include_attempts)
            (2,  Delivery.Status.PENDING,   False),
            (5,  Delivery.Status.PENDING,   False),
            (8,  Delivery.Status.SCHEDULED, False),
            (12, Delivery.Status.SCHEDULED, False),
            (18, Delivery.Status.FAILED,    True),
            (25, Delivery.Status.FAILED,    True),
            (35, Delivery.Status.FAILED,    True),
            (42, Delivery.Status.DELIVERED, True),
        ]
        for minutes_ago, status, include_attempts in recent_specs:
            event_time = now - timedelta(minutes=minutes_ago)
            endpoint, _ = random.choice(active_endpoints)
            event, payload_hash = _make_event(tenant, event_time)

            if status == Delivery.Status.DELIVERED:
                d, att = _create_delivered(tenant, endpoint, event_time, payload_hash, event)
                attempts_created += 1
            elif status == Delivery.Status.FAILED:
                d, atts = _create_failed(tenant, endpoint, event_time, payload_hash, event, num_attempts=3)
                attempts_created += len(atts)
            else:
                next_at = now + timedelta(minutes=random.randint(1, 5)) if status == Delivery.Status.SCHEDULED else None
                d = Delivery.objects.create(
                    tenant=tenant,
                    event=event,
                    endpoint=endpoint,
                    mode=Delivery.Mode.RELIABLE,
                    status=status,
                    attempts_count=0,
                    next_attempt_at=next_at,
                    first_scheduled_at=event_time + timedelta(seconds=5) if status == Delivery.Status.SCHEDULED else None,
                )
                Delivery.objects.filter(pk=d.pk).update(created_at=event_time)

            deliveries_created += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"\nDemo tenant '{TENANT_NAME}' created:\n"
                f"  Endpoints : {len(endpoints)}\n"
                f"  Deliveries: {deliveries_created}\n"
                f"  Attempts  : {attempts_created}\n"
                f"\nAPI key (save this): {raw_key}\n"
                f"\nLog in at http://localhost:3000\n"
            )
        )
