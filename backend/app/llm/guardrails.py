"""Guardrail layer — runs on every agent output and the final Roadmap (agent-workflows.md §10).

Order: schema validation (already guaranteed by Pydantic) → grounding check (ungrounded official
claim → ``needs_verification``) → PII redaction in logs → disclaimer enforcement for visa/finance.
"""

from __future__ import annotations

from app.core.config import DISCLAIMER
from app.core.logging import redact_pii
from app.llm.schemas import (
    AgentNameEnum,
    AgentOutput,
    Roadmap,
    RoadmapItem,
    RoadmapItemDraft,
)

__all__ = ["redact_pii", "run_guardrails", "guard_roadmap", "DISCLAIMER_AGENTS"]

#: Agents whose output must carry the disclaimer (CLAUDE.md §2 rule 5).
DISCLAIMER_AGENTS: frozenset[str] = frozenset(
    {AgentNameEnum.FINANCE_LOGISTICS, AgentNameEnum.VISA_RELOCATION}
)


def _coerce_item(item: RoadmapItemDraft) -> RoadmapItemDraft:
    """An item whose deadline is ungrounded is marked needs_verification (never guessed)."""
    if item.deadline is not None and item.deadline.needs_verification:
        item.needs_verification = True
    return item


def run_guardrails(output: AgentOutput) -> AgentOutput:
    """Coerce ungrounded official claims and enforce the disclaimer for advisory agents."""
    for item in output.items:
        _coerce_item(item)
    if output.agent in DISCLAIMER_AGENTS and not output.disclaimers:
        output.disclaimers = [DISCLAIMER]
    return output


def guard_roadmap(roadmap: Roadmap) -> Roadmap:
    """Final pass: ensure the global disclaimer is present when any advisory/ungrounded item exists."""
    advisory = any(
        i.category.value in ("finance", "visa") or i.needs_verification for i in roadmap.items
    )
    if advisory and DISCLAIMER not in roadmap.global_disclaimers:
        roadmap.global_disclaimers.append(DISCLAIMER)
    return roadmap


def item_is_grounded(item: RoadmapItem) -> bool:
    """True if no official claim on the item is awaiting verification."""
    if item.needs_verification:
        return False
    if item.deadline is not None and item.deadline.needs_verification:
        return False
    return True
