# DeutschPrep — Data Model

> Phase 2 design doc. ER model + application state machine. Implemented in
> `backend/app/models/*.py` (SQLAlchemy 2.0) with the initial Alembic migration. Conforms to
> `CLAUDE.md` §2 (provenance on every official fact) and ADR-0003 (pgvector embedding on `Program`).

---

## 1. Design rules

1. **Provenance is mandatory for official data.** `ProgramRequirement`, `DeadlineEvent`, and the
   scraped core facts on `Program` link a `ProvenanceRecord`. A row holding an official value with
   **no** provenance must set `needs_verification = true` (never persisted as a trusted fact).
2. **PII isolation.** Raw resume/LinkedIn content and parsed personal facts live in
   `Profile` / `ParsedProfileFacts`, encrypted at rest; never logged.
3. **Deterministic vs generated.** Computed values (German GPA, ECTS) are stored with their method;
   generated documents (`Document`) are clearly typed and never treated as official.
4. **Embeddings.** `Program.embedding` is `vector(1024)` (bge-m3, ADR-0003); width asserted at
   startup against `EmbeddingProvider.dimension`.

---

## 2. ER diagram

```mermaid
erDiagram
    USER ||--o{ PROFILE : has
    USER ||--o{ SAVED_UNIVERSITY : saves
    USER ||--o{ APPLICATION : owns
    USER ||--o{ DOCUMENT : owns

    PROFILE ||--|| PARSED_PROFILE_FACTS : yields
    PROFILE ||--o{ ROADMAP : generates
    ROADMAP ||--o{ ROADMAP_ITEM : contains

    UNIVERSITY ||--o{ PROGRAM : offers
    PROGRAM ||--o{ PROGRAM_REQUIREMENT : requires
    PROGRAM ||--o{ DEADLINE_EVENT : has
    PROGRAM ||--o{ SAVED_UNIVERSITY : referenced_by
    PROGRAM ||--o{ APPLICATION : target_of

    APPLICATION ||--o{ APPLICATION_STEP : has
    APPLICATION ||--o{ DOCUMENT : attaches
    APPLICATION ||--o{ ROADMAP_ITEM : drives

    SCRAPE_SOURCE ||--o{ PROVENANCE_RECORD : produces
    PROVENANCE_RECORD ||--o{ PROGRAM : grounds
    PROVENANCE_RECORD ||--o{ PROGRAM_REQUIREMENT : grounds
    PROVENANCE_RECORD ||--o{ DEADLINE_EVENT : grounds

    USER {
        uuid id PK
        string auth0_sub UK "Auth0 subject; no password stored"
        string email
        timestamptz created_at
        timestamptz deleted_at "GDPR soft-delete"
    }
    PROFILE {
        uuid id PK
        uuid user_id FK
        string source_type "resume|linkedin|intake"
        bytea raw_blob_ref "encrypted; S3 key"
        int version
        bool is_active
        timestamptz created_at
    }
    PARSED_PROFILE_FACTS {
        uuid id PK
        uuid profile_id FK
        jsonb education "degrees, institutions"
        jsonb experience
        jsonb skills
        float german_gpa "DETERMINISTIC (Modified Bavarian); method recorded"
        string gpa_method
        int total_ects "DETERMINISTIC"
        bool needs_verification
    }
    UNIVERSITY {
        uuid id PK
        string name
        string city
        string state_bundesland
        bool is_public
        string website_url
    }
    PROGRAM {
        uuid id PK
        uuid university_id FK
        string title
        string degree "MSc|MA|MEng|..."
        string teaching_language "en|de|mixed"
        text description
        string daad_program_id "external id"
        vector embedding "vector(1024) bge-m3"
        uuid provenance_id FK "grounds scraped core facts"
        bool needs_verification
        timestamptz last_seen_at
    }
    PROGRAM_REQUIREMENT {
        uuid id PK
        uuid program_id FK
        string kind "gpa|language|gre|gmat|prerequisite|aps"
        jsonb value "OfficialValue payload"
        uuid provenance_id FK
        bool needs_verification
    }
    DEADLINE_EVENT {
        uuid id PK
        uuid program_id FK
        string intake "winter|summer + year"
        string kind "application|uni_assist|vpd|enrollment"
        date due_date
        uuid provenance_id FK
        bool needs_verification
    }
    SAVED_UNIVERSITY {
        uuid id PK
        uuid user_id FK
        uuid program_id FK
        string note
        timestamptz created_at
    }
    APPLICATION {
        uuid id PK
        uuid user_id FK
        uuid program_id FK
        string state "state machine (see §3)"
        string intake
        timestamptz updated_at
    }
    APPLICATION_STEP {
        uuid id PK
        uuid application_id FK
        string title
        string status "pending|in_progress|blocked|done|skipped"
        int order_index
        date due_date
    }
    ROADMAP {
        uuid id PK
        uuid profile_id FK
        timestamptz generated_at
        jsonb global_disclaimers
    }
    ROADMAP_ITEM {
        uuid id PK
        uuid roadmap_id FK
        uuid application_id FK "nullable"
        string category
        string title
        text body
        string program_id "nullable; for composite-hash dedupe"
        string status "locked|active|done"
        date deadline
        string composite_key "dedupe hash (agent-workflows §6)"
        bool needs_verification
    }
    DOCUMENT {
        uuid id PK
        uuid user_id FK
        uuid application_id FK "nullable"
        string doc_type "SOP|EUROPASS_CV|LOR|TRANSLATION|OTHER"
        string storage_key "S3; encrypted"
        int version
        bool is_generated "true = LLM-authored, not official"
        timestamptz created_at
    }
    SCRAPE_SOURCE {
        uuid id PK
        string name "DAAD|Uni-Assist|<portal>"
        string source_type
        string base_url
        string robots_url
        int rate_limit_per_min
        timestamptz last_crawled_at
        bool enabled
    }
    PROVENANCE_RECORD {
        uuid id PK
        uuid source_id FK
        string source_name
        string source_url
        timestamptz retrieved_at
        string content_hash "change detection"
        text excerpt "short cited snippet"
    }
```

