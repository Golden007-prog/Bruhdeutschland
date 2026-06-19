"""DAAD scraper tests — recorded fixture only, no live network (CLAUDE.md §6)."""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

import pytest

from app.models.enums import DeadlineKind, RequirementKind, TeachingLanguage
from app.scrapers import DaadScraper, FetchResult, parse_programs
from app.scrapers.base import content_hash

FIXTURE = Path(__file__).parent / "fixtures" / "daad_sample.html"
NOW = datetime(2026, 6, 18, 12, 0, tzinfo=timezone.utc)  # injected clock → deterministic
SOURCE_URL = "https://www2.daad.de/deutschland/studienangebote/international-programmes/en/result/"


@pytest.fixture
def html() -> str:
    return FIXTURE.read_text(encoding="utf-8")


def test_parses_all_program_cards(html: str) -> None:
    programs = parse_programs(html, source_url=SOURCE_URL, now=NOW)
    assert len(programs) == 3
    assert [p.daad_program_id for p in programs] == ["DA-10001", "DA-10002", "DA-10003"]


def test_normalizes_core_fields(html: str) -> None:
    tum = parse_programs(html, source_url=SOURCE_URL, now=NOW)[0]
    assert tum.title == "M.Sc. Data Engineering and Analytics"
    assert tum.university_name == "Technical University of Munich"
    assert tum.degree == "M.Sc."
    assert tum.teaching_language is TeachingLanguage.EN
    assert tum.city == "Munich"
    assert tum.needs_verification is False


def test_language_mapping_de_and_mixed(html: str) -> None:
    progs = parse_programs(html, source_url=SOURCE_URL, now=NOW)
    assert progs[1].teaching_language is TeachingLanguage.DE
    assert progs[2].teaching_language is TeachingLanguage.MIXED


def test_requirements_and_deadlines(html: str) -> None:
    tum = parse_programs(html, source_url=SOURCE_URL, now=NOW)[0]
    kinds = {r.kind for r in tum.requirements}
    assert kinds == {RequirementKind.LANGUAGE, RequirementKind.GPA}
    app_deadline = next(d for d in tum.deadlines if d.kind is DeadlineKind.APPLICATION)
    assert app_deadline.due_date is not None
    assert app_deadline.due_date.isoformat() == "2026-05-31"
    assert any(d.kind is DeadlineKind.UNI_ASSIST for d in tum.deadlines)


def test_every_program_has_provenance(html: str) -> None:
    """CLAUDE.md §2: every official row must carry provenance."""
    for p in parse_programs(html, source_url=SOURCE_URL, now=NOW):
        assert p.provenance.source_url == SOURCE_URL
        assert p.provenance.retrieved_at == NOW
        assert len(p.provenance.content_hash) == 64  # sha256 hex


def test_malformed_card_is_flagged_not_fabricated(html: str) -> None:
    """Missing institution + unparseable 'rolling' date → needs_verification, no guessed values."""
    bad = parse_programs(html, source_url=SOURCE_URL, now=NOW)[2]
    assert bad.needs_verification is True
    assert bad.university_name == "(unknown institution)"
    rolling = bad.deadlines[0]
    assert rolling.due_date is None  # never fabricated


def test_content_hash_changes_with_content(html: str) -> None:
    """Change detection: different content → different hash; identical → identical hash."""
    h1 = content_hash("<article>A</article>")
    h2 = content_hash("<article>B</article>")
    h3 = content_hash("<article>A</article>")
    assert h1 != h2 and h1 == h3


def test_scraper_uses_injected_fetcher_no_network(html: str) -> None:
    """DaadScraper.scrape goes through the injected Fetcher — proves no real HTTP in tests."""

    class StubFetcher:
        def get(self, url: str) -> FetchResult:
            return FetchResult(url=url, status_code=200, text=html)

    programs = DaadScraper(StubFetcher()).scrape(SOURCE_URL, now=NOW)
    assert len(programs) == 3


def test_scraper_raises_on_http_error() -> None:
    class ErrFetcher:
        def get(self, url: str) -> FetchResult:
            return FetchResult(url=url, status_code=503, text="")

    with pytest.raises(RuntimeError, match="HTTP 503"):
        DaadScraper(ErrFetcher()).scrape(SOURCE_URL, now=NOW)
