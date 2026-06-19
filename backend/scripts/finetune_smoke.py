"""End-to-end smoke run of the fine-tune harness on bge-m3 (ADR-0003).

Run:  backend/.venv/Scripts/python.exe backend/scripts/finetune_smoke.py

Proves the harness executes a real training step on the GPU using a handful of synthetic German/
English program-matching triples. This is NOT real fine-tuning (2 steps, no saved model) — it
exists to validate the pipeline before Phase 2 supplies a labeled DAAD dataset. It measures whether
the model's parameters actually changed after the step.
"""

from __future__ import annotations

import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import torch

from app.services.finetune import FineTuneConfig, RetrievalTriple, run_finetune

TRIPLES = [
    RetrievalTriple(
        query="English-taught data science master in Munich",
        positive="M.Sc. Data Engineering and Analytics at TUM, taught in English.",
        negative="Lebenshaltungskosten und Sperrkonto für Studierende in München.",
    ),
    RetrievalTriple(
        query="Maschinenbau Master an einer deutschen Universität",
        positive="M.Sc. Maschinenbau an der RWTH Aachen, deutschsprachig.",
        negative="Master of Arts Germanistik an der Universität Hamburg.",
    ),
    RetrievalTriple(
        query="computer science master near Berlin in English",
        positive="M.Sc. Computer Science at HPI / University of Potsdam, English-taught.",
        negative="Bewerbungsfristen und VPD-Verfahren bei Uni-Assist.",
    ),
    RetrievalTriple(
        query="Studiengang deutsche Literatur",
        positive="Master of Arts Germanistik an der Universität Hamburg.",
        negative="M.Sc. Data Engineering and Analytics at TUM.",
    ),
]


def _snapshot(model) -> dict[str, torch.Tensor]:
    """Clone every trainable parameter (to CPU) so we can measure movement across the whole model."""
    return {
        name: p.detach().float().cpu().clone()
        for name, p in model.named_parameters()
        if p.requires_grad
    }


def _movement(before: dict[str, torch.Tensor], after: dict[str, torch.Tensor]) -> tuple[int, int, float]:
    """Return (changed_tensors, total_tensors, total_L1_movement)."""
    changed = 0
    total_l1 = 0.0
    for name, b in before.items():
        a = after[name]
        if not torch.equal(a, b):
            changed += 1
            total_l1 += (a - b).abs().sum().item()
    return changed, len(before), total_l1


def main() -> int:
    from sentence_transformers import SentenceTransformer

    print("Loading bge-m3 for harness smoke test...")
    model = SentenceTransformer("BAAI/bge-m3")
    before = _snapshot(model)

    # Real LR, no warmup, a few steps — so the smoke run produces visible, detectable movement.
    cfg = FineTuneConfig(
        epochs=2,
        batch_size=2,
        learning_rate=1e-4,
        warmup_ratio=0.0,
        smoke=True,
        fp16=torch.cuda.is_available(),
        gradient_checkpointing=False,
    )
    print(f"Running {cfg.epochs} epochs over {len(TRIPLES)} triples "
          f"(batch={cfg.batch_size}, cuda={torch.cuda.is_available()})...")
    t0 = time.perf_counter()
    trained = run_finetune(TRIPLES, cfg, model=model)
    dt = time.perf_counter() - t0

    after = _snapshot(trained)
    changed, total, l1 = _movement(before, after)

    print(f"  finished in {dt:.1f}s | params changed={changed}/{total} | total_L1_movement={l1:.3f}")
    if changed == 0 or l1 == 0.0:
        print("HARNESS SMOKE FAILED: no parameters updated")
        return 1
    print(f"HARNESS SMOKE PASSED: fine-tune ran end-to-end and updated {changed}/{total} "
          f"parameter tensors")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
