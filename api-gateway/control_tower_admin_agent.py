"""
Control Tower Support Agent
============================
Dashboard access-request workflow that operates via both a UI chatbot
API (POST /control-tower-ui-chat) and a Webex bot webhook (POST /webhook).

Implements a ReAct loop: the LLM emits structured JSON that may contain
tool_calls; tools are executed and their results fed back for the next
reasoning step.
"""

# ──────────────────────────────────────────────────────────────
# 1. IMPORTS & ENV SETUP
# ──────────────────────────────────────────────────────────────

from __future__ import annotations

import os
import json
import uuid
import asyncio
import logging
import time
from pathlib import Path
from typing import Any

import httpx
from fastapi import APIRouter, Request
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
from webexteamssdk import WebexTeamsAPI
from webexteamssdk.exceptions import ApiError
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("control_tower_agent")
logger.setLevel(logging.DEBUG)
if not logger.handlers:
    _handler = logging.StreamHandler()
    _handler.setLevel(logging.DEBUG)
    _handler.setFormatter(logging.Formatter("%(asctime)s [%(name)s] %(levelname)s: %(message)s"))
    logger.addHandler(_handler)

router = APIRouter()

# ── LLM helper (reuses the Cisco OAuth LLM from main.py) ───────────


async def _get_llm():
    """Lazy import to avoid circular dependency with main.py."""
    from main import get_llm
    return await get_llm()


# ── Webex bot ───────────────────────────────────────────────────────

BOT_TOKEN = os.getenv("WEBEX_TEAMS_ACCESS_TOKEN")
print(f"Using Webex Teams bot token: {BOT_TOKEN}")
api = WebexTeamsAPI(access_token=BOT_TOKEN)

# ── Spring Boot backend base URL ────────────────────────────────────

# CONTROL_TOWER_API_BASE_URL: str = os.getenv(
#     "CONTROL_TOWER_API_BASE_URL")

CONTROL_TOWER_API_BASE_URL: str = os.getenv("CONTROL_TOWER_API_BASE_URL", "http://localhost:8080/api")  # Default for local testing
# ── Shared httpx client (reused across all async API calls) ─────────

_http_client = httpx.AsyncClient(timeout=30.0)


# ──────────────────────────────────────────────────────────────
# 2. CONSTANTS
# ──────────────────────────────────────────────────────────────

PROMPT_FILE = Path(__file__).parent / "control_tower_agent_prompt.txt"
SYSTEM_PROMPT: str = PROMPT_FILE.read_text(encoding="utf-8")

PLATFORM_ADMIN_ROLE_ID: int = 2
MAX_REACT_ITERATIONS: int = 10
MAX_HISTORY_LENGTH: int = 20
ROLES_CACHE_TTL: int = 300  # seconds

# Logo: served locally via GET /card-logo; override with a full URL if deployed
CARD_LOGO_FILE = Path(__file__).parent / "circuit-logo.png"
# Base URL of this server (used to build the card logo URL for local testing)
_SERVER_BASE_URL: str = os.getenv("SERVER_BASE_URL", "http://localhost:8000")
CARD_LOGO_URL: str = f"{_SERVER_BASE_URL}/card-logo"

# ── Testing override: route ALL approval cards to this single email ──
# Set in .env to your Webex email, e.g. TEST_APPROVAL_EMAIL=avudutha@cisco.com
# Leave unset (or empty) in production to use real admin lookup.
TEST_APPROVAL_EMAIL: str | None = "avudutha@cisco.com"


@router.get("/card-logo")
async def card_logo():
    """Serve the circuit-logo.png so Adaptive Cards can reference it by URL."""
    if CARD_LOGO_FILE.exists():
        return FileResponse(CARD_LOGO_FILE, media_type="image/png")
    return {"error": "logo not found"}


# ──────────────────────────────────────────────────────────────
# 3. STATE STORES (in-memory dicts)
# ──────────────────────────────────────────────────────────────

# Keyed by userName (uppercased). Stores conversation history + collected fields.
conversation_states: dict[str, dict] = {}

# Keyed by request_id (uuid4 string). Stores pending approval metadata.
pending_requests: dict[str, dict] = {}


# ──────────────────────────────────────────────────────────────
# 4. ROLES CACHE
# ──────────────────────────────────────────────────────────────

_roles_cache: list[dict] = []
_roles_last_fetched: float = 0


async def get_roles() -> list[dict]:
    """Fetch available roles from the Spring Boot API with caching.

    Returns the cached list if it was refreshed within ``ROLES_CACHE_TTL``
    seconds; otherwise re-fetches from ``GET {base}/roles``.
    """
    global _roles_cache, _roles_last_fetched

    if _roles_cache and (time.time() - _roles_last_fetched) < ROLES_CACHE_TTL:
        return _roles_cache

    try:
        resp = await _http_client.get(f"{CONTROL_TOWER_API_BASE_URL}/roles")
        resp.raise_for_status()
        _roles_cache = resp.json()
        _roles_last_fetched = time.time()
        logger.info("Roles cache refreshed – %d roles loaded.", len(_roles_cache))
    except Exception:
        logger.exception("Failed to fetch roles from Spring Boot API.")
        # Return stale cache if available, else empty
    return _roles_cache


# ──────────────────────────────────────────────────────────────
# 5. SPRING BOOT API HELPERS
# ──────────────────────────────────────────────────────────────


async def api_get(path: str, params: dict | None = None) -> Any:
    """HTTP GET against the Spring Boot backend.

    Returns parsed JSON or *None* on failure.
    """
    url = f"{CONTROL_TOWER_API_BASE_URL}/{path}"
    try:
        resp = await _http_client.get(url, params=params)
        resp.raise_for_status()
        return resp.json()
    except Exception:
        logger.exception("API GET %s failed.", url)
        return None


