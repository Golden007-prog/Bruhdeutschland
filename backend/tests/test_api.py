"""API tests with the LLM and stores overridden (TestClient; no network)."""

from __future__ import annotations

from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from app.api.deps import get_llm_provider, get_profile_store, get_roadmap_store
from app.api.store import ProfileStore, RoadmapStore
from app.llm.client import ScriptedLLMProvider
from app.llm.schemas import PlanDraft, SkillGap, SkillGapList
from app.main import app

INTAKE = {
    "field": "Computer Science",
    "degree_level": "MSc",
    "raw_gpa": 8.2,
    "gpa_scale": {"best": 10.0, "min_pass": 4.0},
    "courses": [{"credits": 30, "passed": True}, {"credits": 30, "passed": True}],
}


def _llm() -> ScriptedLLMProvider:
    return ScriptedLLMProvider(
        [
            PlanDraft(field="Computer Science"),
            SkillGapList(skill_gaps=[SkillGap(skill="German B2", severity="high")]),
        ]
    )


@pytest.fixture
def client() -> Iterator[TestClient]:
    profiles = ProfileStore()
    roadmaps = RoadmapStore()
    app.dependency_overrides[get_profile_store] = lambda: profiles
    app.dependency_overrides[get_roadmap_store] = lambda: roadmaps
    app.dependency_overrides[get_llm_provider] = _llm
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_health(client: TestClient) -> None:
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_ingest_generate_and_fetch_roadmap(client: TestClient) -> None:
    ing = client.post("/api/v1/profiles/ingest", json=INTAKE)
    assert ing.status_code == 201
    profile_id = ing.json()["profile_id"]

    gen = client.post("/api/v1/roadmap/generate", json={"profile_id": profile_id})
    assert gen.status_code == 201
    body = gen.json()
    assert body["items"]
    assert body["global_disclaimers"]
    roadmap_id = body["id"]

    got = client.get(f"/api/v1/roadmap/{roadmap_id}")
    assert got.status_code == 200
    assert got.json()["id"] == roadmap_id


def test_generate_for_unknown_profile_is_404(client: TestClient) -> None:
    r = client.post(
        "/api/v1/roadmap/generate", json={"profile_id": "00000000-0000-0000-0000-000000000000"}
    )
    assert r.status_code == 404


def test_fetch_unknown_roadmap_is_404(client: TestClient) -> None:
    r = client.get("/api/v1/roadmap/00000000-0000-0000-0000-000000000000")
    assert r.status_code == 404


def test_stream_endpoint_emits_sse_events(client: TestClient) -> None:
    profile_id = client.post("/api/v1/profiles/ingest", json=INTAKE).json()["profile_id"]
    r = client.post("/api/v1/roadmap/generate/stream", json={"profile_id": profile_id})
    assert r.status_code == 200
    assert "text/event-stream" in r.headers["content-type"]
    assert "event: progress" in r.text
    assert "event: roadmap" in r.text


def test_ingest_resume_file(client: TestClient) -> None:
    r = client.post(
        "/api/v1/profiles/ingest/resume",
        files={"file": ("cv.txt", b"Jane Doe\n\nBackend engineer.", "text/plain")},
    )
    assert r.status_code == 201
    assert r.json()["chunks"] >= 1
