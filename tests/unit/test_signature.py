import hashlib
import hmac

import pytest

from workers.delivery import generate_signature


class TestGenerateSignature:
    def test_returns_none_if_no_secret(self):
        assert generate_signature(None, 1234567890, '{"key":"value"}') is None

    def test_returns_none_if_empty_secret(self):
        assert generate_signature("", 1234567890, '{"key":"value"}') is None

    def test_returns_v1_format(self):
        result = generate_signature("my-secret", 1234567890, '{"key":"value"}')
        assert result.startswith("v1=")
        assert len(result) == 3 + 64  # "v1=" + 64 hex chars

    def test_deterministic(self):
        a = generate_signature("secret", 123, "body")
        b = generate_signature("secret", 123, "body")
        assert a == b

    def test_correct_hmac(self):
        secret = "test-secret"
        timestamp = 1234567890
        body = '{"event":"test"}'

        expected_message = f"{timestamp}.{body}"
        expected_sig = hmac.new(
            secret.encode(), expected_message.encode(), hashlib.sha256
        ).hexdigest()

        result = generate_signature(secret, timestamp, body)
        assert result == f"v1={expected_sig}"

    def test_different_secrets_produce_different_signatures(self):
        a = generate_signature("secret-a", 123, "body")
        b = generate_signature("secret-b", 123, "body")
        assert a != b

    def test_different_timestamps_produce_different_signatures(self):
        a = generate_signature("secret", 100, "body")
        b = generate_signature("secret", 200, "body")
        assert a != b
