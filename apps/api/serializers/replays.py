from rest_framework import serializers

from apps.api.prefixed_ids import PrefixedIDField


class ReplayCreateSerializer(serializers.Serializer):
    delivery_ids = serializers.ListField(
        child=PrefixedIDField("del_"),
        min_length=1,
    )
    dry_run = serializers.BooleanField(default=False)
