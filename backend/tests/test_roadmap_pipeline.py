"""End-to-end roadmap generation (LLM mocked) — the golden vertical slice (build Phase 4)."""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone

from app.agents.runner import ProgressEvent, generate_events, generate_roadmap
from app.ingestion.parser import IntakeForm, parse_intake
from app.llm.client import ScriptedLLMProvider
from app.llm.schemas import PlanDraft, Profile, Roadmap, SkillGap, SkillGapList

NOW = datetime(2026, 6, 18, tzinfo=timezone.utc)


def _profile() -> Profile:
    return parse_intake(
        IntakeForm(
            field="Computer Science",
            degree_level="MSc",
            raw_gpa=8.2,
            gpa_scale={"best": 10.0, "min_pass": 4.0},
            courses=[{"credits": 30, "passed": True}, {"credits": 30, "passed": True}],
            goals=["Get into a strong CS program"],
        )
    )


def _llm() -> ScriptedLLMProvider:
    return ScriptedLLMProvider(
        [
            PlanDraft(field="Computer Science", degree_level="MSc", target_intake="Winter 2027"),
            SkillGapList(skill_gaps=[SkillGap(skill="German B2", severity="high")]),
        ]
    )


def test_pipeline_produces_a_valid_roadmap_across_all_categories() -> None:
    rm = asyncio.run(generate_roadmap(_profile(), llm=_llm(), now=NOW))
    assert isinstance(rm, Roadmap)
    categories = {i.category.value for i in rm.items}
    assert {"profile", "documents", "language", "finance", "visa", "campus"} <= categories


def test_deterministic_gpa_item_is_marked_done() -> None:
    rm = asyncio.run(generate_roadmap(_profile(), llm=_llm(), now=NOW))
    gpa_items = [i for i in rm.items if "GPA" in i.title]
    assert gpa_items and gpa_items[0].status == "done"
    assert "1.0" not in gpa_items[0].body or "German GPA" in gpa_items[0].body


def test_ungrounded_official_claims_are_flagged_and_disclaimer_present() -> None:
    rm = asyncio.run(generate_roadmap(_profile(), llm=_llm(), now=NOW))
    assert any(i.needs_verification for i in rm.items)
    assert rm.global_disclaimers  # finance/visa items force the disclaimer
    assert rm.generated_at == NOW


def test_exactly_one_active_step() -> None:
    rm = asyncio.run(generate_roadmap(_profile(), llm=_llm(), now=NOW))
    assert sum(1 for i in rm.items if i.status == "active") == 1


def test_stream_emits_progress_then_final_roadmap() -> None:
    async def collect() -> list[object]:
        return [e async for e in generate_events(_profile(), llm=_llm(), now=NOW)]

    events = asyncio.run(collect())
    assert any(isinstance(e, ProgressEvent) and e.phase == "plan" for e in events)
    agent_done = [e for e in events if isinstance(e, ProgressEvent) and e.phase == "agent_done"]
    assert len(agent_done) == 6  # all six specialists fan out
    assert isinstance(events[-1], Roadmap)
