#!/usr/bin/env bash
# Creates the e2e database: Supabase shim + migrations + seed + an admin and a non-admin user.
set -euo pipefail
cd "$(dirname "$0")/../.."
DB=${PGDATABASE:-portfolio_e2e}
psql -q -v ON_ERROR_STOP=1 -d postgres -c "drop database if exists $DB" -c "create database $DB"
P="psql -q -v ON_ERROR_STOP=1 -d $DB"
$P -f tests/db/supabase-shim.sql
$P -c "alter table auth.users add column password text"
for f in supabase/migrations/*.sql; do $P -f "$f"; done
$P -f supabase/seed.sql
$P <<'SQL'
insert into auth.users (id, email, password) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'admin@example.com', encode(sha256('correct-horse-battery'::bytea), 'hex')),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'stranger@example.com', encode(sha256('stranger-password'::bytea), 'hex'));
insert into public.admin_profiles (id, email) values ('aaaaaaaa-0000-4000-8000-000000000001', 'admin@example.com');
SQL
echo "e2e database ready: $DB"
