import uuid

from django.db import models

from apps.deliveries.models import Delivery
from apps.tenants.models import Tenant


class Attempt(models.Model):
    class Outcome(models.TextChoices):
        SUCCESS = "SUCCESS", "Success"
        RETRYABLE_FAILURE = "RETRYABLE_FAILURE", "Retryable Failure"
        NON_RETRYABLE_FAILURE = "NON_RETRYABLE_FAILURE", "Non-Retryable Failure"

    class Classification(models.TextChoices):
        NETWORK_ERROR = "NETWORK_ERROR", "Network Error"
        DNS_ERROR = "DNS_ERROR", "DNS Error"
        TLS_ERROR = "TLS_ERROR", "TLS Error"
        TIMEOUT = "TIMEOUT", "Timeout"
        HTTP_4XX_PERMANENT = "HTTP_4XX_PERMANENT", "HTTP 4xx Permanent"
        HTTP_5XX_RETRYABLE = "HTTP_5XX_RETRYABLE", "HTTP 5xx Retryable"
        RATE_LIMITED = "RATE_LIMITED", "Rate Limited"
        WORKER_CRASH_OR_UNKNOWN = "WORKER_CRASH_OR_UNKNOWN", "Worker Crash or Unknown"
        OTHER = "OTHER", "Other"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name="attempts",
    )
    delivery = models.ForeignKey(
        Delivery,
        on_delete=models.CASCADE,
        related_name="attempts",
    )
    attempt_number = models.IntegerField()
    started_at = models.DateTimeField()
    ended_at = models.DateTimeField(null=True, blank=True)
    latency_ms = models.IntegerField(null=True, blank=True)
    outcome = models.CharField(
        max_length=25,
        choices=Outcome.choices,
        null=True,
        blank=True,
    )
    classification = models.CharField(
        max_length=25,
        choices=Classification.choices,
        null=True,
        blank=True,
    )
    http_status = models.IntegerField(null=True, blank=True)
    response_headers_json = models.JSONField(null=True, blank=True)
    response_body_snippet = models.TextField(null=True, blank=True)
    error_detail = models.TextField(null=True, blank=True)
    request_payload_hash = models.CharField(max_length=64)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "attempts"
        constraints = [
            models.UniqueConstraint(
                fields=["delivery", "attempt_number"],
                name="unique_delivery_attempt_number",
            ),
        ]
        indexes = [
            models.Index(fields=["delivery_id", "attempt_number"], name="idx_attempts_delivery_num"),
        ]

    def __str__(self):
        return f"Attempt {self.attempt_number} for {self.delivery_id}"