async def api_post(path: str, payload: dict) -> Any:
    """HTTP POST against the Spring Boot backend.

    Returns parsed JSON or *None* on failure.
    """
    url = f"{CONTROL_TOWER_API_BASE_URL}/{path}"
    try:
        resp = await _http_client.post(url, json=payload)
        resp.raise_for_status()
        return resp.json()
    except Exception:
        logger.exception("API POST %s failed.", url)
        return None


async def api_put(path: str, payload: dict) -> Any:
    """HTTP PUT against the Spring Boot backend.

    Returns parsed JSON or *None* on failure.
    """
    url = f"{CONTROL_TOWER_API_BASE_URL}/{path}"
    try:
        resp = await _http_client.put(url, json=payload)
        resp.raise_for_status()
        return resp.json()
    except Exception:
        logger.exception("API PUT %s failed.", url)
        return None


# ──────────────────────────────────────────────────────────────
# 6. TOOL IMPLEMENTATIONS
# ──────────────────────────────────────────────────────────────


async def check_user_access(userName: str = "", user_name: str = "") -> list[dict]:
    """Return all access records for a user via the Spring Boot endpoint.

    Accepts both camelCase (from LLM tool_calls) and snake_case (from
    internal Python callers).  If an email address is passed instead of
    a bare userName, the @domain part is stripped automatically.
    """
    name = userName or user_name
    # Strip @domain if the LLM passed a full email address
    if "@" in name:
        name = name.split("@")[0]
    name = name.strip().upper()
    data = await api_get("user-access-list-by-user", params={"userName": name})
    if not data:
        # Fallback: some environments use a different canonical USER_NAME
        # than the email prefix passed by UI (e.g., AVUDUTHA vs ABVUDUTH).
        # In that case, resolve by scanning user-access-list and matching
        # by USER_NAME or USER_EMAIL.
        list_data = await api_get("user-access-list")
        if isinstance(list_data, dict):
            for key in ("data", "results", "records", "content", "userAccessList", "users"):
                if key in list_data and isinstance(list_data[key], list):
                    list_data = list_data[key]
                    break

        if isinstance(list_data, list):
            target_email = f"{name.lower()}@cisco.com"
            filtered = []
            for row in list_data:
                if not isinstance(row, dict):
                    continue
                row_name = str(row.get("USER_NAME") or row.get("userName") or row.get("username") or "").strip().upper()
                row_email = str(row.get("USER_EMAIL") or row.get("userEmail") or "").strip().lower()
                if row_name == name or row_email == target_email:
                    filtered.append(row)

            if filtered:
                logger.info(
                    "check_user_access fallback matched %d record(s) for user '%s' via user-access-list",
                    len(filtered),
                    name,
                )
                return filtered

        return []
    # Normalize response: API returns a wrapper dict like:
    # {"username": "...", "userEmail": "...", "userRoles": [{"roleId": ..., "roleName": ...}, ...]}
    if isinstance(data, dict):
        # Extract the roles list from known wrapper keys
        for key in ("userRoles", "data", "results", "records", "content", "userAccessList"):
            if key in data and isinstance(data[key], list):
                roles = [r for r in data[key] if isinstance(r, dict)]
                # Attach top-level user metadata to each role record
                user_email = data.get("userEmail", "")
                user_name_val = data.get("username", "") or data.get("userName", "")
                full_name = data.get("fullName", "")
                for r in roles:
                    r.setdefault("userEmail", user_email)
                    r.setdefault("userName", user_name_val)
                    r.setdefault("fullName", full_name)
                    # Mark admin status based on role presence
                    # roleId == PLATFORM_ADMIN_ROLE_ID means platform admin
                    rid = r.get("roleId") or r.get("ROLE_ID")
                    r["ENABLED_FLAG"] = r.get("enabledFlag") or r.get("ENABLED_FLAG") or "Y"
                    # Preserve actual admin flag from API (check both cases)
                    # Use 'in' check to handle None vs False vs "N" properly
                    raw_admin = r.get("admin") if "admin" in r else r.get("ADMIN") if "ADMIN" in r else "N"
                    # Normalize: booleans, "Y"/"N", "true"/"false" → "Y" or "N"
                    if isinstance(raw_admin, bool):
                        admin_flag = "Y" if raw_admin else "N"
                    else:
                        admin_flag = "Y" if str(raw_admin).upper() in ("Y", "YES", "TRUE", "1") else "N"
                    r["ADMIN"] = "Y" if rid == PLATFORM_ADMIN_ROLE_ID else admin_flag
                    r["DASHBOARD_NAME"] = r.get("roleName") or r.get("DASHBOARD_NAME") or ""
                    r["ROLE_ID"] = rid
                    logger.debug("  normalized role: %s, ADMIN=%s (raw=%r)", r["DASHBOARD_NAME"], r["ADMIN"], raw_admin)
                return roles
        # Single record dict — wrap in a list
        return [data]
    if isinstance(data, list):
        return [r for r in data if isinstance(r, dict)]
    logger.warning("Unexpected response type from user-access-list-by-user: %s", type(data))
    return []


