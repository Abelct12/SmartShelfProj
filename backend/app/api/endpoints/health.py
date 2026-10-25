from fastapi import APIRouter
from backend.app.services.prediction_service import prediction_service
from backend.app.core.config import settings

router = APIRouter()

@router.get("/health", tags=["Health"])
def health_check():
    """Application readiness and model status check."""
    model_ready = prediction_service.is_ready()
    return {
        "status": "healthy" if model_ready else "degraded",
        "app_name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "model_status": "loaded" if model_ready else "not_loaded",
        "model_name": prediction_service.metadata.get("model_name") if prediction_service.metadata else None,
        "model_version": prediction_service.metadata.get("model_version") if prediction_service.metadata else None,
        "selected_algorithm": prediction_service.metadata.get("selected_algorithm") if prediction_service.metadata else None
    }
