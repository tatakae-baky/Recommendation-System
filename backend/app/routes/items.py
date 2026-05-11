from fastapi import APIRouter, Query

from ..services import item_service

router = APIRouter(prefix="/items", tags=["items"])


@router.get("")
def list_items(
    q: str | None = Query(default=None, description="Search product names, types, groups, or article id."),
    limit: int = Query(default=250, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
    in_home_feed: bool | None = None,
    in_similar_items: bool | None = None,
):
    return item_service.list_items(q=q, limit=limit, offset=offset, in_home_feed=in_home_feed, in_similar_items=in_similar_items)


@router.get("/{article_id}")
def get_item(article_id: str):
    return item_service.get_item(article_id)


@router.get("/{article_id}/similar")
def get_similar_items(article_id: str):
    return item_service.similar_items(article_id)
