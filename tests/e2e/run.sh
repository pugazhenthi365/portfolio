#!/usr/bin/env bash
# Full e2e run: fresh DB → mock Supabase → production build → Playwright suite.
# Requires a local PostgreSQL (PGHOST/PGPORT/PGUSER) and Playwright with Chromium.
set -euo pipefail
cd "$(dirname "$0")/../.."
export PGDATABASE=${PGDATABASE:-portfolio_e2e}
PORT=${PORT:-3100}
tests/e2e/setup-db.sh
rm -rf /tmp/mock-storage
node tests/e2e/mock-supabase.mjs > /tmp/mock.log 2>&1 &
MOCK=$!
trap 'kill $MOCK $APP 2>/dev/null || true' EXIT
sleep 1.5
ANON=$(grep ANON_KEY /tmp/mock.log | cut -d= -f2)
export NEXT_PUBLIC_SITE_URL=http://localhost:$PORT NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321 NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON
npx next build > /tmp/e2e-build.log 2>&1
npx next start -p "$PORT" > /tmp/e2e-app.log 2>&1 &
APP=$!
sleep 4
BASE_URL=http://localhost:$PORT node tests/e2e/cms.e2e.mjs
