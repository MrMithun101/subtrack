<!-- f2ce85a4-e207-4bfd-83c0-e9242aca690c e350cdf3-8644-44ff-9827-31424a6635da -->
# SubTrack Development Plan

## Phase 1: MVP Setup & Core Features

### Backend Setup (FastAPI)

- **Project Structure**: Feature-based folders (`auth/`, `subscriptions/`, `dashboard/`, `notifications/`)
- **Database**: PostgreSQL with SQLAlchemy ORM and Alembic migrations
- **Files to create**:
  - `backend/app/main.py` - FastAPI app entry point
  - `backend/app/database.py` - SQLAlchemy session & engine
  - `backend/app/config.py` - Environment variables (Pydantic Settings)
  - `backend/app/models/` - SQLAlchemy models (User, Subscription, Notification)
  - `backend/app/schemas/` - Pydantic request/response models
  - `backend/app/services/` - Business logic layer
  - `backend/app/routes/auth.py` - Register, login, me endpoints
  - `backend/app/routes/subscriptions.py` - CRUD endpoints
  - `backend/app/routes/dashboard.py` - Summary and upcoming endpoints
  - `backend/alembic.ini` & `backend/alembic/versions/` - Migration files
  - `backend/requirements.txt` - Dependencies
  - `.env.example` - Environment template

### Authentication System

- JWT token generation/validation
- Password hashing with `passlib[bcrypt]`
- Protected route dependencies
- User model with `is_premium` boolean

### Subscription CRUD

- Full CRUD operations with validation
- Fields: name, price, billing_cycle, next_billing_date, category, is_trial, notes
- User-scoped queries (users only see their subscriptions)

### Email Reminder System

- APScheduler for scheduled jobs
- Email service using Resend API
- Notification model to track sent reminders
- Background task to check upcoming renewals (7, 3, 1 days before)
- `backend/app/services/email_service.py` - Email sending logic
- `backend/app/services/scheduler.py` - APScheduler setup

### Frontend Setup (React + Tailwind)

- **Project Structure**: Component-based with pages
- **Files to create**:
  - `frontend/package.json` - React, Tailwind, Zustand, React Router, Recharts
  - `frontend/src/main.jsx` - App entry
  - `frontend/src/App.jsx` - Router setup
  - `frontend/src/store/authStore.js` - Zustand auth state
  - `frontend/src/store/subscriptionStore.js` - Subscription state
  - `frontend/src/api/` - Axios client with interceptors
  - `frontend/src/pages/Dashboard.jsx` - Main dashboard
  - `frontend/src/pages/Login.jsx` & `Register.jsx` - Auth pages
  - `frontend/src/pages/AddSubscription.jsx` - Form page
  - `frontend/src/components/SubscriptionCard.jsx` - Notion-style card
  - `frontend/src/components/CategoryTag.jsx` - Category badge
  - `frontend/src/components/SummaryWidget.jsx` - Monthly total card
  - `frontend/src/components/UpcomingRenewals.jsx` - Renewal list
  - `frontend/tailwind.config.js` - Tailwind config with Notion colors
  - `frontend/vite.config.js` - Vite config with proxy to backend

### Dashboard Features

- Subscription list/table view with Notion styling
- Category filters and sorting
- Monthly spending total calculation
- Category breakdown chart (Recharts)
- Upcoming renewals list
- Light/dark mode toggle (localStorage + Tailwind dark mode)

### API Integration

- Axios client with base URL from env
- JWT token storage in localStorage
- Request interceptors for auth headers
- Error handling and toast notifications

## Phase 2: AI Integration

- OpenAI API client setup
- `/ai/categorize` endpoint - Auto-categorize subscriptions
- `/ai/recommend` endpoint - Spending insights and recommendations
- `/ai/cancel-flow` endpoint - Generate cancellation instructions
- Frontend AI chat component
- AI message bubbles UI

## Phase 3: Premium System

- Stripe integration for payments
- `/billing/upgrade` and `/billing/downgrade` endpoints
- Feature gating middleware
- Premium badge in UI
- Usage limits for free tier

## Phase 4: One-Click Cancel System

- Cancellation flow templates per provider
- Email generation service
- Step-by-step UI flows
- Future: Web automation hooks

## Phase 5: Deployment & Polish

- Backend: Railway/Render deployment
- Frontend: Vercel deployment
- Environment variable configuration
- Logging setup (structlog)
- Error monitoring (Sentry optional)
- Database migrations in production

## Technical Decisions

- **Backend**: FastAPI with async/await patterns
- **Database**: PostgreSQL with UUID primary keys
- **Auth**: JWT with 7-day expiration
- **Email**: Resend API (free tier)
- **Frontend State**: Zustand for simplicity
- **Styling**: Tailwind with custom Notion-inspired theme
- **Charts**: Recharts for React integration
- **Deployment**: Railway for backend (Postgres included), Vercel for frontend

## File Structure Preview

```
backend/
  app/
    main.py
    config.py
    database.py
    models/
      user.py
      subscription.py
      notification.py
    schemas/
      auth.py
      subscription.py
    services/
      auth_service.py
      subscription_service.py
      email_service.py
      scheduler.py
    routes/
      auth.py
      subscriptions.py
      dashboard.py
  alembic/
  requirements.txt
  .env.example

frontend/
  src/
    pages/
    components/
    store/
    api/
    utils/
  package.json
  tailwind.config.js
  vite.config.js
```

### To-dos

- [ ] 