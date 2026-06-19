"""Deterministic ECTS computation (CLAUDE.md golden rule 4).

Per the ECTS Users' Guide (European Commission): **60 credits correspond to one full-time
academic year**, and one credit corresponds to **25-30 hours** of total student workload
(1500-1800 h per year). This module sums and normalizes ECTS credits with pure arithmetic — no
model inference, no live data. The Profile & Assessment agent surfaces the total as a deterministic
value (``total_ects``; see agent-workflows.md).

Conversion of non-ECTS local credits (e.g. US semester hours) uses a caller-supplied
``conversion_factor`` rather than a hardcoded country table, so no official equivalence is
fabricated (CLAUDE.md golden rule 2).

Source: ECTS Users' Guide 2015, European Commission.
"""

from __future__ import annotations

from collections.abc import Sequence
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

#: ECTS credits in one full-time academic year (ECTS Users' Guide).
ECTS_PER_YEAR = 60

#: Documented workload band: hours of student work per ECTS credit.
HOURS_PER_ECTS_MIN = 25
HOURS_PER_ECTS_MAX = 30


class CourseCredit(BaseModel):
    """One transcript line item, in the source credit unit (ECTS unless scaled by the caller)."""

    model_config = ConfigDict(frozen=True)

    credits: float = Field(ge=0)
    name: str | None = None
    passed: bool = True


class EctsSummary(BaseModel):
    """Aggregated, deterministic ECTS totals for a transcript."""

    model_config = ConfigDict(frozen=True)

    total_ects: float
    course_count: int
    full_time_years: float  # total_ects / 60
    conversion_factor: float = 1.0
    method: Literal["ects_sum", "ects_scaled_sum"] = "ects_sum"


def sum_ects(
    courses: Sequence[CourseCredit],
    *,
    conversion_factor: float = 1.0,
    only_passed: bool = True,
) -> EctsSummary:
    """Sum the ECTS credits of ``courses``.

    ``only_passed`` (default) counts only courses with ``passed=True``. ``conversion_factor``
    scales each course's credits (e.g. local credits -> ECTS); it must be positive and is recorded
    on the result. ``full_time_years`` is the total divided by :data:`ECTS_PER_YEAR`.
    """
    if conversion_factor <= 0:
        raise ValueError("conversion_factor must be positive")

    counted = [c for c in courses if c.passed or not only_passed]
    total = sum(c.credits for c in counted) * conversion_factor

    return EctsSummary(
        total_ects=total,
        course_count=len(counted),
        full_time_years=total / ECTS_PER_YEAR,
        conversion_factor=conversion_factor,
        method="ects_scaled_sum" if conversion_factor != 1.0 else "ects_sum",
    )


def ects_from_workload(hours: float, *, hours_per_ects: float = HOURS_PER_ECTS_MAX) -> float:
    """Convert a student workload in ``hours`` to ECTS credits.

    Defaults to the upper bound of the documented band (30 h/credit). Use 25 for the lower bound.
    """
    if hours_per_ects <= 0:
        raise ValueError("hours_per_ects must be positive")
    if hours < 0:
        raise ValueError("hours must be non-negative")
    return hours / hours_per_ects
