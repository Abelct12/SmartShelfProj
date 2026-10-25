from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class ColumnInfo(BaseModel):
    name: str
    dtype: str
    missing_count: int
    missing_percentage: float
    unique_count: int

class NumericStat(BaseModel):
    column: str
    mean: float
    std: float
    min: float
    q25: float
    median: float
    q75: float
    max: float

class DatasetValidationResponse(BaseModel):
    is_valid_for_training: bool
    filename: str
    total_rows: int
    total_columns: int
    duplicate_rows_count: int
    columns: List[ColumnInfo]
    numeric_statistics: List[NumericStat]
    target_column_found: bool
    target_column_name: Optional[str]
    missing_required_features: List[str]
    preview_rows: List[Dict[str, Any]]
    validation_messages: List[str]
