"""Tests for the deterministic GPA converter (Modified Bavarian Formula).

Formula (KMK-stipulated, used by uni-assist):
    german = 1 + 3 * (Nmax - Nd) / (Nmax - Nmin)
where Nmax = best achievable grade, Nmin = minimum passing grade, Nd = achieved grade.
Result band: 1.0 (best) .. 4.0 (just passing), rounded to one decimal.

Sources: TUM / KMK, Uni-Heidelberg, HS Osnabrück, fintiba grade calculators.
"""

from __future__ import annotations

import math

import pytest

from app.services.gpa_converter import (
    GradeScale,
    GpaConversion,
    convert_to_german_gpa,
)


def test_best_grade_maps_to_1_0() -> None:
    # Nd == Nmax -> top German grade.
    out = convert_to_german_gpa(4.0, GradeScale(best=4.0, min_pass=2.0))
    assert out.german_grade == 1.0
    assert out.is_passing is True
    assert out.clamped is False


def test_minimum_passing_grade_maps_to_4_0() -> None:
    # Nd == Nmin -> lowest passing German grade.
    out = convert_to_german_gpa(2.0, GradeScale(best=4.0, min_pass=2.0))
    assert out.german_grade == 4.0
    assert out.is_passing is True


def test_midpoint_of_four_point_scale() -> None:
    # best=4, min_pass=2, Nd=3 -> 1 + 3*(4-3)/(4-2) = 2.5
    out = convert_to_german_gpa(3.0, GradeScale(best=4.0, min_pass=2.0))
    assert out.german_grade == 2.5


def test_ten_point_scale_worked_example() -> None:
    # best=10, min_pass=4, Nd=7 -> 1 + 3*(10-7)/(10-4) = 2.5
    out = convert_to_german_gpa(7.0, GradeScale(best=10.0, min_pass=4.0))
    assert out.german_grade == 2.5


def test_percentage_scale() -> None:
    # best=100, min_pass=50, Nd=80 -> 1 + 3*(100-80)/(100-50) = 2.2
    out = convert_to_german_gpa(80.0, GradeScale(best=100.0, min_pass=50.0))
    assert out.german_grade == 2.2


def test_reversed_scale_where_lower_is_better() -> None:
    # System where 1 is best and 4 is the minimum pass (e.g. some EU scales).
    # best=1, min_pass=4, Nd=2 -> 1 + 3*(1-2)/(1-4) = 2.0
    out = convert_to_german_gpa(2.0, GradeScale(best=1.0, min_pass=4.0))
    assert out.german_grade == 2.0


def test_grade_better_than_max_is_clamped_to_1_0() -> None:
    out = convert_to_german_gpa(4.3, GradeScale(best=4.0, min_pass=2.0))
    assert out.german_grade == 1.0
    assert out.clamped is True
    assert out.is_passing is True


def test_failing_grade_below_min_pass_is_clamped_and_flagged() -> None:
    # Nd worse than the minimum passing grade -> raw > 4.0 -> failing.
    out = convert_to_german_gpa(1.5, GradeScale(best=4.0, min_pass=2.0))
    assert out.german_grade == 4.0
    assert out.clamped is True
    assert out.is_passing is False


def test_raw_value_is_preserved_unrounded() -> None:
    out = convert_to_german_gpa(8.5, GradeScale(best=10.0, min_pass=4.0))
    # raw = 1 + 3*(10-8.5)/6 = 1.75
    assert math.isclose(out.raw, 1.75, rel_tol=0, abs_tol=1e-9)
    assert out.german_grade == 1.8  # ROUND_HALF_UP at one decimal


def test_rounding_is_half_up_not_bankers() -> None:
    # best=13, min_pass=1, Nd=12 -> raw = 1 + 3*(13-12)/(13-1) = 1.25
    # ROUND_HALF_UP -> 1.3 (banker's rounding would give 1.2).
    out = convert_to_german_gpa(12.0, GradeScale(best=13.0, min_pass=1.0))
    assert math.isclose(out.raw, 1.25, abs_tol=1e-9)
    assert out.german_grade == 1.3


def test_method_is_recorded_for_provenance() -> None:
    out = convert_to_german_gpa(3.0, GradeScale(best=4.0, min_pass=2.0))
    assert out.method == "modified_bavarian"
    assert isinstance(out, GpaConversion)


def test_degenerate_scale_raises() -> None:
    with pytest.raises(ValueError):
        GradeScale(best=4.0, min_pass=4.0)


def test_non_finite_grade_raises() -> None:
    with pytest.raises(ValueError):
        convert_to_german_gpa(float("nan"), GradeScale(best=4.0, min_pass=2.0))
