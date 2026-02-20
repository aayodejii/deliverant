from rest_framework import serializers


class ReplayCreateSerializer(serializers.Serializer):
    delivery_ids = serializers.ListField(
        child=serializers.UUIDField(),
        min_length=1,
    )
    dry_run = serializers.BooleanField(default=False)
