# Deployment Guide

## Prerequisites

- Docker and Docker Compose
- Python 3.12+ (for local development)
- [uv](https://docs.astral.sh/uv/) package manager

## Quick Start

```bash
git clone https://github.com/aayodejii/deliverant.git
cd deliverant
docker compose up --build
```

Services start at:
- API: http://localhost:8000
- Dashboard: http://localhost:3000
- PostgreSQL: localhost:5432
- Redis: localhost:6379

## Services

| Service | Description | Port |
|---|---|---|
| `api` | Django REST API (Gunicorn) | 8000 |
| `worker` | Celery worker (delivery execution) | — |
| `beat` | Celery beat (scheduler + lease recovery) | — |
| `dashboard` | Next.js dashboard | 3000 |
| `postgres` | PostgreSQL 16 | 5432 |
| `redis` | Redis 7 | 6379 |

## Environment Variables

### Required

| Variable | Description | Default |
|---|---|---|
| `SECRET_KEY` | Django secret key | `django-insecure-...` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_NAME` | Database name | `deliverant` |
| `DB_USER` | Database user | `deliverant` |
| `DB_PASSWORD` | Database password | `deliverant` |
| `REDIS_URL` | Redis URL | `redis://localhost:6379/0` |
| `CELERY_BROKER_URL` | Celery broker | `redis://localhost:6379/0` |

### Optional

| Variable | Description | Default |
|---|---|---|
| `INTERNAL_API_SECRET` | Shared secret for OAuth provision | `""` |
| `PROMETHEUS_MULTIPROC_DIR` | Directory for multi-process metrics | — |
| `DJANGO_SETTINGS_MODULE` | Settings module | `deliverant.settings.development` |

### Dashboard (Next.js)

| Variable | Description | Default |
|---|---|---|
| `API_URL` | Django API base URL | `http://localhost:8000/v1` |
| `NEXT_PUBLIC_APP_URL` | Dashboard public URL | `http://localhost:3000` |
| `INTERNAL_API_SECRET` | Must match Django's value | — |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | — |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | — |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID | — |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret | — |

## Configuration Constants

Defined in `deliverant/settings/base.py`:

| Constant | Value | Description |
|---|---|---|
| `MAX_PAYLOAD_SIZE` | 256 KB | Maximum event payload size |
| `MAX_ATTEMPTS` | 12 | Maximum delivery attempts |
| `MAX_DELIVERY_TTL_HOURS` | 72 | Maximum delivery time-to-live |
| `DEFAULT_ATTEMPT_TIMEOUT_SECONDS` | 10 | HTTP request timeout |
| `LEASE_DURATION_SECONDS` | 30 | Worker lease duration |
| `LEASE_RECOVERY_DELAY_SECONDS` | 30 | Delay before retrying after crash |
| `DEDUP_WINDOW_HOURS` | 72 | Idempotency dedup window |
| `MAX_ENDPOINT_CONCURRENCY` | 10 | Max in-flight deliveries per endpoint |
| `MAX_REPLAY_BATCH_SIZE` | 1000 | Max deliveries in a replay batch |

## Database Migrations

```bash
docker compose exec api uv run python manage.py migrate
```

## Running Tests

```bash
# All tests
docker compose exec api uv run pytest tests/ -v

# Unit tests only
docker compose exec api uv run pytest tests/unit -v

# Integration tests only
docker compose exec api uv run pytest tests/integration -v

# E2E tests only
docker compose exec api uv run pytest tests/e2e -v

# With coverage
docker compose exec api uv run pytest --cov=apps --cov=workers
```

## Monitoring

### Prometheus Metrics

Available at `GET /metrics` (provided by django-prometheus).

Key metrics:
- `deliveries_created_total` — Counter by tenant and mode
- `attempts_executed_total` — Counter by outcome and classification
- `delivery_latency_seconds` — Histogram of end-to-end delivery time
- `attempt_latency_seconds` — Histogram of individual attempt latency
- `backlog_size` — Gauge by status (PENDING, SCHEDULED, IN_PROGRESS)
- `endpoint_success_rate` — Gauge by endpoint

Worker metrics are shared via `PROMETHEUS_MULTIPROC_DIR` volume.

### Health Checks

| Endpoint | Description |
|---|---|
| `GET /health` | Overall (DB + Redis) |
| `GET /health/db` | Database |
| `GET /health/redis` | Redis |
| `GET /health/workers` | Celery workers |

Returns `200` if healthy, `503` if unhealthy.

### Structured Logging

Worker logs are JSON-formatted with correlation IDs:

```json
{
  "asctime": "2024-01-01 00:00:00",
  "name": "workers.delivery",
  "levelname": "INFO",
  "message": "Delivery attempt completed",
  "delivery_id": "uuid",
  "tenant_id": "uuid",
  "attempt_number": 1,
  "outcome": "SUCCESS"
}
```

## Production Checklist

- [ ] Set a strong `SECRET_KEY`
- [ ] Set `INTERNAL_API_SECRET` to a strong random value (shared between API and dashboard)
- [ ] Set `DJANGO_SETTINGS_MODULE=deliverant.settings.production`
- [ ] Configure `ALLOWED_HOSTS` in production settings
- [ ] Set up PostgreSQL with proper credentials
- [ ] Configure Redis with authentication if exposed
- [ ] Set up Prometheus scraping for `/metrics`
- [ ] Configure log aggregation for JSON logs
- [ ] Set up Google and GitHub OAuth credentials for dashboard
- [ ] Use HTTPS for all services (API, dashboard, webhook delivery endpoints)
- [ ] Set `PROMETHEUS_MULTIPROC_DIR` as a shared volume between api and worker
- [ ] Point `NEXT_PUBLIC_APP_URL` to your production dashboard domain
