# HR365 Development Timeline

> **DUMMY DATA:** This timeline is seed/demo content for the HR365
> hackathon project.

## Phase 1 — Project Setup

- Repository structure created.
- FastAPI backend initialized.
- Basic HR365 API endpoints created.
- Initial document ingestion pipeline implemented.

## Phase 2 — RAG Foundation

- Document loader implemented.
- Markdown, text, and PDF ingestion added.
- Document cleaning implemented.
- Text chunking implemented.
- Sentence Transformer embeddings integrated.
- FAISS vector search integrated.

## Phase 3 — Retrieval Pipeline

- Semantic retrieval implemented.
- Lexical reranking added.
- Source attribution added.
- Persistent FAISS indexing added.
- Automatic corpus-change detection added.

## Phase 4 — AI Assistant

- Grounded RAG prompting implemented.
- Context-only answer generation implemented.
- Groq integration added through its OpenAI-compatible API.
- Deterministic fallback answer generation added.

## Phase 5 — API

- `/` endpoint added.
- `/health` endpoint added.
- `/api/ask` endpoint added.
- Interactive FastAPI documentation enabled through Swagger.

## Phase 6 — Hackathon Prototype

- HR365 backend prepared for integration with the frontend.
- Demo HR documents added.
- End-to-end RAG testing performed.
- Security and configuration cleanup performed.