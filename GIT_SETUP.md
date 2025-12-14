# Git Repository Setup - Commands to Run

## Current Status

✅ **Fixed:**
- Removed `__pycache__/` files from tracking
- Removed `subtrack.db` from tracking
- Updated `.gitignore` files
- Updated README with quick start

## Exact Git Commands to Run

Run these commands **from the project root** (`/Users/mithunselvananthan/SubTrack App`):

### Step 1: Stage All Changes

```bash
# Add updated .gitignore files
git add .gitignore frontend/.gitignore

# Add all backend files (excluding ignored files)
git add backend/

# Add all frontend files (excluding ignored files)
git add frontend/

# Add root README
git add README.md

# Add any other documentation files
git add *.md
```

### Step 2: Verify What Will Be Committed

```bash
# Check what's staged
git status

# Verify frontend files are included
git ls-files frontend/ | head -20

# Verify backend files are included (but not __pycache__ or .db)
git ls-files backend/ | grep -v __pycache__ | grep -v "\.db$" | head -20
```

### Step 3: Commit

```bash
git commit -m "feat: Add frontend to repo and fix git tracking

- Add complete frontend/ directory with all source files
- Update .gitignore to exclude node_modules, dist, __pycache__, .db files
- Remove __pycache__ and .db files from tracking
- Add production deployment files (alembic, Procfile, vercel.json)
- Update README with quick start instructions
- Add .env.example files for both frontend and backend"
```

### Step 4: Push to GitHub

```bash
git push origin main
```

## Complete Command Sequence (Copy-Paste Ready)

```bash
# From project root
cd "/Users/mithunselvananthan/SubTrack App"

# Stage all changes
git add .gitignore frontend/.gitignore
git add backend/
git add frontend/
git add README.md
git add *.md

# Verify (optional but recommended)
git status

# Commit
git commit -m "feat: Add frontend to repo and fix git tracking

- Add complete frontend/ directory with all source files
- Update .gitignore to exclude node_modules, dist, __pycache__, .db files
- Remove __pycache__ and .db files from tracking
- Add production deployment files (alembic, Procfile, vercel.json)
- Update README with quick start instructions
- Add .env.example files for both frontend and backend"

# Push
git push origin main
```

## What Gets Committed

### ✅ Included:
- `frontend/` - All source files (src/, components/, pages/, etc.)
- `frontend/package.json`, `frontend/tsconfig.json`, etc.
- `frontend/.env.example`, `frontend/vercel.json`
- `backend/` - All source files
- `backend/alembic/` - Migration files
- `backend/Procfile`, `backend/railway.json`, etc.
- `backend/.env.example`
- Root `README.md`, `.gitignore`

### ❌ Excluded (via .gitignore):
- `node_modules/` (frontend and backend)
- `dist/` (frontend build output)
- `__pycache__/` (Python cache)
- `*.db`, `*.sqlite` (database files)
- `.env` files (environment variables)
- `venv/` (Python virtual environment)

## Verification After Push

After pushing, verify on GitHub:

1. **Check frontend folder exists:**
   - Go to your repo on GitHub
   - Verify `frontend/` folder is visible
   - Check `frontend/src/` has all your React files

2. **Check backend folder:**
   - Verify `backend/` folder is visible
   - Check `backend/app/` has all your Python files
   - Verify `backend/alembic/` exists

3. **Verify ignored files are NOT in repo:**
   - `node_modules/` should NOT appear
   - `dist/` should NOT appear
   - `__pycache__/` should NOT appear
   - `.db` files should NOT appear

## If Something Goes Wrong

### If you accidentally commit ignored files:

```bash
# Remove from tracking (but keep local files)
git rm -r --cached node_modules/
git rm -r --cached dist/
git rm -r --cached backend/__pycache__/
git rm -r --cached backend/*.db

# Update .gitignore if needed
# Then commit the removal
git commit -m "chore: Remove ignored files from tracking"
git push origin main
```

### If frontend is still not showing:

```bash
# Check if frontend is in .gitignore (it shouldn't be)
grep -r "frontend" .gitignore

# Force add frontend (if needed)
git add -f frontend/
git commit -m "fix: Force add frontend directory"
git push origin main
```

## Summary

After running these commands:
- ✅ Frontend will be fully tracked in git
- ✅ Backend will be fully tracked in git
- ✅ Ignored files (node_modules, dist, __pycache__, .db) won't be committed
- ✅ Repository is ready for deployment

