from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator
from datetime import date

SUPPORTED_CATEGORIES = [
    "Dairy",
    "Meat & Poultry",
    "Seafood",
    "Fruits",
    "Vegetables",
    "Bakery"
]

SUPPORTED_PACKAGING = [
    "Vacuum Sealed",
    "Modified Atmosphere Packaging (MAP)",
    "Sealed Plastic Container",
    "Paper / Carton",
    "Ambient / Unsealed"
]

class PredictRequest(BaseModel):
    food_category: str = Field(..., description="Food category (e.g. Dairy, Meat & Poultry, Seafood, Fruits, Vegetables, Bakery)")
    food_item: Optional[str] = Field(None, description="Specific food item name")
    storage_temperature_c: float = Field(..., ge=-30.0, le=55.0, description="Storage temperature in degrees Celsius")
    relative_humidity_percent: float = Field(..., ge=10.0, le=100.0, description="Ambient relative humidity percentage")
    packaging_type: str = Field(..., description="Packaging type or condition")
    initial_quality_index: float = Field(9.0, ge=1.0, le=10.0, description="Initial freshness/quality score (1-10 scale)")
    storage_duration_days: float = Field(..., ge=0.0, le=365.0, description="Elapsed storage time in days")
    reference_date: Optional[str] = Field(None, description="Starting/Storage reference date (YYYY-MM-DD)")

    @field_validator("food_category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        cleaned = v.strip()
        matches = [c for c in SUPPORTED_CATEGORIES if c.lower() == cleaned.lower()]
        if not matches:
            raise ValueError(f"Unsupported food category '{v}'. Supported: {', '.join(SUPPORTED_CATEGORIES)}")
        return matches[0]

    @field_validator("packaging_type")
    @classmethod
    def validate_packaging(cls, v: str) -> str:
        cleaned = v.strip()
        matches = [p for p in SUPPORTED_PACKAGING if p.lower() == cleaned.lower()]
        if not matches:
            raise ValueError(f"Unsupported packaging type '{v}'. Supported: {', '.join(SUPPORTED_PACKAGING)}")
        return matches[0]

    @field_validator("reference_date")
    @classmethod
    def validate_date(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return None
        try:
            date.fromisoformat(v)
            return v
        except ValueError:
            raise ValueError("Reference date must be in YYYY-MM-DD format.")

class PredictResponse(BaseModel):
    prediction_id: str
    timestamp: str
    food_category: str
    food_item: Optional[str] = None
    storage_temperature_c: float
    relative_humidity_percent: float
    packaging_type: str
    initial_quality_index: float
    storage_duration_days: float
    
    # Model predictions
    predicted_remaining_days: float
    raw_model_prediction: float
    estimated_expiry_date: Optional[str] = None
    shelf_life_status: str  # "Optimal", "Moderate", "Critical", "Expired"
    status_color: str       # hex color for frontend badge
    
    # Guidance and transparency
    safety_guidance: List[str]
    disclaimer: str
    model_version: str
    model_name: str
    input_summary: Dict[str, Any]
