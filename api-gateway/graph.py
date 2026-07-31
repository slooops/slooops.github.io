"""
LangGraph Agent Graph for Control Tower
=========================================
Replaces the manual ReAct loop with a LangGraph StateGraph that provides:
- Native tool calling (parallel execution)
- Streaming token responses
- Typed state management
- Intent-based routing (Control Tower vs FinIQ vs General)
"""

from __future__ import annotations

import json
import time
import logging
from typing import Annotated, Any, Literal, TypedDict

from langchain_core.messages import (
    AIMessage,
    BaseMessage,
    HumanMessage,
    SystemMessage,
    ToolMessage,
)
from langgraph.graph import END, StateGraph
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode

from tools import CONTROL_TOWER_TOOLS

logger = logging.getLogger("control_tower_agent.graph")

# ──────────────────────────────────────────────────────────────
# 1. STATE DEFINITION
# ──────────────────────────────────────────────────────────────


class AgentState(TypedDict):
    """State shared across all nodes in the graph."""

    # LangGraph's message accumulator — automatically merges new messages
    messages: Annotated[list[BaseMessage], add_messages]
    # Metadata (not mutated by the graph, passed through)
    user_name: str
    user_email: str
    # Iteration counter for safety
    iteration: int


# ──────────────────────────────────────────────────────────────
# 2. GRAPH BUILDER
# ──────────────────────────────────────────────────────────────

MAX_ITERATIONS = 10


def build_control_tower_graph():
    """Construct and compile the Control Tower agent graph.

    Architecture:
        [agent] ──tool_calls──▶ [tools] ──results──▶ [agent]
            │                                           │
            └──── no tool_calls ────────────────────▶ [END]

    The agent node invokes the LLM with tools bound. If the LLM
    returns tool_calls, they are executed by the ToolNode (in parallel).
    Results are appended to messages and looped back to the agent.
    """

    # ── Tool node (auto-executes tool_calls from AIMessage) ─────
    tool_node = ToolNode(CONTROL_TOWER_TOOLS)

    # ── Agent node ──────────────────────────────────────────────
    async def agent_node(state: AgentState) -> dict:
        """Invoke the LLM with the current message history + bound tools."""
        from main import get_llm

        llm = await get_llm()
        # Bind tools so the LLM can emit tool_calls natively
        llm_with_tools = llm.bind_tools(CONTROL_TOWER_TOOLS)

        response = await llm_with_tools.ainvoke(state["messages"])

        # Increment iteration counter
        return {
            "messages": [response],
            "iteration": state.get("iteration", 0) + 1,
        }

    # ── Routing function ────────────────────────────────────────
    def should_continue(state: AgentState) -> Literal["tools", "__end__"]:
        """Decide whether to execute tools or end."""
        # Safety: stop after MAX_ITERATIONS
        if state.get("iteration", 0) >= MAX_ITERATIONS:
            return "__end__"

        last_message = state["messages"][-1]
        # If the LLM returned tool_calls, route to tool execution
        if hasattr(last_message, "tool_calls") and last_message.tool_calls:
            return "tools"
        return "__end__"

    # ── Assemble graph ──────────────────────────────────────────
    graph = StateGraph(AgentState)

    graph.add_node("agent", agent_node)
    graph.add_node("tools", tool_node)

    graph.set_entry_point("agent")

    graph.add_conditional_edges("agent", should_continue, {
        "tools": "tools",
        "__end__": END,
    })
    # After tools execute, always loop back to agent
    graph.add_edge("tools", "agent")

    return graph.compile()


# ──────────────────────────────────────────────────────────────
# 3. COMPILED GRAPH SINGLETON
# ──────────────────────────────────────────────────────────────

# Compiled once at module load — stateless, reusable across requests
control_tower_graph = build_control_tower_graph()


# ──────────────────────────────────────────────────────────────
# 4. ENTRY POINT HELPERS
# ──────────────────────────────────────────────────────────────


def build_system_message(system_prompt: str, roles_json: str, user_name: str, user_email: str, user_full_name: str = "") -> SystemMessage:
    """Construct the full system message with roles registry and user context."""
    content = (
        system_prompt
        + "\n\nROLES REGISTRY:\n"
        + roles_json
        + "\n\nCURRENT USER (username): "
        + user_name
        + "\nCURRENT USER DISPLAY NAME: "
        + (user_full_name or user_name)
        + "\nCURRENT USER EMAIL: "
        + user_email
        + "\n\nIMPORTANT: When addressing the user by name, ALWAYS use the DISPLAY NAME above "
        "(e.g., 'Hi " + (user_full_name.split()[0] if user_full_name and ' ' in user_full_name else user_name) + "'). "
        "NEVER use the username (" + user_name + ") in greetings or conversation."
        + "\n\nCRITICAL OUTPUT RULES:\n"
        "- You have tools bound natively. To call a tool, use the function-calling interface — "
        "do NOT output JSON objects with 'tool_calls' arrays.\n"
        "- Your response to the user must be PLAIN TEXT (with markdown allowed). "
        "Do NOT wrap your reply in a JSON object like {'response': '...', 'tool_calls': []}. "
        "Just write the message directly as natural language.\n"
        "- IGNORE section 13 (OUTPUT FORMAT) of the system prompt — it does not apply here.\n"
        "\nCRITICAL EXECUTION RULE:\n"
        "- When the user says 'proceed', 'yes', 'confirm', 'go ahead' or similar, "
        "you MUST immediately execute the pending action (find_dashboard_admins → send_approval_card, "
        "or create_access_role/update_access_role). Do NOT re-call check_user_access or "
        "check_requester_is_admin. Do NOT ask for confirmation again. "
        "Execute in ONE iteration and reply with the result.\n"
        "\nMINIMIZE ROUND-TRIPS:\n"
        "- For exact/single dashboard matches, call check_user_access + check_requester_is_admin "
        "IMMEDIATELY on the first user message. Do NOT ask 'Did you mean X?'.\n"
        "- NEVER ask for the user's email or username — you already have them above.\n"
        "- Only ask for fullName if check_user_access returns EMPTY (new user).\n"
        "- Combine confirmation + any missing info into ONE message."
    )
    return SystemMessage(content=content)


