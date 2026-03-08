import uuid

from rest_framework import serializers


PREFIX_MAP = {
    "Event": "evt_",
    "Delivery": "del_",
    "Endpoint": "ep_",
    "Attempt": "att_",
    "DeliveryBatch": "bat_",
}


def to_prefixed(prefix, value):
    return f"{prefix}{value}"


def from_prefixed(prefixed_id, expected_prefix):
    prefixed_id = str(prefixed_id)
    if not prefixed_id.startswith(expected_prefix):
        raise ValueError(
            f"Expected ID with prefix '{expected_prefix}', got '{prefixed_id}'"
        )
    raw = prefixed_id[len(expected_prefix):]
    try:
        uuid.UUID(raw)
    except ValueError:
        raise ValueError(f"Invalid UUID after prefix: '{raw}'")
    return raw


class PrefixedIDField(serializers.Field):
    def __init__(self, prefix, **kwargs):
        self.prefix = prefix
        kwargs.setdefault("read_only", False)
        super().__init__(**kwargs)

    def to_representation(self, value):
        return to_prefixed(self.prefix, value)

    def to_internal_value(self, data):
        try:
            return from_prefixed(data, self.prefix)
        except ValueError as e:
            raise serializers.ValidationError(str(e))
