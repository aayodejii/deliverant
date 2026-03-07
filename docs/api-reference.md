# Deliverant API Reference

Base URL: `http://localhost:8000/v1`

All endpoints (except health and OAuth provision) require authentication via `Authorization: Bearer <api_key>`.

---

## Authentication

All API requests must include an API key in the `Authorization` header:

```
Authorization: Bearer <api_key>
```

Unauthenticated requests return `401 Unauthorized`.

---

## Endpoints

### Create Endpoint

`POST /v1/endpoints`

```json
{
  "name": "my-webhook",
  "url": "https://example.com/webhook",
  "secret": "optional-signing-secret",
  "headers_json": {},
  "timeout_seconds": 10
}
```

Response `201`:

```json
{
  "id": "uuid",
  "name": "my-webhook",
  "url": "https://example.com/webhook",
  "status": "ACTIVE",
  "timeout_seconds": 10,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### List Endpoints

`GET /v1/endpoints`

Response `200`: Array of endpoint objects.

### Get Endpoint

`GET /v1/endpoints/{id}`

Response `200`: Single endpoint object. `404` if not found.

### Update Endpoint

`PATCH /v1/endpoints/{id}`

```json
{
  "name": "new-name",
  "status": "PAUSED"
}
```

Setting `status` to `PAUSED` pauses the endpoint. Setting it to `ACTIVE` resumes it.

Response `200`: Updated endpoint object.

### Delete Endpoint

`DELETE /v1/endpoints/{id}`

Response `204`: No content.

---

## Events

### Create Event

`POST /v1/events`

```json
{
  "type": "order.created",
  "payload": { "order_id": 123 },
  "endpoint_ids": ["endpoint-uuid"],
  "idempotency_key": "unique-key-123"
}
```

- `idempotency_key` is optional. When provided, enables RELIABLE mode with time-bounded dedup (72h).
- Without `idempotency_key`, BASIC mode generates a deterministic key from tenant+endpoint+type+payload.

Response `202`:

```json
{
  "event_id": "uuid",
  "deliveries": [
    {
      "delivery_id": "uuid",
      "endpoint_id": "uuid",
      "created": true
    }
  ]
}
```

- `created: false` means an existing delivery was returned (dedup hit).
- `409 Conflict` if the same idempotency key is reused with a different payload within the 72h window.

---

## Deliveries

### List Deliveries

`GET /v1/deliveries`

Query parameters:
- `status` — Filter by status (PENDING, SCHEDULED, IN_PROGRESS, DELIVERED, FAILED, EXPIRED, CANCELLED)
- `endpoint_id` — Filter by endpoint
- `event_id` — Filter by event
- `search` — Search by event type or endpoint name
- `cursor` — Cursor for pagination (ISO datetime)
- `limit` — Results per page (default 20, max 100)

Response `200`:

```json
{
  "results": [...],
  "has_more": true,
  "next_cursor": "2024-01-01T00:00:00Z"
}
```

### Get Delivery

`GET /v1/deliveries/{id}`

Response `200`: Delivery object with nested `attempts` array.

### Cancel Delivery

`POST /v1/deliveries/{id}/cancel`

Cancels a non-terminal delivery. Returns `409` if the delivery is already in a terminal state.

Response `200`:

```json
{
  "status": "cancelled",
  "delivery_id": "uuid"
}
```

---

## Replays

### Create Replay Batch

`POST /v1/replays`

```json
{
  "delivery_ids": ["uuid1", "uuid2"],
  "dry_run": false
}
```

- `dry_run: true` returns what would be created without actually creating deliveries.
- Max batch size: 1000.

Response `201`:

```json
{
  "batch_id": "uuid",
  "created_deliveries": 2,
  "dry_run": false
}
```

---

## Analytics

### Delivery Volume

`GET /v1/analytics/delivery-volume?hours=24`

Returns hourly delivery counts.

```json
[
  { "hour": "2024-01-01T00:00:00Z", "total": 100, "delivered": 90, "failed": 10 }
]
```

### Success Rate

`GET /v1/analytics/success-rate?hours=24`

Returns hourly success rate percentage.

```json
[
  { "hour": "2024-01-01T00:00:00Z", "rate": 90.0, "total": 100 }
]
```

### Latency Distribution

`GET /v1/analytics/latency-distribution`

Returns attempt latency distribution over the last 24h.

```json
[
  { "bucket": "<100ms", "count": 50 },
  { "bucket": "100-300ms", "count": 30 }
]
```

### Endpoint Health

`GET /v1/analytics/endpoint-health`

Returns per-endpoint delivery stats.

```json
[
  {
    "endpoint_id": "uuid",
    "name": "my-webhook",
    "status": "ACTIVE",
    "total": 100,
    "delivered": 90,
    "success_rate": 90.0,
    "avg_latency_ms": 150
  }
]
```

---

## Kill Switch

### Get Status

`GET /v1/kill-switch`

```json
{ "active": false }
```

### Toggle

`POST /v1/kill-switch`

```json
{ "active": true }
```

When active, all delivery attempts are paused. Event ingestion remains available.

---

## Tenant

### Get Tenant Info

`GET /v1/tenant`

```json
{
  "id": "uuid",
  "name": "my-tenant",
  "created_at": "2024-01-01T00:00:00Z",
  "api_keys": [
    {
      "id": "uuid",
      "name": "default",
      "status": "ACTIVE",
      "created_at": "2024-01-01T00:00:00Z",
      "last_used_at": null
    }
  ]
}
```

---

## OAuth Provision (Internal)

`POST /v1/auth/oauth-provision`

Server-to-server endpoint. Requires `X-Internal-Secret` header.

```json
{
  "email": "user@example.com",
  "name": "User Name",
  "provider": "google",
  "provider_account_id": "google-123"
}
```

Creates or retrieves user/tenant, issues an API key.

### Revoke Session

`POST /v1/auth/revoke-session`

Revokes the current API key. Requires authentication.

---

## Health (Public)

No authentication required.

| Endpoint | Description |
|---|---|
| `GET /health` | DB + Redis status |
| `GET /health/db` | Database connectivity |
| `GET /health/redis` | Redis connectivity |
| `GET /health/workers` | Celery worker status |

---

## Webhook Delivery Headers

When Deliverant delivers a webhook, the following headers are included:

| Header | Description |
|---|---|
| `Content-Type` | `application/json` |
| `X-Webhook-Event` | Event type (e.g., `order.created`) |
| `X-Webhook-Delivery` | Delivery UUID |
| `X-Webhook-Attempt` | Attempt number (1-based) |
| `X-Webhook-Timestamp` | Unix timestamp |
| `X-Webhook-Signature` | `v1=<hmac_sha256>` (if endpoint has a secret) |

### Signature Verification

```
signature = HMAC-SHA256(secret, "{timestamp}.{body}")
```

---

## Status Codes

| Code | Meaning |
|---|---|
| `200` | Success |
| `201` | Created |
| `202` | Accepted (async processing) |
| `204` | No Content |
| `400` | Validation error |
| `401` | Unauthorized |
| `403` | Forbidden |
| `404` | Not found |
| `409` | Conflict (idempotency or state) |
| `503` | Service unavailable |

## Delivery States

```
PENDING → SCHEDULED → IN_PROGRESS → DELIVERED
                   ↘ → FAILED
                   ↘ → EXPIRED
              ↘ → CANCELLED (from any non-terminal state)
```

Terminal states: DELIVERED, FAILED, EXPIRED, CANCELLED.

## Retry Backoff Schedule

| Attempt | Delay (max) |
|---|---|
| 1 | 5 seconds |
| 2 | 30 seconds |
| 3 | 2 minutes |
| 4 | 10 minutes |
| 5 | 30 minutes |
| 6 | 2 hours |
| 7 | 6 hours |
| 8 | 12 hours |
| 9 | 18 hours |
| 10-12 | 24 hours |

Full jitter is applied: actual delay is `random(0, max_delay)`.