def _extract_response_text(content: str) -> str:
    """If the LLM still returns a JSON wrapper, extract just the response text."""
    import json as _json
    stripped = content.strip()
    # Strip markdown code fences
    if stripped.startswith("```"):
        lines = stripped.split("\n")
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        stripped = "\n".join(lines)
    try:
        parsed = _json.loads(stripped)
        if isinstance(parsed, dict) and "response" in parsed:
            return parsed["response"]
    except (ValueError, _json.JSONDecodeError):
        pass
    return content


async def invoke_control_tower(
    user_name: str,
    user_email: str,
    user_message: str,
    history: list[BaseMessage],
    system_prompt: str,
    roles_json: str,
    user_full_name: str = "",
) -> str:
    """Run the Control Tower graph and return the final response text.

    Args:
        user_name: Uppercased username.
        user_email: User's email.
        user_message: The new user message.
        history: Previous conversation messages (already in LangChain format).
        system_prompt: The control tower system prompt.
        roles_json: JSON string of the roles registry.
        user_full_name: User's display name (resolved from access records).

    Returns:
        The final assistant response text.
    """
    # Build messages list
    messages: list[BaseMessage] = [
        build_system_message(system_prompt, roles_json, user_name, user_email, user_full_name),
        *history,
        HumanMessage(content=user_message),
    ]

    initial_state: AgentState = {
        "messages": messages,
        "user_name": user_name,
        "user_email": user_email,
        "iteration": 0,
    }

    # Invoke the graph
    final_state = await control_tower_graph.ainvoke(initial_state)

    # ── Safety net: detect if LLM found admins but never sent approval card ──
    # This catches the case where the LLM claims it submitted but didn't.
    tools_called = set()
    admin_emails_from_tool: list[dict] = []
    for msg in final_state["messages"]:
        if isinstance(msg, ToolMessage):
            tools_called.add(msg.name)
            if msg.name == "find_dashboard_admins":
                try:
                    import json as _j
                    admin_emails_from_tool = _j.loads(msg.content)
                except Exception:
                    pass

    if (
        "find_dashboard_admins" in tools_called
        and "send_approval_card" not in tools_called
        and user_message.strip().lower() in ("proceed", "yes", "confirm", "go ahead", "y", "go", "sure")
    ):
        logger.warning(
            "[graph] LLM called find_dashboard_admins but NOT send_approval_card — "
            "forcing approval card submission for %s", user_name,
        )
        # We need to build the request from conversation context — delegate to process_message fallback
        # Re-invoke the graph with a nudge message
        nudge = HumanMessage(
            content="You found the admins but did NOT call send_approval_card. "
            "You MUST call send_approval_card NOW with the admin emails and request details. "
            "Do it immediately."
        )
        retry_state: AgentState = {
            "messages": final_state["messages"] + [nudge],
            "user_name": user_name,
            "user_email": user_email,
            "iteration": final_state.get("iteration", 0),
        }
        final_state = await control_tower_graph.ainvoke(retry_state)

    # Extract the last AI message as the response
    for msg in reversed(final_state["messages"]):
        if isinstance(msg, AIMessage) and not msg.tool_calls:
            return _extract_response_text(msg.content)

    # Fallback
    return "Something went wrong processing your request. Please try again."


async def stream_control_tower(
    user_name: str,
    user_email: str,
    user_message: str,
    history: list[BaseMessage],
    system_prompt: str,
    roles_json: str,
    user_full_name: str = "",
):
    """Stream the Control Tower graph execution, yielding tokens as they arrive.

    Yields:
        str chunks (tokens) from the final AI response.
    """
    messages: list[BaseMessage] = [
        build_system_message(system_prompt, roles_json, user_name, user_email, user_full_name),
        *history,
        HumanMessage(content=user_message),
    ]

    initial_state: AgentState = {
        "messages": messages,
        "user_name": user_name,
        "user_email": user_email,
        "iteration": 0,
    }

    # Use astream_events for token-level streaming
    async for event in control_tower_graph.astream_events(initial_state, version="v2"):
        kind = event.get("event", "")

        # Emit a status signal with tool name when tools are called
        if kind == "on_tool_start":
            tool_name = event.get("name", "") or ""
            yield f"__TOOL__:{tool_name}"

        # Stream tokens from the LLM during the final response
        if kind == "on_chat_model_stream":
            chunk = event.get("data", {}).get("chunk")
            if chunk and hasattr(chunk, "content") and chunk.content:
                # Skip chunks that are part of tool-call responses
                tc = getattr(chunk, "tool_call_chunks", None) or getattr(chunk, "tool_calls", None)
                if tc:
                    continue
                # Also skip if additional_kwargs has tool_calls (OpenAI format)
                ak = getattr(chunk, "additional_kwargs", {}) or {}
                if ak.get("tool_calls"):
                    continue
                yield chunk.content
