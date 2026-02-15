from rest_framework import serializers

from apps.attempts.models import Attempt
from apps.deliveries.models import Delivery


class AttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attempt
        fields = [
            "id",
            "attempt_number",
            "started_at",
            "ended_at",
            "latency_ms",
            "outcome",
            "classification",
            "http_status",
            "response_headers_json",
            "response_body_snippet",
            "error_detail",
            "created_at",
        ]


class DeliverySerializer(serializers.ModelSerializer):
    endpoint_name = serializers.CharField(source="endpoint.name", read_only=True)
    event_type = serializers.CharField(source="event.type", read_only=True)

    class Meta:
        model = Delivery
        fields = [
            "id",
            "event_id",
            "endpoint_id",
            "endpoint_name",
            "event_type",
            "mode",
            "status",
            "attempts_count",
            "next_attempt_at",
            "first_scheduled_at",
            "last_attempt_at",
            "terminal_at",
            "terminal_reason",
            "cancel_requested",
            "created_at",
            "updated_at",
        ]


class DeliveryDetailSerializer(DeliverySerializer):
    attempts = AttemptSerializer(many=True, read_only=True)

    class Meta(DeliverySerializer.Meta):
        fields = DeliverySerializer.Meta.fields + ["attempts"]
