from fastapi import APIRouter

from ..services import recommendation_service

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.get("/{customer_idx}")
def get_recommendations(customer_idx: int):
    return recommendation_service.get_recommendations(customer_idx)
