# Vercel Deployment Guide for SubTrack Frontend

This guide walks you through deploying the SubTrack frontend to Vercel.

## Prerequisites

- ✅ Backend deployed on Railway (or another hosting service)
- ✅ Backend URL available
- ✅ Vercel account (free tier works)

## Step 1: Prepare Your Repository

Ensure your code is pushed to GitHub:

```bash
git add .
git commit -m "Prepare frontend for Vercel deployment"
git push origin main
```

## Step 2: Deploy to Vercel

### Option A: Vercel Dashboard (Recommended)

1. **Go to [vercel.com](https://vercel.com)** and sign in
2. **Click "Add New Project"**
3. **Import your GitHub repository**
4. **Configure the project:**
   - **Framework Preset:** Vite (auto-detected)
   - **Root Directory:** `frontend` (if your repo has both frontend and backend)
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `dist` (auto-detected)
   - **Install Command:** `npm install` (auto-detected)

5. **Click "Deploy"**

### Option B: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy (from frontend directory)
cd frontend
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? No (first time) or Yes (updates)
# - What's your project's name? subtrack-frontend
# - In which directory is your code located? ./
```

## Step 3: Set Environment Variables

### In Vercel Dashboard

1. Go to your project → **Settings** → **Environment Variables**
2. Add the following variable:

| Name | Value | Environment |
|------|-------|-------------|
| `VITE_API_BASE_URL` | `https://your-backend.railway.app` | Production, Preview, Development |

**Important:**
- Replace `https://your-backend.railway.app` with your actual Railway backend URL
- Set for **Production**, **Preview**, and **Development** environments
- Vercel will automatically rebuild when you add environment variables

### Using Vercel CLI

```bash
vercel env add VITE_API_BASE_URL

# Enter value: https://your-backend.railway.app
# Select environments: Production, Preview, Development
```

## Step 4: Verify Deployment

1. **Check build logs:**
   - Go to your project → **Deployments**
   - Click on the latest deployment
   - Check build logs for errors

2. **Test the deployed site:**
   - Visit your Vercel URL (e.g., `https://subtrack-frontend.vercel.app`)
   - Try logging in or registering
   - Verify API calls work (check browser console)

3. **Check environment variables:**
   ```bash
   # Using Vercel CLI
   vercel env ls
   ```

## Step 5: Update Backend CORS

Make sure your Railway backend allows your Vercel domain:

1. **In Railway dashboard:**
   - Go to your backend service → **Variables**
   - Add/update `CORS_ORIGINS`:
     ```
     https://your-app.vercel.app,https://your-custom-domain.com
     ```
   - Or use `FRONTEND_URL` (legacy):
     ```
     https://your-app.vercel.app
     ```

2. **Redeploy backend** (if needed) to apply CORS changes

## Step 6: Custom Domain (Optional)

1. **In Vercel dashboard:**
   - Go to your project → **Settings** → **Domains**
   - Add your custom domain
   - Follow DNS configuration instructions

2. **Update backend CORS:**
   - Add your custom domain to `CORS_ORIGINS` in Railway

## Environment Variables Reference

### Frontend (Vercel)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `https://subtrack-backend.railway.app` |

### Backend (Railway)

| Variable | Description | Example |
|----------|-------------|---------|
| `CORS_ORIGINS` | Comma-separated frontend URLs | `https://subtrack.vercel.app,https://www.subtrack.app` |
| `DATABASE_URL` | PostgreSQL connection string | (Auto-set by Railway) |
| `SECRET_KEY` | JWT signing secret | (Generate with `openssl rand -hex 32`) |
| `INTERNAL_API_KEY` | Internal API key for cron jobs | (Generate with `openssl rand -hex 32`) |

## Local Development

After deploying, you can still develop locally:

1. **Create `.env.local` in frontend directory:**
   ```bash
   cd frontend
   cp .env.example .env.local
   ```

2. **Edit `.env.local`:**
   ```
   VITE_API_BASE_URL=http://localhost:8000
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

## Troubleshooting

### Build Fails

**Error: `VITE_API_BASE_URL is not defined`**
- ✅ Set `VITE_API_BASE_URL` in Vercel environment variables
- ✅ Redeploy after adding environment variables

**Error: `Cannot connect to API`**
- ✅ Verify `VITE_API_BASE_URL` is correct
- ✅ Check backend is running and accessible
- ✅ Verify CORS is configured on backend

### API Calls Fail

**CORS errors:**
- ✅ Add Vercel URL to backend `CORS_ORIGINS`
- ✅ Check browser console for specific CORS error
- ✅ Verify backend allows credentials

**401 Unauthorized:**
- ✅ Check if backend requires authentication
- ✅ Verify JWT token is being sent in requests
- ✅ Check backend logs for authentication errors

### Environment Variables Not Working

- ✅ Variables must start with `VITE_` to be exposed to frontend
- ✅ Redeploy after adding/changing environment variables
- ✅ Check variable names match exactly (case-sensitive)

## Continuous Deployment

Vercel automatically deploys when you push to:
- **Production:** `main` branch
- **Preview:** Other branches and pull requests

To disable auto-deployment:
1. Go to **Settings** → **Git**
2. Unlink repository or disable auto-deployment

## Monitoring

### Vercel Analytics

1. Go to **Analytics** tab in Vercel dashboard
2. Enable Vercel Analytics (if desired)
3. View performance metrics

### Error Tracking

Consider adding error tracking:
- **Sentry** (https://sentry.io)
- **LogRocket** (https://logrocket.com)
- **Bugsnag** (https://www.bugsnag.com)

## Quick Reference

```bash
# Deploy to Vercel
vercel

# Deploy to production
vercel --prod

# View environment variables
vercel env ls

# Add environment variable
vercel env add VITE_API_BASE_URL

# View deployment logs
vercel logs

# Open project in browser
vercel open
```

## Next Steps

1. ✅ Set up custom domain (optional)
2. ✅ Configure analytics (optional)
3. ✅ Set up error tracking (optional)
4. ✅ Test all features on production
5. ✅ Monitor performance and errors

## Support

- Vercel Docs: https://vercel.com/docs
- Vercel Support: https://vercel.com/support
- Vite Docs: https://vitejs.dev

