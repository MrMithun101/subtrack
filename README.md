# SubTrack

A full-stack SaaS subscription tracker application built with FastAPI (backend) and React + TypeScript (frontend).

## Features

- 🔐 User authentication (JWT-based)
- 📊 Subscription management (CRUD operations)
- 📈 Spending analytics and forecasts
- 🔔 Email renewal reminders
- 📱 Responsive dashboard with charts

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM for database operations
- **PostgreSQL** (production) / **SQLite** (local dev)
- **Alembic** - Database migrations
- **JWT** - Authentication
- **Bcrypt** - Password hashing

### Frontend
- **React 18** + **TypeScript**
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Zustand** - State management
- **React Router** - Routing
- **Recharts** - Data visualization

## Project Structure

```
.
├── backend/          # FastAPI backend
│   ├── app/
│   │   ├── api/      # API routes
│   │   ├── core/     # Security, auth, email
│   │   ├── db/       # Database config
│   │   ├── models/    # SQLAlchemy models
│   │   ├── schemas/  # Pydantic schemas
│   │   └── services/ # Business logic
│   ├── alembic/      # Database migrations
│   └── pyproject.toml
└── frontend/         # React frontend
    └── src/
        ├── api/      # API client
        ├── components/
        ├── pages/
        └── stores/   # Zustand stores
```

## Quick Start

### Running Both Services Locally

**Terminal 1 - Backend:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -e .
alembic upgrade head  # First time only
uvicorn app.main:app --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install  # First time only
npm run dev
```

- Backend: http://localhost:8000
- Frontend: http://localhost:5173
- API Docs: http://localhost:8000/docs

## Local Development Setup

### Prerequisites

- Python 3.11+ (backend)
- Node.js 18+ and npm (frontend)
- PostgreSQL (optional, SQLite used by default)

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create a virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -e .
   # Or using requirements.txt:
   pip install -r requirements.txt
   ```

4. **Set up environment variables (optional):**
   Create a `.env` file in the `backend/` directory:
   ```env
   DATABASE_URL=sqlite:///./subtrack.db
   # For PostgreSQL:
   # DATABASE_URL=postgresql://user:password@localhost:5432/subtrack
   ```

5. **Run database migrations:**
   ```bash
   alembic upgrade head
   ```

6. **Start the development server:**
   ```bash
   uvicorn app.main:app --reload
   ```

   The API will be available at `http://localhost:8000`
   - API docs: `http://localhost:8000/docs`
   - Health check: `http://localhost:8000/health`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:5173`

### Running Both Services

You'll need two terminal windows:
- **Terminal 1:** Backend (`cd backend && uvicorn app.main:app --reload`)
- **Terminal 2:** Frontend (`cd frontend && npm run dev`)

## Production Deployment

### Backend on Railway

1. **Create a Railway account** and create a new project

2. **Add PostgreSQL service:**
   - Click "New" → "Database" → "PostgreSQL"
   - Railway will automatically set the `DATABASE_URL` environment variable

3. **Deploy from GitHub:**
   - Click "New" → "GitHub Repo"
   - Select your repository
   - Set the root directory to `backend/`
   - Railway will detect the `Procfile` and deploy automatically

4. **Environment Variables:**
   Railway automatically provides:
   - `DATABASE_URL` (from PostgreSQL service)
   - `PORT` (automatically set)

   Optional variables you may want to add:
   - `FRONTEND_URL` - Your frontend URL for CORS (e.g., `https://your-app.vercel.app`)
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `EMAIL_FROM` - For email reminders

5. **Database Migrations:**
   The `Procfile` automatically runs migrations on startup:
   ```procfile
   web: alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

6. **Verify Deployment:**
   - Check the health endpoint: `https://your-backend.railway.app/health`
   - Should return: `{"status": "ok", "database": "connected"}`

### Frontend on Vercel

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   cd frontend
   vercel
   ```

   Or connect your GitHub repo to Vercel:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Set root directory to `frontend/`
   - Vercel will auto-detect Vite and deploy

3. **Environment Variables:**
   Add in Vercel dashboard:
   - `VITE_API_BASE_URL` - Your Railway backend URL (e.g., `https://your-backend.railway.app`)

   The frontend already uses this environment variable in `frontend/src/utils/constants.ts`.

