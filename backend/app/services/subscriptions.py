from datetime import date, timedelta
from typing import Optional, List

from sqlalchemy.orm import Session

from app.models import Subscription
from app.schemas import SubscriptionCreate, SubscriptionUpdate


def get_subscriptions_for_user(db: Session, user_id: int) -> list[Subscription]:
    """Get all subscriptions for a specific user."""
    return db.query(Subscription).filter(Subscription.user_id == user_id).all()


def get_subscription(
    db: Session, user_id: int, subscription_id: int
) -> Optional[Subscription]:
    """Get a specific subscription by ID, ensuring it belongs to the user."""
    return (
        db.query(Subscription)
        .filter(Subscription.id == subscription_id, Subscription.user_id == user_id)
        .first()
    )


def create_subscription(
    db: Session, user_id: int, subscription_in: SubscriptionCreate
) -> Subscription:
    """Create a new subscription for a user."""
    # reminder_days_before should never be None at this point (handled in endpoint)
    reminder_days = subscription_in.reminder_days_before or 3
    
    subscription = Subscription(
        user_id=user_id,
        name=subscription_in.name,
        price=subscription_in.price,
        currency=subscription_in.currency,
        billing_cycle=subscription_in.billing_cycle,
        next_billing_date=subscription_in.next_billing_date,
        category=subscription_in.category,
        is_active=subscription_in.is_active,
        reminder_enabled=subscription_in.reminder_enabled,
        reminder_days_before=reminder_days,
    )
    db.add(subscription)
    db.commit()
    db.refresh(subscription)
    return subscription


def update_subscription(
    db: Session, db_obj: Subscription, subscription_in: SubscriptionUpdate
) -> Subscription:
    """Update an existing subscription with partial data."""
    update_data = subscription_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_obj, field, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete_subscription(db: Session, db_obj: Subscription) -> None:
    """Delete a subscription."""
    db.delete(db_obj)
    db.commit()


def get_upcoming_renewals(db: Session, user_id: int, within_days: int = 7) -> List[Subscription]:
    """
    Return active subscriptions for the given user that have a next_billing_date
    within the next `within_days` days.
    Only include subscriptions where reminder_enabled is True.
    """
    today = date.today()
    cutoff_date = today + timedelta(days=within_days)
    
    return (
        db.query(Subscription)
        .filter(
            Subscription.user_id == user_id,
            Subscription.is_active == True,
            Subscription.reminder_enabled == True,
            Subscription.next_billing_date.isnot(None),
            Subscription.next_billing_date >= today,
            Subscription.next_billing_date <= cutoff_date,
        )
        .order_by(Subscription.next_billing_date.asc())
        .all()
    )

