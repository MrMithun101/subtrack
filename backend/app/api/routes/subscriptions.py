from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.dependencies import get_db
from app.models import Subscription, User
from app.schemas import SubscriptionCreate, SubscriptionRead, SubscriptionUpdate
from app.services.subscriptions import (
    create_subscription,
    delete_subscription,
    get_subscription,
    get_subscriptions_for_user,
    update_subscription,
)

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


@router.get("", response_model=List[SubscriptionRead])
def list_subscriptions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all subscriptions for the current user."""
    subscriptions = get_subscriptions_for_user(db, current_user.id)
    return subscriptions


@router.get("/summary")
def get_subscriptions_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get summary statistics for the current user's subscriptions."""
    subscriptions = db.query(Subscription).filter(
        Subscription.user_id == current_user.id, Subscription.is_active == True
    ).all()

    total_active = len(subscriptions)
    total_monthly_cost = 0.0
    by_billing_cycle = {"monthly": 0.0, "yearly": 0.0, "weekly": 0.0}

    for sub in subscriptions:
        price = float(sub.price)
        cycle = sub.billing_cycle.lower()

        # Calculate monthly equivalent
        if cycle == "monthly":
            monthly_equivalent = price
            by_billing_cycle["monthly"] += price
        elif cycle == "yearly":
            monthly_equivalent = price / 12
            by_billing_cycle["yearly"] += price
        elif cycle == "weekly":
            monthly_equivalent = price * 4.345
            by_billing_cycle["weekly"] += price
        else:
            # Default to monthly if unknown cycle
            monthly_equivalent = price
            by_billing_cycle["monthly"] += price

        total_monthly_cost += monthly_equivalent

    return {
        "total_active": total_active,
        "total_monthly_cost": round(total_monthly_cost, 2),
        "by_billing_cycle": {
            "monthly": round(by_billing_cycle["monthly"], 2),
            "yearly": round(by_billing_cycle["yearly"], 2),
            "weekly": round(by_billing_cycle["weekly"], 2),
        },
    }


@router.post("", response_model=SubscriptionRead, status_code=status.HTTP_201_CREATED)
def create_subscription_endpoint(
    subscription_in: SubscriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new subscription for the current user."""
    subscription = create_subscription(db, current_user.id, subscription_in)
    return subscription


@router.get("/{subscription_id}", response_model=SubscriptionRead)
def get_subscription_endpoint(
    subscription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific subscription by ID."""
    subscription = get_subscription(db, current_user.id, subscription_id)
    if subscription is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found"
        )
    return subscription


@router.put("/{subscription_id}", response_model=SubscriptionRead)
def update_subscription_endpoint(
    subscription_id: int,
    subscription_in: SubscriptionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a subscription."""
    subscription = get_subscription(db, current_user.id, subscription_id)
    if subscription is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found"
        )
    updated_subscription = update_subscription(db, subscription, subscription_in)
    return updated_subscription


@router.delete("/{subscription_id}")
def delete_subscription_endpoint(
    subscription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a subscription."""
    subscription = get_subscription(db, current_user.id, subscription_id)
    if subscription is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found"
        )
    delete_subscription(db, subscription)
    return {"detail": "Subscription deleted"}

