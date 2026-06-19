"""Tests for the deterministic ECTS calculator.

ECTS Users' Guide (European Commission): 60 credits == one full-time academic year;
1 credit == 25-30 hours of total student workload (1500-1800 h / year).
All arithmetic here is deterministic (CLAUDE.md golden rule 4).
"""

from __future__ import annotations

import math

import pytest

from app.services.ects_calculator import (
    ECTS_PER_YEAR,
    CourseCredit,
    EctsSummary,
    ects_from_workload,
    sum_ects,
)


def test_ects_per_year_constant() -> None:
    assert ECTS_PER_YEAR == 60


def test_simple_sum_of_two_semesters() -> None:
    out = sum_ects([CourseCredit(credits=30), CourseCredit(credits=30)])
    assert out.total_ects == 60
    assert out.course_count == 2
    assert out.full_time_years == 1.0
    assert out.method == "ects_sum"


def test_full_time_years_is_total_over_sixty() -> None:
    out = sum_ects([CourseCredit(credits=90)])
    assert out.full_time_years == 1.5


def test_only_passed_filters_failed_courses_by_default() -> None:
    courses = [CourseCredit(credits=10, passed=True), CourseCredit(credits=5, passed=False)]
    out = sum_ects(courses)
    assert out.total_ects == 10
    assert out.course_count == 1


def test_including_failed_courses_when_requested() -> None:
    courses = [CourseCredit(credits=10, passed=True), CourseCredit(credits=5, passed=False)]
    out = sum_ects(courses, only_passed=False)
    assert out.total_ects == 15
    assert out.course_count == 2


def test_conversion_factor_scales_non_ects_credits() -> None:
    # US semester hours -> ECTS at a caller-supplied factor of 2.0.
    out = sum_ects(
        [CourseCredit(credits=3), CourseCredit(credits=3), CourseCredit(credits=4)],
        conversion_factor=2.0,
    )
    assert out.total_ects == 20
    assert out.method == "ects_scaled_sum"
    assert out.conversion_factor == 2.0


def test_empty_transcript_is_zero() -> None:
    out = sum_ects([])
    assert out.total_ects == 0
    assert out.course_count == 0
    assert out.full_time_years == 0.0
    assert isinstance(out, EctsSummary)


def test_workload_of_one_year_is_sixty_credits() -> None:
    assert ects_from_workload(1800, hours_per_ects=30) == 60.0
    assert ects_from_workload(1500, hours_per_ects=25) == 60.0


def test_workload_partial() -> None:
    assert math.isclose(ects_from_workload(900, hours_per_ects=30), 30.0, abs_tol=1e-9)


def test_negative_credits_rejected() -> None:
    with pytest.raises(ValueError):
        CourseCredit(credits=-5)


def test_non_positive_conversion_factor_rejected() -> None:
    with pytest.raises(ValueError):
        sum_ects([CourseCredit(credits=10)], conversion_factor=0)


def test_non_positive_hours_per_ects_rejected() -> None:
    with pytest.raises(ValueError):
        ects_from_workload(900, hours_per_ects=0)
