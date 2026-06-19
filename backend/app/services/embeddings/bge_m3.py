"""``BAAI/bge-m3`` embedding provider (ADR-0003).

bge-m3 is MIT-licensed, multilingual (German + English), and emits 1024-dim dense vectors that fit
pgvector's index limits. Per the model authors, bge-m3 needs **no** instruction prefix for queries,
so :meth:`embed_queries` and :meth:`embed_passages` share an encoder.

``sentence_transformers`` / ``torch`` are imported lazily inside ``__init__`` so this module can be
imported (and the interface unit-tested) without the heavy ML stack installed.
"""

from __future__ import annotations

from collections.abc import Sequence
from typing import Any

import numpy as np

from .provider import EmbeddingProvider, Vector

MODEL_ID = "BAAI/bge-m3"
DIMENSION = 1024


class BGEM3EmbeddingProvider(EmbeddingProvider):
    """Local bge-m3 provider backed by sentence-transformers."""

    def __init__(
        self,
        *,
        device: str | None = None,
        normalize: bool = True,
        model: Any | None = None,
    ) -> None:
        self._normalize = normalize
        if model is not None:
            # Dependency injection for tests (a stub exposing ``.encode``).
            self._model = model
        else:
            from sentence_transformers import SentenceTransformer  # lazy

            self._model = SentenceTransformer(MODEL_ID, device=device)

    @property
    def model_id(self) -> str:
        return MODEL_ID

    @property
    def dimension(self) -> int:
        return DIMENSION

    def _encode(self, texts: Sequence[str], batch_size: int) -> Vector:
        vectors = self._model.encode(
            list(texts),
            batch_size=batch_size,
            normalize_embeddings=self._normalize,
            convert_to_numpy=True,
            show_progress_bar=False,
        )
        return self._validate(np.asarray(vectors, dtype=np.float32), len(texts))

    def embed_passages(self, texts: Sequence[str], *, batch_size: int = 16) -> Vector:
        return self._encode(texts, batch_size)

    def embed_queries(self, texts: Sequence[str], *, batch_size: int = 16) -> Vector:
        # bge-m3 needs no query instruction; same encoder as passages.
        return self._encode(texts, batch_size)
