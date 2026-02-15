import hashlib
import json
from datetime import timedelta

from django.conf import settings
from django.utils import timezone
from rest_framework import serializers

from apps.deliveries.models import Delivery
from apps.endpoints.models import Endpoint
from apps.events.models import Event


class EventCreateSerializer(serializers.Serializer):
    type = serializers.CharField(max_length=255)
    payload = serializers.JSONField()
    endpoint_ids = serializers.ListField(
        child=serializers.UUIDField(),
        min_length=1,
    )
    idempotency_key = serializers.CharField(max_length=255, required=False, allow_blank=True)

    def validate_payload(self, value):
        payload_str = json.dumps(value, sort_keys=True, separators=(",", ":"))
        if len(payload_str.encode("utf-8")) > settings.MAX_PAYLOAD_SIZE:
            raise serializers.ValidationError(
                f"Payload exceeds maximum size of {settings.MAX_PAYLOAD_SIZE} bytes"
            )
        return value

    def validate_endpoint_ids(self, value):
        tenant = self.context["request"].user
        endpoints = Endpoint.objects.filter(tenant=tenant, id__in=value)
        found_ids = set(str(ep.id) for ep in endpoints)
        requested_ids = set(str(id) for id in value)
        missing = requested_ids - found_ids
        if missing:
            raise serializers.ValidationError(f"Endpoints not found: {', '.join(missing)}")
        return value

    def create(self, validated_data):
        tenant = self.context["request"].user
        payload = validated_data["payload"]
        payload_str = json.dumps(payload, sort_keys=True, separators=(",", ":"))
        payload_hash = hashlib.sha256(payload_str.encode()).hexdigest()

        event = Event.objects.create(
            tenant=tenant,
            type=validated_data["type"],
            payload_json=payload_str,
            payload_hash=payload_hash,
        )

        endpoints = Endpoint.objects.filter(tenant=tenant, id__in=validated_data["endpoint_ids"])
        idempotency_key = validated_data.get("idempotency_key")
        deliveries = []
        dedup_window = timezone.now() - timedelta(hours=settings.DEDUP_WINDOW_HOURS)

        for endpoint in endpoints:
            if idempotency_key:
                mode = Delivery.Mode.RELIABLE
                key_hash = hashlib.sha256(idempotency_key.encode()).hexdigest()
            else:
                mode = Delivery.Mode.BASIC
                key_hash = hashlib.sha256(
                    f"{tenant.id}:{endpoint.id}:{event.type}:{payload_hash}".encode()
                ).hexdigest()

            existing = Delivery.objects.filter(
                tenant=tenant,
                endpoint=endpoint,
                idempotency_key_hash=key_hash,
                created_at__gte=dedup_window,
            ).first()

            if existing:
                if mode == Delivery.Mode.RELIABLE and existing.event.payload_hash != payload_hash:
                    raise serializers.ValidationError({
                        "idempotency_key": "Idempotency key reused with different payload"
                    })
                delivery = existing
                created = False
            else:
                was_reused = Delivery.objects.filter(
                    tenant=tenant,
                    endpoint=endpoint,
                    idempotency_key_hash=key_hash,
                ).exists()

                delivery = Delivery.objects.create(
                    tenant=tenant,
                    endpoint=endpoint,
                    event=event,
                    mode=mode,
                    idempotency_key=idempotency_key,
                    idempotency_key_hash=key_hash,
                    idempotency_key_reused=was_reused,
                    status=Delivery.Status.PENDING,
                )
                created = True

            deliveries.append({"delivery": delivery, "created": created})

        return {"event": event, "deliveries": deliveries}


class EventSerializer(serializers.ModelSerializer):
    payload = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = ["id", "type", "payload", "created_at"]

    def get_payload(self, obj):
        return json.loads(obj.payload_json)


class EventCreateResponseSerializer(serializers.Serializer):
    event_id = serializers.UUIDField()
    deliveries = serializers.ListField()
