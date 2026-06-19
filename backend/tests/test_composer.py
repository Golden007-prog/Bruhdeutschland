"""Tests for the Roadmap Composer: composite-hash dedupe + merge (agent-workflows.md §6)."""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from app.agents.roadmap_composer import RoadmapComposer, composite_key
from app.llm.schemas import AgentNameEnum, AgentOutput, Provenance, RoadmapItemDraft
from app.models.enums import FeatureCategory

NOW = datetime(2026, 6, 18, tzinfo=timezone.utc)
PROV_A = Provenance(source_name="Uni-Assist", source_url="https://uni-assist.de", retrieved_at=NOW)
PROV_B = Provenance(source_name="TUM", source_url="https://tum.de", retrieved_at=NOW)


def _draft(
    title: str, body: str = "", provenance: list[Provenance] | None = None
) -> RoadmapItemDraft:
    return RoadmapItemDraft(
        category=FeatureCategory.DOCUMENTS, title=title, body=body, provenance=provenance or []
    )


def test_composite_key_is_stable_across_whitespace_and_case() -> None:
    assert composite_key(_draft("Submit Uni-Assist application")) == composite_key(
        _draft("  submit   uni-assist application ")
    )


def test_same_logical_step_from_two_agents_is_deduped() -> None:
    out_a = AgentOutput(
        agent=AgentNameEnum.DOCUMENT_PREP, items=[_draft("Submit X", "short", [PROV_A])]
    )
    out_b = AgentOutput(
        agent=AgentNameEnum.VISA_RELOCATION,
        items=[_draft("submit x", "a considerably longer and more specific body", [PROV_B])],
    )
    rm = RoadmapComposer().compose(uuid4(), [out_a, out_b], generated_at=NOW)
    assert len(rm.items) == 1
    item = rm.items[0]
    assert item.body == "a considerably longer and more specific body"  # longer wins
    assert len(item.provenance) == 2  # union


def test_distinct_titles_are_kept_separate() -> None:
    out = AgentOutput(
        agent=AgentNameEnum.DOCUMENT_PREP, items=[_draft("Step one"), _draft("Step two")]
    )
    rm = RoadmapComposer().compose(uuid4(), [out], generated_at=NOW)
    assert len(rm.items) == 2


def test_disclaimers_are_unioned_and_status_assigned() -> None:
    out_a = AgentOutput(
        agent=AgentNameEnum.FINANCE_LOGISTICS, items=[_draft("Open account")], disclaimers=["D"]
    )
    out_b = AgentOutput(
        agent=AgentNameEnum.VISA_RELOCATION, items=[_draft("Visa")], disclaimers=["D"]
    )
    rm = RoadmapComposer().compose(uuid4(), [out_a, out_b], generated_at=NOW)
    assert rm.global_disclaimers == ["D"]
    assert sum(1 for i in rm.items if i.status == "active") == 1  # exactly one active
