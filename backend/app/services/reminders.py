import logging
from datetime import date, timedelta, datetime, timezone
from typing import Dict
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, func

from app.db.session import SessionLocal
from app.models import User, Subscription
from app.core.email import send_email

logger = logging.getLogger(__name__)


def process_renewal_reminders(within_days: int = 7) -> Dict[str, int]:
    """
    Scan all users and send renewal reminder emails for subscriptions
    that are within `within_days` days of next_billing_date,
    respecting reminder_enabled, reminder_days_before, and last_reminder_sent_at.
    
    Idempotent: Won't send if last_reminder_sent_at is within the last 24 hours.
    
    Returns:
        Dict with statistics: {
            'reminders_sent': int,
            'reminders_skipped': int,
            'errors': int,
            'total_processed': int
        }
    """
    db = SessionLocal()
    stats = {
        'reminders_sent': 0,
        'reminders_skipped': 0,
        'errors': 0,
        'total_processed': 0
    }
    
    try:
        today = date.today()
        now = datetime.now(timezone.utc)
        # Idempotency: don't send if reminder was sent in last 24 hours
        cutoff_time = now - timedelta(hours=24)
        
        # Optimized query: Get all subscriptions that need reminders in a single query
        # Join with User to get email in one go
        subscriptions = (
            db.query(Subscription)
            .join(User)
            .options(joinedload(Subscription.user))
            .filter(
                Subscription.is_active == True,
                Subscription.reminder_enabled == True,
                Subscription.next_billing_date.isnot(None),
                Subscription.next_billing_date >= today,
                Subscription.next_billing_date <= today + timedelta(days=within_days),
            )
            .all()
        )
        
        logger.info(f"Found {len(subscriptions)} potential reminders to process")
        
        for subscription in subscriptions:
            stats['total_processed'] += 1
            
            try:
                # Calculate days until renewal
                days_until = (subscription.next_billing_date - today).days
                
                # Check if it's exactly reminder_days_before days before
                if days_until != subscription.reminder_days_before:
                    stats['reminders_skipped'] += 1
                    continue
                
                # Idempotency check: Skip if reminder was sent in last 24 hours
                if subscription.last_reminder_sent_at:
                    # Convert to UTC if it's naive datetime
                    last_sent = subscription.last_reminder_sent_at
                    if last_sent.tzinfo is None:
                        # Assume UTC if timezone-naive
                        last_sent = last_sent.replace(tzinfo=timezone.utc)
                    
                    if last_sent > cutoff_time:
                        stats['reminders_skipped'] += 1
                        logger.debug(
                            f"Skipping subscription {subscription.id} - "
                            f"reminder sent {last_sent} (within 24 hours)"
                        )
                        continue
                
                # Get user email (already loaded via joinedload)
                user_email = subscription.user.email
                if not user_email:
                    logger.warning(f"User {subscription.user_id} has no email, skipping subscription {subscription.id}")
                    stats['reminders_skipped'] += 1
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
                
                # Send email (this is the potentially slow operation)
                send_email(
                    to_email=user_email,
                    subject=subject,
                    body=body,
                )
                
                # Update last_reminder_sent_at atomically
                subscription.last_reminder_sent_at = now
                db.commit()
                
                stats['reminders_sent'] += 1
                logger.info(
                    f"Reminder sent: subscription_id={subscription.id}, "
                    f"name='{subscription.name}', user_id={subscription.user_id}, "
                    f"email={user_email[:3]}***@{user_email.split('@')[1] if '@' in user_email else '***'}"
                )
                
            except Exception as e:
                stats['errors'] += 1
                # Log error but continue processing other subscriptions
                logger.error(
                    f"Error processing reminder for subscription_id={subscription.id}, "
                    f"user_id={subscription.user_id}: {str(e)}",
                    exc_info=True
                )
                # Rollback this subscription's transaction
                db.rollback()
                continue
        
        logger.info(
            f"Reminder processing complete: sent={stats['reminders_sent']}, "
            f"skipped={stats['reminders_skipped']}, errors={stats['errors']}, "
            f"total={stats['total_processed']}"
        )
        
    except Exception as e:
        logger.error(f"Error in process_renewal_reminders: {str(e)}", exc_info=True)
        stats['errors'] += 1
    finally:
        db.close()
    
    return stats
