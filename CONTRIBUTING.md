# Contributing to Deliverant

Thanks for your interest in contributing.

## Before you start

Open an issue before working on anything significant. This avoids duplicate effort and ensures the change aligns with the project's direction.

For small fixes (typos, obvious bugs, docs), a PR without a prior issue is fine.

## Setup

```bash
git clone https://github.com/aayodejii/deliverant.git
cd deliverant
docker compose up --build
```

Run the test suite:

```bash
docker compose exec api pytest
```

## How to contribute

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Add or update tests if the change affects behavior
4. Ensure the test suite passes
5. Open a pull request with a clear description of what and why

## Commit style

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(api): add cursor-based pagination to events endpoint
fix(dashboard): handle null state on delivery detail page
docs: update deployment guide with production checklist
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

## What makes a good PR

- Focused — one logical change per PR
- Tested — new behavior has test coverage
- Explained — the PR description says why, not just what

## Project structure

```
apps/          Django apps (api, deliveries, endpoints, events, attempts, replays, tenants)
workers/       Celery tasks (scheduler, delivery worker)
tests/         Test suite
dashboard/     Next.js frontend
docs/          API reference and deployment guide
```

See [docs/api-reference.md](docs/api-reference.md) for the full API spec.

## License

By contributing, you agree that your contributions will be licensed under the [AGPL-3.0 license](LICENSE).
