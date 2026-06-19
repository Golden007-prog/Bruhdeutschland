"""Program catalog: University, Program (with pgvector embedding), Requirement, Deadline.

Official values here (requirements, deadlines, scraped core facts) MUST link a ProvenanceRecord;
otherwise ``needs_verification`` is set (CLAUDE.md §2). The ``Program.embedding`` column is
``vector(1024)`` to match bge-m3 (ADR-0003).
"""

from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Any

from pgvector.sqlalchemy import Vector  # type: ignore[import-untyped]
from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin, UUIDMixin
from .enums import DeadlineKind, RequirementKind, TeachingLanguage

EMBEDDING_DIM = 1024  # bge-m3 (ADR-0003); asserted against EmbeddingProvider.dimension at startup


class University(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "university"

    name: Mapped[str] = mapped_column(String(256), index=True)
    city: Mapped[str | None] = mapped_column(String(128), nullable=True)
    state_bundesland: Mapped[str | None] = mapped_column(String(128), nullable=True)
    is_public: Mapped[bool] = mapped_column(Boolean, default=True)
    website_url: Mapped[str | None] = mapped_column(String(512), nullable=True)

    programs: Mapped[list[Program]] = relationship(back_populates="university")


class Program(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "program"

    university_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("university.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str] = mapped_column(String(512))
    degree: Mapped[str | None] = mapped_column(String(32), nullable=True)  # MSc | MA | MEng ...
    teaching_language: Mapped[TeachingLanguage | None] = mapped_column(
        SAEnum(TeachingLanguage, native_enum=False), nullable=True
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    daad_program_id: Mapped[str | None] = mapped_column(String(64), index=True, nullable=True)

    # Semantic-search vector (bge-m3). Nullable until the embedding job runs.
    embedding: Mapped[list[float] | None] = mapped_column(Vector(EMBEDDING_DIM), nullable=True)

    # Grounding for the scraped core facts on this row.
    provenance_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("provenance_record.id", ondelete="SET NULL"), nullable=True
    )
    needs_verification: Mapped[bool] = mapped_column(Boolean, default=False)
    last_seen_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    university: Mapped[University] = relationship(back_populates="programs")
    requirements: Mapped[list[ProgramRequirement]] = relationship(
        back_populates="program", cascade="all, delete-orphan"
    )
    deadlines: Mapped[list[DeadlineEvent]] = relationship(
        back_populates="program", cascade="all, delete-orphan"
    )


class ProgramRequirement(UUIDMixin, Base):
    __tablename__ = "program_requirement"

    program_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("program.id", ondelete="CASCADE"), index=True
    )
    kind: Mapped[RequirementKind] = mapped_column(SAEnum(RequirementKind, native_enum=False))
    value: Mapped[dict[str, Any]] = mapped_column(JSONB)  # OfficialValue payload (value + meta)
    provenance_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("provenance_record.id", ondelete="SET NULL"), nullable=True
    )
    needs_verification: Mapped[bool] = mapped_column(Boolean, default=False)

    program: Mapped[Program] = relationship(back_populates="requirements")


class DeadlineEvent(UUIDMixin, Base):
    __tablename__ = "deadline_event"

    program_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("program.id", ondelete="CASCADE"), index=True
    )
    intake: Mapped[str] = mapped_column(String(32))  # e.g. "winter_2027"
    kind: Mapped[DeadlineKind] = mapped_column(SAEnum(DeadlineKind, native_enum=False))
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    provenance_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("provenance_record.id", ondelete="SET NULL"), nullable=True
    )
    needs_verification: Mapped[bool] = mapped_column(Boolean, default=False)

    program: Mapped[Program] = relationship(back_populates="deadlines")
