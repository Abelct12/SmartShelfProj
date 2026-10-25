import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_analytics_summary():
    response = client.get("/api/analytics/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_predictions" in data
    assert "average_remaining_shelf_life_days" in data
    assert "model_status" in data
    assert "status_breakdown" in data

def test_analytics_distributions():
    response = client.get("/api/analytics/distributions")
    assert response.status_code == 200
    data = response.json()
    assert "shelf_life_distribution" in data
    assert "category_distribution" in data
    assert "scatter_points" in data
    assert "packaging_distribution" in data

def test_model_info():
    response = client.get("/api/model/info")
    assert response.status_code == 200
    data = response.json()
    assert "model_name" in data
    assert "evaluation_metrics" in data
    assert "feature_importances" in data
    assert len(data["supported_categories"]) > 0

def test_food_guidelines():
    response = client.get("/api/food-guidelines")
    assert response.status_code == 200
    data = response.json()
    assert "guidelines" in data
    assert len(data["guidelines"]) >= 6
