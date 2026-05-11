from functools import lru_cache
from typing import Any

from fastapi import HTTPException

from ..data_loader import load_table


@lru_cache(maxsize=1)
def _base_customers() -> list[dict[str, Any]]:
    return load_table("customers")


@lru_cache(maxsize=1)
def _similar_users() -> list[dict[str, Any]]:
    return sorted(load_table("similar_users"), key=lambda row: (row.get("query_customer_idx") or 0, row.get("rank") or 0))


@lru_cache(maxsize=1)
def _taste_summary() -> list[dict[str, Any]]:
    return sorted(
        load_table("taste_summary"), key=lambda row: (row.get("query_customer_idx") or 0, row.get("rank") or 0)
    )


def similar_user_customer_ids() -> set[int]:
    return {int(row["query_customer_idx"]) for row in _similar_users() if row.get("query_customer_idx") is not None}


def _recommendation_customer_ids() -> set[int]:
    from .recommendation_service import recommendation_customer_ids

    return recommendation_customer_ids()


@lru_cache(maxsize=1)
def list_customers() -> list[dict[str, Any]]:
    recommendation_ids = _recommendation_customer_ids()
    similar_ids = similar_user_customer_ids()
    by_id: dict[int, dict[str, Any]] = {}

    for customer in _base_customers():
        customer_idx = int(customer["customer_idx"])
        by_id[customer_idx] = {
            **customer,
            "customer_idx": customer_idx,
            "has_recommendations": customer_idx in recommendation_ids,
            "has_similar_users": customer_idx in similar_ids,
        }

    for customer_idx in similar_ids:
        if customer_idx not in by_id:
            by_id[customer_idx] = {
                "customer_id": None,
                "customer_idx": customer_idx,
                "display_name": f"Similarity Customer {customer_idx}",
                "customer_segment": "Similarity Demo Customer",
                "train_purchase_events": None,
                "train_unique_items": None,
                "last_train_purchase_date": None,
                "has_recommendations": customer_idx in recommendation_ids,
                "has_similar_users": True,
            }
        else:
            by_id[customer_idx]["has_similar_users"] = True

    return sorted(by_id.values(), key=lambda row: row["customer_idx"])


def get_customer(customer_idx: int) -> dict[str, Any]:
    for customer in list_customers():
        if int(customer["customer_idx"]) == customer_idx:
            return customer
    raise HTTPException(status_code=404, detail=f"Customer {customer_idx} was not found in the demo export.")


def get_similar_users(customer_idx: int) -> dict[str, Any]:
    rows = [row for row in _similar_users() if int(row.get("query_customer_idx", -1)) == customer_idx]
    if not rows:
        raise HTTPException(status_code=404, detail=f"No similar-user rows were exported for customer {customer_idx}.")

    return {
        "customer": get_customer(customer_idx),
        "similar_users": rows,
    }


def get_taste_summary(customer_idx: int) -> dict[str, Any]:
    rows = [row for row in _taste_summary() if int(row.get("query_customer_idx", -1)) == customer_idx]
    if not rows:
        raise HTTPException(status_code=404, detail=f"No taste-summary rows were exported for customer {customer_idx}.")

    return {
        "customer": get_customer(customer_idx),
        "taste_summary": rows,
    }
