"""
LangChain Tool Definitions for Control Tower Agent
====================================================
Wraps the existing API helpers as LangChain tools for use with LangGraph's
ToolNode and native LLM tool-calling.

Includes a per-argument result cache (TTL=120s) for read-only tools to avoid
redundant API calls when the LLM re-invokes the same tool within a conversation.
"""

from __future__ import annotations

import json
import logging
import time
from typing import Any

from langchain_core.tools import tool

logger = logging.getLogger("control_tower_agent.tools")

# ──────────────────────────────────────────────────────────────
# Tool result cache (shared across all LangGraph invocations)
# ──────────────────────────────────────────────────────────────

_TOOL_CACHE: dict[str, tuple[float, Any]] = {}  # cache_key → (timestamp, result_json_str)
_TOOL_CACHE_TTL: int = 300  # seconds


def _cache_get(key: str) -> str | None:
    """Return cached JSON string if within TTL, else None."""
    entry = _TOOL_CACHE.get(key)
    if entry and (time.time() - entry[0]) < _TOOL_CACHE_TTL:
        logger.info("[tool-cache HIT] %s", key[:80])
        return entry[1]
    return None


def _cache_set(key: str, value: str) -> None:
    _TOOL_CACHE[key] = (time.time(), value)


def invalidate_tool_cache() -> None:
    """Clear the entire tool cache (called after write operations)."""
    _TOOL_CACHE.clear()
    logger.info("[tool-cache] invalidated all entries")


# Lazy imports to avoid circular dependency with control_tower_admin_agent
# (the actual async implementations live there).


@tool
async def check_user_access(userName: str) -> str:
    """Check a user's current dashboard access records.

    Args:
        userName: The user's Cisco username (e.g., 'johndoe'). If an email is provided, only the part before @ is used.

    Returns:
        JSON list of the user's access records including ROLE_ID, DASHBOARD_NAME, ENABLED_FLAG, ADMIN status.
    """
    cache_key = f"check_user_access:{userName.upper()}"
    cached = _cache_get(cache_key)
    if cached is not None:
        return cached
    from control_tower_admin_agent import check_user_access as _impl
    result = await _impl(userName=userName)
    result_str = json.dumps(result, default=str)
    _cache_set(cache_key, result_str)
    return result_str


@tool
async def find_dashboard_admins(roleId: int) -> str:
    """Find administrators for a specific dashboard/role.

    Args:
        roleId: The ROLE_ID of the dashboard to find admins for. Falls back to platform admins if none found.

    Returns:
        JSON list of admin records with userName, userEmail, fullName.
    """
    cache_key = f"find_dashboard_admins:{roleId}"
    cached = _cache_get(cache_key)
    if cached is not None:
        return cached
    from control_tower_admin_agent import find_dashboard_admins as _impl
    result = await _impl(roleId=roleId)
    result_str = json.dumps(result, default=str)
    _cache_set(cache_key, result_str)
    return result_str


@tool
async def check_requester_is_admin(userName: str) -> str:
    """Check whether a user is a platform admin or sub-admin of specific dashboards.

    Args:
        userName: The user's Cisco username to check admin status for.

    Returns:
        JSON object with is_platform_admin (bool), sub_admin_role_ids (list), sub_admin_dashboard_names (list).
    """
    cache_key = f"check_requester_is_admin:{userName.upper()}"
    cached = _cache_get(cache_key)
    if cached is not None:
        return cached
    from control_tower_admin_agent import check_requester_is_admin as _impl
    result = await _impl(userName=userName)
    result_str = json.dumps(result, default=str)
    _cache_set(cache_key, result_str)
    return result_str