async def find_dashboard_admins(role_id: int = 0, roleId: int = 0) -> list[dict]:
    """Return admins for a given *role_id*.

    Accepts both snake_case (``role_id``) and camelCase (``roleId``)
    to tolerate LLM tool-call variation.

    Falls back to platform admins (ROLE_ID == 2) if no role-specific
    admin is found.
    """
    role_id = role_id or roleId
    data = await api_get("user-access-list")
    if not data:
        return []

    # Normalize: API may return a wrapper dict instead of a plain list
    if isinstance(data, dict):
        for key in ("data", "results", "records", "content", "userAccessList", "users"):
            if key in data and isinstance(data[key], list):
                data = data[key]
                break
        else:
            # If it's a dict but no known wrapper key, it might be a
            # list-like structure keyed by username — try values
            logger.warning("user-access-list returned dict with keys: %s", list(data.keys())[:10])
            data = []

    if not isinstance(data, list):
        logger.warning("user-access-list returned unexpected type: %s", type(data))
        return []

    logger.info("find_dashboard_admins: %d total records, looking for role_id=%d", len(data), role_id)

    admins = [
        {
            "userName": row.get("USER_NAME") or row.get("userName") or row.get("username"),
            "userEmail": row.get("USER_EMAIL") or row.get("userEmail"),
            "fullName": row.get("FULL_NAME") or row.get("fullName"),
        }
        for row in data
        if (
            (row.get("ROLE_ID") or row.get("roleId")) == role_id
            and str(row.get("ADMIN") or row.get("admin", "")).upper() == "Y"
            and str(row.get("ENABLED_FLAG") or row.get("enabledFlag", "Y")).upper() != "N"
        )
    ]

    # Fallback to platform admins when role-specific admins don't exist
    if not admins:
        admins = [
            {
                "userName": row.get("USER_NAME") or row.get("userName") or row.get("username"),
                "userEmail": row.get("USER_EMAIL") or row.get("userEmail"),
                "fullName": row.get("FULL_NAME") or row.get("fullName"),
            }
            for row in data
            if (
                (row.get("ROLE_ID") or row.get("roleId")) == PLATFORM_ADMIN_ROLE_ID
                and str(row.get("ADMIN") or row.get("admin", "")).upper() == "Y"
                and str(row.get("ENABLED_FLAG") or row.get("enabledFlag", "Y")).upper() != "N"
            )
        ]

    return admins


async def check_requester_is_admin(user_name: str = "", userName: str = "") -> dict:
    """Determine whether *user_name* is a platform admin or sub-admin.

    Accepts both snake_case and camelCase to tolerate LLM variation.
    """
    user_name = user_name or userName
    records = await check_user_access(user_name)
    logger.info("check_requester_is_admin called for '%s', records: %s", user_name, records)
    # Guard against unexpected response shapes (e.g. list of strings)
    records = [r for r in records if isinstance(r, dict)]

    # Support both camelCase (roleId) and UPPER_SNAKE (ROLE_ID) field names
    def _role_id(r: dict) -> int | None:
        return r.get("roleId") or r.get("ROLE_ID")

    def _role_name(r: dict) -> str:
        return r.get("roleName") or r.get("DASHBOARD_NAME") or r.get("dashboardName") or ""

    def _is_admin(r: dict) -> bool:
        """Check if the user has ADMIN = 'Y' for this specific role."""
        val = r.get("admin") or r.get("ADMIN") or "N"
        return str(val).upper() == "Y"

    def _is_enabled(r: dict) -> bool:
        """Check if the role has ENABLED_FLAG = 'Y'."""
        val = r.get("enabledFlag") or r.get("ENABLED_FLAG") or "Y"
        return str(val).upper() != "N"

    # Platform admin: has ROLE_ID 2 with ADMIN = 'Y' and enabled
    is_platform_admin = any(
        _role_id(r) == PLATFORM_ADMIN_ROLE_ID and _is_admin(r) and _is_enabled(r)
        for r in records
    )

    # Sub-admin: has a NON-platform role with ADMIN = 'Y' and enabled
    # A user with standard access (ADMIN = 'N') is NOT a sub-admin
    sub_admin_roles = [
        r for r in records
        if _role_id(r) != PLATFORM_ADMIN_ROLE_ID
        and _is_admin(r)
        and _is_enabled(r)
    ]

    return {
        "is_platform_admin": is_platform_admin,
        "sub_admin_role_ids": [_role_id(r) for r in sub_admin_roles],
        "sub_admin_dashboard_names": [_role_name(r) for r in sub_admin_roles],
    }


async def create_access_role(**kwargs: Any) -> dict | None:
    """Create a new access-role record via POST to the Spring Boot backend."""
    return await api_post("create-user-access-role", kwargs)


async def update_access_role(**kwargs: Any) -> dict | None:
    """Update an existing access-role record via PUT to the Spring Boot backend."""
    return await api_put("update-user-access-role", kwargs)


