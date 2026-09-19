"""
High-level RAG pipeline: index management + query execution.
"""

from __future__ import annotations

import hashlib
import json
import logging
from pathlib import Path
from typing import Any

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
    """
    Create a signature representing the current raw-document corpus.

    The signature includes:
    - relative file path
    - file size
    - modification timestamp

    This allows the pipeline to automatically rebuild the FAISS index
    whenever the source corpus changes.
    """
    hasher = hashlib.sha256()

    if not raw_dir.exists():
        return hasher.hexdigest()

    for path in sorted(raw_dir.rglob("*")):
        if not path.is_file():
            continue

        if path.suffix.lower() not in SUPPORTED_EXTS:
            continue

        try:
            stat = path.stat()
            relative_path = path.relative_to(raw_dir).as_posix()
        except (OSError, ValueError):
            continue

        hasher.update(relative_path.encode("utf-8"))
        hasher.update(str(stat.st_size).encode("utf-8"))
        hasher.update(str(stat.st_mtime_ns).encode("utf-8"))

    return hasher.hexdigest()


class RAGPipeline:
    """
    Complete HR365 RAG pipeline.

    Flow:

        raw documents
            ↓
        loader
            ↓
        cleaner
            ↓
        chunker
            ↓
        embeddings
            ↓
        FAISS
            ↓
        retriever
            ↓
        reranker
            ↓
        answer engine
    """

    def __init__(self) -> None:
        self.embedder = EmbeddingModel(config.EMBEDDING_MODEL)

        self.store = VectorStore(
            dim=self.embedder.dim,
            index_dir=config.INDEX_DIR,
        )

        self.retriever = Retriever(
            self.embedder,
            self.store,
        )

        self.reranker = LexicalReranker()

        self.answer_engine = AnswerEngine()

        self.manifest_path = config.INDEX_DIR / "manifest.json"

        self._ready = False

    def initialize(self) -> None:
        """
        Load an existing compatible index or rebuild it automatically.
        """
        config.ensure_dirs()

        signature = _compute_corpus_signature(config.RAW_DIR)

        manifest = self._load_manifest()

        index_exists = (
            (config.INDEX_DIR / "faiss.index").exists()
            and (config.INDEX_DIR / "chunks.json").exists()
        )

        reusable_index = (
            index_exists
            and manifest.get("signature") == signature
            and manifest.get("embedding_model")
            == config.EMBEDDING_MODEL
            and manifest.get("chunk_size")
            == config.CHUNK_SIZE
            and manifest.get("chunk_overlap")
            == config.CHUNK_OVERLAP
        )

        if reusable_index:
            logger.info(
                "Existing compatible FAISS index found. "
                "Loading index from %s",
                config.INDEX_DIR,
            )

            if self.store.load():
                self._ready = True

                logger.info(
                    "RAG ready. vectors=%d, llm_available=%s",
                    self.store.size,
                    self.answer_engine.llm_available,
                )
                return

            logger.warning(
                "Existing index could not be loaded. "
                "Rebuilding from source documents."
            )

        else:
            logger.info(
                "Corpus/config changed or index missing. "
                "Rebuilding FAISS index."
            )

        success = self.build_index()

        if not success:
            raise RuntimeError(
                "Failed to build the HR365 RAG index."
            )

        self._write_manifest(signature)

        self._ready = True

        logger.info(
            "RAG ready. vectors=%d, llm_available=%s",
            self.store.size,
            self.answer_engine.llm_available,
        )

    def _load_manifest(self) -> dict[str, Any]:
        """
        Safely load the index manifest.

        Returns an empty dictionary if the manifest is missing or invalid.
        """
        if not self.manifest_path.exists():
            return {}

        try:
            data = json.loads(
                self.manifest_path.read_text(
                    encoding="utf-8"
                )
            )

            if isinstance(data, dict):
                return data

        except (OSError, json.JSONDecodeError) as exc:
            logger.warning(
                "Could not read index manifest: %s",
                exc,
            )

        return {}

    def _write_manifest(self, signature: str) -> None:
        """
        Save metadata describing the current FAISS index.
        """
        try:
            manifest = {
                "signature": signature,
                "embedding_model": config.EMBEDDING_MODEL,
                "chunk_size": config.CHUNK_SIZE,
                "chunk_overlap": config.CHUNK_OVERLAP,
                "vectors": self.store.size,
            }

            self.manifest_path.write_text(
                json.dumps(
                    manifest,
                    indent=2,
                ),
                encoding="utf-8",
            )

        except OSError as exc:
            logger.warning(
                "Could not write index manifest: %s",
                exc,
            )

    def build_index(self) -> bool:
        """
        Build the FAISS index from the current document corpus.

        Returns:
            True  -> index successfully built
            False -> index construction failed
        """
        self.store.clear()

        documents = load_documents(config.RAW_DIR)

        if not documents:
            logger.warning(
                "No supported documents found under %s. "
                "Starting with an empty knowledge base.",
                config.RAW_DIR,
            )
            return True

        cleaned_documents = []

        for document in documents:
            cleaned_document = clean_document(document)

            if cleaned_document.text:
                cleaned_documents.append(
                    cleaned_document
                )

        if not cleaned_documents:
            logger.warning(
                "All documents were empty after cleaning."
            )
            return True

        chunks = chunk_documents(
            cleaned_documents,
            config.CHUNK_SIZE,
            config.CHUNK_OVERLAP,
        )

        if not chunks:
            logger.warning(
                "Chunking produced zero chunks."
            )
            return True

        texts = [chunk.text for chunk in chunks]

        try:
            embeddings = self.embedder.embed_documents(texts)

        except Exception as exc:
            logger.exception(
                "Embedding generation failed: %s",
                exc,
            )
            return False

        try:
            if len(embeddings) != len(chunks):
                logger.error(
                    "Embedding/chunk count mismatch: "
                    "%d embeddings for %d chunks.",
                    len(embeddings),
                    len(chunks),
                )
                return False

            self.store.add(
                chunks,
                embeddings,
            )

            self.store.save()

        except Exception as exc:
            logger.exception(
                "Failed to create or save FAISS index: %s",
                exc,
            )
            return False

        logger.info(
            "Indexed %d chunks from %d documents.",
            len(chunks),
            len(cleaned_documents),
        )

        return True

    def run(
        self,
        question: str,
    ) -> dict[str, Any]:
        """
        Execute one RAG query.
        """
        question = question.strip()

        if not question:
            raise ValueError(
                "Question must not be empty."
            )

        if not self._ready:
            raise RuntimeError(
                "RAG pipeline is not initialized."
            )

        retrieved = self.retriever.retrieve(
            question,
            k=config.RETRIEVAL_K,
        )

        reranked = self.reranker.rerank(
            question,
            retrieved,
            top_n=config.RERANK_K,
        )

        answer, sources = self.answer_engine.generate(
            question,
            reranked,
        )

        return {
            "answer": answer,
            "sources": sources,
            "retrieved": len(retrieved),
            "reranked": len(reranked),
        }