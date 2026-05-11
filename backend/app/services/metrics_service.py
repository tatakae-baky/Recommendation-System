import math
from typing import Any

from ..data_loader import load_json


DISPLAY_METRICS = [
    ("recall_at_k", "Recall@20"),
    ("ndcg_at_k", "NDCG@20"),
    ("mrr_at_k", "MRR@20"),
    ("map_at_k", "MAP@20"),
    ("hitrate_at_k", "HitRate@20"),
    ("catalog_coverage", "Coverage"),
]


def _as_dict(value: Any) -> dict[str, Any]:
    return value if isinstance(value, dict) else {}


def _tag_row(row: dict[str, Any], label: str) -> dict[str, Any]:
    return {"display_name": label, **row}


def _as_rows(value: Any) -> list[dict[str, Any]]:
    if isinstance(value, list):
        return [row for row in value if isinstance(row, dict)]
    if isinstance(value, dict):
        return [value]
    return []


def _json_safe(value: Any) -> Any:
    if isinstance(value, float) and not math.isfinite(value):
        return None
    if isinstance(value, dict):
        return {key: _json_safe(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_json_safe(item) for item in value]
    return value


def get_metrics() -> dict[str, Any]:
    raw = load_json("metrics")
    best_info = _as_dict(raw.get("best_final_model_info"))
    decision = _as_dict(raw.get("hybrid_decision_summary"))
    best_hybrid = _as_dict(best_info.get("best_final_primary_metrics")) or _as_dict(
        decision.get("best_hybrid_validation_row")
    )
    best_popularity = _as_dict(decision.get("best_popularity_validation_row"))
    primary_rows = _as_rows(raw.get("primary_metrics"))

    comparison_rows = []
    if best_hybrid:
        comparison_rows.append(_tag_row(best_hybrid, "Hybrid validation"))
    if best_popularity:
        comparison_rows.append(_tag_row(best_popularity, "Popularity validation"))
    for row in primary_rows:
        if row.get("model_name") == raw.get("final_model_name"):
            comparison_rows.append(_tag_row(row, "Hybrid test"))

    featured_metrics = [
        {
            "key": key,
            "label": label,
            "value": best_hybrid.get(key),
            "popularity_value": best_popularity.get(key),
            "uplift": (
                (best_hybrid.get(key) - best_popularity.get(key)) / best_popularity.get(key)
                if best_hybrid.get(key) is not None and best_popularity.get(key)
                else None
            ),
        }
        for key, label in DISPLAY_METRICS
    ]

    return _json_safe({
        **raw,
        "best_model_name": raw.get("final_model_name") or best_hybrid.get("model_name"),
        "comparison_rows": comparison_rows,
        "featured_metrics": featured_metrics,
        "decision_summary": decision,
    })
