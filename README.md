# Deliverant

Deliverant is a hosted reliability layer for outbound webhooks.

It ensures webhook events are delivered safely under failure, with deterministic retries, enforced deduplication, and full delivery visibility.

This project is intentionally opinionated. It prioritizes correctness, transparency, and trust over convenience or speed.

## Why Deliverant exists

Every SaaS that sends webhooks eventually faces the same problems:

- Silent delivery failures
- Duplicate deliveries during retries
- No visibility into what actually happened
- Risky manual replays

Most teams either build a fragile internal solution, or accept unreliable behavior and hope for the best.

Deliverant exists to make webhook delivery boring, predictable, and auditable.

## Core guarantees

### At-least-once delivery

Events are never silently dropped. If the system is unsure, it retries.

### Enforced deduplication

Duplicate deliveries are prevented within a defined window when idempotency is used.

### Deterministic retries

Retry behavior is explicit, bounded, and explainable. Not infinite loops hidden in code.

### Auditable delivery history

Every attempt is recorded with outcome, timing, and classification.

### Safe replay

Failed deliveries can be replayed with guardrails and full traceability.

Deliverant does not promise exactly-once execution. Its guarantees are explicit and truthful.

## What Deliverant is (and is not)

Deliverant **is**:

- A reliability layer for outbound webhooks
- API-first and language-agnostic
- Designed for SaaS teams and API platforms

Deliverant **is not**:

- A workflow engine
- A no-code automation tool
- A payment or financial execution system
- An inbound webhook processor (V1)

## Key features

- **Prefixed IDs**: All resources use typed prefixed identifiers (`evt_`, `del_`, `ep_`, `att_`, `bat_`) for easy identification
- **Signature verification**: HMAC-SHA256 signatures with configurable signing secrets per endpoint
- **Exponential backoff**: Up to 12 retry attempts with full jitter, from 5 seconds to 24 hours
- **Kill switch**: Redis-backed circuit breaker to pause all delivery processing
- **Delivery analytics**: Volume, success rate, latency distribution, and per-endpoint health metrics
- **Batch replay**: Re-deliver up to 1000 failed deliveries in a single request with dry-run support
- **Cursor-based pagination**: Efficient pagination across all list endpoints

## High-level architecture

- **Ingest API**: Accepts events and creates deliveries to specified endpoints
- **Scheduler**: Determines when deliveries should run using exponential backoff
- **Workers**: Execute HTTP deliveries, record outcomes, and classify failures
- **PostgreSQL**: Enforces invariants and stores full audit history
- **Redis**: Task queue (Celery), caching, and kill switch state
- **Dashboard**: Next.js app with delivery monitoring, endpoint management, and API docs

The system is designed so that failures are visible, recoverable, and explainable.

## Getting started

```bash
git clone https://github.com/aayodejii/deliverant.git
cd deliverant
docker compose up --build
```

Services start at:

- API: http://localhost:8000
- Dashboard: http://localhost:3000
- API Docs: http://localhost:3000/docs

See [docs/deployment.md](docs/deployment.md) for environment variables, configuration, and production setup.

See [docs/api-reference.md](docs/api-reference.md) for the full API reference.

## Tech stack

- **Backend**: Python 3.12, Django 5.x, Django REST Framework
- **Task Queue**: Celery + Redis
- **Database**: PostgreSQL 16
- **Frontend**: Next.js 16, TypeScript, Tailwind CSS v4
- **Package Manager**: uv
- **Deployment**: Docker Compose

## Status

Deliverant is in active development.

Public availability will follow successful validation with design partners.

## Design philosophy

Correctness and trust are more important than speed, features, or growth.

Every feature is evaluated against this principle.

## License

[AGPL-3.0](LICENSE)