@tool
async def create_access_role(
    userName: str,
    userEmail: str,
    fullName: str,
    roleId: int,
    admin: str = "N",
    readOnly: str = "N",
    createdBy: str = "",
) -> str:
    """Create a new dashboard access role for a user.

    Args:
        userName: Target user's Cisco username.
        userEmail: Target user's email address.
        fullName: Target user's full display name.
        roleId: The ROLE_ID of the dashboard to grant access to.
        admin: 'Y' if granting admin access, 'N' for standard access.
        readOnly: 'Y' for read-only, 'N' for full access.
        createdBy: Username of the person granting access.

    Returns:
        JSON result from the API.
    """
    from control_tower_admin_agent import create_access_role as _impl, check_user_access

    # Resolve fullName if it looks like a bare userName (all caps, no space)
    if not fullName or (fullName.isupper() and " " not in fullName):
        records = await check_user_access(user_name=userName)
        for r in records:
            real_name = r.get("fullName") or r.get("FULL_NAME") or ""
            if real_name and real_name.upper() != userName.upper():
                logger.info("[create_access_role] Resolved fullName for %s → %s", userName, real_name)
                fullName = real_name
                break

    # Also resolve email if not provided or looks wrong
    if not userEmail or "@" not in userEmail:
        userEmail = f"{userName.lower()}@cisco.com"

    result = await _impl(
        userName=userName, userEmail=userEmail, fullName=fullName,
        roleId=roleId, admin=admin, readOnly=readOnly, createdBy=createdBy,
    )
    invalidate_tool_cache()
    return json.dumps(result, default=str)


@tool
async def update_access_role(
    userName: str,
    roleId: int,
    enabledFlag: str = "Y",
    admin: str = "N",
    readOnly: str = "N",
    lastUpdatedBy: str = "",
) -> str:
    """Update an existing access role (e.g., re-enable a disabled role or change admin status).

    Args:
        userName: Target user's Cisco username.
        roleId: The ROLE_ID of the dashboard to update.
        enabledFlag: 'Y' to enable, 'N' to disable.
        admin: 'Y' for admin access, 'N' for standard.
        readOnly: 'Y' for read-only, 'N' for full access.
        lastUpdatedBy: Username of the person making the update.

    Returns:
        JSON result from the API.
    """
    from control_tower_admin_agent import update_access_role as _impl
    result = await _impl(
        userName=userName, roleId=roleId, enabledFlag=enabledFlag,
        admin=admin, readOnly=readOnly, lastUpdatedBy=lastUpdatedBy,
    )
    invalidate_tool_cache()
    return json.dumps(result, default=str)


@tool
async def send_approval_card(admin_emails: list[str], request: dict) -> str:
    """Send an approval card to dashboard admins via Webex for an access request.

    Args:
        admin_emails: List of admin email addresses to send the approval card to.
        request: Dict with keys: requester_userName, requester_email, requester_fullName, dashboard_names (list), role_ids (list), access_type, justification.

    Returns:
        The generated request_id for tracking the approval.
    """
    from control_tower_admin_agent import send_approval_card as _impl
    result = await _impl(admin_emails=admin_emails, request=request)
    return json.dumps({"request_id": result}, default=str)


@tool
async def send_webex_dm(email: str, message: str) -> str:
    """Send a plain text direct message to a user via Webex.

    Args:
        email: Recipient's email address.
        message: The message text to send.

    Returns:
        Confirmation of message sent.
    """
    logger.info("[tool] send_webex_dm called — to=%s, message=%.200s", email, message)
    from control_tower_admin_agent import send_webex_dm as _impl
    try:
        await _impl(email=email, message=message)
        logger.info("[tool] send_webex_dm succeeded for %s", email)
        return json.dumps({"status": "sent", "to": email})
    except Exception as e:
        logger.exception("[tool] send_webex_dm FAILED for %s", email)
        return json.dumps({"status": "error", "to": email, "error": str(e)})


# All tools in a list for binding to the LLM
CONTROL_TOWER_TOOLS = [
    check_user_access,
    find_dashboard_admins,
    check_requester_is_admin,
    create_access_role,
    update_access_role,
    send_approval_card,
    send_webex_dm,
]
