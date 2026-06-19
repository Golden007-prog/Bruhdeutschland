"""DAAD reference scraper — vertical slice (data-pipeline.md §8).

`parse_programs` is a **pure, deterministic** function of (html, source_url, now) → normalized
programs, each carrying its own provenance. Tested with a recorded fixture; no live network.

⚠️ Selectors target the recorded fixture and are illustrative. Validate against the live DAAD
structure (or its structured API) before production — until then, values are `needs_verification`.
"""

from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel
from selectolax.parser import HTMLParser, Node

from app.models.enums import DeadlineKind, RequirementKind, TeachingLanguage

from .base import Fetcher, content_hash

_LANG_MAP = {
    "en": TeachingLanguage.EN,
    "english": TeachingLanguage.EN,
    "de": TeachingLanguage.DE,
    "german": TeachingLanguage.DE,
    "deutsch": TeachingLanguage.DE,
    "mixed": TeachingLanguage.MIXED,
    "bilingual": TeachingLanguage.MIXED,
}

SOURCE_NAME = "DAAD"


class ScrapedProvenance(BaseModel):
    source_url: str
    content_hash: str
    retrieved_at: datetime


class ScrapedRequirement(BaseModel):
    kind: RequirementKind
    raw: str


class ScrapedDeadline(BaseModel):
    kind: DeadlineKind
    intake: str
    due_date: date | None = None


class ScrapedProgram(BaseModel):
    daad_program_id: str | None
    title: str
    university_name: str
    degree: str | None = None
    teaching_language: TeachingLanguage | None = None
    city: str | None = None
    description: str | None = None
    requirements: list[ScrapedRequirement] = []
    deadlines: list[ScrapedDeadline] = []
    provenance: ScrapedProvenance
    needs_verification: bool = False


def _text(node: Node | None) -> str | None:
    if node is None:
        return None
    txt = node.text(strip=True)
    return txt or None


def _map_language(card: Node) -> TeachingLanguage | None:
    el = card.css_first(".course__language")
    if el is None:
        return None
    key = (el.attributes.get("data-lang") or el.text(strip=True) or "").strip().lower()
    return _LANG_MAP.get(key)


def _parse_deadlines(card: Node) -> list[ScrapedDeadline]:
    out: list[ScrapedDeadline] = []
    for li in card.css(".course__deadlines li"):
        kind_raw = (li.attributes.get("data-kind") or "application").strip()
        try:
            kind = DeadlineKind(kind_raw)
        except ValueError:
            kind = DeadlineKind.APPLICATION
        intake = (li.attributes.get("data-intake") or "unknown").strip()
        raw_date = (li.attributes.get("data-date") or "").strip()
        due: date | None = None
        if raw_date:
            try:
                due = date.fromisoformat(raw_date)
            except ValueError:
                due = None  # unparseable → left null; flagged at program level
        out.append(ScrapedDeadline(kind=kind, intake=intake, due_date=due))
    return out


def _parse_requirements(card: Node) -> list[ScrapedRequirement]:
    out: list[ScrapedRequirement] = []
    for li in card.css(".course__requirements li"):
        kind_raw = (li.attributes.get("data-kind") or "prerequisite").strip()
        try:
            kind = RequirementKind(kind_raw)
        except ValueError:
            kind = RequirementKind.PREREQUISITE
        raw = li.text(strip=True)
        if raw:
            out.append(ScrapedRequirement(kind=kind, raw=raw))
    return out


def parse_programs(html: str, *, source_url: str, now: datetime) -> list[ScrapedProgram]:
    """Parse a DAAD listing into normalized programs, each with provenance. Pure + deterministic."""
    tree = HTMLParser(html)
    programs: list[ScrapedProgram] = []

    for card in tree.css("article.course"):
        title = _text(card.css_first(".course__title"))
        university_name = _text(card.css_first(".course__institution"))

        # A program is only trustworthy if its core identity parsed. Otherwise flag, don't drop.
        needs_verification = not (title and university_name)

        deadlines = _parse_deadlines(card)
        # If any deadline date failed to parse, the program needs verification.
        if any(d.due_date is None for d in deadlines):
            needs_verification = True

        provenance = ScrapedProvenance(
            source_url=source_url,
            content_hash=content_hash(card.html or ""),
            retrieved_at=now,
        )

        programs.append(
            ScrapedProgram(
                daad_program_id=(card.attributes.get("data-daad-id") or None),
                title=title or "(unknown title)",
                university_name=university_name or "(unknown institution)",
                degree=_text(card.css_first(".course__degree")),
                teaching_language=_map_language(card),
                city=_text(card.css_first(".course__city")),
                description=_text(card.css_first(".course__description")),
                requirements=_parse_requirements(card),
                deadlines=deadlines,
                provenance=provenance,
                needs_verification=needs_verification,
            )
        )

    return programs


class DaadScraper:
    """Fetch + parse one DAAD listing URL. Fetcher is injectable (httpx in prod, stub in tests)."""

    source_name = SOURCE_NAME

    def __init__(self, fetcher: Fetcher) -> None:
        self._fetcher = fetcher

    def scrape(self, url: str, *, now: datetime) -> list[ScrapedProgram]:
        result = self._fetcher.get(url)
        if result.status_code != 200:
            raise RuntimeError(f"DAAD fetch failed: {url} → HTTP {result.status_code}")
        return parse_programs(result.text, source_url=result.url, now=now)