async def send_approval_card(admin_emails: list[str], request: dict) -> str:
    """Send an Adaptive Card approval form to each admin via Webex DM.

    The card layout mirrors a release-approval style:
      • Header row: circuit-logo + title + subtitle
      • Roles table: Role Name | Status | Requested Admin Access
      • Footer buttons: Deny, Approve / Approve All

    Returns the generated ``request_id`` (uuid4) used to correlate
    admin responses with this request.
    """
    request_id = str(uuid.uuid4())
    logger.info(
        "send_approval_card called — admin_emails=%s, requester=%s, target=%s, dashboards=%s",
        admin_emails,
        request.get("requester_userName"),
        request.get("target_userName"),
        request.get("dashboard_names"),
    )
    requester_full_name: str = request.get("requester_fullName", "Unknown")
    requester_email: str = request.get("requester_email", "")
    requester_user_name: str = request.get("requester_userName", "")
    target_full_name: str = request.get("target_fullName", "")
    target_user_name: str = request.get("target_userName", "")
    target_email: str = request.get("target_email", "")

    # Auto-derive emails if missing
    if not requester_email and requester_user_name:
        requester_email = f"{requester_user_name.lower()}@cisco.com"
    if not target_email and target_user_name:
        target_email = f"{target_user_name.lower()}@cisco.com"

    # ── Fix: If fullName looks like a bare userName (all caps, no space, or matches userName),
    #    look up the real full name from the user's access records. ──
    async def _resolve_full_name(full_name: str, user_name: str) -> str:
        """Return real fullName from access records if the provided one looks like a userName."""
        if (
            not full_name
            or full_name == "Unknown"
            or full_name.upper() == user_name.upper()
            or (full_name.isupper() and " " not in full_name)
        ):
            records = await check_user_access(user_name=user_name)
            for r in records:
                real_name = r.get("fullName") or r.get("FULL_NAME") or ""
                if real_name and real_name.upper() != user_name.upper() and " " in real_name:
                    logger.info("Resolved fullName for %s → %s", user_name, real_name)
                    return real_name
        return full_name or user_name

    requester_full_name = await _resolve_full_name(requester_full_name, requester_user_name)
    if target_user_name:
        target_full_name = await _resolve_full_name(target_full_name, target_user_name)
    dashboard_names: list[str] = request.get("dashboard_names", [])
    role_ids: list[int] = request.get("role_ids", [])
    access_type: str = request.get("access_type", "standard")
    justification: str = request.get("justification", "")

    # Determine which roles need re-enablement vs. new creation
    is_reenablement: dict[int, bool] = request.get("is_reenablement", {})
    is_reenablement = {int(k): v for k, v in is_reenablement.items()}

    # Per-role admin flags (defaults to the request-level access_type)
    per_role_admin: dict[int, bool] = request.get("per_role_admin", {})
    per_role_admin = {int(k): v for k, v in per_role_admin.items()}

    # Persist the pending request for later webhook resolution
    pending_requests[request_id] = {
        "requester_userName": requester_user_name,
        "requester_email": requester_email,
        "requester_fullName": requester_full_name,
        "target_userName": target_user_name,
        "target_email": target_email,
        "target_fullName": target_full_name,
        "dashboard_names": dashboard_names,
        "role_ids": role_ids,
        "access_type": access_type,
        "justification": justification,
        "admin_emails_sent_to": list(admin_emails),
        "is_reenablement": is_reenablement,
        "per_role_admin": per_role_admin,
        "status": "pending",
    }

    # ── Helper: is admin access requested for a given role? ─────
    def _admin_requested(idx: int, rid: int) -> bool:
        if rid in per_role_admin:
            return per_role_admin[rid]
        return access_type == "admin"

    # ── Build Adaptive Card body ────────────────────────────────
    card_body: list[dict] = []

    # ── 1. Header: logo + title + subtitle ──────────────────────
    # NOTE: The logo image requires a publicly reachable URL.
    # Uncomment the ColumnSet below once deployed; locally Webex
    # cannot fetch http://localhost URLs and will 400.
    #
    # card_body.append({
    #     "type": "ColumnSet",
    #     "columns": [
    #         {
    #             "type": "Column",
    #             "width": "auto",
    #             "verticalContentAlignment": "Center",
    #             "items": [
    #                 {
    #                     "type": "Image",
    #                     "url": CARD_LOGO_URL,
    #                     "size": "Small",
    #                     "altText": "Control Tower",
    #                 }
    #             ],
    #         },
    #         {
    #             "type": "Column",
    #             "width": "stretch",
    #             "verticalContentAlignment": "Center",
    #             "items": [
    #                 {
    #                     "type": "TextBlock",
    #                     "text": "Control Tower Access Request",
    #                     "weight": "Bolder",
    #                     "size": "Medium",
    #                     "wrap": True,
    #                 },
    #                 {
    #                     "type": "TextBlock",
    #                     "text": (
    #                         f"Approval requested by **{requester_full_name}**"
    #                         f" ({requester_email}) for the following roles"
    #                     ),
    #                     "wrap": True,
    #                     "spacing": "None",
    #                     "isSubtle": True,
    #                     "size": "Small",
    #                 },
    #             ],
    #         },
    #     ],
    # })

    # Fallback plain header (used while logo URL is not publicly reachable)
    card_body.append({
        "type": "TextBlock",
        "text": "Control Tower Access Request",
        "weight": "Bolder",
        "size": "Medium",
        "wrap": True,
    })
    # Build subtitle: show target user if different from requester
    if target_user_name and target_user_name.lower() != requester_user_name.lower():
        subtitle = (
            f"Approval requested for user **{target_full_name or target_user_name}**"
            f" ({target_user_name}) by **{requester_full_name}**"
            f" ({requester_user_name}) for the following roles"
        )
    else:
        subtitle = (
            f"Approval requested by **{requester_full_name}**"
            f" ({requester_user_name}) for the following roles"
        )
    card_body.append({
        "type": "TextBlock",
        "text": subtitle,
        "wrap": True,
        "spacing": "None",
        "isSubtle": True,
        "size": "Small",
    })

    # ── 2. Justification ────────────────────────────────────────
    if justification:
        card_body.append({
            "type": "TextBlock",
            "text": f"**Justification:** {justification}",
            "wrap": True,
            "spacing": "Medium",
            "size": "Small",
        })

    # ── 3. Roles table header ───────────────────────────────────
    card_body.append({
        "type": "ColumnSet",
        "separator": True,
        "spacing": "Medium",
        "columns": [
            {
                "type": "Column",
                "width": "stretch",
                "items": [{"type": "TextBlock", "text": "Role Name", "weight": "Bolder", "size": "Small"}],
            },
            {
                "type": "Column",
                "width": "80px",
                "items": [{"type": "TextBlock", "text": "Status", "weight": "Bolder", "size": "Small", "horizontalAlignment": "Center"}],
            },
            {
                "type": "Column",
                "width": "110px",
                "items": [{"type": "TextBlock", "text": "Admin Access", "weight": "Bolder", "size": "Small", "horizontalAlignment": "Center"}],
            },
        ],
    })

    # ── 4. Roles table rows (one per requested role) ────────────
    for idx, (name, rid) in enumerate(zip(dashboard_names, role_ids)):
        admin_flag = _admin_requested(idx, rid)
        card_body.append({
            "type": "ColumnSet",
            "spacing": "Small",
            "columns": [
                {
                    "type": "Column",
                    "width": "stretch",
                    "items": [{"type": "TextBlock", "text": name, "size": "Small", "wrap": True}],
                },
                {
                    "type": "Column",
                    "width": "80px",
                    "items": [{"type": "TextBlock", "text": "✅", "horizontalAlignment": "Center"}],
                },
                {
                    "type": "Column",
                    "width": "110px",
                    "items": [{"type": "TextBlock", "text": "✅" if admin_flag else "—", "horizontalAlignment": "Center"}],
                },
            ],
        })

    # ── 5. Action buttons ───────────────────────────────────────
    approve_label = "Approve All" if len(role_ids) > 1 else "Approve"
    actions: list[dict] = [
        {
            "type": "Action.Submit",
            "title": "Deny",
            "data": {
                "callback_keyword": "control_tower_approval",
                "request_id": request_id,
                "decision": "reject",
            },
        },
        {
            "type": "Action.Submit",
            "title": approve_label,
            "data": {
                "callback_keyword": "control_tower_approval",
                "request_id": request_id,
                "decision": "approve",
            },
        },
    ]

    card: dict = {
        "type": "AdaptiveCard",
        "version": "1.3",
        "body": card_body,
        "actions": actions,
    }

    # ── Send to each admin via Webex 1:1 ────────────────────────
    # Testing override: if TEST_APPROVAL_EMAIL is set, send only to that address
    target_emails = [TEST_APPROVAL_EMAIL] if TEST_APPROVAL_EMAIL else admin_emails
    loop = asyncio.get_event_loop()
    for email in target_emails:
        try:
            await loop.run_in_executor(
                None,
                lambda e=email: api.messages.create(
                    toPersonEmail=e,
                    text="Control Tower Access Request — please see the attached card.",
                    attachments=[
                        {
                            "contentType": "application/vnd.microsoft.card.adaptive",
                            "content": card,
                        }
                    ],
                ),
            )
            logger.info("Approval card sent to %s for request %s.", email, request_id)
        except ApiError:
            logger.exception("Failed to send approval card to %s.", email)

    # ── Auto-notify requester and target via Webex DM ───────────
    # This ensures DMs are always sent, regardless of whether the LLM
    # remembers to call send_webex_dm separately.
    admin_names = ", ".join(
        e.split("@")[0].upper() for e in admin_emails
    ) if admin_emails else "platform admin(s)"
    dashboard_label = ", ".join(dashboard_names)

    is_other_user = (
        target_user_name
        and target_user_name.strip().upper() != requester_user_name.strip().upper()
    )

    # DM to requester
    requester_msg = (
        f"Your request for {access_type} access to {dashboard_label}"
        f"{f' for {target_user_name}' if is_other_user else ''}"
        f" has been sent to the admin(s) ({admin_names}) for approval."
        f" You'll receive a Webex DM once a decision is made."
    )
    await send_webex_dm(requester_email, requester_msg)

    # DM to target (only if different from requester)
    if is_other_user and target_email:
        target_msg = (
            f"{requester_user_name} has requested {access_type} access"
            f" to {dashboard_label} for you ({target_user_name})."
            f" The request has been sent to the admin(s) ({admin_names})"
            f" for approval. You'll be notified once a decision is made."
        )
        await send_webex_dm(target_email, target_msg)

    return request_id


