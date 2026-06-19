"""Profile ingestion endpoints (build Phase 4).

`POST /api/v1/profiles/ingest` takes a structured intake form (primary path); sibling routes accept
a resume file (PDF/DOCX/text) and a LinkedIn JSON export. All three normalize into the typed
Profile and store it for roadmap generation.
"""

from __future__ import annotations

from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel

from app.api.deps import get_profile_store
from app.api.store import ProfileStore
from app.ingestion.parser import (
    IntakeForm,
    UnsupportedDocument,
    parse_intake,
    parse_linkedin,
    parse_resume,
)
from app.llm.schemas import Profile

router = APIRouter(prefix="/api/v1/profiles", tags=["profiles"])

StoreDep = Annotated[ProfileStore, Depends(get_profile_store)]


class IngestResponse(BaseModel):
    profile_id: UUID
    profile: Profile


class ResumeIngestResponse(IngestResponse):
    chunks: int


@router.post("/ingest", response_model=IngestResponse, status_code=status.HTTP_201_CREATED)
def ingest_intake(form: IntakeForm, store: StoreDep) -> IngestResponse:
    profile = store.add(parse_intake(form))
    return IngestResponse(profile_id=profile.id, profile=profile)


@router.post("/ingest/linkedin", response_model=IngestResponse, status_code=status.HTTP_201_CREATED)
def ingest_linkedin(export: dict[str, Any], store: StoreDep) -> IngestResponse:
    profile = store.add(parse_linkedin(export))
    return IngestResponse(profile_id=profile.id, profile=profile)


@router.post(
    "/ingest/resume", response_model=ResumeIngestResponse, status_code=status.HTTP_201_CREATED
)
async def ingest_resume(
    store: StoreDep, file: Annotated[UploadFile, File()]
) -> ResumeIngestResponse:
    data = await file.read()
    try:
        profile, chunks = parse_resume(
            data,
            content_type=file.content_type or "application/octet-stream",
            filename=file.filename or "upload",
        )
    except UnsupportedDocument as exc:
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail=str(exc))
    store.add(profile)
    return ResumeIngestResponse(profile_id=profile.id, profile=profile, chunks=len(chunks))