### Post-Deployment Checklist

- [ ] Backend health check returns `{"status": "ok", "database": "connected"}`
- [ ] Frontend can connect to backend API
- [ ] CORS is configured correctly (add frontend URL to backend `FRONTEND_URL`)
- [ ] Database migrations ran successfully
- [ ] Email service configured (if using reminders)

## Database Migrations

SubTrack uses **Alembic** for database migrations. This is critical for production deployments on Railway, as Postgres databases don't auto-create tables like SQLite does.

### Local Development

**First-time setup:**
```bash
cd backend

# Apply initial migration (creates User and Subscription tables)
alembic upgrade head
```

**Creating a new migration:**
```bash
# After modifying models, generate a new migration
alembic revision --autogenerate -m "Description of changes"

# Review the generated migration file in alembic/versions/
# Then apply it:
alembic upgrade head
```

**Common migration commands:**
```bash
# Apply all pending migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# View migration history
alembic history

# Check current migration version
alembic current
```

**Using the helper script:**
```bash
# Apply migrations
./scripts/run_migrations.sh upgrade

# Create new migration
./scripts/run_migrations.sh revision "Add new field to User"

# View history
./scripts/run_migrations.sh history
```

### Production (Railway)

**Automatic migrations:**
Migrations run automatically on every deployment via the `Procfile`:
```procfile
web: alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

**Manual migration (if needed):**
```bash
# Install Railway CLI: https://docs.railway.app/develop/cli
railway login
railway link  # Link to your project

# Run migrations manually
railway run alembic upgrade head

# Check current version
railway run alembic current
```

**Important notes:**
- ✅ Migrations run automatically on deploy (via Procfile)
- ✅ Initial migration includes User and Subscription tables with all reminder fields
- ✅ Always test migrations locally before deploying
- ⚠️ Never run `Base.metadata.create_all()` in production (use Alembic only)

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get JWT token
- `GET /auth/me` - Get current user (requires auth)

### Subscriptions
- `GET /subscriptions` - List all subscriptions (requires auth)
- `GET /subscriptions/{id}` - Get subscription by ID
- `POST /subscriptions` - Create new subscription
- `PUT /subscriptions/{id}` - Update subscription
- `DELETE /subscriptions/{id}` - Delete subscription
- `GET /subscriptions/summary` - Get summary statistics
- `GET /subscriptions/upcoming` - Get upcoming renewals

### Health
- `GET /health` - Health check with database connectivity test

## Environment Variables

### Backend

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | Database connection string | `sqlite:///./subtrack.db` | No (for local) |
| `FRONTEND_URL` | Frontend URL for CORS | - | No |
| `SMTP_HOST` | SMTP server host | - | No (emails print to console) |
| `SMTP_PORT` | SMTP server port | `587` | No |
| `SMTP_USERNAME` | SMTP username | - | No |
| `SMTP_PASSWORD` | SMTP password | - | No |
| `EMAIL_FROM` | From email address | `noreply@subtrack.app` | No |
| `PORT` | Server port (Railway sets this) | `8000` | No |

### Frontend

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:8000` |

## Troubleshooting

### Backend Issues

**Database connection errors:**
- Verify `DATABASE_URL` is set correctly
- For Railway: Check PostgreSQL service is running
- For local: Ensure SQLite file is writable

**Migration errors:**
- Run `alembic upgrade head` manually
- Check migration files in `backend/alembic/versions/`

**CORS errors:**
- Add frontend URL to `FRONTEND_URL` environment variable
- Check backend CORS configuration in `app/main.py`

### Frontend Issues

**API connection errors:**
- Verify `VITE_API_BASE_URL` is set correctly
- Check backend is running and accessible
- Verify CORS is configured on backend

**Build errors:**
- Run `npm install` to ensure dependencies are installed
- Check Node.js version (requires 18+)

## Development Commands

### Backend
```bash
# Run server with auto-reload
uvicorn app.main:app --reload

# Run migrations
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "Description"

# Run tests (if available)
pytest
```

### Frontend
```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
