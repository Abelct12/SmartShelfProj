"""
CLI Script to train and persist the Food Shelf Life ML Model.
Usage:
    python scripts/train_model.py
"""

import sys
import os

# Add root directory to sys.path so backend modules can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.ml.train import train_and_persist

if __name__ == "__main__":
    print("=" * 60)
    print("Food Shelf Life Prediction - Machine Learning Training Pipeline")
    print("=" * 60)
    try:
        metadata = train_and_persist()
        print("\nModel training, cross-validation, and persistence succeeded!")
        print(f"Selected Algorithm: {metadata['selected_algorithm']}")
        print(f"Test MAE: {metadata['evaluation_metrics']['test_mae']} days")
        print(f"Test RMSE: {metadata['evaluation_metrics']['test_rmse']} days")
        print(f"Test R2: {metadata['evaluation_metrics']['test_r2']}")
    except Exception as e:
        print(f"\nTraining failed with error: {e}")
        sys.exit(1)
