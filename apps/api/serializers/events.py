import hashlib
import json

from django.conf import settings
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

        for endpoint in endpoints:
            if idempotency_key:
                mode = Delivery.Mode.RELIABLE
                key_hash = hashlib.sha256(idempotency_key.encode()).hexdigest()
            else:
                mode = Delivery.Mode.BASIC
                key_hash = hashlib.sha256(
                    f"{tenant.id}:{endpoint.id}:{event.type}:{payload_hash}".encode()
                ).hexdigest()

            delivery, created = Delivery.objects.get_or_create(
                tenant=tenant,
                endpoint=endpoint,
                idempotency_key_hash=key_hash,
                defaults={
                    "event": event,
                    "mode": mode,
                    "idempotency_key": idempotency_key,
                    "status": Delivery.Status.PENDING,
                },
            )
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
