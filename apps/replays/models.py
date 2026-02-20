import uuid

from django.db import models

from apps.deliveries.models import Delivery
from apps.endpoints.models import Endpoint
from apps.tenants.models import APIKey, Tenant


class DeliveryBatch(models.Model):
    class Status(models.TextChoices):
        CREATED = "CREATED", "Created"
        COMPLETED = "COMPLETED", "Completed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="delivery_batches")
    type = models.CharField(max_length=20, default="REPLAY")
    dry_run = models.BooleanField(default=False)
    requested_by = models.ForeignKey(
        APIKey, on_delete=models.SET_NULL, null=True, related_name="delivery_batches"
    )
    requested_at = models.DateTimeField(auto_now_add=True)
    created_deliveries_count = models.IntegerField(default=0)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.CREATED)

    class Meta:
        db_table = "delivery_batches"

    def __str__(self):
        return f"Batch {self.id} ({self.status})"


class DeliveryBatchItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    batch = models.ForeignKey(DeliveryBatch, on_delete=models.CASCADE, related_name="items")
    source_delivery = models.ForeignKey(
        Delivery, on_delete=models.CASCADE, related_name="replay_items"
    )
    endpoint = models.ForeignKey(Endpoint, on_delete=models.CASCADE, related_name="replay_items")
    created_delivery = models.ForeignKey(
        Delivery,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_by_replay",
    )

    class Meta:
        db_table = "delivery_batch_items"
