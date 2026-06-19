"""
Programme ingestion scaffold (ADR-0006) — NOT ENABLED.

DeutschPrep's programme finder runs over a hand-curated set of REAL programmes (see
frontend/src/lib/seed/programs.ts and the Supabase `programs` table). This module is the *scaffold*
for a future, polite ingestion job that would expand that set with provenance + deep links.

# TODO: confirm data-use terms / pursue a DAAD data partnership before enabling this.
Maintainer note: DAAD "International Programmes" and Hochschulkompass have NO public API, and their
terms for bulk reuse/storage are unclear. We therefore DO NOT scrape them in bulk. This file is a
deliberately inert blueprint: it respects robots.txt, rate-limits, caches, attributes the source, and
stores only what is needed with a deep link back — but `ingest()` raises until a maintainer has
cleared data use and flips `ENABLED`.

Design (when cleared):
  - read + honour robots.txt for every host (urllib.robotparser)
  - rate-limit (>= REQUEST_DELAY seconds between requests) and cache responses on disk
  - parse each programme into the `programs` schema, ALWAYS setting source/source_url/retrieved_at and
    needs_verification=True on admission requirements
  - attribute DAAD/Hochschulkompass visibly; link back; never re-publish wholesale
  - upsert via the Supabase service role (never the anon key)
"""
from __future__ import annotations

import time
from dataclasses import dataclass, field
from urllib import robotparser
from urllib.parse import urlparse

#: Hard switch. Stays False until data-use terms are confirmed (see module docstring).
ENABLED: bool = False

#: Minimum seconds between requests to the same host (politeness).
REQUEST_DELAY: float = 2.0

#: A descriptive, contactable User-Agent (set a real contact before enabling).
USER_AGENT: str = "DeutschPrepBot/0.1 (+https://github.com/Golden007-prog/Bruhdeutschland; contact: basuoikantik@gmail.com)"


@dataclass
class ProgramRecord:
    """Mirrors the Supabase `programs` columns; requirements stay needs_verification."""

    source: str
    source_url: str
    retrieved_at: str
    name: str
    university: str
    degree: str | None = None
    city: str | None = None
    bundesland: str | None = None
    languages: str = "en"
    subject_group: str | None = None
    areas_of_study: list[str] = field(default_factory=list)
    needs_verification: bool = True


def _can_fetch(url: str) -> bool:
    """Honour the host's robots.txt for our User-Agent."""
    parts = urlparse(url)
    rp = robotparser.RobotFileParser()
    rp.set_url(f"{parts.scheme}://{parts.netloc}/robots.txt")
    try:
        rp.read()
    except Exception:
        # If robots.txt can't be read, default to NOT fetching (conservative).
        return False
    return rp.can_fetch(USER_AGENT, url)


def ingest(*, dry_run: bool = True) -> list[ProgramRecord]:
    """
    Entry point for the (future) ingestion job. Inert by design.

    Raises RuntimeError unless ENABLED is set True by a maintainer who has confirmed data-use terms.
    Even then, callers should start with dry_run=True and a tiny page budget, and respect _can_fetch.
    """
    if not ENABLED:
        raise RuntimeError(
            "Programme ingestion is disabled. Confirm DAAD/Hochschulkompass data-use terms "
            "(or pursue a data partnership) and set ENABLED=True before running. See ADR-0006."
        )
    # When enabled, the loop would: for each allowed URL -> _can_fetch -> fetch (cached) ->
    # time.sleep(REQUEST_DELAY) -> parse into ProgramRecord(...) -> upsert (service role).
    _ = (time.sleep, _can_fetch, ProgramRecord, dry_run)  # referenced to document the intended shape
    return []


if __name__ == "__main__":  # pragma: no cover
    print(
        "DeutschPrep programme ingestion is a disabled scaffold (ADR-0006).\n"
        "It does not scrape DAAD/Hochschulkompass. Confirm data-use terms before enabling."
    )
