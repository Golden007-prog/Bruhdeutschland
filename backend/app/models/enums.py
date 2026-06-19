"""Enumerations + the Application state machine (transition rules enforced in code)."""

from __future__ import annotations

import enum


class ProfileSourceType(enum.StrEnum):
    RESUME = "resume"
    LINKEDIN = "linkedin"
    INTAKE = "intake"


class TeachingLanguage(enum.StrEnum):
    EN = "en"
    DE = "de"
    MIXED = "mixed"


class RequirementKind(enum.StrEnum):
    GPA = "gpa"
    LANGUAGE = "language"
    GRE = "gre"
    GMAT = "gmat"
    PREREQUISITE = "prerequisite"
    APS = "aps"


class DeadlineKind(enum.StrEnum):
    APPLICATION = "application"
    UNI_ASSIST = "uni_assist"
    VPD = "vpd"
    ENROLLMENT = "enrollment"


class SourceType(enum.StrEnum):
    DAAD = "daad"
    UNI_ASSIST = "uni_assist"
    UNIVERSITY_PORTAL = "university_portal"
    GOV_MISSION = "gov_mission"
    OTHER = "other"


class DocType(enum.StrEnum):
    SOP = "sop"
    EUROPASS_CV = "europass_cv"
    LOR = "lor"
    TRANSLATION = "translation"
    OTHER = "other"


class FeatureCategory(enum.StrEnum):
    PROFILE = "profile"
    DOCUMENTS = "documents"
    LANGUAGE = "language"
    FINANCE = "finance"
    VISA = "visa"
    CAMPUS = "campus"


class RoadmapStatus(enum.StrEnum):
    LOCKED = "locked"
    ACTIVE = "active"
    DONE = "done"


class StepStatus(enum.StrEnum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    BLOCKED = "blocked"
    DONE = "done"
    SKIPPED = "skipped"


# --- Application state machine (data-model.md §3) -----------------------------


class ApplicationState(enum.StrEnum):
    DRAFT = "draft"
    IN_PREPARATION = "in_preparation"
    DOCUMENTS_READY = "documents_ready"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    INTERVIEW = "interview"
    ADMITTED = "admitted"
    WAITLISTED = "waitlisted"
    REJECTED = "rejected"
    OFFER_ACCEPTED = "offer_accepted"
    OFFER_DECLINED = "offer_declined"
    ENROLLED = "enrolled"
    WITHDRAWN = "withdrawn"


_S = ApplicationState

#: Allowed transitions. Anything not listed is rejected (see :func:`assert_transition`).
ALLOWED_TRANSITIONS: dict[ApplicationState, frozenset[ApplicationState]] = {
    _S.DRAFT: frozenset({_S.IN_PREPARATION, _S.WITHDRAWN}),
    _S.IN_PREPARATION: frozenset({_S.DOCUMENTS_READY, _S.WITHDRAWN}),
    _S.DOCUMENTS_READY: frozenset({_S.SUBMITTED, _S.WITHDRAWN}),
    _S.SUBMITTED: frozenset({_S.UNDER_REVIEW, _S.WITHDRAWN}),
    _S.UNDER_REVIEW: frozenset({_S.INTERVIEW, _S.ADMITTED, _S.WAITLISTED, _S.REJECTED}),
    _S.INTERVIEW: frozenset({_S.ADMITTED, _S.REJECTED}),
    _S.WAITLISTED: frozenset({_S.ADMITTED, _S.REJECTED}),
    _S.ADMITTED: frozenset({_S.OFFER_ACCEPTED, _S.OFFER_DECLINED}),
    _S.OFFER_ACCEPTED: frozenset({_S.ENROLLED}),
    # Terminal states:
    _S.REJECTED: frozenset(),
    _S.OFFER_DECLINED: frozenset(),
    _S.ENROLLED: frozenset(),
    _S.WITHDRAWN: frozenset(),
}

TERMINAL_STATES: frozenset[ApplicationState] = frozenset(
    s for s, nxt in ALLOWED_TRANSITIONS.items() if not nxt
)


class InvalidTransition(ValueError):
    """Raised when an Application is moved along a disallowed edge."""


def can_transition(src: ApplicationState, dst: ApplicationState) -> bool:
    """True iff ``src -> dst`` is an allowed edge."""
    return dst in ALLOWED_TRANSITIONS.get(src, frozenset())


def assert_transition(src: ApplicationState, dst: ApplicationState) -> None:
    """Raise :class:`InvalidTransition` if ``src -> dst`` is not allowed."""
    if not can_transition(src, dst):
        raise InvalidTransition(f"{src} -> {dst} is not a permitted application transition")
