"""High-level RAG pipeline: index management + query execution."""

from __future__ import annotations

import hashlib
import json
import logging
from pathlib import Path
from typing import Dict, List

from app import config
from app.data.chunker import chunk_documents
from app.data.cleaner import clean_document
from app.data.loader import SUPPORTED_EXTS, load_documents
from app.engines.answer_engine import AnswerEngine
from app.rag.embeddings import EmbeddingModel
from app.rag.reranker import LexicalReranker
from app.rag.retriever import Retriever
from app.rag.vectorstore import VectorStore

logger = logging.getLogger(__name__)


def _compute_corpus_signature(raw_dir: Path) -> str:
    """Hash filenames + mtimes + sizes so we can detect content changes."""
    hasher = hashlib.sha256()
    if not raw_dir.exists():
        return hasher.hexdigest()

    for path in sorted(raw_dir.rglob("*")):
        if not path.is_file() or path.suffix.lower() not in SUPPORTED_EXTS:
            continue
        try:
            stat = path.stat()
        except OSError:
            continue
        hasher.update(path.name.encode("utf-8"))
        hasher.update(str(stat.st_size).encode("utf-8"))
        hasher.update(str(stat.st_mtime_ns).encode("utf-8"))
    return hasher.hexdigest()


class RAGPipeline:
    """Coordinates ingestion, retrieval, reranking, and answer generation."""

    def __init__(self) -> None:
        self.embedder = EmbeddingModel(config.EMBEDDING_MODEL)
        self.store = VectorStore(dim=self.embedder.dim, index_dir=config.INDEX_DIR)
        self.retriever = Retriever(self.embedder, self.store)
        self.reranker = LexicalReranker()
        self.answer_engine = AnswerEngine()

        self.manifest_path = config.INDEX_DIR / "manifest.json"
        self._ready = False

    # ------------------------------------------------------------------
    # Startup
    # ------------------------------------------------------------------
    def initialize(self) -> None:
        config.ensure_dirs()

        signature = _compute_corpus_signature(config.RAW_DIR)
        needs_rebuild = True

        if self.manifest_path.exists() and (config.INDEX_DIR / "faiss.index").exists():
            try:
                manifest = json.loads(self.manifest_path.read_text(encoding="utf-8"))
            except Exception:  # noqa: BLE001
                manifest = {}

            if (
                manifest.get("signature") == signature
                and manifest.get("embedding_model") == config.EMBEDDING_MODEL
            ):
                needs_rebuild = False

        if needs_rebuild:
            logger.info("Corpus changed or index missing - rebuilding FAISS index.")
            self.build_index()
            self._write_manifest(signature)
        else:
            logger.info("Loading existing FAISS index from %s", config.INDEX_DIR)
            if not self.store.load():
                logger.warning("Index load failed - rebuilding from scratch.")
                self.build_index()
                self._write_manifest(signature)

        self._ready = True
        logger.info(
            "RAG ready. vectors=%d, llm_available=%s",
            self.store.size,
            self.answer_engine.llm_available,
        )

    def _write_manifest(self, signature: str) -> None:
        try:
            self.manifest_path.write_text(
                json.dumps(
                    {
                        "signature": signature,
                        "embedding_model": config.EMBEDDING_MODEL,
                        "chunk_size": config.CHUNK_SIZE,
                        "chunk_overlap": config.CHUNK_OVERLAP,
                        "vectors": self.store.size,
                    },
                    indent=2,
                ),
                encoding="utf-8",
            )
        except OSError as exc:
            logger.warning("Could not write manifest: %s", exc)

    # ------------------------------------------------------------------
    # Indexing
    # ------------------------------------------------------------------
    def build_index(self) -> None:
        self.store.clear()

        documents = load_documents(config.RAW_DIR)
        if not documents:
            logger.warning("No documents found under %s - index will be empty.", config.RAW_DIR)
            return

        cleaned = []
        for document in documents:
            document = clean_document(document)
            if document.text:
                cleaned.append(document)

        if not cleaned:
            logger.warning("All documents were empty after cleaning.")
            return

        chunks = chunk_documents(
            cleaned, config.CHUNK_SIZE, config.CHUNK_OVERLAP
        )
        if not chunks:
            logger.warning("Chunking produced zero chunks.")
            return

        texts = [c.text for c in chunks]
        try:
            embeddings = self.embedder.embed_documents(texts)
        except Exception as exc:  # noqa: BLE001
            logger.error("Embedding generation failed: %s", exc)
            return

        self.store.add(chunks, embeddings)
        self.store.save()
        logger.info(
            "Indexed %d chunks from %d documents.", len(chunks), len(cleaned)
        )

    # ------------------------------------------------------------------
    # Query
    # ------------------------------------------------------------------
    def run(self, question: str) -> Dict:
        if not question or not question.strip():
            raise ValueError("Question must not be empty.")

        retrieved = self.retriever.retrieve(question, k=config.RETRIEVAL_K)
        reranked = self.reranker.rerank(question, retrieved, top_n=config.RERANK_K)

        answer, sources = self.answer_engine.generate(question, reranked)

        return {
            "answer": answer,
            "sources": sources,
            "retrieved": len(retrieved),
            "reranked": len(reranked),
        }