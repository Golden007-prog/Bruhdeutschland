"""Tests for the LLM provider doubles (no network — CLAUDE.md test rule)."""

from __future__ import annotations

import asyncio

import pytest

from app.llm.client import LLMSchemaError, ScriptedLLMProvider, StubLLMProvider
from app.llm.schemas import PlanDraft, SkillGap, SkillGapList


def test_scripted_provider_returns_response_matching_schema() -> None:
    llm = ScriptedLLMProvider(
        [PlanDraft(field="X"), SkillGapList(skill_gaps=[SkillGap(skill="g", severity="low")])]
    )
    pd = asyncio.run(llm.structured(system="s", prompt="p", schema=PlanDraft))
    assert pd.field == "X"
    sg = asyncio.run(llm.structured(system="s", prompt="p", schema=SkillGapList))
    assert sg.skill_gaps[0].skill == "g"


def test_stub_provider_returns_schema_defaults() -> None:
    pd = asyncio.run(StubLLMProvider().structured(system="s", prompt="p", schema=PlanDraft))
    assert pd.degree_level == "MSc"


def test_scripted_provider_raises_when_no_response_queued() -> None:
    with pytest.raises(LLMSchemaError):
        asyncio.run(ScriptedLLMProvider([]).structured(system="s", prompt="p", schema=PlanDraft))
