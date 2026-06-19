"""initial schema: pgvector extension + all tables + program ANN index

Revision ID: 0001_initial
Revises:
Create Date: 2026-06-18

This initial migration is **metadata-driven**: it enables the ``vector`` extension, then builds
every table from the validated ``app.models`` metadata (the single source of truth), then adds the
pgvector ANN index that can't be expressed as a plain SQLAlchemy index. Subsequent migrations use
normal Alembic autogenerate against this baseline.
"""

from __future__ import annotations

from collections.abc import Sequence

from alembic import op

from app.models import Base
from app.models.catalog import EMBEDDING_DIM

revision: str = "0001_initial"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# IVFFlat ANN index for cosine similarity over bge-m3 vectors (ProgramSearch). `lists` is a
# starter value; tune to ~sqrt(rows) once the corpus is populated.
_IVFFLAT_INDEX = (
    "CREATE INDEX IF NOT EXISTS ix_program_embedding_cosine "
    "ON program USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)"
)


def upgrade() -> None:
    bind = op.get_bind()
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    Base.metadata.create_all(bind=bind)
    # Guard: the embedding column width must match the chosen embedding model (ADR-0003).
    assert EMBEDDING_DIM == 1024, "Program.embedding must be vector(1024) for bge-m3"
    op.execute(_IVFFLAT_INDEX)


def downgrade() -> None:
    bind = op.get_bind()
    op.execute("DROP INDEX IF EXISTS ix_program_embedding_cosine")
    Base.metadata.drop_all(bind=bind)
    # Extension intentionally left installed (may be shared by other schemas).
