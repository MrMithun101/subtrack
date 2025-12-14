# Railway Cron Job Setup for Reminders

This guide explains how to set up a Railway cron job to trigger reminder processing.

## Overview

The reminder system uses a **production-safe endpoint** (`POST /internal/run-reminders`) that:
- ✅ Is protected by `INTERNAL_API_KEY` header
- ✅ Is idempotent (won't send duplicates within 24 hours)
- ✅ Returns statistics about reminders processed
- ✅ Optimized for performance (single query, non-blocking)

## Step 1: Set Environment Variable

In your Railway project, add the `INTERNAL_API_KEY` environment variable:

1. Go to your Railway project dashboard
2. Select your backend service
3. Go to **Variables** tab
4. Add new variable:
   - **Name:** `INTERNAL_API_KEY`
   - **Value:** Generate a strong random secret (see below)

### Generate a Strong Secret Key

```bash
# Using OpenSSL
openssl rand -hex 32

# Or using Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

**Example:** `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6`

⚠️ **Important:** Keep this secret secure. Never commit it to git.

## Step 2: Create Railway Cron Job

Railway supports cron jobs via their **Cron Jobs** feature.

### Option A: Using Railway Dashboard

1. In your Railway project, click **"New"** → **"Cron Job"**
2. Configure the cron job:
   - **Name:** `daily-reminders`
   - **Schedule:** `0 9 * * *` (runs daily at 9:00 AM UTC)
   - **Command:** See below

### Option B: Using `railway.json` (Recommended)

Add this to your `railway.json` in the backend directory:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "uvicorn app.main:app --host 0.0.0.0 --port $PORT",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  },
  "crons": [
    {
      "name": "daily-reminders",
      "schedule": "0 9 * * *",
      "command": "curl -X POST https://your-backend.railway.app/internal/run-reminders -H 'X-Internal-API-Key: $INTERNAL_API_KEY' -H 'Content-Type: application/json'"
    }
  ]
}
```

**Note:** Railway cron jobs run in a separate container, so you need to use `curl` or similar to call your API endpoint.

### Option C: Using Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Create cron job
railway cron create \
  --name "daily-reminders" \
  --schedule "0 9 * * *" \
  --command "curl -X POST https://your-backend.railway.app/internal/run-reminders -H 'X-Internal-API-Key: \$INTERNAL_API_KEY' -H 'Content-Type: application/json'"
```

## Step 3: Cron Schedule Examples

Common schedules for reminder processing:

| Schedule | Description |
|----------|-------------|
| `0 9 * * *` | Daily at 9:00 AM UTC |
| `0 8 * * *` | Daily at 8:00 AM UTC |
| `0 9 * * 1-5` | Weekdays only at 9:00 AM UTC |
| `0 */6 * * *` | Every 6 hours |
| `0 0 * * *` | Daily at midnight UTC |

**Recommended:** `0 9 * * *` (daily at 9 AM UTC) - Gives users time to see reminders during business hours in most timezones.

## Step 4: Verify Setup

### Test the Endpoint Manually

```bash
# Set your internal API key
export INTERNAL_API_KEY="your-secret-key-here"
export BACKEND_URL="https://your-backend.railway.app"

# Test the endpoint
curl -X POST "$BACKEND_URL/internal/run-reminders" \
  -H "X-Internal-API-Key: $INTERNAL_API_KEY" \
  -H "Content-Type: application/json" \
  -v
```

**Expected Response:**
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

### Check Railway Logs

After the cron job runs, check logs:

```bash
railway logs --service your-backend-service
```

Look for:
- `"Starting reminder processing"`
- `"Reminder sent: subscription_id=..."`
- `"Reminder processing complete: sent=..."`

## Step 5: Monitoring

### Railway Dashboard

1. Go to your Railway project
2. Click on the cron job
3. View execution history and logs

### Health Check

The endpoint returns detailed statistics. You can monitor:
- `reminders_sent` - Should be > 0 if there are active subscriptions
- `errors` - Should be 0 in normal operation
- `reminders_skipped` - Normal if reminders were already sent

### Alerting

Set up alerts in Railway for:
- Cron job failures
- High error rates (`errors > 0`)
- Unexpected behavior

## Troubleshooting

### "Missing X-Internal-API-Key header"

- Verify `INTERNAL_API_KEY` is set in Railway environment variables
- Check the cron job command includes the header: `-H 'X-Internal-API-Key: $INTERNAL_API_KEY'`
- Ensure the variable is accessible in the cron job context

### "Invalid internal API key"

- Verify the API key in the cron command matches the environment variable
- Check for extra spaces or quotes in the header value
- Regenerate the key if compromised

### Cron Job Not Running

- Check Railway cron job status in dashboard
- Verify the schedule syntax is correct (use cron format)
- Check Railway logs for cron execution errors

### No Reminders Sent

- Verify there are active subscriptions with `reminder_enabled = true`
- Check `next_billing_date` is set and within the `within_days` window
- Verify `reminder_days_before` matches the days until renewal
- Check if reminders were already sent (idempotency working)

## Alternative: Using Railway's Scheduled Tasks

If Railway cron jobs aren't available, you can use Railway's **Scheduled Tasks** feature or an external cron service like:

- **Cronitor** (https://cronitor.io)
- **EasyCron** (https://www.easycron.com)
- **GitHub Actions** (with scheduled workflows)

All of these can call your `/internal/run-reminders` endpoint with the `X-Internal-API-Key` header.

## Security Best Practices

1. ✅ **Never commit `INTERNAL_API_KEY` to git**
2. ✅ **Use a strong, random secret** (32+ characters)
3. ✅ **Rotate the key periodically** (every 90 days)
4. ✅ **Monitor for unauthorized access attempts** (check logs)
5. ✅ **Use HTTPS only** (Railway provides this automatically)

## Example: Complete Railway Setup

```bash
# 1. Set environment variable in Railway dashboard
INTERNAL_API_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6

# 2. Cron job command (in Railway cron job config)
curl -X POST https://your-backend.railway.app/internal/run-reminders \
  -H "X-Internal-API-Key: $INTERNAL_API_KEY" \
  -H "Content-Type: application/json"

# 3. Schedule: 0 9 * * * (daily at 9 AM UTC)
```

## Testing Locally

You can test the endpoint locally before deploying:

```bash
# Set environment variable
export INTERNAL_API_KEY="test-key-12345"

# Start backend
cd backend
uvicorn app.main:app --reload

# In another terminal, test the endpoint
curl -X POST http://localhost:8000/internal/run-reminders \
  -H "X-Internal-API-Key: test-key-12345" \
  -H "Content-Type: application/json"
```

