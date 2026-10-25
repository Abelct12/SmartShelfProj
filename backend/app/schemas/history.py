from typing import Optional, List
from pydantic import BaseModel

class PredictionItemSchema(BaseModel):
    id: int
    prediction_id: str
    created_at: str
    food_category: str
    food_item: Optional[str] = None
    storage_temperature_c: float
    relative_humidity_percent: float
    packaging_type: str
    initial_quality_index: float
    storage_duration_days: float
    reference_date: Optional[str] = None
    predicted_remaining_days: float
    raw_prediction_days: float
    estimated_expiry_date: Optional[str] = None
    shelf_life_status: str
    safety_notes: Optional[str] = None
    model_version: str
    model_name: str

class PaginatedPredictionsResponse(BaseModel):
    items: List[PredictionItemSchema]
    total: int
    page: int
    page_size: int
    total_pages: int
