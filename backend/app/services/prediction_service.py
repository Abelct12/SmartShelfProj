import json
import os
import uuid
from datetime import date, datetime, timedelta, timezone
from typing import Optional, Tuple, List, Dict, Any

import joblib
import numpy as np
import pandas as pd
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.database.models import PredictionRecord
from backend.app.schemas.prediction import PredictRequest, PredictResponse

class PredictionService:
    def __init__(self):
        self.model_pipeline = None
        self.metadata = None
        self.load_model()

    def load_model(self) -> bool:
        """Load persisted scikit-learn pipeline and metadata."""
        if os.path.exists(settings.MODEL_PATH) and os.path.exists(settings.METADATA_PATH):
            try:
                self.model_pipeline = joblib.load(settings.MODEL_PATH)
                with open(settings.METADATA_PATH, "r") as f:
                    self.metadata = json.load(f)
                return True
            except Exception as e:
                print(f"Error loading model artifacts: {e}")
                self.model_pipeline = None
                self.metadata = None
                return False
        return False

    def is_ready(self) -> bool:
        return self.model_pipeline is not None and self.metadata is not None

    def assess_safety_and_status(
        self,
        food_category: str,
        storage_temp_c: float,
        humidity_percent: float,
        packaging_type: str,
        remaining_days: float
    ) -> Tuple[str, str, List[str]]:
        """
        Evaluate shelf-life classification and generate food science domain guidance.
        Classifications:
        - Optimal: > 7 days remaining
        - Moderate: 2 to 7 days remaining
        - Critical: > 0 to 2 days remaining
        - Expired: <= 0 days remaining
        """
        if remaining_days <= 0.0:
            status = "Expired"
            color = "#ef4444"
        elif remaining_days <= 2.0:
            status = "Critical"
            color = "#f59e0b"
        elif remaining_days <= 7.0:
            status = "Moderate"
            color = "#3b82f6"
        else:
            status = "Optimal"
            color = "#10b981"

        guidance = []

        # 1. Temperature Danger Zone Assessment (USDA/FDA Food Safety Standard)
        # Danger zone is 4.0°C to 60.0°C (40°F to 140°F) for perishable commodities
        perishables = ["Dairy", "Meat & Poultry", "Seafood"]
        if food_category in perishables:
            if storage_temp_c > 4.0:
                guidance.append(
                    f"CRITICAL TEMPERATURE ABUSE: Stored at {storage_temp_c}°C, which is inside the USDA Temperature Danger Zone (4°C–60°C). Psychrotrophic and mesophilic pathogen outgrowth (Salmonella, Listeria monocytogenes) is substantially accelerated."
                )
            elif storage_temp_c < 0.0:
                guidance.append(
                    f"Sub-zero storage ({storage_temp_c}°C): Microbial multiplication is arrested. Shelf life is governed primarily by protein denaturation, lipid oxidation, and ice crystal sublimation."
                )
            else:
                guidance.append(
                    f"Optimal refrigeration maintained ({storage_temp_c}°C). Keep uninterrupted cold chain below 4°C."
                )

        # 2. Bakery Moisture & Mold Guidance
        if food_category == "Bakery":
            if humidity_percent > 65.0:
                guidance.append(
                    f"High relative humidity ({humidity_percent}% RH) substantially raises surface water activity (aw > 0.80), heightening susceptibility to fungal spore germination (Penicillium and Aspergillus)."
                )
            elif storage_temp_c < 4.0:
                guidance.append(
                    "Refrigerating starchy bakery items accelerates amylose retrogradation (crumb staling), even while mold is retarded. Store at cool room temperature unless filled with perishable custard/cream."
                )

        # 3. Fresh Produce Respiration Guidance
        if food_category in ["Fruits", "Vegetables"]:
            if storage_temp_c > 12.0:
                guidance.append(
                    f"Warm ambient temperature ({storage_temp_c}°C) doubles ethylene production and cellular respiration, leading to rapid chlorophyll loss, sugar depletion, and senescent softening."
                )
            if humidity_percent < 80.0:
                guidance.append(
                    f"Ambient humidity ({humidity_percent}% RH) is below optimal produce storage (85–95% RH). Risk of transpirational water loss and textural shriveling."
                )

        # 4. Packaging Specific Safety Caveat
        if packaging_type == "Vacuum Sealed" and food_category in ["Meat & Poultry", "Seafood"]:
            guidance.append(
                "Anaerobic packaging notice: Vacuum seals retard aerobic spoilage organisms (Pseudomonas), but strict cold storage (<3°C) is essential to prevent non-proteolytic Clostridium botulinum growth."
            )
        elif packaging_type == "Ambient / Unsealed":
            guidance.append(
                "Unsealed exposure: Barrier integrity is zero. Subject to ambient microbial inoculation, oxidative rancidity, and moisture transfer."
            )

        if not guidance:
            guidance.append(
                f"Standard storage observed for {food_category}. Maintain consistent temperature and avoid thermal fluctuations."
            )

        return status, color, guidance

    def predict(self, req: PredictRequest, db: Session) -> PredictResponse:
        """Run ML inference, apply non-negative boundary rule, compute expiry, and persist to SQLite."""
        if not self.is_ready():
            raise RuntimeError("Machine learning model pipeline is not ready or failed to load.")

        # Create input DataFrame matching preprocessing pipeline columns
        input_data = pd.DataFrame([{
            "storage_temperature_c": float(req.storage_temperature_c),
            "relative_humidity_percent": float(req.relative_humidity_percent),
            "initial_quality_index": float(req.initial_quality_index),
            "storage_duration_days": float(req.storage_duration_days),
            "food_category": req.food_category,
            "packaging_type": req.packaging_type
        }])

        # Generate ML model inference
        raw_prediction = float(self.model_pipeline.predict(input_data)[0])

        # Transparent domain rule: Remaining shelf life cannot be physically negative
        predicted_remaining = max(0.0, round(raw_prediction, 2))

        # Calculate estimated expiry date accurately
        estimated_expiry_str = None
        if req.reference_date:
            try:
                base_date = date.fromisoformat(req.reference_date)
                # Expiry = Start Reference Date + Elapsed Duration + Remaining Days
                total_days = req.storage_duration_days + predicted_remaining
                expiry_date_obj = base_date + timedelta(days=float(total_days))
                estimated_expiry_str = expiry_date_obj.isoformat()
            except ValueError:
                # Fallback to current date
                expiry_date_obj = date.today() + timedelta(days=float(predicted_remaining))
                estimated_expiry_str = expiry_date_obj.isoformat()
        else:
            # When reference date is not provided, current date is the evaluation point
            expiry_date_obj = date.today() + timedelta(days=float(predicted_remaining))
            estimated_expiry_str = expiry_date_obj.isoformat()

        # Assess shelf life status & domain guidance
        status, status_color, guidance = self.assess_safety_and_status(
            req.food_category,
            req.storage_temperature_c,
            req.relative_humidity_percent,
            req.packaging_type,
            predicted_remaining
        )

        pred_id = f"PRED-{uuid.uuid4().hex[:8].upper()}"
        now_dt = datetime.now(timezone.utc)

        # Persist to SQLite
        record = PredictionRecord(
            prediction_id=pred_id,
            created_at=now_dt,
            food_category=req.food_category,
            food_item=req.food_item,
            storage_temperature_c=req.storage_temperature_c,
            relative_humidity_percent=req.relative_humidity_percent,
            packaging_type=req.packaging_type,
            initial_quality_index=req.initial_quality_index,
            storage_duration_days=req.storage_duration_days,
            reference_date=req.reference_date,
            predicted_remaining_days=predicted_remaining,
            raw_prediction_days=round(raw_prediction, 4),
            estimated_expiry_date=estimated_expiry_str,
            shelf_life_status=status,
            safety_notes=json.dumps(guidance),
            model_version=self.metadata.get("model_version", "1.0.0"),
            model_name=self.metadata.get("model_name", "Gradient Boosting")
        )
        db.add(record)
        db.commit()
        db.refresh(record)

        disclaimer = (
            "Food Safety Disclaimer: The predicted remaining shelf life is an empirical estimate generated by machine learning "
            "based on kinetic degradation models. It does not replace official food safety inspection, regulatory microbiological testing, "
            "or sensory evaluation. Never consume food exhibiting off-odors, surface discoloration, sliminess, or abnormal gas buildup."
        )

        return PredictResponse(
            prediction_id=pred_id,
            timestamp=now_dt.isoformat(),
            food_category=req.food_category,
            food_item=req.food_item,
            storage_temperature_c=req.storage_temperature_c,
            relative_humidity_percent=req.relative_humidity_percent,
            packaging_type=req.packaging_type,
            initial_quality_index=req.initial_quality_index,
            storage_duration_days=req.storage_duration_days,
            predicted_remaining_days=predicted_remaining,
            raw_model_prediction=round(raw_prediction, 3),
            estimated_expiry_date=estimated_expiry_str,
            shelf_life_status=status,
            status_color=status_color,
            safety_guidance=guidance,
            disclaimer=disclaimer,
            model_version=self.metadata.get("model_version", "1.0.0"),
            model_name=self.metadata.get("model_name", "Gradient Boosting"),
            input_summary={
                "food_category": req.food_category,
                "food_item": req.food_item or "Standard Category Item",
                "storage_temperature_c": f"{req.storage_temperature_c} °C",
                "relative_humidity_percent": f"{req.relative_humidity_percent} %",
                "packaging_type": req.packaging_type,
                "initial_quality_index": f"{req.initial_quality_index}/10",
                "storage_duration_days": f"{req.storage_duration_days} days elapsed",
                "reference_date": req.reference_date or "Current Date"
            }
        )

prediction_service = PredictionService()
