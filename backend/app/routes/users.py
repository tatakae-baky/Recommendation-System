from fastapi import APIRouter

from ..services import user_service

router = APIRouter(tags=["users"])


@router.get("/customers")
def list_customers():
    return user_service.list_customers()


@router.get("/users/{customer_idx}/similar")
def get_similar_users(customer_idx: int):
    return user_service.get_similar_users(customer_idx)


@router.get("/users/{customer_idx}/taste-summary")
def get_taste_summary(customer_idx: int):
    return user_service.get_taste_summary(customer_idx)
