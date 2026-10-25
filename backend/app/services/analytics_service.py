from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
import numpy as np

from backend.app.database.models import PredictionRecord
from backend.app.schemas.analytics import (
    AnalyticsSummaryResponse,
    DistributionsResponse,
    StatusCount,
    CategoryCount,
    ScatterPoint,
    ShelfLifeDistributionBin
)
from backend.app.services.prediction_service import prediction_service

class AnalyticsService:
    def get_summary(self, db: Session) -> AnalyticsSummaryResponse:
        """Calculate high-level summary metrics from actual database records."""
        total_predictions = db.query(PredictionRecord).count()

        if total_predictions == 0:
            return AnalyticsSummaryResponse(
                total_predictions=0,
                categories_represented_count=0,
                average_remaining_shelf_life_days=0.0,
                status_breakdown=[],
                category_summary=[],
                latest_activity=[],
                model_status="Ready" if prediction_service.is_ready() else "Unavailable",
                model_name=prediction_service.metadata.get("model_name", "Gradient Boosting") if prediction_service.metadata else "N/A",
                last_trained=prediction_service.metadata.get("training_timestamp") if prediction_service.metadata else None
            )

        # Categories represented
        categories_count = db.query(func.count(func.distinct(PredictionRecord.food_category))).scalar() or 0

        # Average remaining shelf life
        avg_shelf_life = db.query(func.avg(PredictionRecord.predicted_remaining_days)).scalar() or 0.0

        # Status breakdown
        status_rows = db.query(
            PredictionRecord.shelf_life_status,
            func.count(PredictionRecord.id)
        ).group_by(PredictionRecord.shelf_life_status).all()

        status_breakdown = [
            StatusCount(
                status=status or "Unknown",
                count=count,
                percentage=round((count / total_predictions) * 100, 1)
            )
            for status, count in status_rows
        ]

        # Category summary
        cat_rows = db.query(
            PredictionRecord.food_category,
            func.count(PredictionRecord.id),
            func.avg(PredictionRecord.predicted_remaining_days)
        ).group_by(PredictionRecord.food_category).all()

        category_summary = [
            CategoryCount(
                category=cat,
                count=count,
                avg_remaining_days=round(float(avg_days or 0.0), 2)
            )
            for cat, count, avg_days in cat_rows
        ]

        # Latest activity
        latest_records = db.query(PredictionRecord).order_by(PredictionRecord.created_at.desc()).limit(8).all()
        latest_activity = [
            {
                "prediction_id": r.prediction_id,
                "timestamp": r.created_at.isoformat() if r.created_at else None,
                "food_category": r.food_category,
                "food_item": r.food_item,
                "predicted_remaining_days": r.predicted_remaining_days,
                "shelf_life_status": r.shelf_life_status,
                "temperature": r.storage_temperature_c,
                "humidity": r.relative_humidity_percent
            }
            for r in latest_records
        ]

        return AnalyticsSummaryResponse(
            total_predictions=total_predictions,
            categories_represented_count=categories_count,
            average_remaining_shelf_life_days=round(float(avg_shelf_life), 2),
            status_breakdown=status_breakdown,
            category_summary=category_summary,
            latest_activity=latest_activity,
            model_status="Ready" if prediction_service.is_ready() else "Unavailable",
            model_name=prediction_service.metadata.get("model_name", "Gradient Boosting") if prediction_service.metadata else "N/A",
            last_trained=prediction_service.metadata.get("training_timestamp") if prediction_service.metadata else None
        )

    def get_distributions(self, db: Session) -> DistributionsResponse:
        """Return chart-ready statistical distribution data from database records."""
        records = db.query(PredictionRecord).all()

        if not records:
            return DistributionsResponse(
                shelf_life_distribution=[],
                category_distribution=[],
                scatter_points=[],
                packaging_distribution=[]
            )

        # 1. Remaining shelf life bins
        bins = [
            ("0 Days (Expired)", lambda x: x <= 0.0),
            ("0.1 - 2.0 Days (Critical)", lambda x: 0.0 < x <= 2.0),
            ("2.1 - 5.0 Days", lambda x: 2.0 < x <= 5.0),
            ("5.1 - 10.0 Days", lambda x: 5.0 < x <= 10.0),
            ("10.1 - 20.0 Days", lambda x: 10.0 < x <= 20.0),
            ("> 20.0 Days (Frozen/Long)", lambda x: x > 20.0)
        ]

        shelf_life_dist = []
        for label, predicate in bins:
            count = sum(1 for r in records if predicate(r.predicted_remaining_days))
            shelf_life_dist.append(ShelfLifeDistributionBin(bin_label=label, count=count))

        # 2. Category distribution
        cat_map = {}
        for r in records:
            cat = r.food_category
            if cat not in cat_map:
                cat_map[cat] = {"count": 0, "sum_days": 0.0}
            cat_map[cat]["count"] += 1
            cat_map[cat]["sum_days"] += r.predicted_remaining_days

        category_dist = [
            CategoryCount(
                category=k,
                count=v["count"],
                avg_remaining_days=round(v["sum_days"] / v["count"], 2)
            )
            for k, v in cat_map.items()
        ]

        # 3. Scatter points (Storage temp vs remaining shelf life)
        scatter_points = [
            ScatterPoint(
                id=r.prediction_id,
                category=r.food_category,
                temperature=r.storage_temperature_c,
                humidity=r.relative_humidity_percent,
                remaining_days=r.predicted_remaining_days,
                status=r.shelf_life_status
            )
            for r in records[:150]  # Cap for responsive visualization
        ]

        # 4. Packaging distribution
        pkg_map = {}
        for r in records:
            p = r.packaging_type
            pkg_map[p] = pkg_map.get(p, 0) + 1

        packaging_dist = [
            {"packaging": k, "count": v}
            for k, v in pkg_map.items()
        ]

        return DistributionsResponse(
            shelf_life_distribution=shelf_life_dist,
            category_distribution=category_dist,
            scatter_points=scatter_points,
            packaging_distribution=packaging_dist
        )

analytics_service = AnalyticsService()
