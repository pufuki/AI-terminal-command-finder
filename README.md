# CmdFind — AI Terminal Command Finder

Find the right terminal command in seconds. Describe what you want in plain English and get the exact command, explanation, flags, and safety info instantly.

Built with **semantic retrieval (RAG)** — not an LLM call per query. An LLM (Ollama) is used only as a fallback when retrieval confidence is low.

## Features

- **Semantic search** — TF-IDF retrieval on the frontend, FAISS + sentence-transformers on the backend
- **309 indexed commands** across 8 categories (File System, Text Processing, Network, Process Management, Git, System, Development, Basics)
- **AI fallback** — Ollama generates commands when retrieval confidence is low
- **Safety badges** — Safe / Warning / Dangerous with warnings before destructive commands
- **Keyboard navigation** — Arrow keys to navigate, Enter to copy
- **Premium UI** — Raycast/Warp/Linear-inspired dark mode design
- **Instant search** — 200ms debounce, sub-50ms retrieval
- **Copy button** — One-click copy for every command
- **Confidence scores** — Visual indicator of match quality

## Architecture

```
User types query
    ↓
Next.js API route (/api/search)
    ↓
TF-IDF semantic search (lib/search.ts)
    ↓
Confidence ≥ threshold?
    ├─ YES → Return results from dataset
    └─ NO  → Try Python backend (FAISS) → Try Ollama LLM fallback
    ↓
Return command + explanation + flags + safety + confidence
```

### Frontend (Next.js + TypeScript)
- `lib/dataset/` — 309 typed Linux commands across 8 category files
- `lib/search.ts` — TF-IDF cosine similarity engine with synonym expansion
- `lib/llm.ts` — LLM fallback client (Python backend → Ollama)
- `app/api/search/` — Search API endpoint
- `app/page.tsx` — Main UI with search, results, keyboard nav

### Backend (Python + FastAPI)
- `backend/main.py` — FastAPI server with `/search`, `/llm/generate`, `/stats`
- `backend/embeddings.py` — sentence-transformers + FAISS index
- `backend/llm.py` — Ollama integration for command generation
- `backend/dataset.py` — Dataset loader and models
- `backend/commands.json` — Generated dataset (309 commands)

## Quick Start

### Option 1: Frontend Only (TF-IDF search, no backend needed)

```bash
npm install
npm run dev
```

Open http://localhost:3000. The TF-IDF search works standalone — no Python or Ollama required.

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

## Project Structure

```
.
├── app/
│   ├── api/
│   │   ├── search/route.ts    # Search API endpoint
│   │   └── stats/route.ts     # Dataset stats endpoint
│   ├── globals.css            # Theme + animations
│   ├── layout.tsx             # Root layout with theme provider
│   └── page.tsx               # Main search UI
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── command-card.tsx       # Result card with flags, safety, copy
│   ├── copy-button.tsx        # Copy-to-clipboard button
│   ├── empty-state.tsx        # Initial state with suggestions
│   ├── error-state.tsx        # Error display
│   ├── header.tsx             # Top bar with theme toggle
│   ├── loading-skeleton.tsx   # Loading shimmer
│   ├── no-results.tsx        # No results state
│   ├── safety-badge.tsx       # Safe/Warning/Dangerous badge
│   ├── search-box.tsx         # Main search input
│   └── theme-provider.tsx     # next-themes wrapper
├── hooks/
│   ├── use-search.ts           # Debounced search hook
│   └── use-toast.ts            # Toast hook
├── lib/
│   ├── dataset/
│   │   ├── index.ts            # Aggregates all categories
│   │   ├── filesystem.ts       # 40 file system commands
│   │   ├── textproc.ts         # 40 text processing commands
│   │   ├── network.ts          # 40 network commands
│   │   ├── process.ts          # 30 process management commands
│   │   ├── git.ts              # 40 git commands
│   │   ├── system.ts           # 40 system commands
│   │   ├── dev.ts              # 40 development commands
│   │   └── misc.ts             # 40 basic/misc commands
│   ├── types.ts                # Shared TypeScript types
│   ├── search.ts               # TF-IDF semantic search engine
│   ├── llm.ts                  # LLM fallback client
│   └── utils.ts                # Utility functions
├── backend/
│   ├── main.py                 # FastAPI server
│   ├── embeddings.py           # FAISS + sentence-transformers
│   ├── llm.py                  # Ollama integration
│   ├── dataset.py              # Dataset models and loader
│   ├── commands.json           # Generated dataset (309 commands)
│   ├── generate_dataset.js     # Dataset generator script
│   ├── requirements.txt        # Python dependencies
│   └── README.md               # Backend docs
├── Dockerfile.frontend          # Frontend Docker image
├── Dockerfile.backend           # Backend Docker image
├── docker-compose.yml           # Full stack orchestration
├── .env.example                 # Environment variables template
└── README.md                    # This file
```

## Dataset

Each command entry contains:
- `id` — Unique identifier
- `command` — The terminal command
- `description` — Short plain-English description
- `category` — One of 8 categories
- `tags` — Searchable keyword tags
- `example` — Concrete usage example
- `safety` — `safe` | `warning` | `dangerous`
- `explanation` — Detailed explanation of what the command does
- `flags` — Array of `{ flag, description }` for each flag used

To regenerate the backend dataset after modifying TypeScript files:
```bash
cd backend && node generate_dataset.js
```

## API Reference

### `GET /api/search?q=<query>&top=<n>`
Search for commands matching a natural language query.

**Response:**
```json
{
  "query": "delete empty folders",
  "results": [
    {
      "entry": { "id": "fs-001", "command": "find . -type d -empty -delete", ... },
      "score": 0.85,
      "source": "retrieval"
    }
  ],
  "llmUsed": false,
  "latencyMs": 12
}
```

### `GET /api/stats`
Returns dataset statistics (total commands, categories).

### `GET /health` (backend)
Health check with index size and Ollama availability.

### `POST /llm/generate` (backend)
Generate a command using Ollama LLM fallback.

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