async def send_webex_dm(email: str, message: str) -> None:
    """Send a plain-text Webex direct message to *email*."""
    logger.info("send_webex_dm called — to=%s, message=%.200s", email, message)
    if not email:
        logger.warning("send_webex_dm: empty email, skipping.")
        return
    loop = asyncio.get_event_loop()
    try:
        await loop.run_in_executor(
            None,
            lambda: api.messages.create(toPersonEmail=email, text=message),
        )
        logger.info("✅ Webex DM sent successfully to %s.", email)
    except Exception:
        logger.exception("❌ Failed to send Webex DM to %s.", email)


# ──────────────────────────────────────────────────────────────
# 7. TOOL DISPATCHER (with per-conversation caching)
# ──────────────────────────────────────────────────────────────

TOOL_MAP: dict[str, Any] = {
    "check_user_access": check_user_access,
    "find_dashboard_admins": find_dashboard_admins,
    "check_requester_is_admin": check_requester_is_admin,
    "create_access_role": create_access_role,
    "update_access_role": update_access_role,
    "send_approval_card": send_approval_card,
    "send_webex_dm": send_webex_dm,
}

# Tools whose results can be cached within a conversation (read-only lookups)
_CACHEABLE_TOOLS = {"check_user_access", "find_dashboard_admins", "check_requester_is_admin"}

# Per-conversation tool result cache: { userName: { cache_key: result } }
_tool_cache: dict[str, dict[str, Any]] = {}

TOOL_CACHE_TTL: int = 120  # seconds — cache expires after 2 minutes
_tool_cache_timestamps: dict[str, float] = {}


def _get_tool_cache(user_name: str) -> dict[str, Any]:
    """Get or create the tool cache for a user, respecting TTL."""
    now = time.time()
    last_ts = _tool_cache_timestamps.get(user_name, 0)
    if now - last_ts > TOOL_CACHE_TTL:
        _tool_cache[user_name] = {}
        _tool_cache_timestamps[user_name] = now
    return _tool_cache.setdefault(user_name, {})


def invalidate_tool_cache(user_name: str) -> None:
    """Clear cache after write operations (create/update)."""
    _tool_cache.pop(user_name, None)
    _tool_cache_timestamps.pop(user_name, None)


