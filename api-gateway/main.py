import os
import time
import asyncio
import base64
import traceback
import requests
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel, Field
from typing import Dict, List, Literal, Optional
from langchain_openai import AzureChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
import uvicorn
from dotenv import load_dotenv
import db

# Load environment variables from .env file
load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application startup / shutdown resources."""
    await db.init_db()
    yield
    await db.close_db()


app = FastAPI(title="Control Tower AI Agent API", version="1.0.0", lifespan=lifespan)

# Register the Webex webhook router from control_tower_admin_agent
from control_tower_admin_agent import router as webhook_router
from dashboard_codegen_agent import router as dashboard_codegen_router
app.include_router(webhook_router)
app.include_router(dashboard_codegen_router)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str

class ChatRequest(BaseModel):
    message: str
    context: str = ""
    conversation_history: List[ChatMessage] = []

class ChatResponse(BaseModel):
    response: str
    suggestions: List[str] = []


class DashboardQueries(BaseModel):
    summary: str
    details: str
    detailsFiltered: str
    summaryUpdate: str


class DashboardDetailsFilter(BaseModel):
    columnName: str
    type: Literal["select", "text"]


class DashboardCodegenRequest(BaseModel):
    componentName: str
    featureName: str
    queries: DashboardQueries
    paramAliases: Dict[str, str] = Field(default_factory=dict)
    assignmentUsersKey: str
    summaryColumns: List[str]
    detailsTableFilters: List[DashboardDetailsFilter]
    roleName: str
    userName: Optional[str] = None
    userEmail: Optional[str] = None

# --- OAuth token cache ---
_token_cache = {"access_token": None, "expires_at": 0}
TOKEN_TTL_SECONDS = 2400  # 40 minutes (tokens typically last 60 min)

# --- LLM instance cache (reuse until token refreshes) ---
_llm_cache = {"instance": None, "token": None}

def _fetch_oauth_token_sync():
    """Synchronous OAuth token fetch — runs in thread pool to avoid blocking the event loop"""
    LLM_CLIENT_ID = os.getenv("LLM_CLIENT_ID")
    LLM_CLIENT_SECRET = os.getenv("LLM_CLIENT_SECRET")
    
    if not LLM_CLIENT_ID or not LLM_CLIENT_SECRET:
        raise ValueError("LLM credentials not configured – set LLM_CLIENT_ID and LLM_CLIENT_SECRET in .env")
    
    credentials = f"{LLM_CLIENT_ID}:{LLM_CLIENT_SECRET}"
    encoded_value = base64.b64encode(credentials.encode("utf-8")).decode("utf-8")
    url = "https://id.cisco.com/oauth2/default/v1/token"
    headers = {
        "Accept": "*/*",
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": f"Basic {encoded_value}",
    }
    data = {"grant_type": "client_credentials"}
    
    response = requests.post(url, headers=headers, data=data, timeout=30)
    if response.status_code != 200:
        detail = ""
        try:
            err_json = response.json()
            detail = err_json.get("error_description") or err_json.get("error") or ""
        except ValueError:
            detail = response.text[:300]

        if detail:
            raise ValueError(
                f"Failed to obtain access token from Cisco (status {response.status_code}): {detail}"
            )
        raise ValueError(f"Failed to obtain access token from Cisco (status {response.status_code}).")
    
    access_token = response.json().get("access_token")
    if not access_token:
        raise ValueError("No access token returned from Cisco.")
    
    return access_token

async def get_access_token():
    """Get access token from Cisco OAuth2 endpoint (cached, non-blocking)"""
    # Return cached token if still valid
    if _token_cache["access_token"] and time.time() < _token_cache["expires_at"]:
        return _token_cache["access_token"]

    try:
        access_token = await asyncio.to_thread(_fetch_oauth_token_sync)
    except ValueError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Network error while obtaining access token: {str(e)}")

    # Cache the token
    _token_cache["access_token"] = access_token
    _token_cache["expires_at"] = time.time() + TOKEN_TTL_SECONDS
    
    return access_token

async def get_llm():
    """Initialize and return the LLM client (cached until token refreshes)"""
    access_token = await get_access_token()
    
    # Return cached LLM if the token hasn't changed
    if _llm_cache["instance"] is not None and _llm_cache["token"] == access_token:
        return _llm_cache["instance"]
    
    LLM_APP_KEY = os.getenv("LLM_APP_KEY")
    
    if not LLM_APP_KEY:
        raise HTTPException(status_code=500, detail="LLM_APP_KEY not configured – set LLM_APP_KEY in .env")
    
    llm = AzureChatOpenAI(
        deployment_name="gpt-5-nano",
        azure_endpoint="https://chat-ai.cisco.com",
        api_key=access_token,
        api_version="2025-04-01-preview",
        max_tokens=4096,
        model_kwargs={"user": f'{{"appkey": "{LLM_APP_KEY}"}}'},
    )
    
    _llm_cache["instance"] = llm
    _llm_cache["token"] = access_token
    return llm

def generate_suggestions(response_content: str) -> List[str]:
    """Generate contextual suggestions based on the AI response"""
    suggestions = []
    
    if "revenue" in response_content.lower() or "financial" in response_content.lower():
        suggestions.extend([
            "Show me a detailed breakdown by subscription",
            "Compare this quarter to last quarter",
            "Export financial summary"
        ])
    
    if "renewal" in response_content.lower() or "expir" in response_content.lower():
        suggestions.extend([
            "Create renewal reminders",
            "Show renewal timeline",
            "Generate renewal report"
        ])
    
    if "exception" in response_content.lower() or "error" in response_content.lower():
        suggestions.extend([
            "Show exception details",
            "Create resolution plan",
            "Set up monitoring alerts"
        ])
    
    # Default suggestions if no specific context
    if not suggestions:
        suggestions = [
            "Tell me more about this",
            "Show related data",
            "Export this information",
            "Set up alerts for this"
        ]
    
    return suggestions[:4]  # Limit to 4 suggestions

@app.options("/api/chat")
async def chat_options():
    return {"message": "OK"}

@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """Handle chat requests and return LLM responses"""
    try:
        llm = await get_llm()
        
        # Detect invoice analysis requests and use a dedicated system prompt
        context_text = request.context or ""
        is_invoice_analysis = "INVOICE ANALYSIS REQUEST" in context_text
        is_invoice_followup = "INVOICE ANALYSIS REQUEST" in context_text and "FOLLOW-UP QUESTION" in context_text
        
        if is_invoice_followup:
            system_context = f"""You are Ask FinIQ, an AI assistant for Cisco finance operations. You are answering a follow-up question about a specific invoice.

