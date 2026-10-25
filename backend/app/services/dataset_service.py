import io
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np

from backend.app.schemas.dataset import (
    DatasetValidationResponse,
    ColumnInfo,
    NumericStat
)
from backend.app.ml.train import (
    NUMERICAL_FEATURES,
    CATEGORICAL_FEATURES,
    TARGET_COLUMN
)

class DatasetService:
    def validate_csv_content(self, content_bytes: bytes, filename: str) -> DatasetValidationResponse:
        """Parse CSV bytes and perform comprehensive data quality & feature compatibility analysis."""
        validation_messages = []
        try:
            df = pd.read_csv(io.BytesIO(content_bytes))
        except Exception as e:
            return DatasetValidationResponse(
                is_valid_for_training=False,
                filename=filename,
                total_rows=0,
                total_columns=0,
                duplicate_rows_count=0,
                columns=[],
                numeric_statistics=[],
                target_column_found=False,
                target_column_name=None,
                missing_required_features=NUMERICAL_FEATURES + CATEGORICAL_FEATURES + [TARGET_COLUMN],
                preview_rows=[],
                validation_messages=[f"Failed to parse CSV file: {str(e)}"]
            )

        total_rows = len(df)
        total_columns = len(df.columns)
        duplicate_count = int(df.duplicated().sum())

        if duplicate_count > 0:
            validation_messages.append(f"Detected {duplicate_count} duplicate rows in uploaded dataset.")

        # Check required columns
        required_features = NUMERICAL_FEATURES + CATEGORICAL_FEATURES
        missing_features = [col for col in required_features if col not in df.columns]
        target_found = TARGET_COLUMN in df.columns

        if not target_found:
            validation_messages.append(f"Target column '{TARGET_COLUMN}' is missing from the dataset.")

        if missing_features:
            validation_messages.append(f"Missing required features for model training: {', '.join(missing_features)}")

        # Column Info
        column_infos = []
        for col in df.columns:
            missing_c = int(df[col].isna().sum())
            missing_pct = round((missing_c / total_rows * 100), 2) if total_rows > 0 else 0.0
            unique_c = int(df[col].nunique())
            dtype_str = str(df[col].dtype)
            
            column_infos.append(ColumnInfo(
                name=col,
                dtype=dtype_str,
                missing_count=missing_c,
                missing_percentage=missing_pct,
                unique_count=unique_c
            ))

        # Numeric Statistics
        numeric_stats = []
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        for col in numeric_cols:
            series = df[col].dropna()
            if len(series) > 0:
                numeric_stats.append(NumericStat(
                    column=col,
                    mean=round(float(series.mean()), 2),
                    std=round(float(series.std()), 2) if len(series) > 1 else 0.0,
                    min=round(float(series.min()), 2),
                    q25=round(float(series.quantile(0.25)), 2),
                    median=round(float(series.median()), 2),
                    q75=round(float(series.quantile(0.75)), 2),
                    max=round(float(series.max()), 2)
                ))

        # Preview first 10 rows
        preview_rows = df.head(10).replace({np.nan: None}).to_dict(orient="records")

        # Determine validity for model training
        is_valid = (target_found and len(missing_features) == 0 and total_rows >= 50)
        
        if is_valid:
            validation_messages.append(
                f"Dataset passed all feature compatibility checks ({total_rows} rows, {total_columns} columns). Ready for candidate model training."
            )
        else:
            if total_rows < 50:
                validation_messages.append(f"Dataset has only {total_rows} rows; minimum 50 rows required for reliable train/test evaluation.")

        return DatasetValidationResponse(
            is_valid_for_training=is_valid,
            filename=filename,
            total_rows=total_rows,
            total_columns=total_columns,
            duplicate_rows_count=duplicate_count,
            columns=column_infos,
            numeric_statistics=numeric_stats,
            target_column_found=target_found,
            target_column_name=TARGET_COLUMN if target_found else None,
            missing_required_features=missing_features,
            preview_rows=preview_rows,
            validation_messages=validation_messages
        )

dataset_service = DatasetService()