---

## 3. Application state machine

`Application.state` is an explicit FSM. Transitions are enforced in code (a transition table), not
left to free text — so progress is auditable and the roadmap can compute "what's next."

```mermaid
stateDiagram-v2
    [*] --> DRAFT
    DRAFT --> IN_PREPARATION: start prep
    IN_PREPARATION --> DOCUMENTS_READY: all required docs ready
    DOCUMENTS_READY --> SUBMITTED: submit via Uni-Assist / portal
    SUBMITTED --> UNDER_REVIEW: university acknowledges
    UNDER_REVIEW --> INTERVIEW: interview requested
    INTERVIEW --> ADMITTED
    UNDER_REVIEW --> ADMITTED
    UNDER_REVIEW --> WAITLISTED
    UNDER_REVIEW --> REJECTED
    WAITLISTED --> ADMITTED
    WAITLISTED --> REJECTED
    ADMITTED --> OFFER_ACCEPTED: accept offer
    ADMITTED --> OFFER_DECLINED: decline offer
    OFFER_ACCEPTED --> ENROLLED: enrollment confirmed
    DRAFT --> WITHDRAWN
    IN_PREPARATION --> WITHDRAWN
    DOCUMENTS_READY --> WITHDRAWN
    SUBMITTED --> WITHDRAWN
    REJECTED --> [*]
    OFFER_DECLINED --> [*]
    ENROLLED --> [*]
    WITHDRAWN --> [*]
```

### Transition table (the allowed edges; anything else is rejected)

| From | Allowed → To |
|---|---|
| `DRAFT` | `IN_PREPARATION`, `WITHDRAWN` |
| `IN_PREPARATION` | `DOCUMENTS_READY`, `WITHDRAWN` |
| `DOCUMENTS_READY` | `SUBMITTED`, `WITHDRAWN` |
| `SUBMITTED` | `UNDER_REVIEW`, `WITHDRAWN` |
| `UNDER_REVIEW` | `INTERVIEW`, `ADMITTED`, `WAITLISTED`, `REJECTED` |
| `INTERVIEW` | `ADMITTED`, `REJECTED` |
| `WAITLISTED` | `ADMITTED`, `REJECTED` |
| `ADMITTED` | `OFFER_ACCEPTED`, `OFFER_DECLINED` |
| `OFFER_ACCEPTED` | `ENROLLED` |
| `REJECTED`, `OFFER_DECLINED`, `ENROLLED`, `WITHDRAWN` | *(terminal)* |

`ApplicationStep.status` is a simpler lifecycle: `pending → in_progress → done`, with side-paths
`in_progress → blocked → in_progress` and `pending → skipped`.

---

## 4. Provenance & grounding (how it maps to §2 rules)

```mermaid
graph LR
    src["SCRAPE_SOURCE"] --> prov["PROVENANCE_RECORD<br/>{source_url, retrieved_at, content_hash}"]
    prov --> p["PROGRAM (core facts)"]
    prov --> req["PROGRAM_REQUIREMENT"]
    prov --> dl["DEADLINE_EVENT"]
    note["No provenance → needs_verification=true<br/>(never a trusted fact)"]
```

- One `ProvenanceRecord` per scraped row; `content_hash` powers incremental refresh
  (`data-pipeline.md`).
- The guardrail layer (`agent-workflows.md` §10) reads `needs_verification` when composing the
  roadmap and surfaces a UI badge + disclaimer.

---

## 5. Indexing notes

| Table | Index | Why |
|---|---|---|
| `program` | `ivfflat (embedding vector_cosine_ops)` | ANN semantic search (ProgramSearch) |
| `program` | btree `(daad_program_id)`, `(university_id)` | upsert + joins |
| `deadline_event` | btree `(program_id, intake, kind)` | deadline lookups |
| `application` | btree `(user_id, state)` | dashboard queries |
| `provenance_record` | btree `(source_url, content_hash)` | change detection / dedupe |
| `roadmap_item` | btree `(roadmap_id, composite_key)` | dedupe enforcement |

> pgvector ANN indexes support ≤2000 dims; bge-m3's 1024 fits comfortably (a reason it was chosen
> over NV-Embed-v2's 4096 — ADR-0003).

---

## 6. Open questions (for review)

1. **Profile versioning:** keep N historical `Profile` versions (current design) or overwrite? Affects GDPR export scope.
2. **Requirement value shape:** `ProgramRequirement.value` as flexible `jsonb` (current) vs typed sub-tables per `kind`. JSONB is simpler now; revisit if query patterns demand typing.
3. **Soft vs hard delete** for GDPR: `deleted_at` soft-delete + scheduled purge job — confirm retention window.