{request.context}

RULES:
1. Answer the user's question directly and concisely based on the invoice context and previous analysis provided above
2. Only use data explicitly available in the context — never invent or estimate
3. **Bold** all dollar amounts, dates, order numbers, invoice numbers, and customer names
4. Use proper markdown formatting (tables, bullets, bold) as appropriate
5. If the answer is not available in the provided data, say so clearly
6. Keep responses focused and under 200 words unless a detailed breakdown is needed
7. Do NOT repeat the full analysis — just answer the specific question"""
        elif is_invoice_analysis:
            system_context = f"""You are Ask FinIQ, an AI assistant for Cisco finance operations. You help finance analysts quickly understand invoices and their place in the subscription lifecycle.

        {request.context}

        YOUR TASK:
        Provide a concise, high-value analysis of this invoice. The user can already see the PDF — don't just restate it. Add analytical value.

        STRUCTURE YOUR RESPONSE EXACTLY AS FOLLOWS:

        ## Invoice Digest
        2-3 sentences: What is this invoice for, who is it billed to, and why does it exist? Use plain business English.
        Include: invoice number, customer, total amount, billing period, and the action that generated it (new, renewal, modification).

        ## Line Items
        A markdown table of the key items from the PDF:
        | SKU | Description | Qty | Unit Price | Amount |
        Only include line items visible in the PDF. If the PDF text is empty or unreadable, note that and skip this section.

        ## Subscription Context
        Using the subscription lifecycle data provided, explain in 3-4 sentences:
        - Which order generated this invoice and what type (NEW, MODIFY, RENEWAL, REPLACE)
        - Where it sits in the timeline (e.g., "2nd of 4 orders", "the initial activation", "a mid-term modification")
        - How the amount compares to previous invoices if data is available (growing, stable, declining)
        If no subscription data is available, write: "_Subscription context not available for this invoice._"

        ## Financial Flags
        3-5 bullet points using icons to flag what a finance analyst should notice:
        - ⚠️ for issues (outstanding balance, overdue, discrepancies)
        - ✅ for healthy indicators (fully paid, on schedule)
        - 📈 or 📉 for trends (growing/declining amounts)
        - 📅 for upcoming dates (term expiry, next billing)
        - 💡 for insights (billing pattern, revenue implications)
        Each bullet should be one concise sentence.

        RULES:
        1. All dollar amounts must come directly from the provided data — never estimate or invent
        2. **Bold** all dollar amounts, dates, order numbers, invoice numbers, and customer names
        3. Keep the entire response under 400 words — be dense and useful, not verbose
        4. Use professional tone — write like a senior finance analyst preparing a brief
        5. Do NOT repeat information already shown in the summary cards (total amount, date, status)
        6. If PDF text is empty, focus on the invoice metadata and subscription context instead"""
        else:
            # Build the system context for subscription data
            system_context = f"""You are Ask FinIQ, an AI assistant that provides clear, professional subscription lifecycle explanations for Cisco finance operations users.
        Your role is to help finance analysts and operations teams understand the complete lifecycle of a subscription — what happened, when, and what the financial implications are.
        
        {request.context}
        
        CRITICAL RULES:
        1. ONLY use data explicitly provided above — never invent or assume data
        2. If asked about something not in the data, say "This information is not available in the provided data"
        3. All dollar amounts must come directly from the data — never calculate or estimate amounts not present
        
        YOUR AUDIENCE: Finance operations analysts who need to understand revenue recognition, invoicing, deferred revenue, accrual impacts, AR distributions, and billing patterns. They know Cisco terminology (EA, SKU, TSV, ATO, etc.) — you don't need to define these.
        
        AVAILABLE DATA: You have been provided with:
        - Subscription header (customer, deal, term, status)
        - Orders (ATO-level lifecycle events)
        - Order lines (per-line financial detail: invoiced, recognized, deferred)
        - Invoices & Credit Memos (AR transactions per order: amounts, payment status, due dates)
        - AR Distributions (per-invoice accounting distributions: GL accounts, debit/credit amounts, posting dates)
        - ROL Distributions (Revenue Obligation Lifecycle: revenue scheduling, recognition periods, obligation amounts)
        - Accrual lines (revenue accrual journal entries)
        - Accrual distributions (GL account-level accrual postings)
        Use ALL available data sections to provide the most complete analysis possible.
        
        WRITING STYLE:
        - Professional and direct — write like a senior finance analyst preparing a subscription briefing
        - Use plain business English, not literary or dramatic language
        - Explain what each event means financially, not just what happened
        - Connect the dots between orders — explain how modifications, renewals, or replacements changed the financial picture
        - Highlight anything unusual: zero-dollar invoicing, large deferred balances, route changes, gaps between orders
        
        GOOD EXAMPLES:
        - "Subscription SR103726 was activated on **Jan 17, 2024** for **New York Palace Hotel** under an **EA 3.0** deal structure with a **60-month** term."
        - "Order **98456677** (**MODIFY**, Mar 18, 2025) adjusted the existing services and added **E3N-MS22P**. Of the **$16,905.36** invoiced, **$900** has been recognized as revenue with **$670.29** still deferred — indicating partial delivery."
        - "The subscription shows a pattern of incremental expansion, with deferred revenue of **$17,468.11** from the initial order suggesting a phased deployment."
        
        BAD EXAMPLES (DO NOT write like this):
        - "The story of subscription SR103726 revolves around the prestigious New York Palace Hotel, which embarked on a journey..." (too literary)
        - "Order 96275839: The Inaugural Step" (dramatic chapter titles)
        - "Fast forward to March 2025, things got interesting..." (informal storytelling)
        - "This narrative illustrates not just the transactional nature..." (meta-commentary)
        
        STRUCTURE (you MUST use these EXACT markdown headings — the UI parses them into tabs):
        
        # Subscription [ID] — [Customer Name]
        ## Subscription Overview
        (3-4 sentences): Customer, deal type, start date, term length, subscription ID, and current status at a glance
        ## Order-by-Order Breakdown
        (chronological): For each order use ### with the order number, action type, and date as the heading. Cover:
           - Action taken and what changed (new SKUs added, services modified, quantities adjusted)
           - Financial impact: invoiced amount, revenue recognized vs. deferred, and what that implies
           - Any notable patterns (zero invoicing, route changes, large deltas from prior order)
        ## Invoicing & AR Summary
        ONE markdown table with columns: Invoice Number | Order ID | Date | Type (Invoice/CM) | Amount | Status | Due Date | Amount Applied | Balance Remaining
        Then 2-3 sentences summarizing overall AR health: total invoiced vs. paid, outstanding balances, overdue items.
        ## Financial Summary
        ONE markdown table with columns: Order ID | Date | Action Type | Invoiced Amount | Revenue Recognized | Revenue Deferred
        
        Then include the following sub-sections within this same tab:
        
        ### Accounting Distributions
        If AR or ROL distribution data is available:
           - **AR Distributions**: Summarize the GL account postings for each invoice — debit/credit accounts, amounts, and posting dates. Highlight any unusual account codes or imbalances.
           - **ROL Distributions**: Summarize the revenue obligation lifecycle entries — revenue scheduling periods, obligation amounts, and recognition timing. Note how revenue is being spread across periods.
        If no distribution data is available, write: "_No AR/ROL distribution data available for this subscription._"
        
        ### Accruals & Revenue Recognition
        If accrual data is available:
           - Summarize accrual journal entries and their GL account postings
           - Highlight total accrued revenue vs. recognized revenue
           - Note any accrual periods, posting dates, or GL accounts that stand out
        If no accrual data is available, write: "_No accrual data available for this subscription._"
        ## Key Observations
        Present 5-8 concise, high-value observations as a markdown bullet list.
        Each observation MUST start with a status icon followed by a bold title and the detail:
        
        - ✅ **[Title]** — for healthy/positive indicators
        - ⚠️ **[Title]** — for risks, anomalies, or items needing attention
        - 📊 **[Title]** — for data-driven trends or insights
        - 📅 **[Title]** — for upcoming dates, milestones, or deadlines
        - 💰 **[Title]** — for revenue or financial observations
        
        Example:
        - ✅ **AR Fully Current** — All **3 invoices** show Paid status with zero outstanding balance.
        - ⚠️ **High Deferred Revenue** — **$32,700** remains deferred across two orders, indicating incomplete delivery.
        - 📊 **Expanding Contract** — The **MODIFY** order in **Mar 2025** added **2 new SKUs**, increasing ACV by **18%**.
        - 📅 **Term Expiry Approaching** — Subscription ends **Jan 2027**, **11 months** from now.
        
        Cover these areas (as applicable):
        - Revenue recognition status and deferred revenue trajectory
        - Invoicing anomalies, outstanding balances, or overdue items
        - AR aging and payment patterns
        - Accrual and GL posting observations
        - Subscription growth, contraction, or structural changes
        - Upcoming milestones or risks (term expiry, large unrecognized balances)
        
        CRITICAL FORMATTING RULES:
        - You MUST start the response with: # Subscription [ID] — [Customer Name]
        - You MUST prefix each major section with ## exactly as shown above: ## Subscription Overview, ## Order-by-Order Breakdown, ## Invoicing & AR Summary, ## Financial Summary, ## Key Observations
        - Within ## Financial Summary, use ### sub-headings for ### Accounting Distributions and ### Accruals & Revenue Recognition
        - Use ### for individual order sub-headings within the Order-by-Order Breakdown section
        - **Bold** all dollar amounts, dates, order numbers, customer names, and action types
        - Markdown table for the financial summary
        - --- between major sections
        - Keep paragraphs to 2-3 sentences
        - Weave data points into sentences — do not list raw field-value pairs
        - NEVER omit the ## prefix on section headings — the frontend depends on it"""
        
        # Build conversation messages
        messages = [SystemMessage(content=system_context)]
        
        # Add conversation history
        for msg in request.conversation_history:
            if msg.role == "user":
                messages.append(HumanMessage(content=msg.content))
            elif msg.role == "assistant":
                messages.append(AIMessage(content=msg.content))
        
        # Add current user message
        messages.append(HumanMessage(content=request.message))
        
        # Log context size for debugging token limit issues
        context_len = len(request.context or "")
        total_history_len = sum(len(m.content) for m in request.conversation_history)
        print(f"[Chat] Context: {context_len:,} chars, History: {total_history_len:,} chars, Message: {len(request.message)} chars")
        
        # Get LLM response
        response = await llm.ainvoke(messages)
        response_content = response.content
        
        # Generate contextual suggestions
        suggestions = generate_suggestions(response_content)
        
        return ChatResponse(
            response=response_content,
            suggestions=suggestions
        )
        
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error processing chat request: {str(e)}")


