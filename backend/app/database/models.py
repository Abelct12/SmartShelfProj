from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from backend.app.database.db import Base

class PredictionRecord(Base):
    __tablename__ = "prediction_records"

    id = Column(Integer, primary_key=True, index=True)
    prediction_id = Column(String(64), unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    
    # Input features
    food_category = Column(String(64), nullable=False, index=True)
    food_item = Column(String(128), nullable=True)
    storage_temperature_c = Column(Float, nullable=False)
    relative_humidity_percent = Column(Float, nullable=False)
    packaging_type = Column(String(64), nullable=False)
    initial_quality_index = Column(Float, nullable=False, default=9.0)
    storage_duration_days = Column(Float, nullable=False)
    reference_date = Column(String(32), nullable=True)

    # Predictions and domain categorization
    predicted_remaining_days = Column(Float, nullable=False)
    raw_prediction_days = Column(Float, nullable=False)
    estimated_expiry_date = Column(String(32), nullable=True)
    shelf_life_status = Column(String(32), nullable=False)  # "Optimal", "Moderate", "Critical", "Expired"
    safety_notes = Column(Text, nullable=True)  # JSON-encoded array or bullet text
    
    # Model tracking
    model_version = Column(String(32), default="1.0.0")
    model_name = Column(String(64), default="Gradient Boosting")

    def to_dict(self):
        return {
            "id": self.id,
            "prediction_id": self.prediction_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "food_category": self.food_category,
            "food_item": self.food_item,
            "storage_temperature_c": self.storage_temperature_c,
            "relative_humidity_percent": self.relative_humidity_percent,
            "packaging_type": self.packaging_type,
            "initial_quality_index": self.initial_quality_index,
            "storage_duration_days": self.storage_duration_days,
            "reference_date": self.reference_date,
            "predicted_remaining_days": self.predicted_remaining_days,
            "raw_prediction_days": self.raw_prediction_days,
            "estimated_expiry_date": self.estimated_expiry_date,
            "shelf_life_status": self.shelf_life_status,
            "safety_notes": self.safety_notes,
            "model_version": self.model_version,
            "model_name": self.model_name
        }
