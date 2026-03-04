import hashlib
import hmac
import httpx
import logging

from django.db import transaction
from django.utils import timezone

from apps.attempts.models import Attempt
from apps.deliveries.models import Delivery
from apps.deliveries.state_machine import DeliveryStateMachine
from deliverant.celery import app
from workers import kill_switch
from workers.metrics import attempts_executed_total, attempt_latency_seconds, delivery_latency_seconds

logger = logging.getLogger("workers.delivery")


def generate_signature(secret, timestamp, body):
    """Generate HMAC SHA256 signature for webhook."""
    if not secret:
        return None

    message = f"{timestamp}.{body}"
    signature = hmac.new(
        secret.encode() if isinstance(secret, str) else secret,
        message.encode(),
        hashlib.sha256
    ).hexdigest()
    return f"v1={signature}"


def classify_response(response_exception, http_status):
    """Classify HTTP response into outcome and classification."""
    if response_exception:
        error_type = type(response_exception).__name__

        if "timeout" in error_type.lower() or "read timeout" in str(response_exception).lower():
            return Attempt.Outcome.RETRYABLE_FAILURE, Attempt.Classification.TIMEOUT

        if "dns" in str(response_exception).lower():
            return Attempt.Outcome.RETRYABLE_FAILURE, Attempt.Classification.DNS_ERROR

        if "ssl" in str(response_exception).lower() or "tls" in str(response_exception).lower():
            return Attempt.Outcome.RETRYABLE_FAILURE, Attempt.Classification.TLS_ERROR

        return Attempt.Outcome.RETRYABLE_FAILURE, Attempt.Classification.NETWORK_ERROR

    if http_status is None:
        return Attempt.Outcome.RETRYABLE_FAILURE, Attempt.Classification.OTHER

    if 200 <= http_status < 300:
        return Attempt.Outcome.SUCCESS, None

    if http_status == 429:
        return Attempt.Outcome.RETRYABLE_FAILURE, Attempt.Classification.RATE_LIMITED

    if http_status == 408:
        return Attempt.Outcome.RETRYABLE_FAILURE, Attempt.Classification.TIMEOUT

    if 400 <= http_status < 500:
        return Attempt.Outcome.NON_RETRYABLE_FAILURE, Attempt.Classification.HTTP_4XX_PERMANENT

    if 500 <= http_status < 600:
        return Attempt.Outcome.RETRYABLE_FAILURE, Attempt.Classification.HTTP_5XX_RETRYABLE

    if 300 <= http_status < 400:
        return Attempt.Outcome.NON_RETRYABLE_FAILURE, Attempt.Classification.HTTP_4XX_PERMANENT

    return Attempt.Outcome.RETRYABLE_FAILURE, Attempt.Classification.OTHER


@app.task
def execute_delivery(delivery_id):
    """Execute HTTP delivery for a delivery."""
    if kill_switch.is_active():
        logger.info("Delivery skipped due to kill switch", extra={"delivery_id": delivery_id})
        return {"status": "skipped", "reason": "kill_switch_active"}

    try:
        with transaction.atomic():
            delivery = Delivery.objects.select_for_update(skip_locked=True).select_related(
                "endpoint", "event", "tenant"
            ).get(id=delivery_id)

            if delivery.status != Delivery.Status.SCHEDULED:
                logger.info("Delivery skipped", extra={
                    "delivery_id": delivery_id,
                    "reason": f"delivery_status_{delivery.status}",
                })
                return {"status": "skipped", "reason": f"delivery_status_{delivery.status}"}

            delivery = DeliveryStateMachine.acquire_lease(delivery)

    except Delivery.DoesNotExist:
        logger.warning("Delivery not found", extra={"delivery_id": delivery_id})
        return {"status": "error", "reason": "delivery_not_found"}
    except Exception as e:
        logger.error("Failed to acquire lease", extra={"delivery_id": delivery_id, "error": str(e)})
        return {"status": "error", "reason": str(e)}

    attempt_number = delivery.attempts_count + 1
    started_at = timezone.now()

    timestamp = int(started_at.timestamp())
    payload_body = delivery.event.payload_json

    headers = {
        "Content-Type": "application/json",
        "X-Webhook-Event": delivery.event.type,
        "X-Webhook-Delivery": str(delivery.id),
        "X-Webhook-Attempt": str(attempt_number),
        "X-Webhook-Timestamp": str(timestamp),
    }

    if delivery.endpoint.secret_encrypted:
        secret = delivery.endpoint.secret_encrypted.decode()
        signature = generate_signature(secret, timestamp, payload_body)
        if signature:
            headers["X-Webhook-Signature"] = signature

    if delivery.endpoint.headers_json:
        headers.update(delivery.endpoint.headers_json)

    response_exception = None
    http_status = None
    response_headers = None
    response_body_snippet = None
    latency_ms = None

    try:
        with httpx.Client(timeout=delivery.endpoint.timeout_seconds) as client:
            response = client.post(
                delivery.endpoint.url,
                content=payload_body,
                headers=headers,
            )
            ended_at = timezone.now()
            latency_ms = int((ended_at - started_at).total_seconds() * 1000)

            http_status = response.status_code
            response_headers = dict(response.headers)

            try:
                response_body_snippet = response.text[:1024]
            except Exception:
                response_body_snippet = None

    except Exception as e:
        response_exception = e
        ended_at = timezone.now()
        latency_ms = int((ended_at - started_at).total_seconds() * 1000)

    outcome, classification = classify_response(response_exception, http_status)

    payload_hash = delivery.event.payload_hash
    error_detail = str(response_exception) if response_exception else None

    attempt = Attempt.objects.create(
        tenant=delivery.tenant,
        delivery=delivery,
        attempt_number=attempt_number,
        started_at=started_at,
        ended_at=ended_at,
        latency_ms=latency_ms,
        outcome=outcome,
        classification=classification,
        http_status=http_status,
        response_headers_json=response_headers,
        response_body_snippet=response_body_snippet,
        error_detail=error_detail,
        request_payload_hash=payload_hash,
    )

    attempts_executed_total.labels(
        outcome=outcome or "unknown",
        classification=classification or "none",
    ).inc()
    if latency_ms is not None:
        attempt_latency_seconds.observe(latency_ms / 1000)

    with transaction.atomic():
        delivery = Delivery.objects.select_for_update().get(id=delivery_id)

        if outcome == Attempt.Outcome.SUCCESS:
            DeliveryStateMachine.complete_success(delivery)
            total_seconds = (timezone.now() - delivery.created_at).total_seconds()
            delivery_latency_seconds.observe(total_seconds)
        elif outcome == Attempt.Outcome.NON_RETRYABLE_FAILURE:
            DeliveryStateMachine.complete_non_retryable(delivery, f"{classification}: {error_detail or http_status}")
            total_seconds = (timezone.now() - delivery.created_at).total_seconds()
            delivery_latency_seconds.observe(total_seconds)
        else:
            DeliveryStateMachine.complete_retryable(delivery, attempt_number)

    logger.info("Delivery attempt completed", extra={
        "delivery_id": str(delivery.id),
        "attempt_id": str(attempt.id),
        "tenant_id": str(delivery.tenant_id),
        "attempt_number": attempt_number,
        "outcome": outcome,
        "classification": classification,
        "http_status": http_status,
        "latency_ms": latency_ms,
    })

    return {
        "status": "completed",
        "delivery_id": str(delivery.id),
        "attempt_number": attempt_number,
        "outcome": outcome,
        "http_status": http_status,
    }
