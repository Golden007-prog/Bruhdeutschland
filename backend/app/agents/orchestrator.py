"""Orchestrator / Planner (agent-workflows.md §3).

Interprets the profile, builds the shared read-only ``PlanContext`` (including a coarse program
shortlist from one ProgramSearch call), and produces an ``ExecutionPlan`` that fans out all six
specialists concurrently. It emits NO official facts — only a plan.
"""

from __future__ import annotations

from app.llm.client import LLMProvider
from app.llm.prompts import ORCHESTRATOR_SYSTEM, profile_summary
from app.llm.schemas import (
    SPECIALISTS,
    ExecutionPlan,
    PlanContext,
    PlanDraft,
    Profile,
)
from app.services.program_search import ProgramSearch


class Orchestrator:
    async def plan(
        self, profile: Profile, *, llm: LLMProvider, search: ProgramSearch
    ) -> ExecutionPlan:
        draft: PlanDraft = await llm.structured(
            system=ORCHESTRATOR_SYSTEM,
            prompt=profile_summary(profile),
            schema=PlanDraft,
        )
        field = profile.field or draft.field
        degree_level = profile.degree_level or draft.degree_level
        target_intake = profile.target_intake or draft.target_intake
        goals = profile.goals or draft.goals

        shortlist = search.shortlist(field=field, degree_level=degree_level)
        context = PlanContext(
            goals=goals,
            degree_level=degree_level,
            field=field,
            target_intake=target_intake,
            program_shortlist=shortlist,
        )
        return ExecutionPlan(context=context, fan_out=list(SPECIALISTS))
