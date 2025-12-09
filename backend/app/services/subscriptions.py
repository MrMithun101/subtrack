from typing import Optional

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
    subscription = Subscription(
        user_id=user_id,
        name=subscription_in.name,
        price=subscription_in.price,
        currency=subscription_in.currency,
        billing_cycle=subscription_in.billing_cycle,
        next_billing_date=subscription_in.next_billing_date,
        category=subscription_in.category,
        is_active=subscription_in.is_active,
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

