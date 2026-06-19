"""Embedding fine-tune harness for bge-m3 (ADR-0003).

Built now; the real training run happens after Phase 2 produces a labeled DAAD dataset. Uses
sentence-transformers' Trainer with MultipleNegativesRankingLoss (contrastive, in-batch +
explicit hard negatives) — the standard recipe for retrieval embeddings.

``torch`` / ``sentence_transformers`` / ``datasets`` are imported lazily so the module imports
without the ML stack (keeps the dataset unit tests fast and offline).
"""

from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .dataset import RetrievalTriple, to_columnar


@dataclass(slots=True)
class FineTuneConfig:
    """Knobs for a fine-tune run. Defaults target a 16 GB GPU."""

    model_id: str = "BAAI/bge-m3"
    output_dir: str = "backend/artifacts/bge-m3-deutschprep"
    epochs: int = 1
    batch_size: int = 8
    learning_rate: float = 2e-5
    warmup_ratio: float = 0.1
    device: str | None = None
    fp16: bool = True
    gradient_checkpointing: bool = True
    # Smoke-test controls: cap steps and skip saving to prove the pipeline runs end-to-end.
    max_steps: int | None = None
    smoke: bool = False


def build_dataset(triples: Sequence[RetrievalTriple]) -> Any:
    """Build a ``datasets.Dataset`` from triples (column order = loss input order)."""
    from datasets import Dataset  # lazy

    return Dataset.from_dict(to_columnar(triples))


def run_finetune(
    triples: Sequence[RetrievalTriple],
    config: FineTuneConfig | None = None,
    *,
    model: Any | None = None,
) -> Any:
    """Fine-tune bge-m3 on retrieval triples and return the trained SentenceTransformer.

    Args:
        triples: training examples (``query``, ``positive``, optional ``negative``).
        config: hyperparameters; defaults to :class:`FineTuneConfig`.
        model: optional preloaded model (dependency injection for tests / reuse).
    """
    from sentence_transformers import (  # lazy
        SentenceTransformer,
        SentenceTransformerTrainer,
        SentenceTransformerTrainingArguments,
    )
    from sentence_transformers.losses import MultipleNegativesRankingLoss

    cfg = config or FineTuneConfig()
    if not triples:
        raise ValueError("no training triples provided")

    st_model = model or SentenceTransformer(cfg.model_id, device=cfg.device)
    train_ds = build_dataset(triples)
    loss = MultipleNegativesRankingLoss(st_model)

    args = SentenceTransformerTrainingArguments(
        output_dir=cfg.output_dir,
        num_train_epochs=cfg.epochs,
        per_device_train_batch_size=cfg.batch_size,
        learning_rate=cfg.learning_rate,
        warmup_ratio=cfg.warmup_ratio,
        max_steps=cfg.max_steps if cfg.max_steps is not None else -1,
        fp16=cfg.fp16,
        gradient_checkpointing=cfg.gradient_checkpointing,
        logging_steps=1,
        save_strategy="no" if cfg.smoke else "epoch",
        report_to=[],
        disable_tqdm=True,
    )

    trainer = SentenceTransformerTrainer(
        model=st_model,
        args=args,
        train_dataset=train_ds,
        loss=loss,
    )
    trainer.train()

    if not cfg.smoke:
        Path(cfg.output_dir).mkdir(parents=True, exist_ok=True)
        st_model.save_pretrained(cfg.output_dir)

    return st_model
