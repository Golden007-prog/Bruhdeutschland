"""Tests for the Application state machine (data-model.md §3 / models/enums.py)."""

from __future__ import annotations

import pytest

from app.models.enums import (
    ALLOWED_TRANSITIONS,
    TERMINAL_STATES,
    ApplicationState,
    InvalidTransition,
    assert_transition,
    can_transition,
)

S = ApplicationState


def test_happy_path_to_enrolled() -> None:
    path = [
        S.DRAFT,
        S.IN_PREPARATION,
        S.DOCUMENTS_READY,
        S.SUBMITTED,
        S.UNDER_REVIEW,
        S.ADMITTED,
        S.OFFER_ACCEPTED,
        S.ENROLLED,
    ]
    for src, dst in zip(path, path[1:]):
        assert can_transition(src, dst), f"{src}->{dst} should be allowed"


def test_disallowed_transition_raises() -> None:
    with pytest.raises(InvalidTransition):
        assert_transition(S.DRAFT, S.ENROLLED)
    with pytest.raises(InvalidTransition):
        assert_transition(S.SUBMITTED, S.ADMITTED)  # must go via UNDER_REVIEW


def test_terminal_states_have_no_exits() -> None:
    assert TERMINAL_STATES == {S.REJECTED, S.OFFER_DECLINED, S.ENROLLED, S.WITHDRAWN}
    for term in TERMINAL_STATES:
        assert ALLOWED_TRANSITIONS[term] == frozenset()
        for other in ApplicationState:
            assert not can_transition(term, other)


def test_withdraw_allowed_from_active_pre_decision_states() -> None:
    for src in (S.DRAFT, S.IN_PREPARATION, S.DOCUMENTS_READY, S.SUBMITTED):
        assert can_transition(src, S.WITHDRAWN)


def test_every_state_is_in_the_map() -> None:
    """Guard against adding a state without defining its transitions."""
    assert set(ALLOWED_TRANSITIONS) == set(ApplicationState)