async def execute_tool(tool_name: str, params: dict, user_name: str = "") -> Any:
    """Look up *tool_name* in ``TOOL_MAP`` and invoke it with *params*.

    For cacheable read-only tools, results are cached per-conversation
    to avoid redundant API calls within the same request flow.

    Returns a JSON-serializable result, or an error dict if the tool
    is unknown or raises an exception.
    """
    fn = TOOL_MAP.get(tool_name)
    if fn is None:
        logger.warning("Unknown tool requested: %s", tool_name)
        return {"error": f"Unknown tool: {tool_name}"}

    # Check cache for read-only tools
    if tool_name in _CACHEABLE_TOOLS and user_name:
        cache = _get_tool_cache(user_name)
        cache_key = f"{tool_name}:{json.dumps(params, sort_keys=True, default=str)}"
        if cache_key in cache:
            logger.info("Tool '%s' cache HIT for %s", tool_name, user_name)
            return cache[cache_key]

    try:
        result = await fn(**params)
    except Exception:
        logger.exception("Tool '%s' raised an exception.", tool_name)
        return {"error": f"Tool '{tool_name}' failed."}

    # Cache the result
    if tool_name in _CACHEABLE_TOOLS and user_name:
        cache = _get_tool_cache(user_name)
        cache_key = f"{tool_name}:{json.dumps(params, sort_keys=True, default=str)}"
        cache[cache_key] = result
        logger.info("Tool '%s' cached for %s", tool_name, user_name)

    # Invalidate cache after write operations
    if tool_name in ("create_access_role", "update_access_role") and user_name:
        invalidate_tool_cache(user_name)

    return result


# ──────────────────────────────────────────────────────────────
# 8. LLM ORCHESTRATOR (ReAct loop)
# ──────────────────────────────────────────────────────────────


def _format_history(history: list[dict]) -> str:
    """Render conversation history as a multi-line string for the LLM prompt."""
    lines: list[str] = []
    for msg in history:
        role = msg["role"].upper()
        lines.append(f"{role}: {msg['content']}")
    return "\n".join(lines)


async def process_message(user_name: str, user_message: str, user_email: str = "", user_full_name: str = "") -> str:
    """Core orchestrator invoked by both ``/webhook`` and ``/control-tower-ui-chat``.

    Uses LangGraph for structured agent execution with native tool calling.
    Falls back to the legacy ReAct loop if LangGraph is unavailable.
    """
    # ── Get or create conversation state ────────────────────────
    if user_name not in conversation_states:
        conversation_states[user_name] = {
            "history": [],
            "collected": {},
            "user_email": user_email,
        }
    elif user_email:
        conversation_states[user_name]["user_email"] = user_email

    state = conversation_states[user_name]
    resolved_email = user_email or state.get("user_email", "") or f"{user_name.lower()}@cisco.com"
    history: list[dict] = state["history"]

    # Handle empty messages
    if not user_message or not user_message.strip():
        greeting = (
            "Hi! I'm the Control Tower Support Agent. I can help you with:\n"
            "• Requesting access to a dashboard\n"
            "• Checking your current access\n"
            "• Answering questions about the platform\n"
            "What can I help you with?"
        )
        history.append({"role": "assistant", "content": greeting})
        return greeting

    # Append user message to local history
    history.append({"role": "user", "content": user_message})

    roles = await get_roles()
    roles_json = json.dumps(roles, default=str)

    # ── Resolve user's full name for personalized greetings ────
    # Prefer the display name passed from the UI, then fall back to cached value
    if user_full_name and user_full_name.upper() != user_name.upper():
        state["full_name"] = user_full_name
    else:
        user_full_name = state.get("full_name", "")

    # ── Try LangGraph-based execution ──────────────────────────
    try:
        from graph import invoke_control_tower
        from langchain_core.messages import HumanMessage as HM, AIMessage as AIM

        # Convert local dict history to LangChain messages
        lc_history = []
        for msg in history[:-1]:  # Exclude the current message (passed separately)
            if msg["role"] == "user":
                lc_history.append(HM(content=msg["content"]))
            elif msg["role"] == "assistant":
                lc_history.append(AIM(content=msg["content"]))
            # tool_result messages from old format are skipped (graph handles internally)

        response_text = await invoke_control_tower(
            user_name=user_name,
            user_email=resolved_email,
            user_message=user_message,
            history=lc_history,
            system_prompt=SYSTEM_PROMPT,
            roles_json=roles_json,
            user_full_name=user_full_name,
        )

        history.append({"role": "assistant", "content": response_text})
        if len(history) > MAX_HISTORY_LENGTH:
            state["history"] = history[-MAX_HISTORY_LENGTH:]
        return response_text

    except asyncio.CancelledError:
        logger.info("Request cancelled by client for user %s.", user_name)
        raise
    except ImportError:
        logger.warning("LangGraph not available — falling back to legacy ReAct loop.")
    except Exception:
        logger.exception("LangGraph execution failed — falling back to legacy ReAct loop.")

    # ── FALLBACK: Legacy ReAct loop (kept for resilience) ──────
    return await _legacy_react_loop(user_name, resolved_email, history, state, roles_json)


