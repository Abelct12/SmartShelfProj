from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.database.db import get_db
from backend.app.schemas.analytics import AnalyticsSummaryResponse, DistributionsResponse
from backend.app.services.analytics_service import analytics_service

router = APIRouter()

@router.get("/analytics/summary", response_model=AnalyticsSummaryResponse, tags=["Analytics"])
def get_analytics_summary(db: Session = Depends(get_db)):
    """Calculate dashboard key performance indicators and summary metrics."""
    return analytics_service.get_summary(db)

@router.get("/analytics/distributions", response_model=DistributionsResponse, tags=["Analytics"])
def get_analytics_distributions(db: Session = Depends(get_db)):
    """Retrieve statistical distribution data formatted for interactive charts."""
    return analytics_service.get_distributions(db)
