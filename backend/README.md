"""
CmdFind Backend — FastAPI server providing semantic search via FAISS
and LLM fallback via Ollama.

Architecture:
  - dataset.py: Loads the command dataset from JSON
  - embeddings.py: Generates sentence-transformer embeddings and builds a FAISS index
  - llm.py: Ollama fallback for low-confidence queries
  - main.py: FastAPI app exposing /search and /llm/generate endpoints
"""