# ============== Natural Language to SQL Endpoint ==============

from sql_validator import validate_sql, get_sql_generation_prompt, get_schema_context, MAX_ROWS

ORACLE_API_BASE_URL = os.getenv("ORACLE_API_URL", "https://subscription-ai-spring-api.cisco.com")

class NLQueryRequest(BaseModel):
    question: str
    execute: bool = True  # Whether to execute the query or just return SQL
    conversation_history: List[ChatMessage] = []  # Prior Q&A for iterative refinement

class NLQueryResponse(BaseModel):
    question: str
    generated_sql: str
    validated: bool
    validation_error: Optional[str] = None
    results: Optional[List[dict]] = None
    row_count: Optional[int] = None
    summary: Optional[str] = None

@app.post("/api/nl-query", response_model=NLQueryResponse)
async def natural_language_query(request: NLQueryRequest):
    """
    Convert natural language question to SQL, validate, execute, and summarize results.
    """
    try:
        llm = await get_llm()
        
        # Step 1: Generate SQL from natural language
        sql_system = get_sql_generation_prompt()
        messages = [SystemMessage(content=sql_system)]
        
        # Add conversation history so users can refine queries iteratively
        for msg in request.conversation_history[-6:]:  # Last 3 exchanges max
            if msg.role == "user":
                messages.append(HumanMessage(content=msg.content))
            elif msg.role == "assistant":
                messages.append(AIMessage(content=msg.content))
        
        messages.append(HumanMessage(content=f"{request.question}\n\nGenerate the Oracle SQL query:"))
        sql_response = await llm.ainvoke(messages)
        generated_sql = sql_response.content.strip()
        
        # Clean up SQL (remove markdown code blocks if present)
        if generated_sql.startswith("```"):
            lines = generated_sql.split("\n")
            generated_sql = "\n".join(lines[1:-1] if lines[-1] == "```" else lines[1:])
        generated_sql = generated_sql.strip().strip("`")
        
        # Step 2: Validate SQL
        validation_result = validate_sql(generated_sql)
        
        if not validation_result["valid"]:
            return NLQueryResponse(
                question=request.question,
                generated_sql=generated_sql,
                validated=False,
                validation_error=validation_result["error"]
            )
        
        validated_sql = validation_result["sql"]
        
        # Step 3: Execute query if requested
        if not request.execute:
            return NLQueryResponse(
                question=request.question,
                generated_sql=validated_sql,
                validated=True
            )
        
        # Execute via Spring Boot API (non-blocking)
        try:
            execute_response = await asyncio.to_thread(
                requests.post,
                f"{ORACLE_API_BASE_URL}/api/query/execute",
                json={"sql": validated_sql},
                timeout=30,
            )
            
            if execute_response.status_code != 200:
                return NLQueryResponse(
                    question=request.question,
                    generated_sql=validated_sql,
                    validated=True,
                    validation_error=f"Query execution failed: {execute_response.text}"
                )
            
            results = execute_response.json()
            row_count = len(results) if isinstance(results, list) else 0
            
        except requests.exceptions.RequestException as e:
            return NLQueryResponse(
                question=request.question,
                generated_sql=validated_sql,
                validated=True,
                validation_error=f"Failed to connect to database service: {str(e)}"
            )
        
        # Step 4: Generate summary of results
        summary = None
        if row_count > 0:
            # Limit data sent to LLM for summarization
            sample_results = results[:10] if row_count > 10 else results
            
            summary_system = """You are a concise data analyst. Summarize SQL query results in 2-3 factual sentences.
Be specific with numbers. Highlight key findings and patterns. Do not repeat the question."""
            
            summary_prompt = f"""The user asked: "{request.question}"

The query returned {row_count} rows. Here is the data (sample if large):
{sample_results}

Provide your summary:"""
            
            summary_messages = [
                SystemMessage(content=summary_system),
                HumanMessage(content=summary_prompt),
            ]
            summary_response = await llm.ainvoke(summary_messages)
            summary = summary_response.content.strip()
        
        return NLQueryResponse(
            question=request.question,
            generated_sql=validated_sql,
            validated=True,
            results=results[:100] if row_count > 100 else results,  # Limit results returned to frontend
            row_count=row_count,
            summary=summary
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")


@app.get("/api/nl-query/schema")
async def get_schema():
    """Return the database schema context for reference."""
    return {"schema": get_schema_context()}


@app.get("/api/nl-query/examples")
async def get_example_questions():
    """Return example questions users can ask."""
    return {
        "examples": [
            # Subscription queries
            "Show me all subscriptions",
            "How many orders were activated this month?",
            "What is the total sales value by action type?",
            "Show renewals from the last 30 days",
            "Which order lines have unbilled amount greater than 10000?",
            "List subscriptions expiring in the next 90 days",
            "Show me the top 10 customers by total sales value",
            "What is the total revenue recognized vs invoiced?",
            "Show orders with accruals eligible items",
            "List all NEW orders from 2024",
            # Invoice queries
            "Show all open invoices",
            "What invoices are overdue?",
            "Total outstanding amount by customer",
            "Show invoice aging report",
            "How much was invoiced this month?",
            "Show credit memos from this year",
            "Top 10 invoices by amount",
            "Revenue recognized vs deferred by month",
            "AR distributions by account class"
        ]
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "Subscription Chat API", "graph": "langgraph_enabled"}


# ============== Streaming Control Tower Endpoint ==============

class StreamChatRequest(BaseModel):
    userName: str
    userEmail: str = ""
    message: str


@app.post("/api/control-tower-stream")
async def control_tower_stream(req: StreamChatRequest):
    """SSE streaming endpoint for the Control Tower agent.

    Returns tokens as they are generated, giving instant feedback
    instead of waiting for the full ReAct loop to complete.
    """
    import json as _json
    from control_tower_admin_agent import (
        conversation_states, get_roles, SYSTEM_PROMPT, MAX_HISTORY_LENGTH,
    )

    user_name = req.userName.upper()
    user_email = req.userEmail or f"{user_name.lower()}@cisco.com"

    # Ensure conversation state exists
    if user_name not in conversation_states:
        conversation_states[user_name] = {
            "history": [], "collected": {}, "user_email": user_email,
        }

    state = conversation_states[user_name]
    history = state["history"]
    history.append({"role": "user", "content": req.message})

    roles = await get_roles()
    roles_json = _json.dumps(roles, default=str)

    async def event_generator():
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
            async for token in stream_control_tower(
                user_name=user_name,
                user_email=user_email,
                user_message=req.message,
                history=lc_history,
                system_prompt=SYSTEM_PROMPT,
                roles_json=roles_json,
            ):
                full_response += token
                yield f"data: {_json.dumps({'token': token})}\n\n"

            # Store completed response in history
            history.append({"role": "assistant", "content": full_response})
            if len(history) > MAX_HISTORY_LENGTH:
                state["history"] = history[-MAX_HISTORY_LENGTH:]

            yield f"data: {_json.dumps({'done': True})}\n\n"

        except Exception as e:
            yield f"data: {_json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.get("/api/config/check")
async def check_config():
    """Check if required environment variables are configured"""
    required_vars = ["LLM_CLIENT_ID", "LLM_CLIENT_SECRET", "LLM_APP_KEY"]
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        return {
            "status": "error",
            "message": f"Missing environment variables: {', '.join(missing_vars)}"
        }
    
    return {"status": "ok", "message": "All required environment variables are configured"}

@app.post("/api/dashboard-codegen")
async def dashboard_codegen(request: DashboardCodegenRequest):
    """Endpoint to generate dashboard code."""
    # Lazy import to avoid circular dependency
    from dashboard_codegen_agent import (
        DashboardCodegenRequest as AgentDashboardCodegenRequest,
        run_dashboard_codegen,
    )
    
    try:
        agent_request = AgentDashboardCodegenRequest.model_validate(request.model_dump())
        result = await run_dashboard_codegen(agent_request)
        return result
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error processing dashboard codegen request: {str(e)}")

@app.post("/api/dashboard-codegen/stream")
async def dashboard_codegen_stream(request: DashboardCodegenRequest):
    """Streaming variant of dashboard codegen.

    Emits Server-Sent Events so the client sees per-stage progress
    (handoff → backend/ui in parallel → operations) instead of waiting for the
    full generation to finish. The terminal event carries the same payload as
    the blocking /api/dashboard-codegen endpoint.
    """
    # Lazy import to avoid circular dependency
    from dashboard_codegen_agent import (
        DashboardCodegenRequest as AgentDashboardCodegenRequest,
        stream_dashboard_codegen,
    )
    import json as _json

    try:
        agent_request = AgentDashboardCodegenRequest.model_validate(request.model_dump())
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Invalid dashboard codegen request: {str(e)}")

    async def event_generator():
        try:
            async for event in stream_dashboard_codegen(agent_request):
                yield f"data: {_json.dumps(event, default=str)}\n\n"
        except Exception as e:
            traceback.print_exc()
            yield f"data: {_json.dumps({'type': 'error', 'error': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


# ============== Onboarding Persistence Read Endpoints ==============

@app.get("/api/onboarding/sessions")
async def list_onboarding_sessions(
    userId: Optional[str] = Query(default=None),
    userName: Optional[str] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    """List onboarding sessions for a user (most recent first)."""
    lookup_user = (userId or userName or "").strip()
    if not lookup_user:
        raise HTTPException(
            status_code=400,
            detail="Provide userId (or userName) query parameter.",
        )

    try:
        import onboarding_repo

        sessions = await onboarding_repo.list_sessions_for_user(
            lookup_user,
            limit=limit,
            offset=offset,
        )
        return {
            "ok": True,
            "userId": lookup_user,
            "count": len(sessions),
            "limit": limit,
            "offset": offset,
            "items": sessions,
        }
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to list sessions: {exc}")


@app.get("/api/onboarding/sessions/{session_id}")
async def get_onboarding_session(session_id: str):
    """Get one onboarding session by session ID."""
    try:
        import onboarding_repo

        row = await onboarding_repo.get_session(session_id)
        if not row:
            raise HTTPException(status_code=404, detail="Session not found")
        return {"ok": True, "session": row}
    except HTTPException:
        raise
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to fetch session: {exc}")


@app.get("/api/onboarding/sessions/{session_id}/events")
async def get_onboarding_session_events(session_id: str):
    """Get chronological event log for one onboarding session."""
    try:
        import onboarding_repo

        events = await onboarding_repo.list_events_for_session(session_id)
        return {
            "ok": True,
            "sessionId": session_id,
            "count": len(events),
            "events": events,
        }
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to fetch session events: {exc}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)