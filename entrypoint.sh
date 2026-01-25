#!/bin/bash
set -e

uv sync --frozen

exec "$@"
