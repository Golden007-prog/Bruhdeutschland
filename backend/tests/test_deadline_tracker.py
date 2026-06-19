"""Tests for deterministic ordering + status assignment (agent-workflows.md §6)."""

from __future__ import annotations

from datetime import date, datetime

from app.llm.schemas import OfficialValue, Provenance, RoadmapItem
from app.models.enums import FeatureCategory
from app.services.deadline_tracker import assign_statuses, order_items

PROV = Provenance(source_name="Uni", source_url="https://uni.de", retrieved_at=datetime(2026, 1, 1))


def _item(title: str, key: str, due: date | None = None) -> RoadmapItem:
    deadline = OfficialValue.grounded(due, PROV) if due else None
    return RoadmapItem(
        category=FeatureCategory.PROFILE, title=title, composite_key=key, deadline=deadline
    )


def test_orders_by_deadline_with_undated_last() -> None:
    a = _item("A", "a", date(2026, 9, 1))
    b = _item("B", "b", date(2026, 5, 1))
    c = _item("C", "c")
    ordered = order_items([a, b, c])
    assert [i.title for i in ordered] == ["B", "A", "C"]


def test_dependency_comes_before_dependent() -> None:
    x = _item("X", "x")
    y = _item("Y", "y")
    y.depends_on = [x.id]
    ordered = order_items([y, x])
    assert [i.title for i in ordered] == ["X", "Y"]


def test_assign_statuses_keeps_done_activates_first_unblocked() -> None:
    done = _item("Done", "d")
    done.status = "done"
    i1 = _item("One", "1")
    i2 = _item("Two", "2")
    assign_statuses([done, i1, i2])
    assert done.status == "done"
    assert i1.status == "active"
    assert i2.status == "locked"


def test_item_blocked_by_unfinished_dependency_stays_locked() -> None:
    a = _item("A", "a")
    b = _item("B", "b")
    b.depends_on = [a.id]
    assign_statuses([b, a])  # b first in list, but depends on a (not done)
    assert b.status == "locked"
    assert a.status == "active"
