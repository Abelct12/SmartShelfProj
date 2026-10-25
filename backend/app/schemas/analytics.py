from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class StatusCount(BaseModel):
    status: str
    count: int
    percentage: float

class CategoryCount(BaseModel):
    category: str
    count: int
    avg_remaining_days: float

class ScatterPoint(BaseModel):
    id: str
    category: str
    temperature: float
    humidity: float
    remaining_days: float
    status: str

class ShelfLifeDistributionBin(BaseModel):
    bin_label: str
    count: int

class AnalyticsSummaryResponse(BaseModel):
    total_predictions: int
    categories_represented_count: int
    average_remaining_shelf_life_days: float
    status_breakdown: List[StatusCount]
    category_summary: List[CategoryCount]
    latest_activity: List[Dict[str, Any]]
    model_status: str
    model_name: str
    last_trained: Optional[str] = None

class DistributionsResponse(BaseModel):
    shelf_life_distribution: List[ShelfLifeDistributionBin]
    category_distribution: List[CategoryCount]
    scatter_points: List[ScatterPoint]
    packaging_distribution: List[Dict[str, Any]]
