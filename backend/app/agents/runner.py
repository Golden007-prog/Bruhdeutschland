"""End-to-end roadmap generation: plan → concurrent fan-out → guardrails → compose → guard.

Exposes an async generator (``generate_events``) that emits progress as each specialist completes —
the API streams these over SSE — and a convenience ``generate_roadmap`` that returns just the final
Roadmap. The fan-out is genuinely concurrent (``asyncio``); wall-clock ≈ the slowest specialist.
"""

from __future__ import annotations

import asyncio
from collections.abc import AsyncIterator, Coroutine
from datetime import datetime
from typing import Any

from pydantic import BaseModel

from app.agents.orchestrator import Orchestrator
from app.agents.profile_assessment import ProfileAssessmentAgent
from app.agents.roadmap_composer import RoadmapComposer
from app.agents.specialists import SPECIALIST_RUNNERS
from app.llm.client import LLMProvider
from app.llm.guardrails import guard_roadmap, run_guardrails
from app.llm.schemas import (
    AgentInput,
    AgentNameEnum,
    AgentOutput,
    Profile,
    Roadmap,
)
from app.services.program_search import ProgramSearch, StubProgramSearch


class ProgressEvent(BaseModel):
    phase: str  # plan | fan_out | agent_done | compose | done
    detail: str | None = None
    agent: str | None = None


async def generate_events(
    profile: Profile,
    *,
    llm: LLMProvider,
    now: datetime,
    search: ProgramSearch | None = None,
    composer: RoadmapComposer | None = None,
) -> AsyncIterator[ProgressEvent | Roadmap]:
    search = search or StubProgramSearch()
    composer = composer or RoadmapComposer()

    yield ProgressEvent(phase="plan", detail="Building execution plan")
    plan = await Orchestrator().plan(profile, llm=llm, search=search)
    agent_input = AgentInput(profile=profile, plan_context=plan.context)

    yield ProgressEvent(phase="fan_out", detail=f"Launching {len(plan.fan_out)} specialists")

    coros: list[Coroutine[Any, Any, AgentOutput]] = []
    for name in plan.fan_out:
        if name == AgentNameEnum.PROFILE_ASSESSMENT:
            coros.append(ProfileAssessmentAgent().run(agent_input, llm=llm))
        elif name in SPECIALIST_RUNNERS:
            coros.append(SPECIALIST_RUNNERS[name](agent_input))

    tasks = [asyncio.create_task(c) for c in coros]
    outputs: list[AgentOutput] = []
    for fut in asyncio.as_completed(tasks):
        out = run_guardrails(await fut)
        outputs.append(out)
        yield ProgressEvent(phase="agent_done", agent=out.agent)

    yield ProgressEvent(phase="compose", detail="Merging and ordering the roadmap")
    roadmap = guard_roadmap(composer.compose(profile.id, outputs, generated_at=now))

    yield ProgressEvent(phase="done", detail=f"{len(roadmap.items)} steps")
    yield roadmap


async def generate_roadmap(
    profile: Profile,
    *,
    llm: LLMProvider,
    now: datetime,
    search: ProgramSearch | None = None,
    composer: RoadmapComposer | None = None,
) -> Roadmap:
    """Drain the event stream and return the final Roadmap."""
    result: Roadmap | None = None
    async for event in generate_events(profile, llm=llm, now=now, search=search, composer=composer):
        if isinstance(event, Roadmap):
            result = event
    assert result is not None, "generate_events must yield a Roadmap"
    return result
