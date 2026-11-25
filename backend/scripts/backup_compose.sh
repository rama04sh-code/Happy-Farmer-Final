#!/usr/bin/env sh
# Run from the repository root while docker compose is running.
set -eu
umask 077
mkdir -p backups
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
file="backups/happy-farmer-${stamp}.dump"
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$file"
printf '%s\n' "$file"
