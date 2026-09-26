"""
OpenAI helper — reads OPENAI_API_KEY from environment only.
Never hard-code keys. Never expose the key to the browser.
"""
from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from typing import Any, Dict, Optional


def get_openai_key() -> str:
    return (
        os.environ.get("OPENAI_API_KEY")
        or os.environ.get("OPENAI_KEY")
        or ""
    ).strip()


def is_configured() -> bool:
    return bool(get_openai_key())


def chat(
    prompt: str,
    *,
    system: str = "You are SmartRoute NER emergency logistics assistant.",
    model: Optional[str] = None,
    max_tokens: int = 512,
) -> Dict[str, Any]:
    """Call OpenAI Chat Completions. Returns {ok, text, error?, raw?}."""
    key = get_openai_key()
    if not key:
        return {
            "ok": False,
            "text": "",
            "error": "OPENAI_API_KEY is not set on the server",
            "configured": False,
        }

    model = model or os.environ.get("OPENAI_MODEL") or "gpt-4o-mini"
    body = {
        "model": model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": str(prompt or "")},
        ],
        "max_tokens": max_tokens,
        "temperature": 0.3,
    }
    req = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {key}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        text = ""
        try:
            text = data["choices"][0]["message"]["content"] or ""
        except (KeyError, IndexError, TypeError):
            text = json.dumps(data)[:500]
        return {"ok": True, "text": text, "raw": data, "configured": True}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="replace")[:400]
        return {
            "ok": False,
            "text": "",
            "error": f"OpenAI HTTP {e.code}: {err_body}",
            "configured": True,
        }
    except Exception as e:
        return {"ok": False, "text": "", "error": str(e), "configured": True}
