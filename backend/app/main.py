"""FastAPI application entrypoint (build Phase 4).

Wires the profile-ingestion and roadmap-generation routers, structured logging, CORS, and a health
check. Run locally with ``uvicorn app.main:app --reload`` (or via docker-compose).
"""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routers import profiles, roadmap
from app.core.config import get_settings
from app.core.logging import configure_logging

settings = get_settings()
configure_logging(json_logs=settings.app_env != "dev")

app = FastAPI(
    title="DeutschPrep API",
    version="0.1.0",
    summary="German Master's admission copilot — profile ingestion + roadmap generation.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(profiles.router)
app.include_router(roadmap.router)


@app.get("/health", tags=["meta"])
def health() -> dict[str, object]:
    return {
        "status": "ok",
        "llm_mode": settings.llm_mode,
        "llm_configured": settings.llm_configured,
        "model": settings.claude_model,
    }
