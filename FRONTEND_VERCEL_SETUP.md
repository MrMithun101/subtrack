# Frontend Vercel Deployment - Summary

## ✅ Files Created/Modified

### New Files

1. **`frontend/.env.example`** - Environment variable template
2. **`backend/.env.example`** - Backend environment variable template
3. **`frontend/vercel.json`** - Vercel deployment configuration
4. **`frontend/VERCEL_DEPLOYMENT.md`** - Complete deployment guide

### Existing Files (No Changes Needed)

- ✅ `frontend/src/utils/constants.ts` - Already uses `VITE_API_BASE_URL`
- ✅ `frontend/src/api/client.ts` - Already uses `API_BASE_URL` from constants
- ✅ `frontend/package.json` - Build script already exists and works

## File Diffs

### 1. `frontend/.env.example` (NEW)

```env
# Frontend Environment Variables
# Copy this file to .env.local for local development
# For Vercel deployment, set these in the Vercel dashboard under Settings > Environment Variables

# Backend API URL
# Local development: http://localhost:8000
# Production: Your Railway backend URL (e.g., https://your-backend.railway.app)
VITE_API_BASE_URL=http://localhost:8000
```

### 2. `backend/.env.example` (NEW)

```env
# Backend Environment Variables
# Copy this file to .env for local development
# For Railway deployment, set these in the Railway dashboard under Variables

# Database
# Local development (SQLite): sqlite:///./subtrack.db
# Production (PostgreSQL): Automatically set by Railway when you add PostgreSQL service
# DATABASE_URL=postgresql://user:password@host:5432/dbname

# Security
# Generate a strong secret: openssl rand -hex 32
# REQUIRED in production - no default provided
SECRET_KEY=

# CORS Origins (comma-separated)
# Local development: Not needed (localhost allowed by default)
# Production: Your Vercel frontend URL(s)
# CORS_ORIGINS=https://your-app.vercel.app,https://www.your-domain.com

# Legacy: Single frontend URL (use CORS_ORIGINS instead)
# FRONTEND_URL=https://your-app.vercel.app

# Email Configuration (Optional - for reminder emails)
# If not set, emails will be printed to console in development
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USERNAME=your-email@gmail.com
# SMTP_PASSWORD=your-app-password
# EMAIL_FROM=noreply@subtrack.app

# Internal API Key (Required for /internal/run-reminders endpoint)
# Generate: openssl rand -hex 32
# INTERNAL_API_KEY=
```

### 3. `frontend/vercel.json` (NEW)

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 4. `frontend/src/utils/constants.ts` (NO CHANGES - Already Correct)

```typescript
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
```

✅ Already uses `VITE_API_BASE_URL` with localhost fallback

### 5. `frontend/src/api/client.ts` (NO CHANGES - Already Correct)

```typescript
import { API_BASE_URL } from '../utils/constants';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  // ...
});
```

✅ Already uses the constant from `constants.ts`

## Build Verification

✅ Build tested and working:
```bash
cd frontend
npm run build
# ✓ Built successfully in 1.72s
```

## Vercel Environment Variables Setup

### Step 1: Add Environment Variable in Vercel

1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Click **Add New**
3. Enter:
   - **Name:** `VITE_API_BASE_URL`
   - **Value:** `https://your-backend.railway.app` (replace with your actual Railway URL)
   - **Environment:** Select **Production**, **Preview**, and **Development**
4. Click **Save**

### Step 2: Redeploy

After adding environment variables, Vercel will automatically trigger a new deployment. Or manually:

```bash
vercel --prod
```

## Local Development

The setup still works locally:

1. **Create `.env.local`** (optional, for local dev):
   ```bash
   cd frontend
   cp .env.example .env.local
   ```

2. **Edit `.env.local`** (if you want to override):
   ```
   VITE_API_BASE_URL=http://localhost:8000
   ```

3. **Start dev server:**
   ```bash
   npm run dev
   ```

The app will:
- Use `VITE_API_BASE_URL` from `.env.local` if it exists
- Fall back to `http://localhost:8000` if not set (as defined in `constants.ts`)

## Quick Deployment Checklist

- [ ] Push code to GitHub
- [ ] Import repository to Vercel
- [ ] Set `VITE_API_BASE_URL` in Vercel environment variables
- [ ] Verify build succeeds
- [ ] Test deployed site
- [ ] Update backend `CORS_ORIGINS` with Vercel URL
- [ ] Test API calls from production frontend

## Testing

### Test Build Locally

```bash
cd frontend
npm run build
# Should complete without errors
```

### Test with Production API URL

```bash
# Set environment variable
export VITE_API_BASE_URL=https://your-backend.railway.app

# Build
npm run build

# Preview
npm run preview
```

### Test Environment Variable

```bash
# In frontend directory
node -e "console.log(process.env.VITE_API_BASE_URL || 'http://localhost:8000')"
```

## Summary

✅ **No code changes needed** - Frontend already uses `VITE_API_BASE_URL` correctly
✅ **Build works** - `npm run build` completes successfully
✅ **Environment files created** - `.env.example` files for both frontend and backend
✅ **Vercel config created** - `vercel.json` for optimal deployment
✅ **Documentation created** - Complete guide in `VERCEL_DEPLOYMENT.md`

The frontend is ready for Vercel deployment! Just set the `VITE_API_BASE_URL` environment variable in Vercel.

