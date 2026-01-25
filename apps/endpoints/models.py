import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.tenants.models import Tenant


class Endpoint(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        PAUSED = "PAUSED", "Paused"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name="endpoints",
    )
    name = models.CharField(max_length=255)
    url = models.URLField(max_length=2048)
    secret_encrypted = models.BinaryField(null=True, blank=True)
    headers_json = models.JSONField(default=dict, blank=True)
    timeout_seconds = models.IntegerField(default=settings.DEFAULT_ATTEMPT_TIMEOUT_SECONDS)
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.ACTIVE,
    )
    paused_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "endpoints"
        constraints = [
            models.UniqueConstraint(
                fields=["tenant", "name"],
                name="unique_tenant_endpoint_name",
            ),
        ]
        indexes = [
            models.Index(fields=["tenant_id"], name="idx_endpoints_tenant"),
            models.Index(fields=["tenant_id", "status"], name="idx_endpoints_tenant_status"),
        ]

    def __str__(self):
        return f"{self.tenant.name} - {self.name}"

    def pause(self):
        self.status = self.Status.PAUSED
        self.paused_at = timezone.now()
        self.save(update_fields=["status", "paused_at", "updated_at"])

    def resume(self):
        self.status = self.Status.ACTIVE
        self.paused_at = None
        self.save(update_fields=["status", "paused_at", "updated_at"])

    @property
    def is_active(self):
        return self.status == self.Status.ACTIVE
