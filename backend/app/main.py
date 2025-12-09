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
def on_startup():
    Base.metadata.create_all(bind=engine)


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
