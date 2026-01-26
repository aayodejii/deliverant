from rest_framework import serializers

from apps.endpoints.models import Endpoint


class EndpointSerializer(serializers.ModelSerializer):
    class Meta:
        model = Endpoint
        fields = [
            "id",
            "name",
            "url",
            "headers_json",
            "timeout_seconds",
            "status",
            "paused_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "paused_at", "created_at", "updated_at"]


class EndpointCreateSerializer(serializers.ModelSerializer):
    secret = serializers.CharField(write_only=True, required=False, allow_blank=True)
    headers_json = serializers.JSONField(required=False, default=dict)
    timeout_seconds = serializers.IntegerField(required=False)

    class Meta:
        model = Endpoint
        fields = [
            "name",
            "url",
            "secret",
            "headers_json",
            "timeout_seconds",
        ]

    def create(self, validated_data):
        secret = validated_data.pop("secret", None)
        tenant = self.context["request"].auth.tenant
        endpoint = Endpoint.objects.create(tenant=tenant, **validated_data)
        if secret:
            endpoint.secret_encrypted = secret.encode()
            endpoint.save(update_fields=["secret_encrypted"])
        return endpoint


class EndpointUpdateSerializer(serializers.ModelSerializer):
    secret = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Endpoint
        fields = [
            "name",
            "url",
            "secret",
            "headers_json",
            "timeout_seconds",
            "status",
        ]

    def update(self, instance, validated_data):
        secret = validated_data.pop("secret", None)
        if secret is not None:
            instance.secret_encrypted = secret.encode() if secret else None

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if validated_data.get("status") == Endpoint.Status.PAUSED and instance.paused_at is None:
            instance.pause()
        elif validated_data.get("status") == Endpoint.Status.ACTIVE and instance.paused_at is not None:
            instance.resume()
        else:
            instance.save()

        return instance
