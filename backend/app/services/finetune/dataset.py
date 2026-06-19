"""Training data structures for embedding fine-tuning (ADR-0003).

The real corpus comes from Phase 2 (DAAD scrape → mined hard negatives). This module defines the
on-disk format and the in-memory contract so the harness can be built and unit-tested now, before
that data exists.

On-disk format: JSON Lines, one object per line::

    {"query": "...", "positive": "...", "negative": "..."}   # negative optional
"""

from __future__ import annotations

import json
from collections.abc import Iterable, Sequence
from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass(frozen=True, slots=True)
class RetrievalTriple:
    """One training example: a query, a relevant passage, and an optional hard negative.

    With no ``negative``, training relies on in-batch negatives (MultipleNegativesRankingLoss).
    """

    query: str
    positive: str
    negative: str | None = None

    def __post_init__(self) -> None:
        if not self.query.strip() or not self.positive.strip():
            raise ValueError("query and positive must be non-empty")


def load_triples_jsonl(path: str | Path) -> list[RetrievalTriple]:
    """Parse a JSONL file into triples. Raises on malformed lines (fail loud, not silent)."""
    triples: list[RetrievalTriple] = []
    for lineno, line in enumerate(Path(path).read_text(encoding="utf-8").splitlines(), start=1):
        line = line.strip()
        if not line:
            continue
        try:
            obj: dict[str, Any] = json.loads(line)
            triples.append(
                RetrievalTriple(
                    query=obj["query"],
                    positive=obj["positive"],
                    negative=obj.get("negative"),
                )
            )
        except (json.JSONDecodeError, KeyError, ValueError) as exc:
            raise ValueError(f"{path}:{lineno}: invalid training example ({exc})") from exc
    if not triples:
        raise ValueError(f"{path}: no training examples found")
    return triples


def to_columnar(triples: Sequence[RetrievalTriple]) -> dict[str, list[str]]:
    """Convert triples to the column dict ``datasets.Dataset.from_dict`` expects.

    Includes a ``negative`` column only if **every** triple has one (the loss requires homogeneous
    columns across the batch).
    """
    has_neg = all(t.negative for t in triples)
    cols: dict[str, list[str]] = {"anchor": [], "positive": []}
    if has_neg:
        cols["negative"] = []
    for t in triples:
        cols["anchor"].append(t.query)
        cols["positive"].append(t.positive)
        if has_neg:
            cols["negative"].append(t.negative)  # type: ignore[arg-type]
    return cols


def iter_texts(triples: Iterable[RetrievalTriple]) -> Iterable[str]:
    """Yield every distinct text (for sanity checks / vocab inspection)."""
    for t in triples:
        yield t.query
        yield t.positive
        if t.negative:
            yield t.negative
