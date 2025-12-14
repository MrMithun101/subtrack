"""
Internal API endpoints for administrative tasks.
Protected by INTERNAL_API_KEY environment variable.
"""
import os
import logging
from typing import Optional

from fastapi import APIRouter, Header, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

from app.services.reminders import process_renewal_reminders

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/internal", tags=["internal"])

# Internal API key security
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY")
if not INTERNAL_API_KEY:
    logger.warning(
        "INTERNAL_API_KEY not set! Internal endpoints will be disabled. "
        "Set INTERNAL_API_KEY environment variable in production."
    )


def verify_internal_api_key(x_internal_api_key: Optional[str] = Header(None, alias="X-Internal-API-Key")) -> bool:
    """
    Verify the internal API key from X-Internal-API-Key header.
    
    Returns True if valid, raises HTTPException if invalid.
    """
    if not INTERNAL_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Internal API is not configured. INTERNAL_API_KEY not set."
        )
    
    if not x_internal_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-Internal-API-Key header"
        )
    
    # Constant-time comparison to prevent timing attacks
    import hmac
    if not hmac.compare_digest(x_internal_api_key, INTERNAL_API_KEY):
        logger.warning("Invalid internal API key attempted")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid internal API key"
        )
    
    return True


class ReminderResponse(BaseModel):
    """Response model for reminder processing."""
    success: bool
    reminders_sent: int
    reminders_skipped: int
    errors: int
    total_processed: int
    message: str


@router.post("/run-reminders", response_model=ReminderResponse)
def run_reminders(
    within_days: int = 7,
    _: bool = Depends(verify_internal_api_key),
):
    """
    Process and send renewal reminders.
    
    Protected by X-Internal-API-Key header.
    Idempotent: Won't send duplicate reminders within 24 hours.
    
    Args:
        within_days: Look for subscriptions renewing within this many days (default: 7, max: 60)
    
    Returns:
        Statistics about reminders processed
    """
    # Validate within_days
    if within_days < 1:
        within_days = 1
    if within_days > 60:
        within_days = 60
    
    try:
        logger.info(f"Starting reminder processing (within_days={within_days})")
        
        # Process reminders (this may take a few seconds, but is optimized)
        stats = process_renewal_reminders(within_days=within_days)
        
        success = stats['errors'] == 0
        message = (
            f"Processed {stats['total_processed']} subscriptions. "
            f"Sent {stats['reminders_sent']} reminders, "
            f"skipped {stats['reminders_skipped']}, "
            f"encountered {stats['errors']} errors."
        )
        
        logger.info(f"Reminder processing completed: {message}")
        
        return ReminderResponse(
            success=success,
            reminders_sent=stats['reminders_sent'],
            reminders_skipped=stats['reminders_skipped'],
            errors=stats['errors'],
            total_processed=stats['total_processed'],
            message=message
        )
        
    except Exception as e:
        logger.error(f"Error in run_reminders endpoint: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process reminders: {str(e)}"
        )

