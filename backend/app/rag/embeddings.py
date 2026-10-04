"""
Lightweight ONNX embedding wrapper for HR365.

Uses the same all-MiniLM-L6-v2 model family as the original
Sentence Transformers implementation, but runs through ONNX Runtime
with a quantized CPU model to keep memory usage low.
"""

from __future__ import annotations

import logging

import numpy as np
import onnxruntime as ort
from huggingface_hub import hf_hub_download
from transformers import AutoTokenizer

logger = logging.getLogger(__name__)


MODEL_REPO = "sentence-transformers/all-MiniLM-L6-v2"

# Official quantized ONNX model for x86 CPUs supporting AVX2.
MODEL_FILE = "onnx/model_quint8_avx2.onnx"

MAX_SEQUENCE_LENGTH = 256


class EmbeddingModel:
    """
    Lightweight embedding model using ONNX Runtime.

    The model produces the same 384-dimensional embedding space as
    all-MiniLM-L6-v2.

    Sentence embeddings are created using mean pooling followed by
    L2 normalization, matching the original Sentence Transformers
    model behavior.
    """

    def __init__(self, model_name: str) -> None:
        if not model_name.strip():
            raise ValueError(
                "Embedding model name must not be empty."
            )

        if model_name != MODEL_REPO:
            logger.warning(
                "Configured embedding model '%s' differs from "
                "the supported ONNX model '%s'. Using ONNX model.",
                model_name,
                MODEL_REPO,
            )

        logger.info(
            "Loading lightweight ONNX embedding model: %s",
            MODEL_REPO,
        )

        self.model_name = MODEL_REPO

        # ------------------------------------------------------------------
        # Tokenizer
        # ------------------------------------------------------------------

        self.tokenizer = AutoTokenizer.from_pretrained(
            MODEL_REPO
        )

        # ------------------------------------------------------------------
        # Download official quantized ONNX model
        # ------------------------------------------------------------------

        model_path = hf_hub_download(
            repo_id=MODEL_REPO,
            filename=MODEL_FILE,
        )

        logger.info(
            "ONNX model downloaded: %s",
            model_path,
        )

        # ------------------------------------------------------------------
        # ONNX Runtime configuration
        # ------------------------------------------------------------------

        session_options = ort.SessionOptions()

        # Keep memory usage predictable on Render's small instance.
        session_options.intra_op_num_threads = 1
        session_options.inter_op_num_threads = 1

        session_options.graph_optimization_level = (
            ort.GraphOptimizationLevel.ORT_ENABLE_BASIC
        )

        self.session = ort.InferenceSession(
            model_path,
            sess_options=session_options,
            providers=["CPUExecutionProvider"],
        )

        self._dimension = 384

        logger.info(
            "Lightweight ONNX embedding model loaded successfully."
        )

    @property
    def dim(self) -> int:
        """Return the embedding dimension."""
        return self._dimension

    # ------------------------------------------------------------------
    # Tokenization
    # ------------------------------------------------------------------

    def _tokenize(
        self,
        texts: list[str],
    ) -> dict[str, np.ndarray]:
        if not texts:
            return {}

        cleaned_texts = [
            text.strip()
            for text in texts
        ]

        if any(not text for text in cleaned_texts):
            raise ValueError(
                "Document text must not contain empty strings."
            )

        encoded = self.tokenizer(
            cleaned_texts,
            padding=True,
            truncation=True,
            max_length=MAX_SEQUENCE_LENGTH,
            return_tensors="np",
        )

        return {
            key: np.asarray(
                value,
                dtype=np.int64,
            )
            for key, value in encoded.items()
        }

    # ------------------------------------------------------------------
    # Mean pooling
    # ------------------------------------------------------------------

    @staticmethod
    def _mean_pool(
        token_embeddings: np.ndarray,
        attention_mask: np.ndarray,
    ) -> np.ndarray:
        """
        Mean-pool token embeddings using the attention mask.
        """

        mask = attention_mask.astype(
            np.float32
        )[
            ...,
            None,
        ]

        masked_embeddings = (
            token_embeddings * mask
        )

        token_counts = np.clip(
            mask.sum(axis=1),
            a_min=1e-9,
            a_max=None,
        )

        return (
            masked_embeddings.sum(axis=1)
            / token_counts
        )

    # ------------------------------------------------------------------
    # L2 normalization
    # ------------------------------------------------------------------

    @staticmethod
    def _normalize(
        embeddings: np.ndarray,
    ) -> np.ndarray:
        norms = np.linalg.norm(
            embeddings,
            axis=1,
            keepdims=True,
        )

        norms = np.clip(
            norms,
            a_min=1e-12,
            a_max=None,
        )

        return embeddings / norms

    # ------------------------------------------------------------------
    # ONNX inference
    # ------------------------------------------------------------------

    def _encode(
        self,
        texts: list[str],
    ) -> np.ndarray:
        inputs = self._tokenize(texts)

        if not inputs:
            return np.empty(
                (0, self.dim),
                dtype=np.float32,
            )

        input_names = {
            item.name
            for item in self.session.get_inputs()
        }

        # Only pass inputs accepted by the ONNX model.
        model_inputs = {
            key: value
            for key, value in inputs.items()
            if key in input_names
        }

        outputs = self.session.run(
            None,
            model_inputs,
        )

        if not outputs:
            raise RuntimeError(
                "ONNX embedding model returned no outputs."
            )

        token_embeddings = np.asarray(
            outputs[0],
            dtype=np.float32,
        )

        attention_mask = inputs[
            "attention_mask"
        ]

        if token_embeddings.ndim != 3:
            raise RuntimeError(
                "ONNX model returned unexpected "
                f"embedding shape: {token_embeddings.shape}."
            )

        embeddings = self._mean_pool(
            token_embeddings,
            attention_mask,
        )

        embeddings = self._normalize(
            embeddings
        )

        embeddings = np.asarray(
            embeddings,
            dtype=np.float32,
        )

        if embeddings.shape[1] != self.dim:
            raise RuntimeError(
                "Embedding dimension mismatch. "
                f"Expected {self.dim}, "
                f"got {embeddings.shape[1]}."
            )

        if not np.isfinite(
            embeddings
        ).all():
            raise RuntimeError(
                "Generated embeddings contain "
                "NaN or infinite values."
            )

        return embeddings

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def embed_documents(
        self,
        texts: list[str],
    ) -> np.ndarray:
        """
        Generate normalized embeddings for documents.

        Small batches keep memory usage low if the index ever needs
        to be rebuilt.
        """

        if not texts:
            return np.empty(
                (0, self.dim),
                dtype=np.float32,
            )

        batch_size = 4
        batches: list[np.ndarray] = []

        for start in range(
            0,
            len(texts),
            batch_size,
        ):
            batch = texts[
                start : start + batch_size
            ]

            embeddings = self._encode(
                batch
            )

            batches.append(
                embeddings
            )

        result = np.vstack(
            batches
        ).astype(
            np.float32,
            copy=False,
        )

        if result.shape[0] != len(texts):
            raise RuntimeError(
                "Embedding count does not match "
                "document count."
            )

        return result

    def embed_query(
        self,
        text: str,
    ) -> np.ndarray:
        """
        Generate a normalized embedding for one query.
        """

        text = text.strip()

        if not text:
            raise ValueError(
                "Query text must not be empty."
            )

        embedding = self._encode(
            [text]
        )

        if embedding.shape != (
            1,
            self.dim,
        ):
            raise RuntimeError(
                "Query embedding has unexpected "
                f"shape: {embedding.shape}."
            )

        return embedding