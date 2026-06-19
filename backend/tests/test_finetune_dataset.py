"""Offline unit tests for the fine-tune dataset layer (no model, no network)."""

from __future__ import annotations

import pytest

from app.services.finetune import RetrievalTriple, load_triples_jsonl, to_columnar


def test_triple_rejects_empty_fields() -> None:
    with pytest.raises(ValueError):
        RetrievalTriple(query="  ", positive="x")
    with pytest.raises(ValueError):
        RetrievalTriple(query="x", positive="")


def test_to_columnar_includes_negative_only_when_all_present() -> None:
    with_neg = [
        RetrievalTriple("q1", "p1", "n1"),
        RetrievalTriple("q2", "p2", "n2"),
    ]
    cols = to_columnar(with_neg)
    assert set(cols) == {"anchor", "positive", "negative"}
    assert cols["anchor"] == ["q1", "q2"]
    assert cols["negative"] == ["n1", "n2"]


def test_to_columnar_drops_negative_when_any_missing() -> None:
    mixed = [RetrievalTriple("q1", "p1", "n1"), RetrievalTriple("q2", "p2")]
    cols = to_columnar(mixed)
    assert set(cols) == {"anchor", "positive"}


def test_load_triples_jsonl(tmp_path) -> None:  # noqa: ANN001
    path = tmp_path / "triples.jsonl"
    path.write_text(
        '{"query": "data science master english munich", "positive": "TUM M.Sc. Data Eng.", '
        '"negative": "Germanistik MA Hamburg"}\n'
        '{"query": "maschinenbau master", "positive": "RWTH M.Sc. Maschinenbau"}\n',
        encoding="utf-8",
    )
    triples = load_triples_jsonl(path)
    assert len(triples) == 2
    assert triples[0].negative == "Germanistik MA Hamburg"
    assert triples[1].negative is None


def test_load_triples_jsonl_raises_on_garbage(tmp_path) -> None:  # noqa: ANN001
    path = tmp_path / "bad.jsonl"
    path.write_text('{"query": "x"}\n', encoding="utf-8")  # missing "positive"
    with pytest.raises(ValueError, match="invalid training example"):
        load_triples_jsonl(path)
