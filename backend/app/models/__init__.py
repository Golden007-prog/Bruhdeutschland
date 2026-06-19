"""SQLAlchemy 2.0 models for DeutschPrep (data-model.md).

Importing this package registers every model on ``Base.metadata`` (used by Alembic + startup
checks). Keep this import list complete so ``Base.metadata`` always reflects the full schema.
"""

from .application import Application, ApplicationStep, SavedUniversity
from .base import Base, TimestampMixin, UUIDMixin
from .catalog import EMBEDDING_DIM, DeadlineEvent, Program, ProgramRequirement, University
from .document import Document
from .enums import (
    ALLOWED_TRANSITIONS,
    TERMINAL_STATES,
    ApplicationState,
    DeadlineKind,
    DocType,
    FeatureCategory,
    InvalidTransition,
    ProfileSourceType,
    RequirementKind,
    RoadmapStatus,
    SourceType,
    StepStatus,
    TeachingLanguage,
    assert_transition,
    can_transition,
)
from .provenance import ProvenanceRecord, ScrapeSource
from .roadmap import Roadmap, RoadmapItem
from .user import ParsedProfileFacts, Profile, User

__all__ = [
    "Base",
    "UUIDMixin",
    "TimestampMixin",
    # users / profiles
    "User",
    "Profile",
    "ParsedProfileFacts",
    # catalog
    "University",
    "Program",
    "ProgramRequirement",
    "DeadlineEvent",
    "EMBEDDING_DIM",
    # applications
    "Application",
    "ApplicationStep",
    "SavedUniversity",
    # roadmap / documents
    "Roadmap",
    "RoadmapItem",
    "Document",
    # provenance
    "ScrapeSource",
    "ProvenanceRecord",
    # enums + state machine
    "ApplicationState",
    "ALLOWED_TRANSITIONS",
    "TERMINAL_STATES",
    "InvalidTransition",
    "assert_transition",
    "can_transition",
    "StepStatus",
    "DocType",
    "FeatureCategory",
    "RoadmapStatus",
    "ProfileSourceType",
    "TeachingLanguage",
    "RequirementKind",
    "DeadlineKind",
    "SourceType",
]
