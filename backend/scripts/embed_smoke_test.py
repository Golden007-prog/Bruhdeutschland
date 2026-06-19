"""Downloads bge-m3 and proves multilingual retrieval works (ADR-0003 eval).

Run:  backend/.venv/Scripts/python.exe backend/scripts/embed_smoke_test.py

Builds a tiny German-Master's program corpus, embeds it with bge-m3, then runs German AND English
queries against it. Asserts each query's intended program ranks #1 (so the run exits non-zero if
retrieval regresses). This is an evaluation script, not a unit test — it touches the network/model.
"""

from __future__ import annotations

import sys
import time
from pathlib import Path

# Make `app.*` importable when run from the repo root.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import numpy as np

from app.services.embeddings import BGEM3EmbeddingProvider, cosine_similarity

# A small, realistic corpus: English- and German-taught Master's programs + a couple of distractors.
CORPUS: list[tuple[str, str]] = [
    ("tum_dataeng", "M.Sc. Data Engineering and Analytics at TUM, taught in English, Munich. "
                    "Focus on machine learning, big data systems and statistics."),
    ("rwth_mech", "M.Sc. Maschinenbau (Mechanical Engineering) an der RWTH Aachen, deutschsprachig. "
                  "Schwerpunkte: Konstruktionstechnik, Thermodynamik, Produktionstechnik."),
    ("uni_hh_lit", "Master of Arts Germanistik (deutsche Literatur) an der Universität Hamburg. "
                   "Literaturgeschichte, Linguistik und Editionswissenschaft."),
    ("hpi_cs", "M.Sc. Computer Science at the University of Potsdam / HPI, English-taught, "
               "covering distributed systems, security and software engineering."),
    ("distractor_cost", "Lebenshaltungskosten für Studierende in München: Miete, Krankenversicherung "
                        "und das Sperrkonto in Höhe des Regelbedarfs."),
]

QUERIES: list[tuple[str, str]] = [
    ("Master's in data science and machine learning taught in English in Munich", "tum_dataeng"),
    ("Maschinenbau Masterstudiengang an einer öffentlichen Universität in Deutschland", "rwth_mech"),
    ("English-taught computer science master near Berlin", "hpi_cs"),
    ("Studiengang über deutsche Literatur und Sprachwissenschaft", "uni_hh_lit"),
]


def main() -> int:
    print("Loading BAAI/bge-m3 (first run downloads ~2.3 GB)...")
    t0 = time.perf_counter()
    provider = BGEM3EmbeddingProvider()
    print(f"  loaded in {time.perf_counter() - t0:.1f}s | dim={provider.dimension}\n")

    ids = [c[0] for c in CORPUS]
    passages = [c[1] for c in CORPUS]
    corpus_vecs = provider.embed_passages(passages)
    print(f"Encoded corpus: shape={corpus_vecs.shape}, dtype={corpus_vecs.dtype}, "
          f"unit-norm={np.allclose(np.linalg.norm(corpus_vecs, axis=1), 1.0, atol=1e-3)}\n")

    failures = 0
    for query, expected_id in QUERIES:
        q_vec = provider.embed_queries([query])
        sims = cosine_similarity(q_vec, corpus_vecs)[0]
        order = np.argsort(-sims)
        top_id = ids[order[0]]
        ok = top_id == expected_id
        failures += not ok
        flag = "OK " if ok else "FAIL"
        print(f"[{flag}] query: {query[:60]!r}")
        for rank, idx in enumerate(order[:3], start=1):
            mark = " <-- expected" if ids[idx] == expected_id else ""
            print(f"        {rank}. {ids[idx]:<16} cos={sims[idx]:.3f}{mark}")
        print()

    if failures:
        print(f"RETRIEVAL CHECK FAILED: {failures}/{len(QUERIES)} queries mis-ranked")
        return 1
    print(f"RETRIEVAL CHECK PASSED: {len(QUERIES)}/{len(QUERIES)} queries ranked the right program #1")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
