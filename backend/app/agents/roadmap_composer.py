"""Roadmap Composer — fan-in (agent-workflows.md §6).

Joins all specialists' ``AgentOutput`` drafts into the canonical ``Roadmap``: dedupe by a
deterministic composite hash, merge collisions (union provenance/deps, grounded value wins, longer
body wins), resolve dependencies, order by dependency + deadline, assign status. Creates no facts.
"""

from __future__ import annotations

import hashlib
import re
from collections.abc import Iterable
from datetime import datetime
from uuid import UUID

from app.llm.schemas import (
    AgentOutput,
    Roadmap,
    RoadmapItem,
    RoadmapItemDraft,
)
from app.services.deadline_tracker import assign_statuses, order_items

_WS = re.compile(r"\s+")


def _normalize(title: str) -> str:
    return _WS.sub(" ", title.strip().casefold())


def composite_key(item: RoadmapItemDraft) -> str:
    """Stable dedup key: same logical step from two agents → identical key (agent-workflows.md §6)."""
    deadline = item.deadline.value.isoformat() if item.deadline and item.deadline.value else ""
    parts = [item.category.value, _normalize(item.title), item.program_id or "", deadline]
    return hashlib.sha256("|".join(parts).encode("utf-8")).hexdigest()


def _merge(into: RoadmapItemDraft, other: RoadmapItemDraft) -> RoadmapItemDraft:
    """Merge ``other`` into ``into`` on a key collision (grounded wins, longer body wins)."""
    if len(other.body) > len(into.body):
        into.body = other.body
    into.provenance = list(
        {(p.source_url, p.source_name): p for p in [*into.provenance, *other.provenance]}.values()
    )
    into.depends_on = sorted(set(into.depends_on) | set(other.depends_on))
    # Grounded deadline supersedes an unverified one.
    if into.deadline is None or into.deadline.needs_verification:
        if other.deadline is not None and not other.deadline.needs_verification:
            into.deadline = other.deadline
    into.needs_verification = into.needs_verification or other.needs_verification
    if other.status == "done":
        into.status = "done"
    return into


class RoadmapComposer:
    def compose(
        self,
        profile_id: UUID,
        outputs: Iterable[AgentOutput],
        *,
        generated_at: datetime,
    ) -> Roadmap:
        outputs = list(outputs)

        # 1. Dedupe drafts by composite key.
        merged: dict[str, RoadmapItemDraft] = {}
        for out in outputs:
            for draft in out.items:
                key = composite_key(draft)
                if key in merged:
                    _merge(merged[key], draft)
                else:
                    merged[key] = draft.model_copy(deep=True)

        # 2. Materialize RoadmapItems (assign ids), keyed for dependency resolution.
        items: list[RoadmapItem] = []
        key_to_id: dict[str, UUID] = {}
        for key, draft in merged.items():
            item = RoadmapItem(
                category=draft.category,
                title=draft.title,
                body=draft.body,
                program_id=draft.program_id,
                status=draft.status,
                deadline=draft.deadline,
                provenance=draft.provenance,
                needs_verification=draft.needs_verification,
                composite_key=key,
            )
            items.append(item)
            key_to_id[key] = item.id

        # 3. Resolve draft dependency keys → item UUIDs (drop danglers).
        for item, draft in zip(items, merged.values()):
            item.depends_on = [key_to_id[k] for k in draft.depends_on if k in key_to_id]

        # 4. Deterministic order + status.
        items = order_items(items)
        items = assign_statuses(items)

        disclaimers = sorted({d for out in outputs for d in out.disclaimers})
        return Roadmap(
            profile_id=profile_id,
            items=items,
            generated_at=generated_at,
            global_disclaimers=disclaimers,
        )
