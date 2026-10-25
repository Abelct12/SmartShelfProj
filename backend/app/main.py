import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.core.config import settings
from backend.app.database.db import init_db
from backend.app.services.prediction_service import prediction_service

# Import API Endpoint Routers
from backend.app.api.endpoints.health import router as health_router
from backend.app.api.endpoints.predictions import router as predictions_router
from backend.app.api.endpoints.analytics import router as analytics_router
from backend.app.api.endpoints.model import router as model_router
from backend.app.api.endpoints.dataset import router as dataset_router
from backend.app.api.endpoints.guidelines import router as guidelines_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for application startup and shutdown events."""
    # Initialize SQLite database schema
    init_db()
    print("Database tables initialized.")

    # Load machine learning pipeline artifact
    loaded = prediction_service.load_model()
    if loaded:
        print(f"ML Pipeline loaded successfully: {prediction_service.metadata.get('model_name')}")
    else:
        print("Warning: ML model artifacts not found at startup. Please run training pipeline.")

    yield
    print("Application shutdown complete.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Production-grade AI and Data Science system for estimating food remaining shelf life.",
    lifespan=lifespan
)

# CORS Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(health_router, prefix=settings.API_V1_STR)
app.include_router(predictions_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)
app.include_router(model_router, prefix=settings.API_V1_STR)
app.include_router(dataset_router, prefix=settings.API_V1_STR)
app.include_router(guidelines_router, prefix=settings.API_V1_STR)

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

# Global exception handler for uniform JSON responses
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    if isinstance(exc, StarletteHTTPException):
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal processing error: {str(exc)}"}
    )

@app.get("/", tags=["Root"])
def root():
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "api_docs": "/docs",
        "health_check": f"{settings.API_V1_STR}/health",
        "description": "Food Shelf Life Prediction System REST API"
    }
