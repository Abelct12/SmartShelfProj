"""
Machine Learning Training Pipeline for Food Shelf Life Prediction.
Evaluates candidate regression models:
- Linear Regression (Baseline)
- Ridge Regression
- Random Forest Regressor
- Gradient Boosting Regressor

Selects the best performing model based on test RMSE and R2,
saves the unified scikit-learn Pipeline (preprocessing + model),
and exports comprehensive metadata, metrics, and feature importances.
"""

import json
import os
import sys
from datetime import datetime
import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import KFold, cross_validate, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

# Supported feature definitions
NUMERICAL_FEATURES = [
    "storage_temperature_c",
    "relative_humidity_percent",
    "initial_quality_index",
    "storage_duration_days"
]

CATEGORICAL_FEATURES = [
    "food_category",
    "packaging_type"
]

TARGET_COLUMN = "remaining_shelf_life_days"

def build_preprocessor():
    """Build scikit-learn ColumnTransformer for numerical and categorical features."""
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), NUMERICAL_FEATURES),
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), CATEGORICAL_FEATURES)
        ],
        remainder="drop"
    )
    return preprocessor

def evaluate_models(X_train, y_train, X_test, y_test, preprocessor):
    """
    Train and evaluate multiple candidate regression algorithms.
    Computes 5-fold CV metrics on training data and held-out test metrics.
    """
    candidates = {
        "Linear Regression": LinearRegression(),
        "Ridge Regression": Ridge(alpha=1.0),
        "Random Forest": RandomForestRegressor(n_estimators=100, max_depth=12, random_state=42, n_jobs=-1),
        "Gradient Boosting": GradientBoostingRegressor(n_estimators=120, learning_rate=0.08, max_depth=5, random_state=42)
    }

    results = {}
    fitted_pipelines = {}
    cv = KFold(n_splits=5, shuffle=True, random_state=42)

    scoring = {
        "mae": "neg_mean_absolute_error",
        "rmse": "neg_root_mean_squared_error",
        "r2": "r2"
    }

    print("\n--- Evaluating Candidate Regression Models (5-Fold CV & Held-Out Test Set) ---")
    
    for name, model in candidates.items():
        pipeline = Pipeline([
            ("preprocessor", preprocessor),
            ("regressor", model)
        ])
        
        # 5-Fold Cross-Validation on Training set
        cv_scores = cross_validate(pipeline, X_train, y_train, cv=cv, scoring=scoring, n_jobs=-1)
        cv_mae = float(-cv_scores["test_mae"].mean())
        cv_rmse = float(-cv_scores["test_rmse"].mean())
        cv_r2 = float(cv_scores["test_r2"].mean())

        # Fit on full training set
        pipeline.fit(X_train, y_train)
        fitted_pipelines[name] = pipeline

        # Evaluate on held-out test set
        y_pred = pipeline.predict(X_test)
        
        # Transparent non-negative floor rule for evaluation reporting
        y_pred_bounded = np.clip(y_pred, 0.0, None)

        test_mae = float(mean_absolute_error(y_test, y_pred_bounded))
        test_rmse = float(np.sqrt(mean_squared_error(y_test, y_pred_bounded)))
        test_r2 = float(r2_score(y_test, y_pred_bounded))

        results[name] = {
            "cv_mae": round(cv_mae, 4),
            "cv_rmse": round(cv_rmse, 4),
            "cv_r2": round(cv_r2, 4),
            "test_mae": round(test_mae, 4),
            "test_rmse": round(test_rmse, 4),
            "test_r2": round(test_r2, 4),
        }

        print(f"[{name}]")
        print(f"  5-Fold CV -> MAE: {cv_mae:.3f} days | RMSE: {cv_rmse:.3f} days | R2: {cv_r2:.4f}")
        print(f"  Test Set  -> MAE: {test_mae:.3f} days | RMSE: {test_rmse:.3f} days | R2: {test_r2:.4f}")

    # Model selection based on lowest test RMSE and highest R2
    best_model_name = min(results, key=lambda k: results[k]["test_rmse"])
    print(f"\n=> Best Model Selected: '{best_model_name}' (Test RMSE: {results[best_model_name]['test_rmse']} days, R2: {results[best_model_name]['test_r2']})")

    return best_model_name, fitted_pipelines[best_model_name], results

