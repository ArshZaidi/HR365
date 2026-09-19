# HR365 — Locally Runnable RAG Backend

A lightweight, fully local Retrieval-Augmented Generation backend for the
HR365 hackathon project. It ingests documents, embeds them, indexes them with
FAISS, retrieves and reranks relevant passages, and answers questions using
DeepSeek **or** a deterministic fallback if no API key is configured.

## Architecture

```
INGESTION
  raw documents
    -> data/loader.py        (reads .md, .txt, .pdf)
    -> data/cleaner.py       (normalises whitespace)
    -> data/chunker.py       (word-based, 700w / 100w overlap)
    -> rag/embeddings.py     (sentence-transformers, normalised)
    -> rag/vectorstore.py    (FAISS IndexFlatIP + JSON metadata)

QUERY
  user question
    -> rag/embeddings.py     (query embedding)
    -> rag/vectorstore.py    (top-10 vector hits)
    -> rag/reranker.py       (lexical + vector score -> top-5)
    -> rag/prompts.py        (system + user prompt)
    -> engines/answer_engine.py (DeepSeek, else deterministic fallback)
    -> answer + sources
```

## Project layout

```
backend/
├── app/
│   ├── main.py            # FastAPI app + startup wiring
│   ├── config.py          # central config (paths, models, K values)
│   ├── auth/              # reserved namespace (unused in MVP)
│   ├── data/              # loader / cleaner / chunker
│   ├── engines/           # answer_engine (DeepSeek + fallback)
│   ├── models/            # Document, Chunk, Pydantic schemas
│   └── rag/               # embeddings, vectorstore, retriever,
│                          # reranker, prompts, pipeline
├── data/
│   ├── raw/               # put your source documents here
│   ├── processed/         # reserved for derived artefacts
│   └── index/             # FAISS index + JSON metadata + manifest
├── .env.example
├── requirements.txt
└── README.md
```

## Installation (Windows PowerShell)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

If PowerShell blocks the activation script, run once:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

On cmd.exe use `.venv\Scripts\activate.bat` instead.

## Configuration

Copy `.env.example` to `.env`:

```powershell
copy .env.example .env
```

Every value is optional. To enable DeepSeek:

```dotenv
DEEPSEEK_API_KEY=sk-...
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

If `DEEPSEEK_API_KEY` is empty or the API call fails, the answer engine
returns a deterministic extractive answer built from the retrieved passages.
The API never crashes because of a missing key.

## Running

From inside `backend/` (with the venv active):

```powershell
uvicorn app.main:app --reload
```

The API will be available at `http://127.0.0.1:8000`.

## Endpoints

| Method | Path        | Description                              |
|--------|-------------|------------------------------------------|
| GET    | `/`         | Basic banner                             |
| GET    | `/health`   | Indexed chunk count and LLM availability |
| POST   | `/api/ask`  | Ask a question, returns answer + sources |
| GET    | `/docs`     | Interactive Swagger UI                   |

### Example request

```bash
curl -X POST http://127.0.0.1:8000/api/ask ^
  -H "Content-Type: application/json" ^
  -d "{\"question\": \"What are the main features of HR365?\"}"
```

(`^` is the cmd.exe line continuation character. On PowerShell, use
`` ` `` instead, or put the whole command on one line.)

### Example response

```json
{
  "answer": "No DEEPSEEK_API_KEY is configured, so this is a deterministic extractive answer built from the retrieved HR365 passages:\n\n- ## 1. Employee Information Management (source: features.md)\n- ## 2. Leave Management (source: features.md)\n- ## 5. AI-Assisted HR Queries (source: features.md)",
  "sources": [
    { "source": "features.md", "chunk_id": "features.md::chunk-0", "score": 0.78 },
    { "source": "overview.md", "chunk_id": "overview.md::chunk-0", "score": 0.61 }
  ]
}
```

## How indexing works

1. On startup, `RAGPipeline.initialize()` computes a signature from the
   filenames, sizes, and mtimes of everything in `data/raw/`.
2. If the signature matches the stored `data/index/manifest.json` and the
   FAISS index exists, the index is loaded from disk (no rebuild).
3. Otherwise, `build_index()` runs the full pipeline:
   load -> clean -> chunk -> embed -> add -> save.
4. The manifest is updated so the next restart reuses the index.

The index lives in `data/index/`:

- `faiss.index` — the FAISS `IndexFlatIP` (cosine similarity via normalised
  vectors).
- `chunks.json` — every chunk's text, source, document_id, and metadata.
- `manifest.json` — corpus signature + embedding model name.

## Replacing the dummy data

The four files in `data/raw/` (`overview.md`, `features.md`, `timeline.md`,
`faq.md`) are **fictional seed content** marked as dummy data. To use real
documents:

1. Delete or move the dummy `.md` files.
2. Drop your own `.md`, `.txt`, or `.pdf` files into `data/raw/`.
3. Restart the API. The signature changes, so the index rebuilds.

You can also delete `data/index/` to force a rebuild.

## How the DeepSeek fallback works

`AnswerEngine.generate()`:

1. If `DEEPSEEK_API_KEY` is set, it POSTs to
   `{DEEPSEEK_BASE_URL}/chat/completions` with the system prompt and the
   retrieved passages.
2. If the key is missing, or the request raises, or the model returns an
   empty answer, the engine falls back to `_fallback()`.
3. `_fallback()` splits the retrieved chunks into sentences, scores each
   sentence by query-term overlap, picks the best 3-5, and returns them as a
   bulleted answer with source citations. The response clearly states that no
   LLM was used.

## Debugging checklist

- **Model download hangs on first run** — `sentence-transformers` downloads
  `all-MiniLM-L6-v2` (~90 MB) the first time. Ensure you have internet access.
- **`ModuleNotFoundError: No module named 'app'`** — you are not running
  `uvicorn` from inside `backend/`. `cd backend` first.
- **`/api/ask` returns empty `sources`** — the index is empty. Check that
  `data/raw/` contains files and that startup logs say "Indexed N chunks".
- **Corpus changed but index did not rebuild** — delete
  `data/index/manifest.json` (or the whole `data/index/` folder) and restart.
- **`faiss` import error on Windows** — reinstall with
  `pip install --force-reinstall faiss-cpu`.
- **DeepSeek returns 401** — the key in `.env` is wrong. The engine will log
  a warning and fall back automatically; the API will still respond.
- **Port 8000 in use** — run
  `uvicorn app.main:app --reload --port 8001`.