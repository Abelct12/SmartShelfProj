import os
from pathlib import Path
from pydantic_settings import BaseSettings

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
BACKEND_DIR = BASE_DIR / "backend"
MODELS_DIR = BASE_DIR / "models"
DATA_DIR = BASE_DIR / "data"

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Food Shelf Life Prediction System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Database
    DATABASE_URL: str = f"sqlite:///{BASE_DIR / 'food_shelf_life.db'}"
    
    # Model Artifacts
    MODEL_PATH: Path = MODELS_DIR / "food_shelf_life_pipeline.joblib"
    METADATA_PATH: Path = MODELS_DIR / "model_metadata.json"
    DATASET_PATH: Path = DATA_DIR / "raw" / "food_shelf_life_dataset.csv"
    
    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ]

    model_config = {
        "case_sensitive": True
    }

settings = Settings()
