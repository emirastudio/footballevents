#!/bin/sh
set -e

# Apply pending Prisma migrations before starting the app.
# Fails the container if migrations error out (correct behaviour — never serve
# traffic against a half-migrated schema).
if [ -n "${DATABASE_URL:-}" ]; then
  echo "[entrypoint] running prisma migrate deploy…"
  node node_modules/prisma/build/index.js migrate deploy
else
  echo "[entrypoint] DATABASE_URL not set — skipping migrate deploy"
fi

exec "$@"
