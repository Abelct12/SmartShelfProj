import os
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from backend.app.schemas.model_info import ModelInfoResponse
from backend.app.services.prediction_service import prediction_service
from backend.app.ml.train import train_and_persist

router = APIRouter()

class RetrainRequest(BaseModel):
    confirm: bool = Field(..., description="Explicit user confirmation required for triggering model training")
    test_size: float = Field(0.2, ge=0.1, le=0.4, description="Held-out test split ratio")
    random_state: int = Field(42, description="Random seed for reproducibility")

@router.get("/model/info", response_model=ModelInfoResponse, tags=["Model"])
def get_model_info():
    """Retrieve full model metadata, candidate comparisons, metrics, and feature importances."""
    if not prediction_service.metadata:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model metadata is not available. Please run training first."
        )
    return prediction_service.metadata

@router.post("/model/retrain", tags=["Model"])
def retrain_model(req: RetrainRequest):
    """
    Controlled candidate-model retraining endpoint.
    Requires explicit confirmation flag. Evaluates all candidate algorithms,
    selects the highest-performing model, updates artifacts, and reloads the active model.
    """
    if not req.confirm:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Model retraining aborted. The 'confirm' parameter must be set to true."
        )

    try:
        updated_metadata = train_and_persist(
            test_size=req.test_size,
            random_state=req.random_state
        )
        # Reload pipeline into active prediction service
        reloaded = prediction_service.load_model()
        
        return {
            "status": "success",
            "message": "Model training and evaluation completed successfully. Active pipeline updated.",
            "selected_algorithm": updated_metadata.get("selected_algorithm"),
            "model_name": updated_metadata.get("model_name"),
            "evaluation_metrics": updated_metadata.get("evaluation_metrics"),
            "pipeline_reloaded": reloaded
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Retraining failed: {str(e)}"
        )
