# ADR-0006 — Program finder: data ingestion, attribution & hybrid search

- **Status:** Accepted
- **Date:** 2026-06-20
- **Deciders:** Lead architect (DeutschPrep)
- **Related:** ADR-0003 (RAG & grounding), ADR-0004 (hosted SPA + Supabase), `CLAUDE.md` §2/§4,
  "University Matching" work order

## Context

The "Course & university matching" page generated *illustrative* programmes from a demo profile — fine
as a placeholder, wrong as a product (`CLAUDE.md` golden rule #2: never present fabricated facts as
real). The reference standard is DAAD *International Programmes in Germany* (~2,500 programmes) and
Hochschulkompass. **There is no public DAAD/Hochschulkompass API**, and the legal/ToS footing for
bulk-scraping and storing their curated datasets is unclear.

## Decision

### 1. Data sourcing — curated real set + scraper *stub* (no bulk scrape yet)

v1 ships a **hand-verified, curated set of REAL programmes** at real German public universities — each
with its official source URL, `retrieved_at`, and **`needs_verification: true`** on admission
requirements. We do **NOT** run a bulk scrape of DAAD/Hochschulkompass: we cannot verify their terms
permit bulk reuse/storage, and republishing a public-good organisation's curated dataset without
clearance is legally and ethically gray.

We ship a **documented, `robots.txt`-respecting, rate-limited ingestion STUB** in
`backend/app/scrapers/` that is **not executed** — it carries a
`# TODO: confirm data-use terms / pursue a DAAD data partnership` and a maintainer note. The dataset
grows by hand-curation or after a formal data partnership.

The app **assists, it does not certify**: every programme deep-links to the official page, attributes
the source, keeps requirements flagged for verification, and offers a "re-verify" action.

### 2. Storage — Supabase `programs` (public read, admin write)

`programs` (+ `user_shortlist`, `saved_searches`) in Supabase, with provenance columns, a generated
`fts tsvector`, and an `embedding vector(384)` column (pgvector) for the future semantic path. RLS:
`programs` is **public-read** (anon `select using (true)`), writable only by the service role (curated
inserts via the Supabase MCP / a maintainer job). User tables are owner-only.

### 3. Search — hybrid, with a pragmatic v1

The schema is built for **hybrid search**: Postgres FTS (`fts` GIN), fuzzy (`pg_trgm` GIN on
name/university), and semantic (`pgvector` HNSW), fusible with Reciprocal Rank Fusion. A
`search_programs` SQL RPC implements the FTS + trigram RRF path as the **scale path** for when the set
reaches thousands of rows.

**For the curated v1 (tens–hundreds of programmes), search/filter/facet/sort run client-side** over the
fetched set (loaded from Supabase `programs`, or the committed seed when Supabase/offline): instant,
typo-tolerant, with live facet counts and URL-reflected filters. This is faster UX at this size and
keeps the page working offline. Semantic re-ranking is enabled when programme embeddings are backfilled
(by a maintainer job using an embedding model / the BYOK provider); **no ~30 MB in-browser
`transformers.js` model is bundled by default** on the free static app — it remains an opt-in.

### 4. Honest scoring — eligibility vs relevance (split)

The single "FIT (illustrative)" bar is replaced by two truthful signals:
- **Eligibility** — deterministic, tested TS over the user's *confirmed* profile vs the programme's
  *known* requirements (degree field, German grade via Modified-Bavarian, ECTS, language level, tests):
  **Meets / Maybe / Doesn't meet / Unknown**. Unknown/`needs_verification` requirements show **Unknown**
  with the official link — never a guess. Rolled up to *Likely eligible / Borderline / Stretch*.
- **Relevance** — how well the programme matches the user's stated interest (search ranking). Labelled
  **"Relevance"**, never "admission chance." No fabricated admission probability.

## Consequences

- **Positive:** real, provenance-stamped data; honest about requirements; fast faceted search with no
  heavy deps; a clear scale path (RPC + pgvector) and ingestion path (the documented stub) without doing
  legally-uncertain mass-scraping now.
- **Negative:** the curated set is small until a partnership / manual curation expands it; semantic
  search is dormant until embeddings are backfilled (FTS + fuzzy carry v1). These are flagged in the UI
  (result counts are honest) and here.
- **Non-goal:** claiming to be an authoritative programme database. DAAD/Hochschulkompass are attributed
  and linked; DeutschPrep is an assistant over a curated, verifiable subset.
