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
    reminder_enabled: bool = True
    reminder_days_before: int = 3


class SubscriptionCreate(BaseModel):
    """Create schema - reminder_days_before is optional to allow using user's default."""
    name: str
    price: float
    currency: str = "USD"
    billing_cycle: str = "monthly"
    next_billing_date: Optional[date] = None
    category: Optional[str] = None
    is_active: bool = True
    reminder_enabled: bool = True
    reminder_days_before: Optional[int] = None  # None means use user's default


class SubscriptionUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    currency: Optional[str] = None
    billing_cycle: Optional[str] = None
    next_billing_date: Optional[date] = None
    category: Optional[str] = None
    is_active: Optional[bool] = None
    reminder_enabled: Optional[bool] = None
    reminder_days_before: Optional[int] = None


class SubscriptionRead(SubscriptionBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    last_reminder_sent_at: Optional[datetime] = None

    class Config:
        from_attributes = True

