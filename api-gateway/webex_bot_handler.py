"""
Control Tower WebSocket-based Webex Bot Handler
=================================================
Uses the `webex-bot` library which maintains an *outbound* WebSocket to Webex
cloud — no inbound webhook delivery required. This works on Cisco-internal
deployments where Webex's public servers cannot reach the app's internal IP.

Flow:
  1. Admin clicks Approve/Deny on an Adaptive Card in Webex.
  2. Webex pushes the attachmentAction event over the bot's WebSocket.
  3. `webex-bot` dispatches to `ControlTowerCardCallback` (matched by callback_keyword).
  4. `execute()` runs sync in the bot thread; async work is delegated to the
     main event loop via `asyncio.run_coroutine_threadsafe`.
  5. User sends a message to the bot → `ControlTowerMessageCommand.execute()`.
"""
from __future__ import annotations

import asyncio
import fcntl
import logging
import threading
from typing import IO, Optional

from webex_bot.models.command import Command
from webex_bot.models.response import Response
from webex_bot.webex_bot import WebexBot

logger = logging.getLogger("control_tower_agent.webex_bot")

# Injected by start_webex_bot() — reference to the FastAPI/uvicorn event loop
_main_loop: Optional[asyncio.AbstractEventLoop] = None

# Held open by the worker that wins the startup race; keeps the fcntl lock alive
_bot_lock_fd: Optional[IO] = None


# ──────────────────────────────────────────────────────────────
# Custom WebexBot subclass
# ──────────────────────────────────────────────────────────────


class ControlTowerWebexBot(WebexBot):
    """
    WebexBot subclass that adds a fallback for Adaptive Card submissions that
    lack the ``callback_keyword`` field (cards sent before the field was added).

    The base library routes card actions by looking up
    ``attachment_actions.inputs["callback_keyword"]``.  If that key is absent
    but the submission carries a ``request_id`` field we recognise, we inject
    the keyword before calling the parent handler so routing works normally.
    """

    def process_incoming_card_action(self, attachment_actions, activity):
        inputs = attachment_actions.inputs or {}
        if "callback_keyword" not in inputs and "request_id" in inputs:
            logger.info(
                "[WebexBot] Old card (no callback_keyword) — injecting fallback key"
            )
            attachment_actions.inputs["callback_keyword"] = "control_tower_approval"
        super().process_incoming_card_action(attachment_actions, activity)


# ──────────────────────────────────────────────────────────────
# Card Callback Command — handles Approve/Deny clicks
# ──────────────────────────────────────────────────────────────


class ControlTowerCardCallback(Command):
    """Routes Adaptive Card Submit actions (Approve/Deny) to the approval handler."""

    def __init__(self):
        super().__init__(card_callback_keyword="control_tower_approval")

    def execute(self, message, attachment_actions, activity):
        inputs = attachment_actions.inputs or {}
        request_id = inputs.get("request_id", "")
        decision = inputs.get("decision", "")
        # In webex-bot, the actor email is in the activity dict, not on attachment_actions
        admin_email = ""
        if activity and isinstance(activity, dict):
            admin_email = activity.get("actor", {}).get("emailAddress", "")
        if not admin_email:
            # Fallback: try personEmail (webexteamssdk style)
            admin_email = getattr(attachment_actions, "personEmail", "") or ""

        logger.info(
            "[WebexBot] Card callback: request_id=%s decision=%s admin=%s",
            request_id, decision, admin_email,
        )

        if not request_id or not decision:
            response = Response()
            response.text = "⚠️ Invalid card submission — missing request_id or decision."
            return response

        if _main_loop is None or _main_loop.is_closed():
            logger.error("[WebexBot] Main event loop not available")
            response = Response()
            response.text = "⚠️ Bot is initialising — please try again in a moment."
            return response

        try:
            coro = _handle_approval_decision(request_id, decision, admin_email)
            future = asyncio.run_coroutine_threadsafe(coro, _main_loop)
            reply_text = future.result(timeout=30)
        except Exception as exc:
            logger.exception("[WebexBot] Error processing approval: %s", exc)
            reply_text = "❌ Error processing your decision. Please try again."

        response = Response()
        response.text = reply_text
        return response


# ──────────────────────────────────────────────────────────────
# Message Command — handles DMs to the bot
# ──────────────────────────────────────────────────────────────


