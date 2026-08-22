import os
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.api.activities import router as activities_router
from backend.app.api.admin import router as admin_router
from backend.app.api.auth import router as auth_router
from backend.app.api.cities import router as cities_router
from backend.app.api.community import router as community_router
from backend.app.api.favorites import router as favorites_router
from backend.app.api.notifications import router as notifications_router
from backend.app.api.recommendations import router as recommendations_router
from backend.app.api.trips import router as trips_router
from backend.app.database.seed import seed_database
from backend.app.database.session import Base, engine

# Initialize database schema tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="GlobeTrotter API",
    description="Backend REST API for GlobeTrotter — Personalized Smart Travel Planning Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins in development and containerized setups
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global Exception Handler to ensure human-readable error messages without exposing tracebacks
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": f"An unexpected server error occurred: {str(exc)}"},
    )


# Automatically run seed on application startup
@app.on_event("startup")
def on_startup():
    try:
        seed_database()
    except Exception as e:
        print(f"[GlobeTrotter Startup Seeding Warning]: {e}")


# Root and Health Check Endpoints
@app.get("/")
def root():
    return {
        "app": "GlobeTrotter — Personalized Smart Travel Planning",
        "version": "1.0.0",
        "status": "healthy",
        "documentation": "/docs",
    }


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "globetrotter-backend"}


# Include API routers under /api
app.include_router(auth_router, prefix="/api")
app.include_router(trips_router, prefix="/api")
app.include_router(cities_router, prefix="/api")
app.include_router(activities_router, prefix="/api")
app.include_router(community_router, prefix="/api")
app.include_router(recommendations_router, prefix="/api")
app.include_router(favorites_router, prefix="/api")
app.include_router(notifications_router, prefix="/api")
app.include_router(admin_router, prefix="/api")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
