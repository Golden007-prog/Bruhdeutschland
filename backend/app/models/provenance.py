"""Provenance + scrape sources — the backbone of grounding (CLAUDE.md §2 rule 3)."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum as SAEnum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin, UUIDMixin
from .enums import SourceType


class ScrapeSource(UUIDMixin, TimestampMixin, Base):
    """A data origin (DAAD, Uni-Assist, a university portal, a government mission)."""

    __tablename__ = "scrape_source"

    name: Mapped[str] = mapped_column(String(128), unique=True)
    source_type: Mapped[SourceType] = mapped_column(SAEnum(SourceType, native_enum=False))
    base_url: Mapped[str] = mapped_column(String(512))
    robots_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    rate_limit_per_min: Mapped[int] = mapped_column(Integer, default=30)
    last_crawled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)

    records: Mapped[list[ProvenanceRecord]] = relationship(back_populates="source")


class ProvenanceRecord(UUIDMixin, Base):
    """Immutable proof of where one official value came from. Linked by every grounded row.

    ``content_hash`` drives incremental refresh / change detection (data-pipeline.md).
    """

    __tablename__ = "provenance_record"

    source_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("scrape_source.id", ondelete="CASCADE"))
    source_name: Mapped[str] = mapped_column(String(128))
    source_url: Mapped[str] = mapped_column(String(1024))
    retrieved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    content_hash: Mapped[str] = mapped_column(String(64))  # sha256 hex
    excerpt: Mapped[str | None] = mapped_column(Text, nullable=True)

    source: Mapped[ScrapeSource] = relationship(back_populates="records")
