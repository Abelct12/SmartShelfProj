export interface PredictRequest {
  food_category: string;
  food_item?: string;
  storage_temperature_c: number;
  relative_humidity_percent: number;
  packaging_type: string;
  initial_quality_index: number;
  storage_duration_days: number;
  reference_date?: string;
}

export interface PredictResponse {
  prediction_id: string;
  timestamp: string;
  food_category: string;
  food_item?: string;
  storage_temperature_c: number;
  relative_humidity_percent: number;
  packaging_type: string;
  initial_quality_index: number;
  storage_duration_days: number;
  predicted_remaining_days: number;
  raw_model_prediction: number;
  estimated_expiry_date?: string;
  shelf_life_status: 'Optimal' | 'Moderate' | 'Critical' | 'Expired' | string;
  status_color: string;
  safety_guidance: string[];
  disclaimer: string;
  model_version: string;
  model_name: string;
  input_summary: Record<string, any>;
}

export interface PredictionItem {
  id: number;
  prediction_id: string;
  created_at: string;
  food_category: string;
  food_item?: string;
  storage_temperature_c: number;
  relative_humidity_percent: number;
  packaging_type: string;
  initial_quality_index: number;
  storage_duration_days: number;
  reference_date?: string;
  predicted_remaining_days: number;
  raw_prediction_days: number;
  estimated_expiry_date?: string;
  shelf_life_status: string;
  safety_notes?: string;
  model_version: string;
  model_name: string;
}

export interface PaginatedPredictionsResponse {
  items: PredictionItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface StatusCount {
  status: string;
  count: number;
  percentage: number;
}

export interface CategoryCount {
  category: string;
  count: number;
  avg_remaining_days: number;
}

export interface AnalyticsSummary {
  total_predictions: number;
  categories_represented_count: number;
  average_remaining_shelf_life_days: number;
  status_breakdown: StatusCount[];
  category_summary: CategoryCount[];
  latest_activity: {
    prediction_id: string;
    timestamp?: string;
    food_category: string;
    food_item?: string;
    predicted_remaining_days: number;
    shelf_life_status: string;
    temperature: number;
    humidity: number;
  }[];
  model_status: string;
  model_name: string;
  last_trained?: string;
}

export interface DistributionsData {
  shelf_life_distribution: { bin_label: string; count: number }[];
  category_distribution: CategoryCount[];
  scatter_points: {
    id: string;
    category: string;
    temperature: number;
    humidity: number;
    remaining_days: number;
    status: string;
  }[];
  packaging_distribution: { packaging: string; count: number }[];
}

export interface ModelInfo {
  model_version: string;
  model_name: string;
  selected_algorithm: string;
  dataset_path: string;
  dataset_samples_total: number;
  train_samples: number;
  test_samples: number;
  train_test_split_ratio: string;
  random_state: number;
  training_timestamp: string;
  numerical_features: string[];
  categorical_features: string[];
  target_column: string;
  evaluation_metrics: {
    cv_mae: number;
    cv_rmse: number;
    cv_r2: number;
    test_mae: number;
    test_rmse: number;
    test_r2: number;
  };
  all_model_comparisons: Record<string, Record<string, number>>;
  feature_importances: { feature: string; importance: number }[];
  supported_categories: string[];
  supported_packaging: string[];
  feature_summary: {
    temperature_range_c: [number, number];
    humidity_range_percent: [number, number];
    quality_range: [number, number];
    storage_duration_max_days: number;
    remaining_shelf_life_mean_days: number;
  };
  academic_limitations: string[];
}

export interface ColumnInfo {
  name: string;
  dtype: string;
  missing_count: number;
  missing_percentage: number;
  unique_count: number;
}

export interface NumericStat {
  column: string;
  mean: number;
  std: number;
  min: number;
  q25: number;
  median: number;
  q75: number;
  max: number;
}

export interface DatasetValidationResponse {
  is_valid_for_training: boolean;
  filename: string;
  total_rows: number;
  total_columns: number;
  duplicate_rows_count: number;
  columns: ColumnInfo[];
  numeric_statistics: NumericStat[];
  target_column_found: boolean;
  target_column_name?: string;
  missing_required_features: string[];
  preview_rows: Record<string, any>[];
  validation_messages: string[];
}

export interface FoodGuideline {
  category: string;
  optimal_temperature_range: string;
  optimal_humidity_range: string;
  recommended_packaging: string;
  primary_spoilage_mechanisms: string[];
  critical_food_safety_rule: string;
  typical_shelf_life_unopened: string;
  source: string;
}
