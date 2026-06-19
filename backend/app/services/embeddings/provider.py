"""Embedding provider interface (ADR-0003).

All semantic-search embedding access in DeutschPrep goes through ``EmbeddingProvider`` so the
underlying model stays swappable (mirrors the ``LLMProvider`` / ``TTSProvider`` pattern). The
pgvector column dimension is pinned to a provider's :attr:`dimension` and asserted at startup.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from collections.abc import Sequence

import numpy as np
from numpy.typing import NDArray

Vector = NDArray[np.float32]


class EmbeddingProvider(ABC):
    """Vendor-neutral contract for producing dense, L2-normalized embeddings.

    Vectors are returned L2-normalized so cosine similarity reduces to a dot product, matching how
    pgvector's ``vector_cosine_ops`` index is queried.
    """

    @property
    @abstractmethod
    def model_id(self) -> str:
        """Stable identifier of the underlying model (e.g. ``"BAAI/bge-m3"``)."""

    @property
    @abstractmethod
    def dimension(self) -> int:
        """Output embedding dimension. Must equal the pgvector column width."""

    @abstractmethod
    def embed_passages(self, texts: Sequence[str], *, batch_size: int = 16) -> Vector:
        """Embed corpus passages (programs, DAAD entries). Shape ``(len(texts), dimension)``."""

    @abstractmethod
    def embed_queries(self, texts: Sequence[str], *, batch_size: int = 16) -> Vector:
        """Embed user/search queries. Shape ``(len(texts), dimension)``.

        Some models (e.g. E5) require a query prefix; others (bge-m3) do not. Providers encapsulate
        that asymmetry so callers never have to know.
        """

    # -- shared helpers -------------------------------------------------------

    def _validate(self, vectors: Vector, n: int) -> Vector:
        """Assert shape matches the declared contract; surface drift loudly, not silently."""
        if vectors.shape != (n, self.dimension):
            raise ValueError(
                f"{self.model_id} returned {vectors.shape}, expected ({n}, {self.dimension})"
            )
        return vectors.astype(np.float32, copy=False)


def cosine_similarity(a: Vector, b: Vector) -> NDArray[np.float32]:
    """Cosine-sim matrix between row sets ``a`` (m×d) and ``b`` (n×d) → ``(m, n)``.

    Inputs are normalized defensively, so this is correct even for non-normalized vectors.
    """
    a = a / (np.linalg.norm(a, axis=1, keepdims=True) + 1e-12)
    b = b / (np.linalg.norm(b, axis=1, keepdims=True) + 1e-12)
    return (a @ b.T).astype(np.float32)
