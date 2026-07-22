"""
CmdFind FastAPI backend.
Provides semantic search via FAISS and LLM fallback via Ollama.

Endpoints:
  GET  /health        — health check
  GET  /search?q=...  — semantic search
  POST /llm/generate  — LLM fallback command generation
  GET  /stats         — dataset statistics
"""
import logging
import time

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from dataset import load_commands
from embeddings import init_index, get_index
from llm import generate_command, is_ollama_available

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="CmdFind Backend",
    description="Semantic terminal command search with FAISS + Ollama fallback",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Initialize on startup
logger.info("Loading dataset...")
_commands = load_commands()
logger.info("Loaded %d commands", len(_commands))

logger.info("Initializing FAISS index...")
_index = init_index(_commands)
logger.info("Index ready (%d vectors)", _index.index.ntotal if _index.index else 0)

_ollama_available = is_ollama_available()
logger.info("Ollama available: %s", _ollama_available)


class LLMRequest(BaseModel):
    query: str


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "commands_indexed": len(_commands),
        "ollama_available": _ollama_available,
    }


@app.get("/search")
async def search(
    q: str = Query(..., description="Natural language query"),
    top_k: int = Query(5, ge=1, le=20),
    threshold: float = Query(0.15, ge=0.0, le=1.0),
):
    start = time.time()
    results = _index.search(q, top_k=top_k)

    top_score = results[0]["score"] if results else 0.0
    llm_used = False

    if not results or top_score < threshold:
        llm_result = await generate_command(q)
        if llm_result:
            results = [{
                "entry": {
                    "id": f"llm-{int(time.time())}",
                    "command": llm_result["command"],
                    "description": f'AI-generated for: "{q}"',
                    "category": "AI Generated",
                    "tags": ["ai-generated", "fallback"],
                    "example": llm_result["example"],
                    "safety": llm_result["safety"],
                    "explanation": llm_result["explanation"],
                    "flags": llm_result["flags"],
                },
                "score": 1.0,
                "source": "llm",
                "rank": 0,
            }]
            llm_used = True

    latency_ms = int((time.time() - start) * 1000)
    return {
        "query": q,
        "results": results,
        "llm_used": llm_used,
        "latency_ms": latency_ms,
    }


@app.post("/llm/generate")
async def llm_generate(req: LLMRequest):
    result = await generate_command(req.query)
    if result is None:
        return JSONResponse(
            status_code=503,
            content={
                "error": "LLM unavailable",
                "message": "Ollama is not running or failed to generate a response.",
            },
        )
    return result


@app.get("/stats")
async def stats():
    from collections import Counter
    category_counts = Counter(c.category for c in _commands)
    return {
        "total_commands": len(_commands),
        "categories": dict(category_counts),
        "index_size": _index.index.ntotal if _index.index else 0,
        "ollama_available": _ollama_available,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
