#!/usr/bin/env python3
"""Create a timestamped PostgreSQL or SQLite backup.

PostgreSQL requires pg_dump on PATH. Restore PostgreSQL archives with pg_restore.
"""
from datetime import datetime, timedelta, timezone
from pathlib import Path
import os
import shutil
import subprocess
import sys

from sqlalchemy.engine import make_url

# Load the same .env configuration as the API when run from the repository root.
BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))
from app.core.config import settings  # noqa: E402


def main() -> int:
    os.umask(0o077)  # database dumps may contain personal and operational data
    database_url = os.environ.get("DATABASE_URL") or settings.database_url
    if not database_url:
        print("DATABASE_URL is required", file=sys.stderr)
        return 2
    backup_dir = Path(os.environ.get("BACKUP_DIR", "backups"))
    backup_dir.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    url = make_url(database_url)

    if url.drivername.startswith("postgresql"):
        executable = shutil.which("pg_dump")
        if not executable:
            print("pg_dump was not found. Install PostgreSQL client tools.", file=sys.stderr)
            return 2
        target = backup_dir / f"happy-farmer-{stamp}.dump"
        env = os.environ.copy()
        if url.password:
            env["PGPASSWORD"] = url.password
        command = [executable, "--format=custom", "--no-owner", "--file", str(target),
                   "--host", url.host or "localhost", "--port", str(url.port or 5432),
                   "--username", url.username or "", url.database or ""]
        if url.query.get("sslmode"):
            env["PGSSLMODE"] = str(url.query["sslmode"])
        subprocess.run(command, env=env, check=True)
    elif url.drivername.startswith("sqlite"):
        import sqlite3
        db_path = url.database
        if not db_path or db_path == ":memory:":
            print("A file-backed SQLite database is required for backup", file=sys.stderr)
            return 2
        target = backup_dir / f"happy-farmer-{stamp}.sqlite3"
        with sqlite3.connect(db_path) as source, sqlite3.connect(target) as dest:
            source.backup(dest)
    else:
        print(f"Unsupported database dialect: {url.drivername}", file=sys.stderr)
        return 2

    keep_days = int(os.environ.get("BACKUP_KEEP_DAYS", "30"))
    expiry = datetime.now(timezone.utc) - timedelta(days=max(keep_days, 1))
    for old in backup_dir.glob("happy-farmer-*"):
        if old == target or not old.is_file():
            continue
        modified = datetime.fromtimestamp(old.stat().st_mtime, timezone.utc)
        if modified < expiry:
            old.unlink(missing_ok=True)
    print(target)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