class ControlTowerMessageCommand(Command):
    """Handles regular text messages sent to the bot via Webex DM."""

    def __init__(self):
        super().__init__(
            command_keyword="",  # Catch-all for any message
            help_message="I'm the Control Tower Support Bot. Ask me about dashboard access!",
            delete_previous_message=False,
        )

    def execute(self, message, attachment_actions, activity):
        # Extract sender info
        sender_email = ""
        if hasattr(message, "personEmail"):
            sender_email = message.personEmail or ""
        elif hasattr(activity, "actor") and hasattr(activity["actor"], "id"):
            sender_email = ""  # Will be resolved below

        # For webex-bot, message is the text content
        user_text = ""
        if isinstance(message, str):
            user_text = message
        elif hasattr(message, "text"):
            user_text = message.text or ""

        # Try to get email from activity
        if not sender_email and activity:
            try:
                from control_tower_admin_agent import api as webex_api
                person = webex_api.people.get(activity.get("actor", {}).get("id", ""))
                sender_email = person.emails[0] if person.emails else ""
            except Exception:
                pass

        if not sender_email:
            response = Response()
            response.text = "I couldn't identify you. Please try again."
            return response

        user_name = sender_email.split("@")[0].upper()

        logger.info("[WebexBot] Message from %s: %s", user_name, user_text[:100])

        if _main_loop is None or _main_loop.is_closed():
            response = Response()
            response.text = "⚠️ Bot is initialising — please try again in a moment."
            return response

        try:
            from control_tower_admin_agent import process_message
            coro = process_message(user_name, user_text, user_email=sender_email)
            future = asyncio.run_coroutine_threadsafe(coro, _main_loop)
            reply_text = future.result(timeout=60)
        except Exception as exc:
            logger.exception("[WebexBot] Error processing message: %s", exc)
            reply_text = "Something went wrong. Please try again."

        response = Response()
        response.text = reply_text
        return response


# ──────────────────────────────────────────────────────────────
# Async approval handler (runs on the main event loop)
# ──────────────────────────────────────────────────────────────


