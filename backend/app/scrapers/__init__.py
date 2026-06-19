"""Source scrapers. Each emits normalized rows + a ProvenanceRecord per official value."""

from .base import (
    Fetcher,
    FetchResult,
    HttpxFetcher,
    RateLimiter,
    RobotsPolicy,
    canonical_text,
    content_hash,
)
from .daad import (
    DaadScraper,
    ScrapedDeadline,
    ScrapedProgram,
    ScrapedProvenance,
    ScrapedRequirement,
    parse_programs,
)

__all__ = [
    "Fetcher",
    "FetchResult",
    "HttpxFetcher",
    "RateLimiter",
    "RobotsPolicy",
    "canonical_text",
    "content_hash",
    "DaadScraper",
    "ScrapedProgram",
    "ScrapedProvenance",
    "ScrapedRequirement",
    "ScrapedDeadline",
    "parse_programs",
]
