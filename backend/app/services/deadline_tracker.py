"""Deterministic roadmap ordering + status assignment (agent-workflows.md §6, §9).

Pure functions: a topological sort honoring ``depends_on`` with deadline (then title) as the
tiebreak, and a status pass that marks the first actionable item ``active``. No model involvement.
"""

from __future__ import annotations

from datetime import date
from uuid import UUID

from app.llm.schemas import RoadmapItem

_LATE = date.max


def _deadline_key(item: RoadmapItem) -> tuple[date, str]:
    due = item.deadline.value if item.deadline and item.deadline.value else _LATE
    return (due, item.title.casefold())


def order_items(items: list[RoadmapItem]) -> list[RoadmapItem]:
    """Topologically sort by ``depends_on`` (UUID edges); ties broken by deadline then title.

    Dependencies that point outside the set are ignored. Cycles are broken deterministically by
    falling back to the deadline key, so the function always returns every input item exactly once.
    """
    by_id: dict[UUID, RoadmapItem] = {i.id: i for i in items}
    indegree: dict[UUID, int] = {i.id: 0 for i in items}
    for i in items:
        for dep in i.depends_on:
            if dep in by_id:
                indegree[i.id] += 1

    ready = sorted((i for i in items if indegree[i.id] == 0), key=_deadline_key, reverse=True)
    out: list[RoadmapItem] = []
    seen: set[UUID] = set()
    while ready:
        node = ready.pop()  # smallest deadline key first (list is reverse-sorted)
        out.append(node)
        seen.add(node.id)
        for other in items:
            if other.id in seen or other.id in {r.id for r in ready}:
                continue
            if node.id in other.depends_on:
                indegree[other.id] -= 1
        ready = sorted(
            (
                i
                for i in items
                if i.id not in seen and i.id not in {r.id for r in ready} and indegree[i.id] <= 0
            ),
            key=_deadline_key,
            reverse=True,
        )

    if len(out) != len(items):  # cycle: append the rest deterministically
        remaining = sorted((i for i in items if i.id not in seen), key=_deadline_key)
        out.extend(remaining)
    return out


def assign_statuses(items: list[RoadmapItem]) -> list[RoadmapItem]:
    """In dependency order, keep ``done`` items, make the first unblocked item ``active``, lock rest.

    An item is unblocked when every dependency it points to is already ``done``.
    """
    done_ids = {i.id for i in items if i.status == "done"}
    activated = False
    for item in items:
        if item.status == "done":
            continue
        deps_done = all(dep in done_ids for dep in item.depends_on)
        if deps_done and not activated:
            item.status = "active"
            activated = True
        else:
            item.status = "locked"
    return items