async def _legacy_react_loop(
    user_name: str, resolved_email: str, history: list[dict], state: dict, roles_json: str
) -> str:
    """Original ReAct loop — used as fallback when LangGraph is unavailable."""
    llm = await _get_llm()

    prompt_prefix = (
        SYSTEM_PROMPT
        + "\n\nROLES REGISTRY:\n"
        + roles_json
        + "\n\nCURRENT USER: "
        + user_name
        + "\nCURRENT USER EMAIL: "
        + resolved_email
        + "\n\nCONVERSATION:\n"
    )

    for iteration in range(MAX_REACT_ITERATIONS):
        full_prompt = prompt_prefix + _format_history(history)

        try:
            llm_response = await llm.ainvoke(full_prompt)
            raw_content: str = llm_response.content
        except Exception:
            logger.exception("LLM invocation failed on iteration %d.", iteration)
            fallback = "Something went wrong processing your request. Please try again."
            history.append({"role": "assistant", "content": fallback})
            return fallback

        stripped = raw_content.strip()
        if stripped.startswith("```"):
            lines = stripped.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            stripped = "\n".join(lines)

        try:
            parsed: dict = json.loads(stripped)
        except json.JSONDecodeError:
            logger.warning(
                "LLM returned non-JSON on iteration %d. Using raw content.", iteration,
            )
            history.append({"role": "assistant", "content": raw_content})
            if len(history) > MAX_HISTORY_LENGTH:
                state["history"] = history[-MAX_HISTORY_LENGTH:]
            return raw_content

        response_text: str = parsed.get("response", "")
        tool_calls: list[dict] = parsed.get("tool_calls", [])
        logger.info(
            "ReAct iteration %d for %s — response: %.200s, tool_calls: %s",
            iteration, user_name, response_text, [tc.get("tool") for tc in tool_calls],
        )

        if not tool_calls:
            history.append({"role": "assistant", "content": response_text})
            if len(history) > MAX_HISTORY_LENGTH:
                state["history"] = history[-MAX_HISTORY_LENGTH:]
            return response_text

        history.append({"role": "assistant", "content": response_text})

        tool_names = [tc.get("tool", "") for tc in tool_calls]
        tool_params_list = [tc.get("params", {}) for tc in tool_calls]
        results = await asyncio.gather(
            *(execute_tool(n, p, user_name=user_name) for n, p in zip(tool_names, tool_params_list)),
            return_exceptions=True,
        )

        for tool_name, result in zip(tool_names, results):
            if isinstance(result, Exception):
                result = {"error": f"Tool '{tool_name}' failed: {result}"}
            try:
                result_str = json.dumps(result, default=str)
            except (TypeError, ValueError):
                result_str = str(result)

            logger.info("Tool '%s' result (truncated): %.500s", tool_name, result_str)
            history.append({
                "role": "tool_result",
                "content": f"[{tool_name}] {result_str}",
            })

    logger.warning(
        "Max ReAct iterations (%d) reached for user %s.", MAX_REACT_ITERATIONS, user_name,
    )
    fallback = (
        "I'm having trouble completing your request. "
        "Please try again or contact the platform team."
    )
    history.append({"role": "assistant", "content": fallback})
    if len(history) > MAX_HISTORY_LENGTH:
        state["history"] = history[-MAX_HISTORY_LENGTH:]
    return fallback


# ──────────────────────────────────────────────────────────────
# Pydantic models (for Webex webhook payloads)
# ──────────────────────────────────────────────────────────────


class WebhookData(BaseModel):
    id: str


class WebhookPayload(BaseModel):
    resource: str | None = None
    data: WebhookData


# ──────────────────────────────────────────────────────────────
# 9. WEBEX WEBHOOK ENDPOINT
# ──────────────────────────────────────────────────────────────


@router.post("/webhook")
async def webhook(payload: WebhookPayload):
    """Webex webhook handling both adaptive-card submissions and chat messages.

    • ``attachmentActions`` — admin responded to an approval card.
    • ``messages`` — user sent a message to the Webex bot.
    """
    resource = payload.resource or "messages"

    # ── A) Attachment actions — NOW HANDLED BY webex-bot WebSocket ──
    # The webex-bot library receives card submissions over an outbound
    # WebSocket connection, eliminating the need for Webex to POST here.
    # See webex_bot_handler.py → ControlTowerCardCallback.
    #
    # if resource == "attachmentActions":
    #     ... (commented out — handled by WebSocket bot)
    #
    if resource == "attachmentActions":
        logger.info("attachmentActions received via webhook — ignored (handled by WebSocket bot).")
        return {"status": "handled_by_websocket_bot"}

    # ── B) Regular chat messages ────────────────────────────────
    if resource == "messages":
        try:
            message = api.messages.get(payload.data.id)
        except ApiError:
            logger.exception("Failed to fetch message %s.", payload.data.id)
            return {"status": "message_not_found"}

        # Ignore the bot's own messages
        try:
            bot_email = api.people.me().emails[0]
        except (ApiError, IndexError):
            logger.exception("Failed to resolve bot identity.")
            return {"status": "bot_identity_error"}

        if message.personEmail == bot_email:
            return {"status": "ignored_bot_message"}

        user_email: str = message.personEmail or ""
        user_name: str = (
            user_email.split("@")[0].upper() if user_email else "UNKNOWN"
        )
        user_text: str = message.text or ""
        room_id: str = message.roomId

        response_text = await process_message(user_name, user_text, user_email=user_email)

        try:
            api.messages.create(roomId=room_id, text=response_text)
        except ApiError:
            logger.exception("Failed to send reply to room %s.", room_id)

        return {"status": "message_processed"}

    return {"status": f"ignored_resource_{resource}"}


# ──────────────────────────────────────────────────────────────
# 10. UI CHATBOT ENDPOINT
# ──────────────────────────────────────────────────────────────


class ChatRequest(BaseModel):
    """Inbound payload from the UI chatbot."""
    userName: str
    userEmail: str = ""
    message: str


class ChatResponse(BaseModel):
    """Outbound response to the UI chatbot."""
    response: str


@router.post("/control-tower-ui-chat", response_model=ChatResponse)
async def chat(req: ChatRequest, request: Request):
    """UI chatbot endpoint — funnels into the shared ReAct orchestrator.

    Supports client-side cancellation: if the UI unsubscribes (aborts the
    HTTP request), the agent processing is cancelled via asyncio task
    cancellation.
    """
    # Derive user ID from email (e.g. "pragampe@cisco.com" → "PRAGAMPE")
    # req.userName is the display name (e.g. "Prashansa")
    user_id = req.userEmail.split("@")[0].upper() if req.userEmail else req.userName.upper()
    print(f"Received UI chat message from {req.userName} (id={user_id}, email={req.userEmail}): {req.message}")

    # Run process_message as a task so we can cancel it on disconnect
    task = asyncio.ensure_future(
        process_message(user_id, req.message, user_email=req.userEmail, user_full_name=req.userName)
    )

    # Poll for client disconnect while waiting for the task
    while not task.done():
        if await request.is_disconnected():
            task.cancel()
            logger.info("Client disconnected — cancelled agent task for %s.", req.userName)
            return ChatResponse(response="Request cancelled.")
        await asyncio.sleep(0.25)

    try:
        response = task.result()
    except asyncio.CancelledError:
        logger.info("Agent task was cancelled for %s.", req.userName)
        return ChatResponse(response="Request cancelled.")
    except Exception as exc:
        logger.exception("Agent task failed for %s.", req.userName)
        return ChatResponse(response="Something went wrong. Please try again.")

    return ChatResponse(response=response)


