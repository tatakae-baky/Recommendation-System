from functools import lru_cache
from typing import Any

from fastapi import HTTPException

from ..data_loader import load_table

SIMILAR_ITEM_LIMIT = 40


@lru_cache(maxsize=1)
def _articles() -> list[dict[str, Any]]:
    return load_table("articles")


@lru_cache(maxsize=1)
def _article_by_id() -> dict[str, dict[str, Any]]:
    return {str(item["article_id"]): item for item in _articles()}


@lru_cache(maxsize=1)
def _article_by_idx() -> dict[int, dict[str, Any]]:
    return {int(item["article_idx"]): item for item in _articles() if item.get("article_idx") is not None}


@lru_cache(maxsize=1)
def _similar_rows() -> list[dict[str, Any]]:
    return sorted(load_table("similar_items"), key=lambda row: (row.get("query_article_id"), row.get("rank") or 0))


def list_items(
    q: str | None = None,
    limit: int = 250,
    offset: int = 0,
    in_home_feed: bool | None = None,
    in_similar_items: bool | None = None,
) -> dict[str, Any]:
    items = _articles()
    if q:
        needle = q.lower()
        items = [
            item
            for item in items
            if needle in str(item.get("prod_name", "")).lower()
            or needle in str(item.get("product_type_name", "")).lower()
            or needle in str(item.get("garment_group_name", "")).lower()
            or needle in str(item.get("article_id", "")).lower()
        ]
    if in_home_feed is not None:
        items = [item for item in items if bool(item.get("in_home_feed")) is in_home_feed]
    if in_similar_items is not None:
        items = [item for item in items if bool(item.get("in_similar_items")) is in_similar_items]

    total = len(items)
    limit = max(1, min(limit, 1000))
    offset = max(0, offset)
    return {"total": total, "limit": limit, "offset": offset, "items": items[offset : offset + limit]}


def get_item(article_id: str) -> dict[str, Any]:
    item = _article_by_id().get(str(article_id))
    if not item:
        raise HTTPException(status_code=404, detail=f"Article {article_id} was not found in the demo catalog.")
    return item


def _article_from_row(row: dict[str, Any], article_field: str, idx_field: str) -> dict[str, Any] | None:
    item = _article_by_id().get(str(row.get(article_field)))
    if item:
        return item
    idx = row.get(idx_field)
    return _article_by_idx().get(int(idx)) if idx is not None else None


def _forward_similar(article_id: str) -> list[dict[str, Any]]:
    rows = [row for row in _similar_rows() if str(row.get("query_article_id")) == str(article_id)]
    similar = []

    for row in rows:
        item = _article_from_row(row, "similar_article_id", "similar_article_idx")
        if not item:
            continue
        similar.append(
            {
                **item,
                "rank": row.get("rank"),
                "similarity_score": row.get("similarity_score"),
                "similarity_method": row.get("method"),
                "similarity_source": "exported_forward",
            }
        )

    return similar


def _reverse_similar(article_id: str) -> list[dict[str, Any]]:
    rows = [row for row in _similar_rows() if str(row.get("similar_article_id")) == str(article_id)]
    rows = sorted(rows, key=lambda row: (-(row.get("similarity_score") or 0), row.get("rank") or 9999))
    similar = []

    for rank, row in enumerate(rows, start=1):
        item = _article_from_row(row, "query_article_id", "query_article_idx")
        if not item:
            continue
        similar.append(
            {
                **item,
                "rank": rank,
                "similarity_score": row.get("similarity_score"),
                "similarity_method": f"{row.get('method')}_reverse_lookup",
                "similarity_source": "reverse_lookup",
            }
        )

    return similar


def _metadata_fallback(query_item: dict[str, Any]) -> list[dict[str, Any]]:
    weighted_fields = [
        ("product_type_name", 0.28),
        ("garment_group_name", 0.22),
        ("section_name", 0.18),
        ("department_name", 0.12),
        ("colour_group_name", 0.10),
        ("product_group_name", 0.06),
        ("graphical_appearance_name", 0.04),
    ]

    scored_items = []
    query_article_id = str(query_item.get("article_id"))
    for item in _articles():
        if str(item.get("article_id")) == query_article_id:
            continue

        score = 0.0
        matched_fields = []
        for field, weight in weighted_fields:
            if query_item.get(field) and query_item.get(field) == item.get(field):
                score += weight
                matched_fields.append(field)

        if score > 0:
            scored_items.append((score, matched_fields, item))

    scored_items.sort(
        key=lambda row: (
            -row[0],
            str(row[2].get("prod_name") or ""),
            str(row[2].get("article_id") or ""),
        )
    )

    similar = []
    for rank, (score, matched_fields, item) in enumerate(scored_items[:SIMILAR_ITEM_LIMIT], start=1):
        similar.append(
            {
                **item,
                "rank": rank,
                "similarity_score": round(score, 6),
                "similarity_method": "metadata_attribute_overlap_fallback",
                "similarity_source": "metadata_fallback",
                "matched_similarity_fields": matched_fields,
            }
        )

    return similar


def _dedupe(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen = set()
    deduped = []
    for item in items:
        article_id = str(item.get("article_id"))
        if article_id in seen:
            continue
        seen.add(article_id)
        deduped.append({**item, "rank": len(deduped) + 1})
    return deduped[:SIMILAR_ITEM_LIMIT]


def similar_items(article_id: str) -> dict[str, Any]:
    query_item = get_item(article_id)
    forward = _forward_similar(article_id)

    if forward:
        reverse = _reverse_similar(article_id)
        similar = _dedupe([*forward, *reverse])
        if len(similar) < SIMILAR_ITEM_LIMIT:
            similar = _dedupe([*similar, *_metadata_fallback(query_item)])
        source = "exported_forward"
    else:
        reverse = _reverse_similar(article_id)
        if reverse:
            similar = _dedupe([*reverse, *_metadata_fallback(query_item)])
            source = "reverse_lookup"
        else:
            similar = _metadata_fallback(query_item)
            source = "metadata_fallback"

    return {"query_item": query_item, "similar_items": similar, "similarity_source": source}
