"""Scraper primitives: injectable fetch, canonical hashing, robots policy, rate limiting.

Everything network/time-related is injectable so scrapers are unit-testable with recorded fixtures
and no live calls (CLAUDE.md §6). The default ``HttpxFetcher`` is used in production.
"""

from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass
from typing import Protocol, runtime_checkable
from urllib.robotparser import RobotFileParser

_WS = re.compile(r"\s+")


@dataclass(frozen=True, slots=True)
class FetchResult:
    url: str
    status_code: int
    text: str


@runtime_checkable
class Fetcher(Protocol):
    """Minimal HTTP surface a scraper needs. Implemented by httpx in prod, a stub in tests."""

    def get(self, url: str) -> FetchResult: ...


class HttpxFetcher:
    """Production fetcher: httpx with a timeout and a descriptive User-Agent."""

    def __init__(self, *, timeout: float = 20.0, user_agent: str = "DeutschPrepBot/0.1") -> None:
        self._timeout = timeout
        self._headers = {"User-Agent": user_agent}

    def get(self, url: str) -> FetchResult:
        import httpx  # lazy so importing the module needs no network stack

        resp = httpx.get(url, timeout=self._timeout, headers=self._headers, follow_redirects=True)
        return FetchResult(url=str(resp.url), status_code=resp.status_code, text=resp.text)


def canonical_text(html: str) -> str:
    """Whitespace-collapsed text for stable hashing (resists trivial page churn)."""
    return _WS.sub(" ", html).strip()


def content_hash(text: str) -> str:
    """sha256 hex of canonicalized content — drives change detection (data-pipeline.md §5)."""
    return hashlib.sha256(canonical_text(text).encode("utf-8")).hexdigest()


class RobotsPolicy:
    """Thin wrapper over urllib's robotparser; robots content is injected (testable)."""

    def __init__(self, robots_txt: str, *, user_agent: str = "DeutschPrepBot/0.1") -> None:
        self._ua = user_agent
        self._rp = RobotFileParser()
        self._rp.parse(robots_txt.splitlines())

    def allowed(self, url: str) -> bool:
        return self._rp.can_fetch(self._ua, url)

    def crawl_delay(self) -> float | None:
        delay = self._rp.crawl_delay(self._ua)
        return float(delay) if delay is not None else None


class RateLimiter:
    """Min-interval gate. ``clock``/``sleep`` are injectable so tests never actually wait."""

    def __init__(self, per_minute: int, *, clock, sleep) -> None:  # noqa: ANN001
        self._min_interval = 60.0 / max(per_minute, 1)
        self._clock = clock
        self._sleep = sleep
        self._last: float | None = None

    def wait(self) -> None:
        now = self._clock()
        if self._last is not None:
            elapsed = now - self._last
            if elapsed < self._min_interval:
                self._sleep(self._min_interval - elapsed)
        self._last = self._clock()
