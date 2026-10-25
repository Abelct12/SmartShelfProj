import os
from fastapi import APIRouter, File, UploadFile, HTTPException, status
import pandas as pd

from backend.app.schemas.dataset import DatasetValidationResponse
from backend.app.services.dataset_service import dataset_service
from backend.app.core.config import settings

router = APIRouter()

MAX_FILE_SIZE = 15 * 1024 * 1024  # 15 MB limit

@router.post("/dataset/validate", response_model=DatasetValidationResponse, tags=["Dataset"])
async def validate_dataset(file: UploadFile = File(...)):
    """
    Upload and inspect a CSV dataset.
    Performs schema validation, column type extraction, missing value analysis,
    duplicate row detection, and target variable verification.
    """
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only .csv files are supported."
        )

    try:
        content = await file.read()
        if len(content) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty."
            )
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                detail=f"Uploaded file exceeds maximum allowed size of 15 MB (Received {len(content) / (1024 * 1024):.2f} MB)."
            )
        return dataset_service.validate_csv_content(content, file.filename)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to inspect dataset: {str(e)}"
        )

@router.get("/dataset/active-info", response_model=DatasetValidationResponse, tags=["Dataset"])
def get_active_dataset_info():
    """Inspect the active training dataset currently located in data/raw."""
    if not os.path.exists(settings.DATASET_PATH):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active dataset file not found."
        )

    with open(settings.DATASET_PATH, "rb") as f:
        content = f.read()

    return dataset_service.validate_csv_content(content, os.path.basename(settings.DATASET_PATH))
