import logging
from datetime import date, timedelta, datetime
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models import User, Subscription
from app.core.email import send_email

logger = logging.getLogger(__name__)


def process_renewal_reminders(within_days: int = 7) -> None:
    """
    Scan all users and send renewal reminder emails for subscriptions
    that are within `within_days` days of next_billing_date,
    respecting reminder_enabled, reminder_days_before, and last_reminder_sent_at.
    """
    db = SessionLocal()
    try:
        # Query all users
        users = db.query(User).all()
        
        today = date.today()
        
        for user in users:
            # Get all active subscriptions for this user
            subscriptions = (
                db.query(Subscription)
                .filter(
                    Subscription.user_id == user.id,
                    Subscription.is_active == True,
                    Subscription.reminder_enabled == True,
                    Subscription.next_billing_date.isnot(None),
                )
                .all()
            )
            
            for subscription in subscriptions:
                try:
                    # Check if next_billing_date is within the window
                    days_until = (subscription.next_billing_date - today).days
                    
                    if days_until < 0 or days_until > within_days:
                        continue
                    
                    # Check if it's exactly reminder_days_before days before
                    if days_until != subscription.reminder_days_before:
                        continue
                    
                    # Check if reminder has already been sent
                    # Simplest rule: if last_reminder_sent_at is None, send it
                    if subscription.last_reminder_sent_at is not None:
                        continue
                    
                    # Send the reminder email
                    subject = f"Upcoming subscription renewal: {subscription.name}"
                    
                    body = f"""Hello,

This is a reminder about your upcoming subscription renewal.

Subscription Details:
- Name: {subscription.name}
- Price: {subscription.currency} {subscription.price:.2f}
- Billing Cycle: {subscription.billing_cycle}
- Next Billing Date: {subscription.next_billing_date.strftime('%B %d, %Y')}

You configured SubTrack to remind you {subscription.reminder_days_before} days before renewal.

You can manage your subscriptions at your SubTrack dashboard.

Best regards,
SubTrack Team
"""
                    
                    # Send email
                    send_email(
                        to_email=user.email,
                        subject=subject,
                        body=body,
                    )
                    
                    # Update last_reminder_sent_at
                    subscription.last_reminder_sent_at = datetime.utcnow()
                    db.commit()
                    
                    logger.info(
                        f"Reminder sent for subscription '{subscription.name}' "
                        f"(ID: {subscription.id}) to user {user.email}"
                    )
                    
                except Exception as e:
                    # Log error but continue processing other subscriptions
                    logger.error(
                        f"Error processing reminder for subscription {subscription.id} "
                        f"(user {user.email}): {str(e)}",
                        exc_info=True
                    )
                    # Rollback this subscription's transaction
                    db.rollback()
                    continue
        
    except Exception as e:
        logger.error(f"Error in process_renewal_reminders: {str(e)}", exc_info=True)
    finally:
        db.close()
