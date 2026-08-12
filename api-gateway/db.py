"""PostgreSQL connection pool using asyncpg.

Configuration is driven entirely by environment variables so no credentials
ever appear in source code:

  POSTGRES_HOST      - hostname or IP              (default: localhost)
  POSTGRES_PORT      - port                        (default: 5432)
  POSTGRES_DB        - database name               (required)
  POSTGRES_USER      - username                    (required)
  POSTGRES_PASSWORD  - password                    (required)
  POSTGRES_MIN_SIZE  - min pool connections        (default: 2)
  POSTGRES_MAX_SIZE  - max pool connections        (default: 10)
  POSTGRES_SSL       - 'require' | 'prefer' | ''   (default: '')

Usage
-----
Call ``init_db()`` once on startup and ``close_db()`` on shutdown (already
wired into main.py lifespan). Then use ``get_pool()`` anywhere:

    pool = get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM fin_caseiq.onboarding_sessions")
"""

from __future__ import annotations

import os
import ssl
from typing import Any

import asyncpg  # type: ignore

_pool: asyncpg.Pool | None = None


def _build_connect_kwargs() -> dict:
    """Return keyword args for asyncpg.create_pool().

    Using explicit kwargs instead of a DSN URL means special characters in
    the password (e.g. '#', '@', '%') are passed verbatim and never
    misinterpreted as URL syntax.
    """
    return {
        "host":     os.getenv("POSTGRES_HOST", "localhost"),
        "port":     int(os.getenv("POSTGRES_PORT", "5432")),
        "database": os.getenv("POSTGRES_DB", ""),
        "user":     os.getenv("POSTGRES_USER", ""),
        "password": os.getenv("POSTGRES_PASSWORD", ""),
    }


def _build_ssl() -> ssl.SSLContext | None:
    mode = os.getenv("POSTGRES_SSL", "").strip().lower()
    if mode == "require":
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        return ctx
    return None


async def init_db() -> None:
    """Create the connection pool.  Call once from the FastAPI lifespan.

    If POSTGRES_DB or POSTGRES_USER are not set the pool is skipped and a
    warning is printed.  The rest of the application starts normally; any
    endpoint that calls get_pool() will raise a clear RuntimeError at that
    point rather than crashing the whole server on startup.
    """
    global _pool
    if _pool is not None:
        return  # already initialised

    db_name = os.getenv("POSTGRES_DB", "")
    user    = os.getenv("POSTGRES_USER", "")
    if not db_name or not user:
        print(
            "[db] WARNING: POSTGRES_DB / POSTGRES_USER not set — "
            "database pool will not be initialised. "
            "Set these variables in your .env file to enable DB features."
        )
        return

    try:
        connect_kwargs = _build_connect_kwargs()
        ssl_ctx = _build_ssl()
        min_size = int(os.getenv("POSTGRES_MIN_SIZE", "2"))
        max_size = int(os.getenv("POSTGRES_MAX_SIZE", "10"))

        _pool = await asyncpg.create_pool(
            **connect_kwargs,
            min_size=min_size,
            max_size=max_size,
            ssl=ssl_ctx,
            # Ensure every connection works under fin_caseiq schema by default.
            init=_set_search_path,
        )
        print(f"[db] PostgreSQL pool ready (min={min_size}, max={max_size})")
    except Exception as exc:
        print(f"[db] WARNING: Could not connect to PostgreSQL — {exc}. DB features will be unavailable.")


async def _set_search_path(conn: asyncpg.Connection) -> None:
    """Set the default search_path for every new pool connection."""
    await conn.execute("SET search_path TO fin_caseiq, public")


async def close_db() -> None:
    """Gracefully close the pool.  Call once from the FastAPI lifespan."""
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None
        print("[db] PostgreSQL pool closed")


def get_pool() -> asyncpg.Pool:
    """Return the active pool; raises RuntimeError if not initialised."""
    if _pool is None:
        raise RuntimeError(
            "Database pool is not initialised. "
            "Ensure init_db() was awaited during application startup."
        )
    return _pool


# ── Convenience helpers ──────────────────────────────────────────────────────

async def fetch(query: str, *args: Any) -> list[asyncpg.Record]:
    """Run a SELECT and return all rows."""
    async with get_pool().acquire() as conn:
        return await conn.fetch(query, *args)


async def fetchrow(query: str, *args: Any) -> asyncpg.Record | None:
    """Run a SELECT and return the first row (or None)."""
    async with get_pool().acquire() as conn:
        return await conn.fetchrow(query, *args)


async def fetchval(query: str, *args: Any) -> Any:
    """Run a SELECT and return a single scalar value."""
    async with get_pool().acquire() as conn:
        return await conn.fetchval(query, *args)


async def execute(query: str, *args: Any) -> str:
    """Run an INSERT / UPDATE / DELETE and return the command tag."""
    async with get_pool().acquire() as conn:
        return await conn.execute(query, *args)
