import pytest

from apps.attempts.models import Attempt
from workers.delivery import classify_response


class TestClassifyResponse:
    def test_2xx_success(self):
        for status in [200, 201, 204, 299]:
            outcome, classification = classify_response(None, status)
            assert outcome == Attempt.Outcome.SUCCESS
            assert classification is None

    def test_5xx_retryable(self):
        for status in [500, 502, 503, 599]:
            outcome, classification = classify_response(None, status)
            assert outcome == Attempt.Outcome.RETRYABLE_FAILURE
            assert classification == Attempt.Classification.HTTP_5XX_RETRYABLE

    def test_4xx_non_retryable(self):
        for status in [400, 401, 403, 404, 422]:
            outcome, classification = classify_response(None, status)
            assert outcome == Attempt.Outcome.NON_RETRYABLE_FAILURE
            assert classification == Attempt.Classification.HTTP_4XX_PERMANENT

    def test_3xx_non_retryable(self):
        for status in [301, 302, 307]:
            outcome, classification = classify_response(None, status)
            assert outcome == Attempt.Outcome.NON_RETRYABLE_FAILURE
            assert classification == Attempt.Classification.HTTP_4XX_PERMANENT

    def test_408_retryable_timeout(self):
        outcome, classification = classify_response(None, 408)
        assert outcome == Attempt.Outcome.RETRYABLE_FAILURE
        assert classification == Attempt.Classification.TIMEOUT

    def test_429_rate_limited(self):
        outcome, classification = classify_response(None, 429)
        assert outcome == Attempt.Outcome.RETRYABLE_FAILURE
        assert classification == Attempt.Classification.RATE_LIMITED

    def test_timeout_exception(self):
        exc = TimeoutError("Connection timed out")
        outcome, classification = classify_response(exc, None)
        assert outcome == Attempt.Outcome.RETRYABLE_FAILURE
        assert classification == Attempt.Classification.TIMEOUT

    def test_dns_exception(self):
        exc = Exception("DNS resolution failed for example.com")
        outcome, classification = classify_response(exc, None)
        assert outcome == Attempt.Outcome.RETRYABLE_FAILURE
        assert classification == Attempt.Classification.DNS_ERROR

    def test_ssl_exception(self):
        exc = Exception("SSL certificate verify failed")
        outcome, classification = classify_response(exc, None)
        assert outcome == Attempt.Outcome.RETRYABLE_FAILURE
        assert classification == Attempt.Classification.TLS_ERROR

    def test_tls_exception(self):
        exc = Exception("TLS handshake failed")
        outcome, classification = classify_response(exc, None)
        assert outcome == Attempt.Outcome.RETRYABLE_FAILURE
        assert classification == Attempt.Classification.TLS_ERROR

    def test_generic_exception(self):
        exc = ConnectionError("Connection refused")
        outcome, classification = classify_response(exc, None)
        assert outcome == Attempt.Outcome.RETRYABLE_FAILURE
        assert classification == Attempt.Classification.NETWORK_ERROR

    def test_no_exception_no_status(self):
        outcome, classification = classify_response(None, None)
        assert outcome == Attempt.Outcome.RETRYABLE_FAILURE
        assert classification == Attempt.Classification.OTHER
