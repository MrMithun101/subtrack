from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class SubscriptionBase(BaseModel):
    name: str
    price: float
    currency: str = "USD"
    billing_cycle: str = "monthly"
    next_billing_date: Optional[date] = None
    category: Optional[str] = None
    is_active: bool = True


class SubscriptionCreate(SubscriptionBase):
    pass


class SubscriptionUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    currency: Optional[str] = None
    billing_cycle: Optional[str] = None
    next_billing_date: Optional[date] = None
    category: Optional[str] = None
    is_active: Optional[bool] = None


class SubscriptionRead(SubscriptionBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