async def _handle_approval_decision(request_id: str, decision: str, admin_email: str) -> str:
    """Process an admin's approve/deny decision from the Adaptive Card."""
    from control_tower_admin_agent import (
        pending_requests,
        send_webex_dm,
        create_access_role,
        update_access_role,
        api as webex_api,
    )
    from webexteamssdk.exceptions import ApiError

    # Look up the pending request
    req = pending_requests.get(request_id)
    if not req or req["status"] != "pending":
        logger.info("[WebexBot] Ignoring stale/unknown request_id %s.", request_id)
        return "ℹ️ This request has already been handled."

    # First-write wins: mark status immediately
    req["status"] = decision

    # Resolve the admin who responded
    admin_user_name = admin_email.split("@")[0].upper() if admin_email else "UNKNOWN"

    requester_email: str = req["requester_email"]
    requester_full_name: str = req["requester_fullName"]
    requester_user_name: str = req.get("requester_userName", "")
    # Target user: for Flow B this differs from requester; for Flow A they're the same
    target_email: str = req.get("target_email", "") or requester_email
    target_full_name: str = req.get("target_fullName", "") or requester_full_name
    target_user_name: str = req.get("target_userName", "") or requester_user_name

    # Ensure target_email is valid
    if not target_email or "@" not in target_email:
        target_email = f"{target_user_name.lower()}@cisco.com"
    is_other_user_request = (
        target_user_name and target_user_name.lower() != requester_user_name.lower()
    )
    dashboard_label: str = ", ".join(req["dashboard_names"])
    role_ids: list[int] = req["role_ids"]
    access_type: str = req["access_type"]
    is_reenablement: dict[int, bool] = req.get("is_reenablement", {})

    if decision == "approve":
        per_role_admin: dict[int, bool] = req.get("per_role_admin", {})
        default_admin = access_type == "admin"

        for rid in role_ids:
            role_wants_admin = per_role_admin.get(rid, default_admin)
            grant_admin = "Y" if role_wants_admin else "N"

            if is_reenablement.get(rid, False):
                await update_access_role(
                    userName=target_user_name,
                    roleId=rid,
                    enabledFlag="Y",
                    admin=grant_admin,
                    readOnly="N",
                    lastUpdatedBy=admin_user_name,
                )
            else:
                await create_access_role(
                    userName=target_user_name,
                    userEmail=target_email,
                    fullName=target_full_name,
                    roleId=rid,
                    admin=grant_admin,
                    readOnly="N",
                    createdBy=admin_user_name,
                )

        admin_suffix = (
            " with admin access" if any(
                per_role_admin.get(rid, default_admin) for rid in role_ids
            ) else ""
        )

        # Notify requester
        if is_other_user_request:
            await send_webex_dm(
                requester_email,
                (
                    f"✅ Your request for {target_user_name}'s access to"
                    f" {dashboard_label} has been approved{admin_suffix}."
                ),
            )
            # Notify target user
            await send_webex_dm(
                target_email,
                (
                    f"✅ You ({target_user_name}) have been granted"
                    f" {access_type} access to {dashboard_label}{admin_suffix}."
                    f" Requested by {requester_user_name}."
                ),
            )
        else:
            await send_webex_dm(
                requester_email,
                (
                    f"✅ Your access to {dashboard_label} has been"
                    f" approved{admin_suffix}."
                ),
            )

        reply = f"✅ Approved! {target_user_name} now has {access_type} access to {dashboard_label}."

    elif decision == "reject":
        if is_other_user_request:
            await send_webex_dm(
                requester_email,
                (
                    f"❌ Your request for {target_user_name}'s access to"
                    f" {dashboard_label} was declined."
                ),
            )
            await send_webex_dm(
                target_email,
                (
                    f"❌ The request for your ({target_user_name}) access to"
                    f" {dashboard_label} (requested by {requester_user_name})"
                    f" was declined."
                ),
            )
        else:
            await send_webex_dm(
                requester_email,
                f"❌ Your request for {dashboard_label} was declined.",
            )

        reply = f"❌ Denied. The request for {dashboard_label} has been declined."

    else:
        reply = f"Unknown decision: {decision}"

    # ── Void remaining cards sent to other admins ───────────
    other_admins = [
        e for e in req.get("admin_emails_sent_to", [])
        if e != admin_email
    ]
    for other_email in other_admins:
        try:
            webex_api.messages.create(
                toPersonEmail=other_email,
                text=(
                    f"ℹ️ The access request from {requester_full_name}"
                    f" for {dashboard_label} has already been handled."
                ),
            )
        except ApiError:
            logger.exception("[WebexBot] Failed to void card for admin %s.", other_email)

    # Clean up
    pending_requests.pop(request_id, None)
    logger.info("[WebexBot] Decision processed: %s for request %s", decision, request_id)
    return reply


# ──────────────────────────────────────────────────────────────
# Bot startup
# ──────────────────────────────────────────────────────────────


def start_webex_bot(token: str, loop: asyncio.AbstractEventLoop) -> None:
    """
    Start ControlTowerWebexBot in a daemon thread.

    Only ONE uvicorn worker process actually starts the bot — the others are
    shut out by a non-blocking fcntl exclusive lock on a temp file. This
    prevents the "4000 Replaced" WebSocket churn that occurs when multiple
    workers all try to hold the same bot connection simultaneously.

    The bot opens an outbound WebSocket to Webex cloud so it works on
    Cisco-internal deployments where inbound webhook delivery is blocked.
    """
    global _main_loop, _bot_lock_fd
    _main_loop = loop

    # Race for the exclusive lock — only the first worker wins.
    try:
        _bot_lock_fd = open("/tmp/control_tower_webex_bot.lock", "w")
        fcntl.flock(_bot_lock_fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except (BlockingIOError, OSError):
        logger.info(
            "[WebexBot] Another worker already holds the bot lock — skipping WebSocket start."
        )
        return

    def _run() -> None:
        logger.info("[WebexBot] Starting WebSocket listener thread...")
        # webex-bot uses asyncio internally; create a fresh loop for this thread
        bot_loop = asyncio.new_event_loop()
        asyncio.set_event_loop(bot_loop)
        try:
            bot = ControlTowerWebexBot(teams_bot_token=token)
            bot.add_command(ControlTowerCardCallback())
            bot.add_command(ControlTowerMessageCommand())
            bot.run()
        except Exception as exc:
            logger.error("[WebexBot] Listener thread crashed: %s", exc, exc_info=True)
        finally:
            bot_loop.close()

    t = threading.Thread(target=_run, daemon=True, name="webex-bot-listener")
    t.start()
    logger.info("[WebexBot] Listener thread started (outbound WebSocket)")
