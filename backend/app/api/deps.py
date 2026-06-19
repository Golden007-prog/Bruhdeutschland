"""Dependency-injection providers. Each is overridable in tests via ``app.dependency_overrides``."""

from __future__ import annotations

from functools import lru_cache

from app.api.store import ProfileStore, RoadmapStore
from app.core.config import Settings, get_settings
from app.llm.client import LLMProvider, build_llm_provider


@lru_cache
def get_profile_store() -> ProfileStore:
    return ProfileStore()


@lru_cache
def get_roadmap_store() -> RoadmapStore:
    return RoadmapStore()


@lru_cache
def get_llm_provider() -> LLMProvider:
    settings: Settings = get_settings()
    return build_llm_provider(settings)
