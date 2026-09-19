# HR365 Frequently Asked Questions

> **DUMMY DATA:** This file contains seed/demo content for the HR365
> hackathon project.

## General

### What is HR365?

HR365 is a fictional, locally runnable HR platform demo designed to
centralise common HR operations and provide an AI assistant for
answering questions from internal documents.

### Who is HR365 for?

HR365 is designed for small and medium-sized organisations that want a
lightweight HR workspace.

### Is HR365 a real production HR system?

No. The current repository contains a hackathon prototype and
demonstration data.

## AI Assistant

### What can the HR365 AI assistant do?

The assistant can answer questions using information retrieved from
the HR365 knowledge base.

### What happens if the answer is not in the documents?

The assistant should state that the provided documents do not contain
the requested information rather than inventing an answer.

## Documents

### What file types can I index?

The current document loader supports:

- `.txt`
- `.md`
- `.pdf`

### Where should documents be placed?

Documents should be placed inside:

`backend/data/raw/`

The RAG pipeline automatically processes supported documents when the
backend initializes and detects corpus changes.

## Technical

### Does HR365 use a vector database?

The current prototype uses FAISS for local vector similarity search.

### Does HR365 require an external AI provider?

No. The RAG pipeline can run without an LLM API key using its
deterministic fallback answer engine.

When configured, the prototype uses an LLM through Groq's
OpenAI-compatible API.