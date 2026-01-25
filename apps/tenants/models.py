import hashlib
import secrets
import uuid

from django.db import models
from django.utils import timezone


class Tenant(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "tenants"

    def __str__(self):
        return self.name


class APIKeyManager(models.Manager):
    def create_key(self, tenant, name=None):
        raw_key = secrets.token_urlsafe(32)
        key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
        api_key = self.create(
            tenant=tenant,
            key_hash=key_hash,
            name=name,
        )
        return api_key, raw_key


class APIKey(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        REVOKED = "REVOKED", "Revoked"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name="api_keys",
    )
    key_hash = models.CharField(max_length=64, unique=True)
    name = models.CharField(max_length=255, blank=True)
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.ACTIVE,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    last_used_at = models.DateTimeField(null=True, blank=True)

    objects = APIKeyManager()

    class Meta:
        db_table = "api_keys"
        verbose_name = "API Key"
        verbose_name_plural = "API Keys"

    def __str__(self):
        return f"{self.tenant.name} - {self.name or 'Unnamed'}"

    @classmethod
    def hash_key(cls, raw_key):
        return hashlib.sha256(raw_key.encode()).hexdigest()

    @classmethod
    def get_from_key(cls, raw_key):
        key_hash = cls.hash_key(raw_key)
        try:
            return cls.objects.select_related("tenant").get(
                key_hash=key_hash,
                status=cls.Status.ACTIVE,
            )
        except cls.DoesNotExist:
            return None

    def update_last_used(self):
        self.last_used_at = timezone.now()
        self.save(update_fields=["last_used_at"])

    def revoke(self):
        self.status = self.Status.REVOKED
        self.save(update_fields=["status"])
