from fastapi import APIRouter

from ..services import metrics_service

router = APIRouter(prefix="/metrics", tags=["metrics"])


@router.get("")
def get_metrics():
    return metrics_service.get_metrics()
