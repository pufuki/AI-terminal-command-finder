"""
LLM fallback module — uses Ollama to generate terminal commands
when semantic retrieval confidence is low.
"""
import json
import logging
import os

import httpx

logger = logging.getLogger(__name__)

OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "llama3.2")

PROMPT_TEMPLATE = """You are a Linux terminal command expert. The user wants a terminal command for the following request:

"{query}"

Respond ONLY with a valid JSON object (no markdown, no code fences) with these fields:
- "command": the exact terminal command
- "explanation": a clear one-sentence explanation of what it does
- "flags": an array of objects with "flag" and "description" for each flag used
- "example": a concrete example of using the command
- "safety": one of "safe", "warning", or "dangerous"

Example response:
{{"command":"find . -type d -empty -delete","explanation":"Finds and removes all empty directories recursively.","flags":[{{"flag":"-type d","description":"Match directories only"}},{{"flag":"-empty","description":"Match empty entries"}},{{"flag":"-delete","description":"Delete matched entries"}}],"example":"find . -type d -empty -delete","safety":"warning"}}"""


def _extract_json(text: str) -> dict | None:
    import re
    cleaned = text.strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*```$", "", cleaned, flags=re.IGNORECASE)
    match = re.search(r"\{[\s\S]*\}", cleaned)
    if not match:
        return None
    try:
        return json.loads(match.group(0))
    except json.JSONDecodeError:
        return None


async def generate_command(query: str) -> dict | None:
    """Generate a command using Ollama. Returns a dict or None on failure."""
    prompt = PROMPT_TEMPLATE.format(query=query)
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{OLLAMA_URL}/api/generate",
                json={
                    "model": OLLAMA_MODEL,
                    "prompt": prompt,
                    "stream": False,
                    "options": {"temperature": 0.3, "top_p": 0.9},
                },
            )
            response.raise_for_status()
            data = response.json()
            result = _extract_json(data.get("response", ""))
            if result and "command" in result:
                return {
                    "command": result["command"],
                    "explanation": result.get("explanation", "AI-generated command."),
                    "flags": result.get("flags", []),
                    "example": result.get("example", result["command"]),
                    "safety": result.get("safety", "warning"),
                    "source": "llm",
                }
            logger.warning("LLM returned unparseable response")
            return None
    except Exception as e:
        logger.error("Ollama request failed: %s", e)
        return None


def is_ollama_available() -> bool:
    """Check if Ollama is reachable."""
    try:
        with httpx.Client(timeout=3.0) as client:
            response = client.get(f"{OLLAMA_URL}/api/tags")
            return response.status_code == 200
    except Exception:
        return False
