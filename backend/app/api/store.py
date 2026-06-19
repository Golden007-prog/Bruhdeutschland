"""In-memory stores for the local vertical slice.

Phase 4 runs end-to-end without a database; persistence to Postgres (the SQLAlchemy models already
exist) is layered in later behind the same interface. Profiles hold PII, so these never log values.
"""

from __future__ import annotations

from uuid import UUID

from app.llm.schemas import Profile, Roadmap


class ProfileStore:
    def __init__(self) -> None:
        self._items: dict[UUID, Profile] = {}

    def add(self, profile: Profile) -> Profile:
        self._items[profile.id] = profile
        return profile

    def get(self, profile_id: UUID) -> Profile | None:
        return self._items.get(profile_id)


class RoadmapStore:
    def __init__(self) -> None:
        self._items: dict[UUID, Roadmap] = {}

    def add(self, roadmap: Roadmap) -> Roadmap:
        self._items[roadmap.id] = roadmap
        return roadmap

    def get(self, roadmap_id: UUID) -> Roadmap | None:
        return self._items.get(roadmap_id)
