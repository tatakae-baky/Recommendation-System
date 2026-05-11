from typing import Any

from pydantic import BaseModel


class RecommendationResponse(BaseModel):
    customer: dict[str, Any]
    model_name: str | None = None
    recommendations: list[dict[str, Any]]
