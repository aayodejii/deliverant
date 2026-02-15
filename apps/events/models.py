import uuid

from django.db import models

from apps.tenants.models import Tenant


class Event(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name="events",
    )
    type = models.CharField(max_length=255)
    payload_json = models.TextField()
    payload_hash = models.CharField(max_length=64)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "events"
        indexes = [
            models.Index(fields=["tenant_id", "created_at"], name="idx_events_tenant_created"),
            models.Index(fields=["tenant_id", "type", "created_at"], name="idx_events_tenant_type_created"),
        ]

    def __str__(self):
        return f"{self.tenant.name} - {self.type} ({self.id})"
