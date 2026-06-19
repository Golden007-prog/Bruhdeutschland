"""Document: generated SOP / Europass CV / LOR / translation. Stored encrypted in S3."""

from __future__ import annotations

import uuid

from sqlalchemy import Boolean, Enum as SAEnum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, TimestampMixin, UUIDMixin
from .enums import DocType


class Document(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "document"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("user_account.id", ondelete="CASCADE"), index=True
    )
    application_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("application.id", ondelete="SET NULL"), nullable=True
    )
    doc_type: Mapped[DocType] = mapped_column(SAEnum(DocType, native_enum=False))
    storage_key: Mapped[str | None] = mapped_column(String(512), nullable=True)  # encrypted S3 key
    version: Mapped[int] = mapped_column(Integer, default=1)
    # True = LLM-authored draft (generated, not an official document).
    is_generated: Mapped[bool] = mapped_column(Boolean, default=True)
