"""Tests for the grounding primitives (agent-workflows.md §2 / CLAUDE.md §2)."""

from __future__ import annotations

from datetime import datetime

import pytest

from app.llm.schemas import DeterministicValue, OfficialValue, Provenance

PROV = Provenance(
    source_name="DAAD", source_url="https://www.daad.de", retrieved_at=datetime(2026, 1, 1)
)


def test_grounded_official_value_is_not_flagged() -> None:
    ov = OfficialValue.grounded(11904, PROV)
    assert ov.value == 11904
    assert ov.needs_verification is False


def test_official_value_without_provenance_is_forbidden() -> None:
    with pytest.raises(ValueError):
        OfficialValue(value=11904)  # no provenance


def test_null_official_value_is_auto_flagged() -> None:
    ov = OfficialValue[int].unverified()
    assert ov.value is None
    assert ov.needs_verification is True


def test_deterministic_value_records_method() -> None:
    dv = DeterministicValue[float](value=1.7, method="modified_bavarian")
    assert dv.value == 1.7
    assert dv.method == "modified_bavarian"
