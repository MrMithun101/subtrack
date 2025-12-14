# Production-Safe Reminders System

## Overview

The reminders system has been refactored to be production-safe with:
- ✅ **Protected endpoint** (`POST /internal/run-reminders`) secured by `INTERNAL_API_KEY`
- ✅ **Idempotency** - Won't send duplicate reminders within 24 hours
- ✅ **Optimized queries** - Single efficient database query
- ✅ **Non-blocking** - Fast response times
- ✅ **Detailed logging** - No secrets logged
- ✅ **Statistics** - Returns counts of sent/skipped/errors

## Architecture

### Components

1. **Service Layer** (`app/services/reminders.py`)
   - `process_renewal_reminders()` - Core reminder processing logic
   - Optimized single-query approach
   - Idempotency checks (24-hour window)
   - Returns statistics

2. **API Endpoint** (`app/api/routes/internal.py`)
   - `POST /internal/run-reminders`
   - Protected by `X-Internal-API-Key` header
   - Validates API key using constant-time comparison
   - Returns structured response with statistics

3. **Cron Job** (Railway)
   - Calls the endpoint on a schedule (e.g., daily at 9 AM)
   - Uses `INTERNAL_API_KEY` environment variable

## Key Features

### Idempotency

The system is idempotent - running it multiple times won't send duplicate reminders:

- Checks `last_reminder_sent_at` timestamp
- Skips if reminder was sent within last 24 hours
- Prevents duplicate emails if cron job runs multiple times

### Performance Optimizations

1. **Single Query**: Uses `joinedload` to fetch subscriptions with users in one query
2. **Filtered Query**: Only fetches subscriptions that need reminders (within date window)
3. **Efficient Filtering**: Database-level filtering for:
   - Active subscriptions
   - Reminders enabled
   - Date range
   - Days until renewal matching `reminder_days_before`

### Security

1. **API Key Protection**: Constant-time comparison prevents timing attacks
2. **No Secrets in Logs**: Email addresses are partially masked in logs
3. **Environment Variable**: `INTERNAL_API_KEY` must be set (no default)

### Logging

Logs include:
- ✅ Subscription IDs
- ✅ User IDs
- ✅ Partially masked emails (e.g., `abc***@example.com`)
- ✅ Statistics (sent, skipped, errors)
- ❌ Never logs passwords, API keys, or full email addresses

## Usage

### Local Testing

```bash
# Set API key
export INTERNAL_API_KEY="test-key-12345"

# Start backend
cd backend
uvicorn app.main:app --reload

# Test endpoint (in another terminal)
curl -X POST http://localhost:8000/internal/run-reminders \
  -H "X-Internal-API-Key: test-key-12345" \
  -H "Content-Type: application/json"
```

### Production (Railway)

See `RAILWAY_CRON.md` for detailed setup instructions.

Quick setup:
1. Set `INTERNAL_API_KEY` environment variable in Railway
2. Create cron job that calls: `POST /internal/run-reminders` with header `X-Internal-API-Key: $INTERNAL_API_KEY`
3. Schedule: `0 9 * * *` (daily at 9 AM UTC)

## API Reference

### Endpoint: `POST /internal/run-reminders`

**Headers:**
- `X-Internal-API-Key`: Required. Must match `INTERNAL_API_KEY` environment variable

**Query Parameters:**
- `within_days` (optional, default: 7, max: 60): Look for subscriptions renewing within this many days

**Response:**
```json
{
  "success": true,
  "reminders_sent": 5,
  "reminders_skipped": 12,
  "errors": 0,
  "total_processed": 17,
  "message": "Processed 17 subscriptions. Sent 5 reminders, skipped 12, encountered 0 errors."
}
```

**Status Codes:**
- `200`: Success
- `401`: Missing or invalid API key
- `503`: Internal API not configured (INTERNAL_API_KEY not set)
- `500`: Server error

## Migration from Background Worker

The old background worker (in `main.py` startup) has been removed. Instead:

1. **Development**: Call the endpoint manually or use a local cron
2. **Production**: Use Railway cron job (see `RAILWAY_CRON.md`)

This provides:
- Better control over when reminders run
- Easier monitoring and debugging
- No risk of blocking the API server
- Ability to manually trigger reminders if needed

## Monitoring

### Check Reminder Status

```bash
# Call endpoint and check response
curl -X POST https://your-backend.railway.app/internal/run-reminders \
  -H "X-Internal-API-Key: $INTERNAL_API_KEY" \
  -H "Content-Type: application/json"
```

### View Logs

```bash
# Railway logs
railway logs --service your-backend-service

# Look for:
# - "Starting reminder processing"
# - "Reminder sent: subscription_id=..."
# - "Reminder processing complete: sent=..."
```

### Metrics to Monitor

- `reminders_sent` - Should be > 0 if there are active subscriptions
- `errors` - Should be 0 in normal operation
- `reminders_skipped` - Normal if reminders were already sent (idempotency)

## Troubleshooting

### No Reminders Sent

1. Check if subscriptions exist with:
   - `is_active = true`
   - `reminder_enabled = true`
   - `next_billing_date` set and within date window
   - `reminder_days_before` matches days until renewal

2. Check idempotency:
   - If `last_reminder_sent_at` is recent (< 24 hours), reminders are skipped
   - This is expected behavior

### API Key Issues

- Verify `INTERNAL_API_KEY` is set in Railway environment variables
- Check cron job command includes the header correctly
- Ensure no extra spaces or quotes in the API key

### Performance Issues

The endpoint is optimized, but if you have thousands of subscriptions:
- Consider adding pagination
- Use database indexes (already in place)
- Monitor query performance

## Files Modified

1. `app/services/reminders.py` - Refactored for idempotency and optimization
2. `app/api/routes/internal.py` - New protected endpoint
3. `app/main.py` - Removed background worker, added internal router
4. `RAILWAY_CRON.md` - Railway cron setup guide
5. `test_reminders_endpoint.sh` - Test script

## Next Steps

1. ✅ Set `INTERNAL_API_KEY` in Railway
2. ✅ Create Railway cron job (see `RAILWAY_CRON.md`)
3. ✅ Test endpoint manually
4. ✅ Monitor first few cron executions
5. ✅ Set up alerts for errors

