"""Embedding services (ADR-0003): vendor-neutral interface + bge-m3 implementation."""

from .bge_m3 import DIMENSION, MODEL_ID, BGEM3EmbeddingProvider
from .provider import EmbeddingProvider, Vector, cosine_similarity

__all__ = [
    "EmbeddingProvider",
    "Vector",
    "cosine_similarity",
    "BGEM3EmbeddingProvider",
    "MODEL_ID",
    "DIMENSION",
]
