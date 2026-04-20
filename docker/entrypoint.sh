#!/bin/sh
set -e

echo "[entrypoint] running database migrations..."
node scripts/migrate.mjs

echo "[entrypoint] backfilling organization data (idempotent)..."
node scripts/backfill-orgs.mjs

echo "[entrypoint] starting app..."
exec "$@"
