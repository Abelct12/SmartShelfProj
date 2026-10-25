import io
import csv
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc

from backend.app.database.db import get_db
from backend.app.database.models import PredictionRecord
from backend.app.schemas.prediction import PredictRequest, PredictResponse
from backend.app.schemas.history import PaginatedPredictionsResponse, PredictionItemSchema
from backend.app.services.prediction_service import prediction_service

router = APIRouter()

@router.post("/predict", response_model=PredictResponse, status_code=status.HTTP_201_CREATED, tags=["Predictions"])
def create_prediction(req: PredictRequest, db: Session = Depends(get_db)):
    """
    Validate input parameters, run machine learning pipeline inference,
    evaluate food science safety guidance, and persist prediction to database.
    """
    if not prediction_service.is_ready():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Machine learning model is currently not available. Please train or provide model artifacts."
        )
    try:
        response = prediction_service.predict(req, db)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failed: {str(e)}"
        )

@router.get("/predictions", response_model=PaginatedPredictionsResponse, tags=["Predictions"])
def get_predictions(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    category: Optional[str] = Query(None, description="Filter by food category"),
    status_filter: Optional[str] = Query(None, description="Filter by shelf life status"),
    search: Optional[str] = Query(None, description="Search by ID, item name, or category"),
    sort_by: str = Query("created_at", description="Field to sort by"),
    order: str = Query("desc", description="Sort order: 'asc' or 'desc'"),
    db: Session = Depends(get_db)
):
    """Retrieve paginated prediction history with search, filtering, and sorting."""
    query = db.query(PredictionRecord)

    # Search filter
    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                PredictionRecord.prediction_id.ilike(search_pattern),
                PredictionRecord.food_category.ilike(search_pattern),
                PredictionRecord.food_item.ilike(search_pattern)
            )
        )

    # Category filter
    if category and category.lower() != "all":
        query = query.filter(PredictionRecord.food_category.ilike(category))

    # Status filter
    if status_filter and status_filter.lower() != "all":
        query = query.filter(PredictionRecord.shelf_life_status.ilike(status_filter))

    # Sorting
    sort_column = getattr(PredictionRecord, sort_by, PredictionRecord.created_at)
    if order.lower() == "asc":
        query = query.order_by(asc(sort_column))
    else:
        query = query.order_by(desc(sort_column))

    total = query.count()
    total_pages = max(1, (total + page_size - 1) // page_size)
    offset = (page - 1) * page_size
    records = query.offset(offset).limit(page_size).all()

    items = [
        PredictionItemSchema(
            id=r.id,
            prediction_id=r.prediction_id,
            created_at=r.created_at.isoformat() if r.created_at else "",
            food_category=r.food_category,
            food_item=r.food_item,
            storage_temperature_c=r.storage_temperature_c,
            relative_humidity_percent=r.relative_humidity_percent,
            packaging_type=r.packaging_type,
            initial_quality_index=r.initial_quality_index,
            storage_duration_days=r.storage_duration_days,
            reference_date=r.reference_date,
            predicted_remaining_days=r.predicted_remaining_days,
            raw_prediction_days=r.raw_prediction_days,
            estimated_expiry_date=r.estimated_expiry_date,
            shelf_life_status=r.shelf_life_status,
            safety_notes=r.safety_notes,
            model_version=r.model_version,
            model_name=r.model_name
        )
        for r in records
    ]

    return PaginatedPredictionsResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.get("/predictions/export/csv", tags=["Predictions"])
def export_predictions_csv(db: Session = Depends(get_db)):
    """Export complete prediction history as a downloadable CSV file."""
    records = db.query(PredictionRecord).order_by(desc(PredictionRecord.created_at)).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Prediction ID",
        "Timestamp",
        "Food Category",
        "Food Item",
        "Storage Temp (°C)",
        "Humidity (%)",
        "Packaging Type",
        "Initial Quality Index",
        "Storage Duration (Days)",
        "Predicted Remaining Shelf Life (Days)",
        "Estimated Expiry Date",
        "Shelf Life Status",
        "Model Version"
    ])

    for r in records:
        writer.writerow([
            r.prediction_id,
            r.created_at.isoformat() if r.created_at else "",
            r.food_category,
            r.food_item or "",
            r.storage_temperature_c,
            r.relative_humidity_percent,
            r.packaging_type,
            r.initial_quality_index,
            r.storage_duration_days,
            r.predicted_remaining_days,
            r.estimated_expiry_date or "",
            r.shelf_life_status,
            r.model_version
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=food_shelf_life_predictions.csv"}
    )

@router.get("/predictions/{pred_id}", response_model=PredictionItemSchema, tags=["Predictions"])
def get_prediction_detail(pred_id: str, db: Session = Depends(get_db)):
    """Retrieve full details of an individual prediction record by ID."""
    record = db.query(PredictionRecord).filter(
        or_(
            PredictionRecord.prediction_id == pred_id,
            PredictionRecord.id == (int(pred_id) if pred_id.isdigit() else -1)
        )
    ).first()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Prediction record with ID '{pred_id}' not found."
        )

    return PredictionItemSchema(
        id=record.id,
        prediction_id=record.prediction_id,
        created_at=record.created_at.isoformat() if record.created_at else "",
        food_category=record.food_category,
        food_item=record.food_item,
        storage_temperature_c=record.storage_temperature_c,
        relative_humidity_percent=record.relative_humidity_percent,
        packaging_type=record.packaging_type,
        initial_quality_index=record.initial_quality_index,
        storage_duration_days=record.storage_duration_days,
        reference_date=record.reference_date,
        predicted_remaining_days=record.predicted_remaining_days,
        raw_prediction_days=record.raw_prediction_days,
        estimated_expiry_date=record.estimated_expiry_date,
        shelf_life_status=record.shelf_life_status,
        safety_notes=record.safety_notes,
        model_version=record.model_version,
        model_name=record.model_name
    )

@router.delete("/predictions/{pred_id}", status_code=status.HTTP_200_OK, tags=["Predictions"])
def delete_prediction(pred_id: str, db: Session = Depends(get_db)):
    """Delete a prediction record with confirmation status."""
    record = db.query(PredictionRecord).filter(
        or_(
            PredictionRecord.prediction_id == pred_id,
            PredictionRecord.id == (int(pred_id) if pred_id.isdigit() else -1)
        )
    ).first()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Prediction record with ID '{pred_id}' not found."
        )

    deleted_id = record.prediction_id
    db.delete(record)
    db.commit()

    return {"message": f"Prediction record {deleted_id} deleted successfully.", "deleted_id": deleted_id}
