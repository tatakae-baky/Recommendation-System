from typing import Any

from pydantic import BaseModel


class FlexibleModel(BaseModel):
    class Config:
        extra = "allow"


class Item(FlexibleModel):
    article_id: str
    prod_name: str | None = None
    product_type_name: str | None = None
    garment_group_name: str | None = None
    image_url: str | None = None


class ItemList(BaseModel):
    total: int
    limit: int
    offset: int
    items: list[dict[str, Any]]
