"""Roadmap generation endpoints (build Phase 4).

`POST /roadmap/generate` runs the orchestrator → fan-out → composer pipeline (LLM injected) and
returns the canonical Roadmap. `POST /roadmap/generate/stream` streams progress over SSE. `GET
/roadmap/{id}` returns a stored Roadmap.
"""

from __future__ import annotations

import json
from collections.abc import AsyncIterator
from datetime import datetime, timezone
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.agents.runner import ProgressEvent, generate_events, generate_roadmap
from app.api.deps import get_llm_provider, get_profile_store, get_roadmap_store
from app.api.store import ProfileStore, RoadmapStore
from app.llm.client import LLMProvider
from app.llm.schemas import Profile, Roadmap

router = APIRouter(prefix="/api/v1/roadmap", tags=["roadmap"])

ProfileStoreDep = Annotated[ProfileStore, Depends(get_profile_store)]
RoadmapStoreDep = Annotated[RoadmapStore, Depends(get_roadmap_store)]
LLMDep = Annotated[LLMProvider, Depends(get_llm_provider)]


class GenerateRequest(BaseModel):
    profile_id: UUID


def _require_profile(profile_id: UUID, profiles: ProfileStore) -> Profile:
    profile = profiles.get(profile_id)
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return profile


@router.post("/generate", response_model=Roadmap, status_code=status.HTTP_201_CREATED)
async def generate(
    req: GenerateRequest,
    profiles: ProfileStoreDep,
    roadmaps: RoadmapStoreDep,
    llm: LLMDep,
) -> Roadmap:
    profile = _require_profile(req.profile_id, profiles)
    roadmap = await generate_roadmap(profile, llm=llm, now=datetime.now(timezone.utc))
    return roadmaps.add(roadmap)


@router.post("/generate/stream")
async def generate_stream(
    req: GenerateRequest,
    profiles: ProfileStoreDep,
    roadmaps: RoadmapStoreDep,
    llm: LLMDep,
) -> StreamingResponse:
    profile = _require_profile(req.profile_id, profiles)

    async def event_source() -> AsyncIterator[str]:
        async for event in generate_events(profile, llm=llm, now=datetime.now(timezone.utc)):
            if isinstance(event, ProgressEvent):
                yield f"event: progress\ndata: {event.model_dump_json()}\n\n"
            elif isinstance(event, Roadmap):
                roadmaps.add(event)
                yield f"event: roadmap\ndata: {event.model_dump_json()}\n\n"
        yield f"event: end\ndata: {json.dumps({'ok': True})}\n\n"

    return StreamingResponse(event_source(), media_type="text/event-stream")


@router.get("/{roadmap_id}", response_model=Roadmap)
def get_roadmap(roadmap_id: UUID, roadmaps: RoadmapStoreDep) -> Roadmap:
    roadmap = roadmaps.get(roadmap_id)
    if roadmap is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Roadmap not found")
    return roadmap
