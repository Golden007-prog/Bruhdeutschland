"""Offline unit tests for the embedding provider contract (no model download, no network).

The real bge-m3 retrieval check lives in ``scripts/embed_smoke_test.py`` (touches the network).
Per CLAUDE.md §6, the test suite never makes live calls.
"""

from __future__ import annotations

import numpy as np
import pytest

from app.services.embeddings import DIMENSION, BGEM3EmbeddingProvider, cosine_similarity


class _FakeST:
    """Stub standing in for SentenceTransformer; returns deterministic vectors of a fixed dim."""

    def __init__(self, dim: int = DIMENSION) -> None:
        self._dim = dim

    def encode(self, texts, **_kwargs):  # noqa: ANN001 - mirrors the ST signature
        rng = np.random.default_rng(len(texts))
        return rng.standard_normal((len(texts), self._dim)).astype(np.float32)


def test_provider_reports_contract() -> None:
    provider = BGEM3EmbeddingProvider(model=_FakeST())
    assert provider.model_id == "BAAI/bge-m3"
    assert provider.dimension == DIMENSION == 1024


def test_embed_passages_and_queries_shape() -> None:
    provider = BGEM3EmbeddingProvider(model=_FakeST())
    passages = provider.embed_passages(["a", "b", "c"])
    queries = provider.embed_queries(["q1", "q2"])
    assert passages.shape == (3, DIMENSION)
    assert queries.shape == (2, DIMENSION)
    assert passages.dtype == np.float32


def test_dimension_mismatch_is_rejected() -> None:
    """A model that returns the wrong width must fail loudly, not silently corrupt the index."""
    provider = BGEM3EmbeddingProvider(model=_FakeST(dim=512))
    with pytest.raises(ValueError, match="expected"):
        provider.embed_passages(["x"])


def test_cosine_similarity_values() -> None:
    a = np.array([[1.0, 0.0], [0.0, 1.0]], dtype=np.float32)
    b = np.array([[1.0, 0.0]], dtype=np.float32)
    sims = cosine_similarity(a, b)
    assert sims.shape == (2, 1)
    assert sims[0, 0] == pytest.approx(1.0, abs=1e-5)
    assert sims[1, 0] == pytest.approx(0.0, abs=1e-5)


def test_cosine_similarity_handles_unnormalized() -> None:
    a = np.array([[3.0, 0.0]], dtype=np.float32)  # not unit-norm
    b = np.array([[10.0, 0.0]], dtype=np.float32)
    assert cosine_similarity(a, b)[0, 0] == pytest.approx(1.0, abs=1e-5)
