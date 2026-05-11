from functools import lru_cache
from typing import Any

from fastapi import HTTPException

from ..data_loader import load_table
from .user_service import get_customer


@lru_cache(maxsize=1)
def _home_feed() -> list[dict[str, Any]]:
    return sorted(load_table("home_feed"), key=lambda row: (row.get("customer_idx") or 0, row.get("rank") or 0))


def recommendation_customer_ids() -> set[int]:
    return {int(row["customer_idx"]) for row in _home_feed() if row.get("customer_idx") is not None}


def get_recommendations(customer_idx: int) -> dict[str, Any]:
    rows = [row for row in _home_feed() if int(row.get("customer_idx", -1)) == customer_idx]
    if not rows:
        raise HTTPException(
            status_code=404,
            detail=f"No personalized recommendation rows were exported for customer {customer_idx}.",
        )

    return {
        "customer": get_customer(customer_idx),
        "model_name": rows[0].get("model_name"),
        "recommendations": rows,
    }
