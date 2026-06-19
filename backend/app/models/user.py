"""User, Profile, ParsedProfileFacts. PII lives here — encrypted at rest, never logged."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum as SAEnum,
    Float,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin, UUIDMixin
from .enums import ProfileSourceType


class User(UUIDMixin, TimestampMixin, Base):
    """An applicant. Authenticated via Auth0 (ADR-0001) — no password is ever stored."""

    __tablename__ = "user_account"  # avoid reserved word "user"

    auth0_sub: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(320), index=True)
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )  # GDPR soft-delete; purge job hard-deletes later

    profiles: Mapped[list[Profile]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class Profile(UUIDMixin, TimestampMixin, Base):
    """A versioned ingestion of the user's resume / LinkedIn / intake form."""

    __tablename__ = "profile"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("user_account.id", ondelete="CASCADE"), index=True
    )
    source_type: Mapped[ProfileSourceType] = mapped_column(
        SAEnum(ProfileSourceType, native_enum=False)
    )
    raw_blob_ref: Mapped[str | None] = mapped_column(String(512), nullable=True)  # encrypted S3 key
    version: Mapped[int] = mapped_column(Integer, default=1)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    user: Mapped[User] = relationship(back_populates="profiles")
    facts: Mapped[ParsedProfileFacts | None] = relationship(
        back_populates="profile", uselist=False, cascade="all, delete-orphan"
    )


class ParsedProfileFacts(UUIDMixin, Base):
    """Normalized facts extracted from a Profile. GPA/ECTS are DETERMINISTIC (method recorded)."""

    __tablename__ = "parsed_profile_facts"

    profile_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("profile.id", ondelete="CASCADE"), unique=True, index=True
    )
    education: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    experience: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    skills: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)

    german_gpa: Mapped[float | None] = mapped_column(Float, nullable=True)  # GPAConverter output
    gpa_method: Mapped[str | None] = mapped_column(String(64), nullable=True)  # e.g. "modified_bavarian"
    total_ects: Mapped[int | None] = mapped_column(Integer, nullable=True)  # ECTSCalculator output
    needs_verification: Mapped[bool] = mapped_column(Boolean, default=False)

    profile: Mapped[Profile] = relationship(back_populates="facts")
