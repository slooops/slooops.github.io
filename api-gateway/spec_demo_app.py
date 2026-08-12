from __future__ import annotations

import asyncio
import base64
import os
import time
from typing import Any

import requests
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from langchain_openai import AzureChatOpenAI

from spec_compiler import configure_spec_llm_factory, router as spec_compiler_router


load_dotenv()

app = FastAPI(title="Dashboard Spec Onboarding Demo", version="1.0.0")
app.include_router(spec_compiler_router)

_token_cache: dict[str, Any] = {"access_token": None, "expires_at": 0.0}
_llm_cache: dict[str, Any] = {"instance": None, "token": None}


def _fetch_access_token() -> str:
    client_id = os.getenv("LLM_CLIENT_ID")
    client_secret = os.getenv("LLM_CLIENT_SECRET")
    if not client_id or not client_secret:
        raise ValueError("Set LLM_CLIENT_ID and LLM_CLIENT_SECRET before starting the demo.")

    credentials = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()
    response = requests.post(
        "https://id.cisco.com/oauth2/default/v1/token",
        headers={
            "Authorization": f"Basic {credentials}",
            "Content-Type": "application/x-www-form-urlencoded",
        },
        data={"grant_type": "client_credentials"},
        timeout=30,
    )
    response.raise_for_status()
    access_token = response.json().get("access_token")
    if not access_token:
        raise ValueError("Cisco OAuth did not return an access token.")
    return access_token


async def get_demo_llm() -> AzureChatOpenAI:
    app_key = os.getenv("LLM_APP_KEY")
    if not app_key:
        raise HTTPException(status_code=500, detail="Set LLM_APP_KEY before starting the demo.")

    if not _token_cache["access_token"] or time.time() >= _token_cache["expires_at"]:
        try:
            _token_cache["access_token"] = await asyncio.to_thread(_fetch_access_token)
            _token_cache["expires_at"] = time.time() + 2400
        except (ValueError, requests.RequestException) as exc:
            raise HTTPException(status_code=502, detail=str(exc)) from exc

    access_token = _token_cache["access_token"]
    if _llm_cache["instance"] is None or _llm_cache["token"] != access_token:
        _llm_cache["instance"] = AzureChatOpenAI(
            deployment_name="gpt-5-nano",
            azure_endpoint="https://chat-ai.cisco.com",
            api_key=access_token,
            api_version="2025-04-01-preview",
            max_tokens=4096,
            model_kwargs={"user": f'{{"appkey": "{app_key}"}}'},
        )
        _llm_cache["token"] = access_token

    return _llm_cache["instance"]


configure_spec_llm_factory(get_demo_llm)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}