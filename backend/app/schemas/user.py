from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    is_active: bool = True
    is_superuser: bool = False
    default_reminder_days_before: int = 3


class UserCreate(UserBase):
    password: str


class UserRead(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserInDB(UserBase):
    id: int
    hashed_password: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

