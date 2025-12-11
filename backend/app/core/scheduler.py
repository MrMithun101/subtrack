import logging
import threading
import time
from datetime import datetime, timedelta, time as dt_time
from typing import Optional

from app.db.session import SessionLocal
from app.services.reminders import process_renewal_reminders

logger = logging.getLogger(__name__)


class ReminderScheduler:
    """Scheduler for running daily renewal reminder jobs."""
    
    def __init__(self, run_time: dt_time = dt_time(9, 0)):  # Default: 9:00 AM
        self.run_time = run_time
        self.running = False
        self.thread: Optional[threading.Thread] = None
    
    def _run_daily_check(self):
        """Run the daily reminder check at the specified time."""
        while self.running:
            now = datetime.now()
            target_time = datetime.combine(now.date(), self.run_time)
            
            # If target time has passed today, schedule for tomorrow
            if now >= target_time:
                target_time = datetime.combine(
                    (now + timedelta(days=1)).date(), 
                    self.run_time
                )
            
            # Calculate seconds until target time
            seconds_until = (target_time - now).total_seconds()
            
            logger.info(
                f"Reminder scheduler: Next run at {target_time.strftime('%Y-%m-%d %H:%M:%S')} "
                f"(in {seconds_until / 3600:.1f} hours)"
            )
            
            # Sleep until target time
            time.sleep(seconds_until)
            
            if not self.running:
                break
            
            # Run the reminder process
            logger.info("Running daily renewal reminder check...")
            try:
                db = SessionLocal()
                try:
                    stats = process_renewal_reminders(db, within_days=7)
                    logger.info(
                        f"Reminder check completed: {stats['reminders_sent']} sent, "
                        f"{stats['reminders_skipped']} skipped, {stats['errors']} errors"
                    )
                finally:
                    db.close()
            except Exception as e:
                logger.error(f"Error running reminder check: {str(e)}", exc_info=True)
    
    def start(self):
        """Start the scheduler in a background thread."""
        if self.running:
            logger.warning("Scheduler is already running")
            return
        
        self.running = True
        self.thread = threading.Thread(target=self._run_daily_check, daemon=True)
        self.thread.start()
        logger.info(f"Reminder scheduler started (daily at {self.run_time.strftime('%H:%M')})")
    
    def stop(self):
        """Stop the scheduler."""
        self.running = False
        if self.thread:
            self.thread.join(timeout=5)
        logger.info("Reminder scheduler stopped")


# Global scheduler instance
_scheduler: Optional[ReminderScheduler] = None


def get_scheduler() -> ReminderScheduler:
    """Get or create the global scheduler instance."""
    global _scheduler
    if _scheduler is None:
        # Default to 9:00 AM, can be configured via env var
        import os
        run_hour = int(os.getenv("REMINDER_SCHEDULE_HOUR", "9"))
        run_minute = int(os.getenv("REMINDER_SCHEDULE_MINUTE", "0"))
        _scheduler = ReminderScheduler(run_time=dt_time(run_hour, run_minute))
    return _scheduler


def start_reminder_scheduler():
    """Start the reminder scheduler (called on app startup)."""
    scheduler = get_scheduler()
    scheduler.start()


def stop_reminder_scheduler():
    """Stop the reminder scheduler (called on app shutdown)."""
    global _scheduler
    if _scheduler:
        _scheduler.stop()
        _scheduler = None

