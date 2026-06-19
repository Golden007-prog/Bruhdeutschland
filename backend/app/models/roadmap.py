"""Roadmap + RoadmapItem (canonical output of the Roadmap Composer, agent-workflows.md §6)."""

from __future__ import annotations

import uuid
from datetime import date
from typing import Any

from sqlalchemy import (
    Boolean,
    Date,
    Enum as SAEnum,
    ForeignKey,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin, UUIDMixin
from .enums import FeatureCategory, RoadmapStatus


class Roadmap(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "roadmap"

    profile_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("profile.id", ondelete="CASCADE"), index=True
    )
    global_disclaimers: Mapped[list[Any] | None] = mapped_column(JSONB, nullable=True)

    items: Mapped[list[RoadmapItem]] = relationship(
        back_populates="roadmap", cascade="all, delete-orphan"
    )


class RoadmapItem(UUIDMixin, Base):
    __tablename__ = "roadmap_item"
    # Composite-hash dedupe is enforced per roadmap (agent-workflows.md §6).
    __table_args__ = (UniqueConstraint("roadmap_id", "composite_key", name="uq_roadmap_item_key"),)

    roadmap_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("roadmap.id", ondelete="CASCADE"), index=True
    )
    application_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("application.id", ondelete="SET NULL"), nullable=True
    )
    category: Mapped[FeatureCategory] = mapped_column(SAEnum(FeatureCategory, native_enum=False))
    title: Mapped[str] = mapped_column(String(256))
    body: Mapped[str | None] = mapped_column(Text, nullable=True)
    program_id: Mapped[str | None] = mapped_column(String(64), nullable=True)  # dedupe scope
    status: Mapped[RoadmapStatus] = mapped_column(
        SAEnum(RoadmapStatus, native_enum=False), default=RoadmapStatus.LOCKED
    )
    deadline: Mapped[date | None] = mapped_column(Date, nullable=True)
    composite_key: Mapped[str] = mapped_column(String(64))  # sha256 hex (agent-workflows.md §6)
    needs_verification: Mapped[bool] = mapped_column(Boolean, default=False)

    roadmap: Mapped[Roadmap] = relationship(back_populates="items")
