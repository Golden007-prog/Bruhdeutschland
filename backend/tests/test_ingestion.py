"""Tests for ingestion: intake / LinkedIn / resume parsing, chunking, PII (build Phase 4)."""

from __future__ import annotations

import pytest

from app.ingestion.parser import (
    IntakeForm,
    UnsupportedDocument,
    chunk_text,
    extract_text,
    parse_intake,
    parse_linkedin,
    parse_resume,
)
from app.models.enums import ProfileSourceType


def test_parse_intake_maps_grade_scale_and_courses() -> None:
    form = IntakeForm(
        field="Computer Science",
        raw_gpa=8.2,
        gpa_scale={"best": 10.0, "min_pass": 4.0},
        courses=[{"credits": 30, "passed": True}, {"credits": 6, "passed": False}],
    )
    profile = parse_intake(form)
    assert profile.source_type is ProfileSourceType.INTAKE
    assert profile.gpa_scale is not None and profile.gpa_scale.best == 10.0
    assert len(profile.courses) == 2
    assert profile.raw_gpa == 8.2


def test_parse_linkedin_maps_positions_and_education() -> None:
    export = {
        "full_name": "Jane Doe",
        "education": [{"school": "IIT Delhi", "degree": "B.Tech", "field": "CS", "end_year": 2024}],
        "positions": [{"title": "Backend Engineer", "company": "Acme"}],
        "skills": ["Python", "SQL"],
    }
    profile = parse_linkedin(export)
    assert profile.source_type is ProfileSourceType.LINKEDIN
    assert profile.education[0].institution == "IIT Delhi"
    assert profile.experience == ["Backend Engineer @ Acme"]
    assert profile.skills == ["Python", "SQL"]


def test_chunk_text_splits_large_input() -> None:
    text = "\n\n".join(["paragraph " * 50 for _ in range(10)])
    chunks = chunk_text(text, max_chars=500)
    assert len(chunks) > 1
    assert all(len(c) <= 600 for c in chunks)  # paragraph boundaries, approx bound


def test_chunk_text_empty_is_empty() -> None:
    assert chunk_text("   ") == []


def test_extract_text_from_plain_text() -> None:
    out = extract_text(b"Jane Doe\nEngineer", content_type="text/plain", filename="cv.txt")
    assert "Jane Doe" in out


def test_parse_resume_returns_skeleton_and_chunks() -> None:
    profile, chunks = parse_resume(
        b"Jane Doe\n\nExperience: backend engineering for 2 years.",
        content_type="text/plain",
        filename="cv.txt",
    )
    assert profile.source_type is ProfileSourceType.RESUME
    assert profile.full_name == "Jane Doe"
    assert len(chunks) >= 1


def test_unsupported_document_raises() -> None:
    with pytest.raises(UnsupportedDocument):
        extract_text(b"\x00\x01", content_type="application/zip", filename="cv.zip")
