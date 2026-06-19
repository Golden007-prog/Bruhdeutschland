"""Deterministic GPA conversion via the Modified Bavarian Formula (CLAUDE.md golden rule 4).

German universities and uni-assist convert foreign grades with the KMK-stipulated *Modified
Bavarian Formula*::

    german = 1 + 3 * (Nmax - Nd) / (Nmax - Nmin)

where ``Nmax`` is the best achievable grade in the source system, ``Nmin`` the minimum *passing*
grade, and ``Nd`` the grade actually achieved. The result lies in ``1.0`` (best) .. ``4.0`` (just
passing) and is reported to one decimal place. The formula is direction-agnostic: as long as
``best`` carries the value of the top grade and ``min_pass`` the value of the lowest pass, scales
where a *lower* number is better (e.g. 1 = best, 4 = pass) convert correctly too.

This module performs no model inference and reads no live data — it is pure, tested arithmetic.
The chosen ``method`` is recorded on the result so the Profile & Assessment agent can attach it as
a deterministic value (``german_gpa`` with ``method="modified_bavarian"``; see agent-workflows.md).

Sources (formula + one-decimal rounding): KMK / TU München, Uni-Heidelberg, HS Osnabrück,
fintiba grade calculator.
"""

from __future__ import annotations

import math
from decimal import ROUND_HALF_UP, Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, model_validator

#: German grade band: 1.0 is the best mark, 4.0 the lowest passing mark.
BEST_GERMAN_GRADE = 1.0
PASS_GERMAN_GRADE = 4.0

#: Identifier recorded on every conversion for provenance/auditability.
METHOD: Literal["modified_bavarian"] = "modified_bavarian"

_TOL = 1e-9


class GradeScale(BaseModel):
    """A source grading scale described by its best grade and minimum passing grade.

    Both endpoints are supplied explicitly by the caller (DAAD/transcript data) rather than
    inferred, so no official scale is fabricated (CLAUDE.md golden rule 2).
    """

    model_config = ConfigDict(frozen=True)

    best: float  # Nmax — value of the best achievable grade
    min_pass: float  # Nmin — value of the lowest passing grade
    name: str | None = None

    @model_validator(mode="after")
    def _check_endpoints(self) -> GradeScale:
        if not (math.isfinite(self.best) and math.isfinite(self.min_pass)):
            raise ValueError("grade scale endpoints must be finite")
        if self.best == self.min_pass:
            raise ValueError("grade scale 'best' and 'min_pass' must differ")
        return self


class GpaConversion(BaseModel):
    """Result of a Modified Bavarian conversion. ``raw`` keeps full precision for auditing."""

    model_config = ConfigDict(frozen=True)

    german_grade: float  # clamped to [1.0, 4.0] and rounded to ``decimals``
    raw: float  # unrounded, unclamped formula output
    source_grade: float
    scale: GradeScale
    method: Literal["modified_bavarian"] = METHOD
    clamped: bool  # True if ``raw`` fell outside [1.0, 4.0]
    is_passing: bool  # True if the source grade meets the minimum pass (raw <= 4.0)


def _round_half_up(value: float, decimals: int) -> float:
    quantum = Decimal(1).scaleb(-decimals)
    return float(Decimal(str(value)).quantize(quantum, rounding=ROUND_HALF_UP))


def convert_to_german_gpa(
    source_grade: float,
    scale: GradeScale,
    *,
    decimals: int = 1,
) -> GpaConversion:
    """Convert ``source_grade`` on ``scale`` to a German grade via the Modified Bavarian Formula.

    The unrounded value is clamped into the valid German band ``[1.0, 4.0]``; ``clamped`` records
    whether clamping occurred (a grade better than ``best`` or worse than ``min_pass``). A grade
    worse than ``min_pass`` is failing, reflected by ``is_passing=False``.
    """
    if not math.isfinite(source_grade):
        raise ValueError("source_grade must be a finite number")
    if decimals < 0:
        raise ValueError("decimals must be non-negative")

    raw = 1.0 + 3.0 * (scale.best - source_grade) / (scale.best - scale.min_pass)

    clamped_value = min(max(raw, BEST_GERMAN_GRADE), PASS_GERMAN_GRADE)
    german_grade = _round_half_up(clamped_value, decimals)

    return GpaConversion(
        german_grade=german_grade,
        raw=raw,
        source_grade=source_grade,
        scale=scale,
        clamped=(raw < BEST_GERMAN_GRADE - _TOL) or (raw > PASS_GERMAN_GRADE + _TOL),
        is_passing=raw <= PASS_GERMAN_GRADE + _TOL,
    )
