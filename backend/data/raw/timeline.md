# HR365 — Project Timeline (DUMMY DATA)

> **DUMMY DATA WARNING**: The milestones below are fictional and exist only
> to give the RAG demo something to retrieve. They do not describe any real
> product, event, or hackathon schedule.

## Phase 1 — Foundation (Weeks 1-2)

- Define the HR365 data model.
- Stand up the FastAPI backend skeleton.
- Implement document ingestion (loader, cleaner, chunker).

## Phase 2 — Retrieval (Weeks 3-4)

- Integrate sentence-transformers for embeddings.
- Build the FAISS vector store with persistence.
- Add a lexical reranker on top of vector search.

## Phase 3 — Answering (Weeks 5-6)

- Integrate the DeepSeek chat completion API.
- Implement a deterministic fallback so the API works without any API key.
- Return answers together with source citations.

## Phase 4 — Frontend and Polish (Weeks 7-8)

- Build a minimal chat interface.
- Add a health endpoint and startup logs.
- Package the project so it runs locally with a single uvicorn command.