# ──────────────────────────────────────────────────────────────
# 10b. UI CHATBOT SSE STREAMING ENDPOINT
# ──────────────────────────────────────────────────────────────

@router.post("/control-tower-ui-chat-stream")
async def chat_stream(req: ChatRequest, request: Request):
    """SSE streaming endpoint — streams tokens as they are generated.

    Event format:
        event: token\ndata: <chunk>\n\n
        event: done\ndata: {"full_response": "..."}\n\n
        event: error\ndata: {"error": "..."}\n\n
    """
    user_id = req.userEmail.split("@")[0].upper() if req.userEmail else req.userName.upper()
    user_full_name = req.userName
    user_email = req.userEmail
    logger.info("SSE stream request from %s (id=%s)", user_full_name, user_id)

    async def event_generator():
        # ── Setup state (same as process_message) ──────────────
        if user_id not in conversation_states:
            conversation_states[user_id] = {
                "history": [],
                "collected": {},
                "user_email": user_email,
            }
        elif user_email:
            conversation_states[user_id]["user_email"] = user_email

        state = conversation_states[user_id]
        resolved_email = user_email or state.get("user_email", "") or f"{user_id.lower()}@cisco.com"
        history: list[dict] = state["history"]

        # Handle empty messages
        if not req.message or not req.message.strip():
            greeting = (
                "Hi! I'm the Control Tower Support Agent. I can help you with:\n"
                "• Requesting access to a dashboard\n"
                "• Checking your current access\n"
                "• Answering questions about the platform\n"
                "What can I help you with?"
            )
            history.append({"role": "assistant", "content": greeting})
            yield f"event: token\ndata: {json.dumps(greeting)}\n\n"
            yield f"event: done\ndata: {json.dumps({'full_response': greeting})}\n\n"
            return

        history.append({"role": "user", "content": req.message})

        roles = await get_roles()
        roles_json = json.dumps(roles, default=str)

        # Resolve display name
        if user_full_name and user_full_name.upper() != user_id.upper():
            state["full_name"] = user_full_name
        else:
            user_full_name_resolved = state.get("full_name", "")

        resolved_full_name = state.get("full_name", "")

        try:
            from graph import stream_control_tower
            from langchain_core.messages import HumanMessage as HM, AIMessage as AIM

            lc_history = []
            for msg in history[:-1]:
                if msg["role"] == "user":
                    lc_history.append(HM(content=msg["content"]))
                elif msg["role"] == "assistant":
                    lc_history.append(AIM(content=msg["content"]))

            full_response = ""

            # Human-friendly labels for tool calls
            _TOOL_LABELS = {
                "check_user_access": "Checking your access records…",
                "check_requester_is_admin": "Verifying admin privileges…",
                "find_dashboard_admins": "Looking up dashboard admins…",
                "create_access_role": "Creating access role…",
                "update_access_role": "Updating access role…",
                "send_approval_card": "Sending approval request to admins…",
                "send_webex_dm": "Sending notification…",
            }

            async for token in stream_control_tower(
                user_name=user_id,
                user_email=resolved_email,
                user_message=req.message,
                history=lc_history,
                system_prompt=SYSTEM_PROMPT,
                roles_json=roles_json,
                user_full_name=resolved_full_name,
            ):
                # Check if client disconnected
                if await request.is_disconnected():
                    logger.info("Client disconnected during stream for %s.", user_id)
                    return
                # Tool status signal
                if token.startswith("__TOOL__:"):
                    tool_name = token[len("__TOOL__:"):]
                    label = _TOOL_LABELS.get(tool_name, f"Processing ({tool_name})…")
                    yield f"event: status\ndata: {json.dumps({'message': label})}\n\n"
                    continue
                full_response += token
                yield f"event: token\ndata: {json.dumps(token)}\n\n"

            # Save to history
            history.append({"role": "assistant", "content": full_response})
            if len(history) > MAX_HISTORY_LENGTH:
                state["history"] = history[-MAX_HISTORY_LENGTH:]

            yield f"event: done\ndata: {json.dumps({'full_response': full_response})}\n\n"

        except Exception as exc:
            logger.exception("SSE stream failed for %s.", user_id)
            error_msg = "Something went wrong processing your request. Please try again."
            history.append({"role": "assistant", "content": error_msg})
            yield f"event: error\ndata: {json.dumps({'error': error_msg})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx/proxy buffering
        },
    )


# ──────────────────────────────────────────────────────────────
# 11. STARTUP EVENT
# ──────────────────────────────────────────────────────────────


@router.on_event("startup")
async def startup() -> None:
    """Pre-fetch the roles cache and start the Webex WebSocket bot."""
    logger.info("Control Tower Agent starting up — pre-fetching roles cache.")
    await get_roles()

    # Start the WebSocket-based Webex bot for handling card callbacks & DMs
    if BOT_TOKEN:
        import asyncio
        from webex_bot_handler import start_webex_bot
        loop = asyncio.get_event_loop()
        start_webex_bot(BOT_TOKEN, loop)
    else:
        logger.warning("WEBEX_TEAMS_ACCESS_TOKEN not set — Webex bot NOT started.")
