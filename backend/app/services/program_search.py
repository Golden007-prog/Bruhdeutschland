"""ProgramSearch interface + an offline stub (agent-workflows.md §3, §9; ADR-0003).

The real implementation does pgvector RAG over DAAD data and returns programs carrying provenance.
The stub returns a small, clearly-advisory shortlist so the orchestrator and Agent 1 run offline
without a database. Stub matches are never presented as grounded official facts.
"""

from __future__ import annotations

from abc import ABC, abstractmethod

from app.llm.schemas import ProgramRef


class ProgramSearch(ABC):
    """Coarse shortlist for ``PlanContext`` (orchestrator) + authoritative matches (Agent 1)."""

    @abstractmethod
    def shortlist(self, *, field: str, degree_level: str, limit: int = 5) -> list[ProgramRef]:
        """Return up to ``limit`` candidate programs for a field + degree level."""


class StubProgramSearch(ProgramSearch):
    """Deterministic, offline shortlist keyed loosely by field. Advisory only — no provenance."""

    _CATALOG: dict[str, list[ProgramRef]] = {
        "computer science": [
            ProgramRef(program_id="tum-msc-cs", title="M.Sc. Informatics", university="TU München"),
            ProgramRef(
                program_id="rwth-msc-cs", title="M.Sc. Computer Science", university="RWTH Aachen"
            ),
            ProgramRef(
                program_id="tudarmstadt-msc-cs",
                title="M.Sc. Computer Science",
                university="TU Darmstadt",
            ),
        ],
        "data": [
            ProgramRef(
                program_id="tum-msc-de", title="M.Sc. Data Engineering", university="TU München"
            ),
            ProgramRef(
                program_id="lmu-msc-ds", title="M.Sc. Data Science", university="LMU München"
            ),
        ],
    }

    _DEFAULT: list[ProgramRef] = [
        ProgramRef(
            program_id="generic-msc",
            title="M.Sc. (field match)",
            university="German public university",
        ),
    ]

    def shortlist(self, *, field: str, degree_level: str, limit: int = 5) -> list[ProgramRef]:
        key = field.strip().casefold()
        for cat, refs in self._CATALOG.items():
            if cat in key:
                return refs[:limit]
        return self._DEFAULT[:limit]
