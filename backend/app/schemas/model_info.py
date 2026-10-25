from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class EvaluationMetrics(BaseModel):
    cv_mae: float
    cv_rmse: float
    cv_r2: float
    test_mae: float
    test_rmse: float
    test_r2: float

class FeatureImportanceItem(BaseModel):
    feature: str
    importance: float

class ModelInfoResponse(BaseModel):
    model_version: str
    model_name: str
    selected_algorithm: str
    dataset_path: str
    dataset_samples_total: int
    train_samples: int
    test_samples: int
    train_test_split_ratio: str
    random_state: int
    training_timestamp: str
    numerical_features: List[str]
    categorical_features: List[str]
    target_column: str
    evaluation_metrics: EvaluationMetrics
    all_model_comparisons: Dict[str, Dict[str, float]]
    feature_importances: List[FeatureImportanceItem]
    supported_categories: List[str]
    supported_packaging: List[str]
    feature_summary: Dict[str, Any]
    academic_limitations: List[str]