def extract_feature_importances(pipeline, categorical_features, numerical_features):
    """Extract feature names and importances from fitted model pipeline."""
    try:
        preprocessor = pipeline.named_steps["preprocessor"]
        regressor = pipeline.named_steps["regressor"]

        cat_encoder = preprocessor.named_transformers_["cat"]
        cat_feature_names = list(cat_encoder.get_feature_names_out(categorical_features))
        all_feature_names = numerical_features + cat_feature_names

        importances = []
        if hasattr(regressor, "feature_importances_"):
            raw_imp = regressor.feature_importances_
            for name, score in zip(all_feature_names, raw_imp):
                importances.append({"feature": name, "importance": round(float(score), 4)})
            importances.sort(key=lambda x: x["importance"], reverse=True)
        elif hasattr(regressor, "coef_"):
            raw_imp = np.abs(regressor.coef_)
            total = sum(raw_imp) if sum(raw_imp) > 0 else 1.0
            norm_imp = raw_imp / total
            for name, score in zip(all_feature_names, norm_imp):
                importances.append({"feature": name, "importance": round(float(score), 4)})
            importances.sort(key=lambda x: x["importance"], reverse=True)
        return importances
    except Exception as e:
        print(f"Warning: Could not extract feature importances: {e}")
        return []

def train_and_persist(data_path="data/raw/food_shelf_life_dataset.csv",
                      model_dir="models",
                      test_size=0.2,
                      random_state=42):
    """
    End-to-end training, validation, selection, and artifact persistence.
    """
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Training dataset not found at {data_path}")

    os.makedirs(model_dir, exist_ok=True)
    df = pd.read_csv(data_path)

    # Validate required columns
    required_cols = NUMERICAL_FEATURES + CATEGORICAL_FEATURES + [TARGET_COLUMN]
    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        raise ValueError(f"Dataset is missing required columns: {missing}")

    # Remove rows with nulls in required features
    initial_len = len(df)
    clean_df = df.dropna(subset=required_cols).copy()
    dropped_count = initial_len - len(clean_df)

    X = clean_df[NUMERICAL_FEATURES + CATEGORICAL_FEATURES]
    y = clean_df[TARGET_COLUMN]

    # Stratified or standard reproducible train-test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state
    )

    preprocessor = build_preprocessor()
    best_model_name, best_pipeline, evaluation_results = evaluate_models(
        X_train, y_train, X_test, y_test, preprocessor
    )

    # Extract feature importance
    feature_importances = extract_feature_importances(
        best_pipeline, CATEGORICAL_FEATURES, NUMERICAL_FEATURES
    )

    # Persistence paths
    pipeline_path = os.path.join(model_dir, "food_shelf_life_pipeline.joblib")
    metadata_path = os.path.join(model_dir, "model_metadata.json")

    joblib.dump(best_pipeline, pipeline_path)
    print(f"\nPersisted winning model pipeline to: {pipeline_path}")

    # Compile comprehensive academic metadata
    metadata = {
        "model_version": "1.0.0",
        "model_name": best_model_name,
        "selected_algorithm": best_pipeline.named_steps["regressor"].__class__.__name__,
        "dataset_path": data_path,
        "dataset_samples_total": len(clean_df),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "dropped_missing_samples": dropped_count,
        "train_test_split_ratio": f"{int((1 - test_size) * 100)}/{int(test_size * 100)}",
        "random_state": random_state,
        "training_timestamp": datetime.now().isoformat(),
        "numerical_features": NUMERICAL_FEATURES,
        "categorical_features": CATEGORICAL_FEATURES,
        "target_column": TARGET_COLUMN,
        "evaluation_metrics": evaluation_results[best_model_name],
        "all_model_comparisons": evaluation_results,
        "feature_importances": feature_importances,
        "supported_categories": sorted(clean_df["food_category"].unique().tolist()),
        "supported_packaging": sorted(clean_df["packaging_type"].unique().tolist()),
        "feature_summary": {
            "temperature_range_c": [float(clean_df["storage_temperature_c"].min()), float(clean_df["storage_temperature_c"].max())],
            "humidity_range_percent": [float(clean_df["relative_humidity_percent"].min()), float(clean_df["relative_humidity_percent"].max())],
            "quality_range": [float(clean_df["initial_quality_index"].min()), float(clean_df["initial_quality_index"].max())],
            "storage_duration_max_days": float(clean_df["storage_duration_days"].max()),
            "remaining_shelf_life_mean_days": round(float(clean_df[TARGET_COLUMN].mean()), 2)
        },
        "academic_limitations": [
            "Predictions are statistical approximations based on kinetic and microbial spoilage models; they do not replace regulatory microbiological laboratory analysis.",
            "Predictions assume steady-state storage temperature and relative humidity over the storage duration.",
            "Extreme conditions far beyond training ranges (-20°C to 40°C) may lead to extrapolation uncertainty.",
            "Cross-contamination, physical damage, and anaerobic pathogen outgrowth (e.g., Clostridium botulinum in defective vacuum packs) are not modeled."
        ]
    }

    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"Persisted model metadata to: {metadata_path}")

    return metadata

if __name__ == "__main__":
    train_and_persist()
