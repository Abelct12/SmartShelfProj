"""
Seed realistic prediction records into SQLite database for demonstration.
"""

import sys
import os
from datetime import datetime, timedelta
import random

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.database.db import SessionLocal, init_db
from backend.app.database.models import PredictionRecord
from backend.app.services.prediction_service import prediction_service
from backend.app.schemas.prediction import PredictRequest

DEMO_SCENARIOS = [
    {
        "food_category": "Dairy",
        "food_item": "Pasteurized Whole Milk",
        "storage_temperature_c": 3.5,
        "relative_humidity_percent": 55.0,
        "packaging_type": "Sealed Plastic Container",
        "initial_quality_index": 9.5,
        "storage_duration_days": 3.0,
        "days_ago": 4
    },
    {
        "food_category": "Meat & Poultry",
        "food_item": "Raw Chicken Breast",
        "storage_temperature_c": 1.8,
        "relative_humidity_percent": 65.0,
        "packaging_type": "Vacuum Sealed",
        "initial_quality_index": 9.0,
        "storage_duration_days": 2.0,
        "days_ago": 3
    },
    {
        "food_category": "Seafood",
        "food_item": "Fresh Salmon Fillet",
        "storage_temperature_c": 1.0,
        "relative_humidity_percent": 70.0,
        "packaging_type": "Modified Atmosphere Packaging (MAP)",
        "initial_quality_index": 9.2,
        "storage_duration_days": 1.5,
        "days_ago": 2
    },
    {
        "food_category": "Fruits",
        "food_item": "Fresh Strawberries",
        "storage_temperature_c": 5.0,
        "relative_humidity_percent": 85.0,
        "packaging_type": "Sealed Plastic Container",
        "initial_quality_index": 8.8,
        "storage_duration_days": 2.5,
        "days_ago": 2
    },
    {
        "food_category": "Vegetables",
        "food_item": "Baby Spinach Leaves",
        "storage_temperature_c": 4.0,
        "relative_humidity_percent": 90.0,
        "packaging_type": "Sealed Plastic Container",
        "initial_quality_index": 8.5,
        "storage_duration_days": 3.0,
        "days_ago": 1
    },
    {
        "food_category": "Bakery",
        "food_item": "Whole Wheat Artisan Loaf",
        "storage_temperature_c": 21.0,
        "relative_humidity_percent": 45.0,
        "packaging_type": "Paper / Carton",
        "initial_quality_index": 9.0,
        "storage_duration_days": 2.0,
        "days_ago": 1
    },
    {
        "food_category": "Dairy",
        "food_item": "Greek Yogurt",
        "storage_temperature_c": 7.5, # Slightly warm
        "relative_humidity_percent": 60.0,
        "packaging_type": "Sealed Plastic Container",
        "initial_quality_index": 8.0,
        "storage_duration_days": 8.0,
        "days_ago": 0
    },
    {
        "food_category": "Meat & Poultry",
        "food_item": "Ground Beef (85/15)",
        "storage_temperature_c": 8.5, # Temperature abuse!
        "relative_humidity_percent": 70.0,
        "packaging_type": "Ambient / Unsealed",
        "initial_quality_index": 7.0,
        "storage_duration_days": 3.0,
        "days_ago": 0
    }
]

def seed():
    init_db()
    db = SessionLocal()
    existing_count = db.query(PredictionRecord).count()
    if existing_count > 0:
        print(f"Database already contains {existing_count} records. Skipping seed.")
        db.close()
        return

    print("Seeding initial prediction records...")
    for item in DEMO_SCENARIOS:
        ref_date = (datetime.now() - timedelta(days=item["days_ago"] + item["storage_duration_days"])).strftime("%Y-%m-%d")
        req = PredictRequest(
            food_category=item["food_category"],
            food_item=item["food_item"],
            storage_temperature_c=item["storage_temperature_c"],
            relative_humidity_percent=item["relative_humidity_percent"],
            packaging_type=item["packaging_type"],
            initial_quality_index=item["initial_quality_index"],
            storage_duration_days=item["storage_duration_days"],
            reference_date=ref_date
        )
        resp = prediction_service.predict(req, db)
        print(f"  Created record {resp.prediction_id}: {resp.food_category} ({resp.food_item}) -> {resp.predicted_remaining_days} days [{resp.shelf_life_status}]")

    db.close()
    print("Database seeding completed.")

if __name__ == "__main__":
    seed()
