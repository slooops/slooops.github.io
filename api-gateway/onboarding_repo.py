"""DB repository for onboarding sessions and events.

All SQL targets the ``fin_caseiq`` schema.  The connection pool's
``init`` callback already sets ``search_path TO fin_caseiq, public``
so unqualified table names resolve correctly, but every query here
uses fully-qualified names for clarity.

Tables
------
fin_caseiq.onboarding_sessions  – one row per component onboarding session
fin_caseiq.onboarding_events    – append-only event log (analytics)
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

import db


# ── helpers ───────────────────────────────────────────────────────────────────

def _now() -> datetime:
    return datetime.now(timezone.utc)


def _json_or_none(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, str):
        return value
    return json.dumps(value)


def _row_to_dict(row) -> dict[str, Any] | None:
    if row is None:
        return None
    return dict(row)


# ── sessions ──────────────────────────────────────────────────────────────────

async def create_session(
    *,
    user_id: str,
    user_email: str | None,
    component_name: str,
    feature_name: str,
    role_name: str,
    assignment_users_key: str,
    input_mode: str = "manual",            # 'manual' | 'spec'
    manual_payload: dict[str, Any] | None = None,
    spec_text: str | None = None,
) -> str:
    """Insert a new session row and return its UUID.

    Called at the start of every codegen request so every generation is
    tracked even if the LLM fails partway through.
    """
    session_id = str(uuid4())
    now = _now()

    await db.execute(
        """
        INSERT INTO fin_caseiq.onboarding_sessions (
            id,
            user_id,
            user_email,
            component_name,
            feature_name,
            role_name,
            assignment_users_key,
            input_mode,
            manual_payload_current,
            spec_text_current,
            status,
            generation_count,
            edit_count,
            apply_count,
            created_at,
            updated_at
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7,
            $8::fin_caseiq.onboarding_input_mode,
            $9::jsonb, $10,
            'pending'::fin_caseiq.onboarding_session_status,
            0, 0, 0,
            $11, $12
        )
        """,
        session_id,
        user_id,
        user_email,
        component_name,
        feature_name,
        role_name,
        assignment_users_key,
        input_mode,
        _json_or_none(manual_payload),
        spec_text,
        now,
        now,
    )

    return session_id


async def update_session_generated(
    session_id: str,
    *,
    backend_document: str,
    ui_document: str,
    backend_handoff: dict[str, Any],
    file_operations: list[dict[str, Any]],
    model_version: str | None = None,
) -> None:
    """Mark a session as generated and store the LLM output.

    Increments ``generation_count`` atomically so parallel requests
    (e.g. regeneration) produce a correct counter without a read-modify-write
    race.
    """
    now = _now()

    await db.execute(
        """
        UPDATE fin_caseiq.onboarding_sessions
        SET
            status                  = 'generated'::fin_caseiq.onboarding_session_status,
            backend_document_current = $2,
            ui_document_current      = $3,
            backend_handoff_current  = $4::jsonb,
            file_operations_current  = $5::jsonb,
            model_version            = COALESCE($6, model_version),
            generation_count         = generation_count + 1,
            last_generated_at        = $7,
            updated_at               = $7
        WHERE id = $1
        """,
        session_id,
        backend_document,
        ui_document,
        _json_or_none(backend_handoff),
        _json_or_none(file_operations),
        model_version,
        now,
    )


async def update_session_generation_failed(
    session_id: str,
    *,
    error_message: str,
) -> None:
    """Mark a session as failed after a codegen error."""
    now = _now()

    await db.execute(
        """
        UPDATE fin_caseiq.onboarding_sessions
        SET
            status        = 'failed'::fin_caseiq.onboarding_session_status,
            error_message = $2,
            updated_at    = $3
        WHERE id = $1
        """,
        session_id,
        error_message,
        now,
    )


async def update_session_apply_failed(
    session_id: str,
    *,
    error_message: str,
) -> None:
    """Mark a session as failed after an apply workflow error."""
    now = _now()

    await db.execute(
        """
        UPDATE fin_caseiq.onboarding_sessions
        SET
            status        = 'failed'::fin_caseiq.onboarding_session_status,
            error_message = $2,
            updated_at    = $3
        WHERE id = $1
        """,
        session_id,
        error_message,
        now,
    )


async def update_session_applied(
    session_id: str,
    *,
    pr_url: str | None = None,
    branch: str | None = None,
) -> None:
    """Mark a session as applied (PR opened / code pushed)."""
    now = _now()

    await db.execute(
        """
        UPDATE fin_caseiq.onboarding_sessions
        SET
            status        = 'applied'::fin_caseiq.onboarding_session_status,
            apply_count   = apply_count + 1,
            last_applied_at = $2,
            updated_at    = $2
        WHERE id = $1
        """,
        session_id,
        now,
    )


async def increment_edit_count(session_id: str) -> None:
    """Bump the edit counter when the user triggers 'Edit inputs & regenerate'."""
    now = _now()

    await db.execute(
        """
        UPDATE fin_caseiq.onboarding_sessions
        SET
            edit_count   = edit_count + 1,
            last_edited_at = $2,
            updated_at   = $2
        WHERE id = $1
        """,
        session_id,
        now,
    )


async def get_session(session_id: str) -> dict[str, Any] | None:
    """Fetch a single session by its UUID."""
    row = await db.fetchrow(
        "SELECT * FROM fin_caseiq.onboarding_sessions WHERE id = $1",
        session_id,
    )
    return _row_to_dict(row)


async def list_sessions_for_user(
    user_id: str,
    *,
    limit: int = 50,
    offset: int = 0,
) -> list[dict[str, Any]]:
    """Return the most-recent sessions for a given CEC user ID."""
    rows = await db.fetch(
        """
        SELECT
            id,
            component_name,
            feature_name,
            role_name,
            input_mode,
            status,
            generation_count,
            edit_count,
            apply_count,
            last_generated_at,
            last_applied_at,
            created_at,
            updated_at
        FROM fin_caseiq.onboarding_sessions
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
        """,
        user_id,
        limit,
        offset,
    )
    return [dict(r) for r in rows]


# ── events ────────────────────────────────────────────────────────────────────

async def log_event(
    session_id: str,
    *,
    event_type: str,                       # matches onboarding_event_type enum
    status: str = "success",              # matches onboarding_event_status enum
    user_id: str | None = None,
    component_name: str | None = None,
    component_id: str | None = None,
    input_mode: str | None = None,
    doc_kind: str | None = None,
    generation_version: int | None = None,
    spec_version: int | None = None,
    payload: dict[str, Any] | None = None,
    error_code: str | None = None,
    model_version: str | None = None,
    duration_ms: int | None = None,
) -> str:
    """Append an event row and return its UUID.

    Never raises — logs a warning to stdout on failure so an event write
    error never propagates back to the user.
    """
    event_id = str(uuid4())
    now = _now()

    try:
        await db.execute(
            """
            INSERT INTO fin_caseiq.onboarding_events (
                id,
                session_id,
                user_id,
                component_id,
                component_name,
                input_mode,
                event_type,
                status,
                doc_kind,
                generation_version,
                spec_version,
                payload_json,
                error_code,
                model_version,
                duration_ms,
                created_at
            ) VALUES (
                $1, $2, $3, $4, $5,
                $6::fin_caseiq.onboarding_input_mode,
                $7::fin_caseiq.onboarding_event_type,
                $8::fin_caseiq.onboarding_event_status,
                $9, $10, $11,
                $12::jsonb,
                $13, $14, $15, $16
            )
            """,
            event_id,
            session_id,
            user_id,
            component_id,
            component_name,
            input_mode,
            event_type,
            status,
            doc_kind,
            generation_version,
            spec_version,
            _json_or_none(payload),
            error_code,
            model_version,
            duration_ms,
            now,
        )
    except Exception as exc:
        print(f"[onboarding_repo] WARNING: failed to log event {event_type} "
              f"for session {session_id}: {exc}")

    return event_id


async def list_events_for_session(session_id: str) -> list[dict[str, Any]]:
    """Return all events for a session ordered chronologically."""
    rows = await db.fetch(
        """
        SELECT *
        FROM fin_caseiq.onboarding_events
        WHERE session_id = $1
        ORDER BY created_at ASC
        """,
        session_id,
    )
    return [dict(r) for r in rows]
