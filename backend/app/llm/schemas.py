"""Shared, Pydantic-validated contracts for the agent system (agent-workflows.md §2, §6).

Two grounding primitives anchor the anti-hallucination design:

* :class:`OfficialValue` — any fact sourced from official German sources. A non-null value **must**
  carry provenance; a null value is automatically flagged ``needs_verification`` (CLAUDE.md §2).
* :class:`DeterministicValue` — a number produced by a tested service (GPA, ECTS, cost, deadlines),
  carrying the method used. The model may explain it but never produce it.

No free-form text crosses an agent boundary: every agent returns one of these models.
"""

from __future__ import annotations

from datetime import date, datetime
from typing import Generic, Literal, TypeVar
from uuid import UUID, uuid4

from pydantic import BaseModel, Field, model_validator

from app.models.enums import FeatureCategory, ProfileSourceType
from app.services.ects_calculator import CourseCredit
from app.services.gpa_converter import GradeScale

T = TypeVar("T")

RoadmapStatusLiteral = Literal["locked", "active", "done"]
SeverityLiteral = Literal["low", "medium", "high"]


# --- Grounding primitives -----------------------------------------------------


class Provenance(BaseModel):
    """Where one official value came from (CLAUDE.md §2 rule 3)."""

    source_name: str
    source_url: str
    retrieved_at: datetime


class OfficialValue(BaseModel, Generic[T]):
    """A value sourced from official German sources, or one flagged for verification."""

    value: T | None = None
    provenance: Provenance | None = None
    needs_verification: bool = False

    @model_validator(mode="after")
    def _enforce_grounding(self) -> OfficialValue[T]:
        if self.value is not None and self.provenance is None:
            raise ValueError("official value without provenance is forbidden")
        if self.value is None:
            self.needs_verification = True
        return self

    @classmethod
    def grounded(cls, value: T, provenance: Provenance) -> OfficialValue[T]:
        return cls(value=value, provenance=provenance, needs_verification=False)

    @classmethod
    def unverified(cls) -> OfficialValue[T]:
        return cls(value=None, provenance=None, needs_verification=True)


class DeterministicValue(BaseModel, Generic[T]):
    """A number from a tested deterministic service; ``method`` records how it was computed."""

    value: T
    method: str


# --- Profile (typed output of ingestion) -------------------------------------


class EducationItem(BaseModel):
    institution: str
    degree: str | None = None
    field: str | None = None
    year: int | None = None


class Profile(BaseModel):
    """The normalized, typed profile produced by ingestion. PII is minimized here."""

    id: UUID = Field(default_factory=uuid4)
    source_type: ProfileSourceType = ProfileSourceType.INTAKE
    full_name: str | None = None
    education: list[EducationItem] = []
    experience: list[str] = []
    skills: list[str] = []

    # Inputs for the deterministic services (Agent 1).
    raw_gpa: float | None = None
    gpa_scale: GradeScale | None = None
    courses: list[CourseCredit] = []

    # Goals / targeting (drive the orchestrator's PlanContext).
    goals: list[str] = []
    field: str | None = None
    degree_level: str | None = None
    target_intake: str | None = None


# --- Orchestration ------------------------------------------------------------


class AgentNameEnum:
    """String constants for agents (kept simple for serialization)."""

    ORCHESTRATOR = "orchestrator"
    PROFILE_ASSESSMENT = "profile_assessment"
    DOCUMENT_PREP = "document_prep"
    LANGUAGE_TEST = "language_test"
    FINANCE_LOGISTICS = "finance_logistics"
    VISA_RELOCATION = "visa_relocation"
    CAMPUS_LIFE = "campus_life"
    ROADMAP_COMPOSER = "roadmap_composer"


SPECIALISTS: tuple[str, ...] = (
    AgentNameEnum.PROFILE_ASSESSMENT,
    AgentNameEnum.DOCUMENT_PREP,
    AgentNameEnum.LANGUAGE_TEST,
    AgentNameEnum.FINANCE_LOGISTICS,
    AgentNameEnum.VISA_RELOCATION,
    AgentNameEnum.CAMPUS_LIFE,
)


class ProgramRef(BaseModel):
    program_id: str
    title: str
    university: str | None = None


class PlanContext(BaseModel):
    """Shared, read-only context handed to every specialist (enables fan-out)."""

    goals: list[str] = []
    degree_level: str = "MSc"
    field: str = "General"
    target_intake: str = "Winter 2027"
    program_shortlist: list[ProgramRef] = []


class ExecutionPlan(BaseModel):
    context: PlanContext
    fan_out: list[str] = list(SPECIALISTS)


class AgentInput(BaseModel):
    profile: Profile
    plan_context: PlanContext


# --- Agent outputs ------------------------------------------------------------


class RoadmapItemDraft(BaseModel):
    """What a specialist contributes to the roadmap, before fan-in/dedupe."""

    category: FeatureCategory
    title: str
    body: str = ""
    program_id: str | None = None
    status: RoadmapStatusLiteral = "locked"
    depends_on: list[str] = []  # composite keys of prerequisite drafts
    deadline: OfficialValue[date] | None = None
    provenance: list[Provenance] = []
    needs_verification: bool = False


class AgentOutput(BaseModel):
    agent: str
    items: list[RoadmapItemDraft] = []
    notes: list[str] = []
    disclaimers: list[str] = []


class SkillGap(BaseModel):
    skill: str
    severity: SeverityLiteral
    rationale: str = ""  # LLM-reasoned, non-official


class ProgramMatch(BaseModel):
    program: ProgramRef
    fit_score: float = Field(ge=0.0, le=1.0)
    reason: str = ""  # generated
    grounded: bool = False


class ProfileAssessmentOutput(AgentOutput):
    german_gpa: DeterministicValue[float] | None = None
    total_ects: DeterministicValue[int] | None = None
    matched_programs: list[ProgramMatch] = []
    skill_gaps: list[SkillGap] = []


# --- Canonical roadmap (Roadmap Composer output) -----------------------------


class RoadmapItem(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    category: FeatureCategory
    title: str
    body: str = ""
    program_id: str | None = None
    status: RoadmapStatusLiteral = "locked"
    depends_on: list[UUID] = []
    deadline: OfficialValue[date] | None = None
    provenance: list[Provenance] = []
    needs_verification: bool = False
    composite_key: str


class Roadmap(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    profile_id: UUID
    items: list[RoadmapItem] = []
    generated_at: datetime
    global_disclaimers: list[str] = []


# --- LLM-only structured payloads (what the model returns via tool-use) -------


class SkillGapList(BaseModel):
    """Structured payload the Profile & Assessment LLM call must return."""

    skill_gaps: list[SkillGap] = []


class PlanDraft(BaseModel):
    """Structured payload the Orchestrator LLM call returns to seed the PlanContext."""

    degree_level: str = "MSc"
    field: str = "General"
    target_intake: str = "Winter 2027"
    goals: list[str] = []
