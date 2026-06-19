"""Typed specialist stubs for agents 2-6 (agent-workflows.md §4).

Phase 4 ships Agent 1 fully; the rest are typed stubs that produce realistic *generated* roadmap
drafts and exercise the grounding contract: official facts they don't yet retrieve (deadlines,
amounts) are emitted as ``needs_verification`` rather than guessed, and finance/visa carry the
disclaimer. They are deterministic — no LLM call — so they're cheap and fully testable.
"""

from __future__ import annotations

from collections.abc import Callable, Coroutine
from datetime import date
from typing import Any

from app.core.config import DISCLAIMER
from app.llm.schemas import (
    AgentInput,
    AgentNameEnum,
    AgentOutput,
    OfficialValue,
    RoadmapItemDraft,
)
from app.models.enums import FeatureCategory

SpecialistRunner = Callable[[AgentInput], Coroutine[Any, Any, AgentOutput]]


async def _document_prep(inp: AgentInput) -> AgentOutput:
    return AgentOutput(
        agent=AgentNameEnum.DOCUMENT_PREP,
        items=[
            RoadmapItemDraft(
                category=FeatureCategory.DOCUMENTS,
                title="Draft Statement of Purpose",
                body="Generated draft tailored to your shortlisted programs. Review before sending.",
                status="locked",
            ),
            RoadmapItemDraft(
                category=FeatureCategory.DOCUMENTS,
                title="Complete Uni-Assist application",
                body="Procedural steps; the submission deadline must be verified per program.",
                status="locked",
                deadline=OfficialValue[date].unverified(),
                needs_verification=True,
            ),
        ],
    )


async def _language_test(inp: AgentInput) -> AgentOutput:
    return AgentOutput(
        agent=AgentNameEnum.LANGUAGE_TEST,
        items=[
            RoadmapItemDraft(
                category=FeatureCategory.LANGUAGE,
                title="Reach German B1 and book TestDaF",
                body="Suggested study plan (generated). Confirm required score on the program page.",
                status="locked",
            ),
        ],
    )


async def _finance_logistics(inp: AgentInput) -> AgentOutput:
    return AgentOutput(
        agent=AgentNameEnum.FINANCE_LOGISTICS,
        items=[
            RoadmapItemDraft(
                category=FeatureCategory.FINANCE,
                title="Open a Sperrkonto (blocked account)",
                body="The required blocked amount is an official figure and must be verified.",
                status="locked",
                needs_verification=True,
            ),
            RoadmapItemDraft(
                category=FeatureCategory.FINANCE,
                title="Estimate monthly cost of living",
                body="Cost math runs in the deterministic CostOfLiving service (not the model).",
                status="locked",
            ),
        ],
        disclaimers=[DISCLAIMER],
    )


async def _visa_relocation(inp: AgentInput) -> AgentOutput:
    return AgentOutput(
        agent=AgentNameEnum.VISA_RELOCATION,
        items=[
            RoadmapItemDraft(
                category=FeatureCategory.VISA,
                title="Prepare student visa documents",
                body="Checklist and APS requirements must be verified with the German mission.",
                status="locked",
                deadline=OfficialValue[date].unverified(),
                needs_verification=True,
            ),
        ],
        disclaimers=[DISCLAIMER],
    )


async def _campus_life(inp: AgentInput) -> AgentOutput:
    return AgentOutput(
        agent=AgentNameEnum.CAMPUS_LIFE,
        items=[
            RoadmapItemDraft(
                category=FeatureCategory.CAMPUS,
                title="Get the Deutschlandticket & plan arrival",
                body="Pre-departure tips (generated). Confirm current ticket price/coverage.",
                status="locked",
            ),
        ],
    )


SPECIALIST_RUNNERS: dict[str, SpecialistRunner] = {
    AgentNameEnum.DOCUMENT_PREP: _document_prep,
    AgentNameEnum.LANGUAGE_TEST: _language_test,
    AgentNameEnum.FINANCE_LOGISTICS: _finance_logistics,
    AgentNameEnum.VISA_RELOCATION: _visa_relocation,
    AgentNameEnum.CAMPUS_LIFE: _campus_life,
}
