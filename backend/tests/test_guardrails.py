"""Tests for the guardrail layer (agent-workflows.md §10)."""

from __future__ import annotations

from datetime import date, datetime, timezone

from app.core.config import DISCLAIMER
from app.core.logging import redact_pii
from app.llm.guardrails import guard_roadmap, run_guardrails
from app.llm.schemas import (
    AgentNameEnum,
    AgentOutput,
    OfficialValue,
    Roadmap,
    RoadmapItem,
    RoadmapItemDraft,
)
from app.models.enums import FeatureCategory


def test_finance_agent_output_gets_disclaimer() -> None:
    out = AgentOutput(agent=AgentNameEnum.FINANCE_LOGISTICS, items=[])
    run_guardrails(out)
    assert DISCLAIMER in out.disclaimers


def test_non_advisory_agent_has_no_forced_disclaimer() -> None:
    out = AgentOutput(agent=AgentNameEnum.CAMPUS_LIFE, items=[])
    run_guardrails(out)
    assert out.disclaimers == []


def test_ungrounded_deadline_coerces_needs_verification() -> None:
    item = RoadmapItemDraft(
        category=FeatureCategory.VISA,
        title="Book visa appointment",
        deadline=OfficialValue[date].unverified(),
    )
    out = AgentOutput(agent=AgentNameEnum.VISA_RELOCATION, items=[item])
    run_guardrails(out)
    assert out.items[0].needs_verification is True


def test_guard_roadmap_adds_global_disclaimer_for_advisory_items() -> None:
    item = RoadmapItem(
        category=FeatureCategory.FINANCE,
        title="Open Sperrkonto",
        composite_key="k",
        needs_verification=True,
    )
    rm = Roadmap(profile_id=item.id, items=[item], generated_at=datetime.now(timezone.utc))
    guard_roadmap(rm)
    assert DISCLAIMER in rm.global_disclaimers


def test_redact_pii_masks_email_and_phone() -> None:
    masked = redact_pii("Reach me at jane.doe@example.com or +49 151 23456789")
    assert "jane.doe@example.com" not in masked
    assert "23456789" not in masked
    assert "[redacted-email]" in masked
