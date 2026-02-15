import uuid

from django.db import models

from apps.endpoints.models import Endpoint
from apps.events.models import Event
from apps.tenants.models import Tenant


class Delivery(models.Model):
    class Mode(models.TextChoices):
        RELIABLE = "RELIABLE", "Reliable"
        BASIC = "BASIC", "Basic"

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        SCHEDULED = "SCHEDULED", "Scheduled"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        DELIVERED = "DELIVERED", "Delivered"
        FAILED = "FAILED", "Failed"
        EXPIRED = "EXPIRED", "Expired"
        CANCELLED = "CANCELLED", "Cancelled"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name="deliveries",
    )
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name="deliveries",
    )
    endpoint = models.ForeignKey(
        Endpoint,
        on_delete=models.CASCADE,
        related_name="deliveries",
    )
    mode = models.CharField(
        max_length=10,
        choices=Mode.choices,
        default=Mode.RELIABLE,
    )
    idempotency_key = models.CharField(max_length=255, null=True, blank=True)
    idempotency_key_hash = models.CharField(max_length=64, null=True, blank=True)
    status = models.CharField(
        max_length=15,
        choices=Status.choices,
        default=Status.PENDING,
    )
    attempts_count = models.IntegerField(default=0)
    next_attempt_at = models.DateTimeField(null=True, blank=True)
    first_scheduled_at = models.DateTimeField(null=True, blank=True)
    last_attempt_at = models.DateTimeField(null=True, blank=True)
    terminal_at = models.DateTimeField(null=True, blank=True)
    terminal_reason = models.CharField(max_length=255, null=True, blank=True)
    lease_id = models.UUIDField(null=True, blank=True)
    lease_expires_at = models.DateTimeField(null=True, blank=True)
    cancel_requested = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "deliveries"
        verbose_name_plural = "deliveries"
        indexes = [
            models.Index(
                fields=["endpoint_id", "status", "next_attempt_at"],
                name="idx_deliveries_worker_lease",
            ),
            models.Index(
                fields=["status", "next_attempt_at"],
                name="idx_deliveries_status_next",
            ),
            models.Index(
                fields=["tenant_id", "endpoint_id", "idempotency_key_hash"],
                name="idx_deliveries_dedup",
            ),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["tenant_id", "endpoint_id", "idempotency_key_hash"],
                name="unique_delivery_idempotency",
                condition=models.Q(idempotency_key_hash__isnull=False),
            ),
        ]

    def __str__(self):
        return f"{self.endpoint.name} - {self.event.type} ({self.status})"

    @property
    def is_terminal(self):
        return self.status in [
            self.Status.DELIVERED,
            self.Status.FAILED,
            self.Status.EXPIRED,
            self.Status.CANCELLED,
        ]
