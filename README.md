# CmdFind - AI Terminal Command Finder

Find the right terminal command in seconds. Describe what you want in plain English and get the exact command, explanation, flags, and safety info instantly.

Built with **semantic retrieval (RAG)** - not an LLM call per query. An LLM (Ollama) is used only as a fallback when retrieval confidence is low.

## Features

- **Semantic search** - TF-IDF retrieval on the frontend, FAISS + sentence-transformers on the backend
- **309 indexed commands** - across 8 categories (File System, Text Processing, Network, Process Management, Git, System, Development, Basics)
- **AI fallback** - Ollama generates commands when retrieval confidence is low
- **Safety badges** - Safe / Warning / Dangerous with warnings before destructive commands
- **Keyboard navigation** - Arrow keys to navigate, Enter to copy
- **Premium UI** - Raycast/Warp/Linear-inspired dark mode design
- **Instant search** - 200ms debounce, sub-50ms retrieval
- **Copy button** - One-click copy for every command
- **Confidence scores** - Visual indicator of match quality

## Quick Start

### Option 1: Frontend Only (TF-IDF search, no backend needed)

```bash
npm install
npm run dev
```

Open http://localhost:3000. The TF-IDF search works standalone - no Python or Ollama required.

### Option 2: Full Stack (FAISS + Ollama)

**1. Start Ollama:**
```bash
# Install from https://ollama.com
ollama pull llama3.2
ollama serve
```

**2. Start the Python backend:**
```bash
cd backend
pip install -r requirements.txt
node generate_dataset.js    # Generate commands.json from TS dataset
python main.py              # Starts on :8000, builds FAISS index on first run
```

**3. Start the frontend:**
```bash
cp .env.example .env
npm install
npm run dev
```

### Option 3: Docker Compose (everything)

```bash
docker-compose up --build
```

This starts:
- Frontend on http://localhost:3000
- Backend on http://localhost:8000
- Ollama on http://localhost:11434

After first run, pull the model inside the Ollama container:
```bash
docker exec -it <ollama-container> ollama pull llama3.2
```

To regenerate the backend dataset after modifying TypeScript files:
```bash
cd backend && node generate_dataset.js
```

## Configuration

| Variable | Default | Description |
|---|---|---|
| `PYTHON_BACKEND_URL` | `http://localhost:8000` | FastAPI backend URL |
| `OLLAMA_URL` | `http://localhost:11434` | Ollama server URL |
| `OLLAMA_MODEL` | `llama3.2` | Ollama model name |
| `EMBEDDING_MODEL` | `all-MiniLM-L6-v2` | sentence-transformers model |

## Tech Stack

- **Frontend:** Next.js 13, TypeScript, TailwindCSS, shadcn/ui, lucide-react
- **Backend:** FastAPI, FAISS, sentence-transformers, Pydantic
- **LLM:** Ollama (llama3.2)
- **Docker:** Docker Compose for full-stack deployment

## License

MIT
