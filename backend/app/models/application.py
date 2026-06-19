"""Application + ApplicationStep + SavedUniversity. State machine enforced via enums.py."""

from __future__ import annotations

import uuid
from datetime import date

from sqlalchemy import (
    Date,
    Enum as SAEnum,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin, UUIDMixin
from .enums import ApplicationState, StepStatus


class SavedUniversity(UUIDMixin, TimestampMixin, Base):
    """A program the user has bookmarked (shortlist)."""

    __tablename__ = "saved_university"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("user_account.id", ondelete="CASCADE"), index=True
    )
    program_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("program.id", ondelete="CASCADE"))
    note: Mapped[str | None] = mapped_column(Text, nullable=True)


class Application(UUIDMixin, TimestampMixin, Base):
    """A user's application to one program. ``state`` follows the FSM in enums.py."""

    __tablename__ = "application"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("user_account.id", ondelete="CASCADE"), index=True
    )
    program_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("program.id", ondelete="CASCADE"))
    state: Mapped[ApplicationState] = mapped_column(
        SAEnum(ApplicationState, native_enum=False), default=ApplicationState.DRAFT, index=True
    )
    intake: Mapped[str | None] = mapped_column(String(32), nullable=True)

    steps: Mapped[list[ApplicationStep]] = relationship(
        back_populates="application", cascade="all, delete-orphan"
    )


class ApplicationStep(UUIDMixin, Base):
    """One actionable step within an application (ordered)."""

    __tablename__ = "application_step"

    application_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("application.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str] = mapped_column(String(256))
    status: Mapped[StepStatus] = mapped_column(
        SAEnum(StepStatus, native_enum=False), default=StepStatus.PENDING
    )
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    application: Mapped[Application] = relationship(back_populates="steps")
