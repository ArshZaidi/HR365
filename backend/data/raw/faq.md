# HR365 — Frequently Asked Questions (DUMMY DATA)

> **DUMMY DATA WARNING**: These Q&A pairs are fictional seed content for the
> HR365 demo. They are not real HR policies.

**Q: What is HR365?**
A: HR365 is a fictional, locally runnable HR platform demo that includes an
AI assistant for answering HR questions from internal documents.

**Q: Do I need an LLM API key to run HR365?**
A: No. If `DEEPSEEK_API_KEY` is not set, HR365 uses a deterministic extractive
fallback that builds an answer from the retrieved passages. The API still
works, and the response clearly states that no LLM was used.

**Q: How does the AI assistant decide what to answer?**
A: It embeds your question, retrieves the top candidate passages from the
FAISS index, reranks them using a lightweight lexical score, and then either
calls the LLM or generates a fallback answer using only those passages.

**Q: What file types can I index?**
A: HR365 indexes `.md`, `.txt`, and `.pdf` files placed in `backend/data/raw/`.

**Q: What happens if the documents don't contain the answer?**
A: The assistant is instructed to say that the provided documents do not
contain information about the question. It does not invent facts.

**Q: How do I update the knowledge base?**
A: Add or edit files in `backend/data/raw/` and restart the API. The index is
rebuilt automatically when the raw files change.

**Q: Where is the FAISS index stored?**
A: It is written to `backend/data/index/` as `faiss.index` alongside a
`chunks.json` metadata file and a `manifest.json` corpus signature.