# Embeddings (ADR-0003)

Semantic-search embeddings for ProgramSearch (RAG over DAAD/program data). Model: **`BAAI/bge-m3`**
(MIT, multilingual DE+EN, 1024-dim) served locally behind the `EmbeddingProvider` interface.

> NV-Embed-v2 was evaluated and **rejected**: `cc-by-nc-4.0` (non-commercial — cannot ship in a
> commercial product), English-only, and 4096-dim (exceeds pgvector's index limit). See ADR-0003.

## Layout

| File | Purpose |
|---|---|
| `provider.py` | `EmbeddingProvider` ABC + `cosine_similarity` helper. Vectors are L2-normalized. |
| `bge_m3.py` | `BGEM3EmbeddingProvider` (sentence-transformers). Lazy ML imports. |
| `../finetune/` | Fine-tune harness (dataset format + trainer). Real training runs on Phase 2 DAAD data. |

## pgvector contract

The pgvector column width is pinned to `DIMENSION` (1024) and must be asserted at startup. Querying
uses cosine (`vector_cosine_ops`); since vectors are normalized, cosine == dot product.

## Setup

```bash
python -m venv backend/.venv
backend/.venv/Scripts/python.exe -m pip install torch --index-url https://download.pytorch.org/whl/cu124
backend/.venv/Scripts/python.exe -m pip install -r backend/requirements-embeddings.txt
```

## Use

```python
from app.services.embeddings import BGEM3EmbeddingProvider, cosine_similarity

provider = BGEM3EmbeddingProvider()              # downloads bge-m3 on first use
corpus = provider.embed_passages(["M.Sc. Data Engineering at TUM ...", ...])
query = provider.embed_queries(["english data science master in munich"])
scores = cosine_similarity(query, corpus)        # (1, N)
```

## Verify

```bash
# Offline unit tests (no network/model) — CI-safe:
backend/.venv/Scripts/python.exe -m pytest backend/tests -q

# Real retrieval eval (downloads bge-m3, German+English queries):
backend/.venv/Scripts/python.exe backend/scripts/embed_smoke_test.py

# Fine-tune harness smoke run (2 steps, proves the pipeline on the GPU):
backend/.venv/Scripts/python.exe backend/scripts/finetune_smoke.py
```
