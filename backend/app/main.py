from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi

# Routers
from app.api.routes.auth import router as auth_router
from app.api.routes.subscriptions import router as subscriptions_router
from app.api.routes.internal import router as internal_router

# DB
from app.db.session import Base, engine
from app.models import Subscription, User  # Import models so they're registered with Base


app = FastAPI(title="SubTrack API")

# Configure CORS
# Always allow localhost for local development
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Add production origins from CORS_ORIGINS env var (comma-separated)
import os
cors_origins_env = os.getenv("CORS_ORIGINS")
if cors_origins_env:
    # Split by comma and strip whitespace
    production_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]
    allowed_origins.extend(production_origins)

# Legacy support: also check FRONTEND_URL (single URL)
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url and frontend_url not in allowed_origins:
    allowed_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title="SubTrack API",
        version="0.1.0",
        description="SubTrack API with HTTP Bearer authentication",
        routes=app.routes,
    )
    openapi_schema["components"]["securitySchemes"] = {
        "HTTPBearer": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
        }
    }
    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi


@app.on_event("startup")
async def on_startup():
    """
    Startup event handler.
    Note: Database tables are created via Alembic migrations, not here.
    
    Note: Reminder processing is handled via Railway cron job calling
    POST /internal/run-reminders endpoint, not via background worker.
    """
    pass


# Include routers
app.include_router(auth_router)
app.include_router(subscriptions_router)
app.include_router(internal_router)


# Basic test routes
@app.get("/")
def read_root():
    return {"message": "SubTrack backend is running"}


@app.get("/health")
def health_check():
    """
    Health check endpoint that verifies database connectivity.
    Returns 200 if DB is accessible, 503 if not.
    """
    from sqlalchemy import text
    from app.db.session import engine
    
    try:
        # Simple DB connectivity check
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        # Return 503 Service Unavailable if DB is not accessible
        from fastapi import status
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "error", "database": "disconnected", "error": str(e)}
        )
