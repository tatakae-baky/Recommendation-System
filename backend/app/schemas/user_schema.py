from pydantic import BaseModel


class Customer(BaseModel):
    customer_idx: int
    display_name: str
    customer_segment: str | None = None
    has_recommendations: bool = False
    has_similar_users: bool = False

    class Config:
        extra = "allow"
