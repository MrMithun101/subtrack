from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi

# Routers
from app.api.routes.auth import router as auth_router
from app.api.routes.subscriptions import router as subscriptions_router

# DB
from app.db.session import Base, engine
from app.models import Subscription, User  # Import models so they're registered with Base


app = FastAPI(title="SubTrack API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
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


# Run DB migrations automatically (for SQLite)
@app.on_event("startup")
async def on_startup():
    Base.metadata.create_all(bind=engine)
    
    # Start the reminder worker
    # NOTE: This is a simple in-process scheduler for development.
    # In production, consider using a dedicated worker process, Celery,
    # or a cron job to run reminder tasks separately from the API server.
    import asyncio
    from app.services.reminders import process_renewal_reminders
    
    async def reminder_worker():
        """Background worker that runs renewal reminder checks once per day."""
        while True:
            try:
                # Run once per 24 hours
                process_renewal_reminders(within_days=7)
            except Exception as e:
                # Log error but don't crash the worker
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error in reminder worker: {str(e)}", exc_info=True)
            
            # Wait 24 hours before next run
            await asyncio.sleep(60 * 60 * 24)  # 24 hours in seconds
    
    # Start the worker as a background task
    asyncio.create_task(reminder_worker())


# Include routers
app.include_router(auth_router)
app.include_router(subscriptions_router)


# Basic test routes
@app.get("/")
def read_root():
    return {"message": "SubTrack backend is running"}


@app.get("/health")
def health_check():
    return {"status": "ok"}
