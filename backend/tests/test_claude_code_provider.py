"""Tests for the Claude Code (personal-subscription) LLM provider.

The provider shells out to the local ``claude`` CLI in print mode; here the subprocess runner is
injected, so no real CLI call or subscription usage happens during tests (CLAUDE.md test rule).
"""

from __future__ import annotations

import asyncio
import json

import pytest

from app.llm.claude_code import ClaudeCodeProvider, extract_json_object
from app.llm.client import LLMSchemaError
from app.llm.schemas import PlanDraft, SkillGapList


def _envelope(result_text: str) -> str:
    """Mimic `claude -p --output-format json` output."""
    return json.dumps(
        {"type": "result", "subtype": "success", "is_error": False, "result": result_text}
    )


def _runner(*results: str, rc: int = 0, err: str = ""):
    queue = list(results)
    calls: list[list[str]] = []

    async def run(args: list[str]) -> tuple[int, str, str]:
        calls.append(args)
        return (rc, queue.pop(0) if queue else "", err)

    run.calls = calls  # type: ignore[attr-defined]
    return run


def test_parses_plain_json_result() -> None:
    runner = _runner(
        _envelope('{"field":"CS","degree_level":"MSc","target_intake":"Winter 2027","goals":[]}')
    )
    provider = ClaudeCodeProvider(model="claude-opus-4-8", runner=runner)
    out = asyncio.run(provider.structured(system="s", prompt="p", schema=PlanDraft))
    assert out.field == "CS"


def test_extracts_json_from_fenced_block() -> None:
    fenced = 'Sure:\n```json\n{"skill_gaps":[{"skill":"German B2","severity":"high","rationale":""}]}\n```'
    provider = ClaudeCodeProvider(model="m", runner=_runner(_envelope(fenced)))
    out = asyncio.run(provider.structured(system="s", prompt="p", schema=SkillGapList))
    assert out.skill_gaps[0].skill == "German B2"


def test_retries_then_succeeds() -> None:
    runner = _runner(
        _envelope("sorry, no json here"),
        _envelope('{"field":"X","degree_level":"MSc","target_intake":"W","goals":[]}'),
    )
    provider = ClaudeCodeProvider(model="m", runner=runner)
    out = asyncio.run(provider.structured(system="s", prompt="p", schema=PlanDraft, max_retries=1))
    assert out.field == "X"


def test_nonzero_exit_raises() -> None:
    provider = ClaudeCodeProvider(model="m", runner=_runner("", rc=1, err="boom"))
    with pytest.raises(LLMSchemaError):
        asyncio.run(provider.structured(system="s", prompt="p", schema=PlanDraft, max_retries=0))


def test_passes_print_and_model_flags() -> None:
    runner = _runner(_envelope('{"field":"X","degree_level":"M","target_intake":"W","goals":[]}'))
    provider = ClaudeCodeProvider(model="claude-opus-4-8", runner=runner)
    asyncio.run(provider.structured(system="sys", prompt="hello", schema=PlanDraft))
    args = runner.calls[0]
    assert "-p" in args
    assert "--output-format" in args and "json" in args
    assert "claude-opus-4-8" in args


def test_extract_json_object_helper() -> None:
    assert extract_json_object('prefix {"a": 1, "b": [2, 3]} suffix') == {"a": 1, "b": [2, 3]}
    with pytest.raises(ValueError):
        extract_json_object("no json at all")
