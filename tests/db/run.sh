#!/usr/bin/env bash
# Spins up a throwaway database, applies the shim + migrations + seed, runs the RLS suite.
# Usage: PGHOST=... PGPORT=... PGUSER=postgres tests/db/run.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
DB=portfolio_rls_test
psql -q -v ON_ERROR_STOP=1 -d postgres -c "drop database if exists $DB" -c "create database $DB"
P="psql -q -v ON_ERROR_STOP=1 -d $DB"
$P -f tests/db/supabase-shim.sql
for f in supabase/migrations/*.sql; do echo "→ $f"; $P -f "$f"; done
$P -f supabase/seed.sql
$P -f tests/db/rls.test.sql
