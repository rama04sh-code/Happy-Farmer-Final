#!/usr/bin/env sh
# Usage: sh backend/scripts/restore_compose.sh backups/file.dump
set -eu
file="${1:?Pass a PostgreSQL .dump backup file}"
test -f "$file"
# Stop the backend first and create a separate backup before restoring.
docker compose exec -T db sh -c 'pg_restore --clean --if-exists --no-owner -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < "$file"
