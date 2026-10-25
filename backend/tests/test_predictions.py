import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_valid_prediction():
    payload = {
        "food_category": "Dairy",
        "food_item": "Organic Whole Milk",
        "storage_temperature_c": 3.0,
        "relative_humidity_percent": 60.0,
        "packaging_type": "Sealed Plastic Container",
        "initial_quality_index": 9.5,
        "storage_duration_days": 2.0,
        "reference_date": "2026-10-10"
    }
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "prediction_id" in data
    assert data["food_category"] == "Dairy"
    assert data["predicted_remaining_days"] >= 0.0
    assert "estimated_expiry_date" in data
    assert data["shelf_life_status"] in ["Optimal", "Moderate", "Critical", "Expired"]
    assert len(data["safety_guidance"]) > 0
    assert "disclaimer" in data

def test_unsupported_category():
    payload = {
        "food_category": "Space Food",  # Unsupported category
        "storage_temperature_c": 4.0,
        "relative_humidity_percent": 50.0,
        "packaging_type": "Sealed Plastic Container",
        "initial_quality_index": 9.0,
        "storage_duration_days": 1.0
    }
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 422  # Pydantic validation error

def test_out_of_range_temperature():
    payload = {
        "food_category": "Meat & Poultry",
        "storage_temperature_c": 150.0,  # Invalid: > 55°C
        "relative_humidity_percent": 60.0,
        "packaging_type": "Vacuum Sealed",
        "initial_quality_index": 9.0,
        "storage_duration_days": 1.0
    }
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 422

def test_history_retrieval_and_filtering():
    # Retrieve page 1
    response = client.get("/api/predictions?page=1&page_size=5")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] >= 1

    # Retrieve with category filter
    resp_dairy = client.get("/api/predictions?category=Dairy")
    assert resp_dairy.status_code == 200
    dairy_data = resp_dairy.json()
    for item in dairy_data["items"]:
        assert item["food_category"] == "Dairy"

def test_prediction_detail_and_deletion():
    # First create a prediction to test retrieval and deletion
    payload = {
        "food_category": "Vegetables",
        "food_item": "Test Carrots",
        "storage_temperature_c": 4.0,
        "relative_humidity_percent": 85.0,
        "packaging_type": "Paper / Carton",
        "initial_quality_index": 8.0,
        "storage_duration_days": 1.0
    }
    create_resp = client.post("/api/predict", json=payload)
    assert create_resp.status_code == 201
    pred_id = create_resp.json()["prediction_id"]

    # Detail check
    detail_resp = client.get(f"/api/predictions/{pred_id}")
    assert detail_resp.status_code == 200
    assert detail_resp.json()["prediction_id"] == pred_id

    # Deletion
    del_resp = client.delete(f"/api/predictions/{pred_id}")
    assert del_resp.status_code == 200

    # Ensure 404 after deletion
    after_resp = client.get(f"/api/predictions/{pred_id}")
    assert after_resp.status_code == 404

def test_csv_export():
    response = client.get("/api/predictions/export/csv")
    assert response.status_code == 200
    assert "text/csv" in response.headers["content-type"]
    assert "Prediction ID" in response.text

def test_prediction_without_reference_date():
    payload = {
        "food_category": "Bakery",
        "food_item": "White Sliced Bread",
        "storage_temperature_c": 21.0,
        "relative_humidity_percent": 45.0,
        "packaging_type": "Paper / Carton",
        "initial_quality_index": 9.0,
        "storage_duration_days": 1.0
        # No reference_date provided
    }
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["estimated_expiry_date"] is not None
    assert data["predicted_remaining_days"] >= 0.0

def test_subzero_freezer_prediction():
    payload = {
        "food_category": "Meat & Poultry",
        "food_item": "Frozen Beef Steak",
        "storage_temperature_c": -18.0,
        "relative_humidity_percent": 60.0,
        "packaging_type": "Vacuum Sealed",
        "initial_quality_index": 9.5,
        "storage_duration_days": 10.0
    }
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["predicted_remaining_days"] > 0.0
    # Should contain sub-zero or frozen guidance
    notes_joined = " ".join(data["safety_guidance"])
    assert "Sub-zero" in notes_joined or "frozen" in notes_joined or "refrigeration" in notes_joined.lower()

def test_negative_elapsed_duration_rejected():
    payload = {
        "food_category": "Fruits",
        "storage_temperature_c": 4.0,
        "relative_humidity_percent": 85.0,
        "packaging_type": "Sealed Plastic Container",
        "initial_quality_index": 9.0,
        "storage_duration_days": -5.0  # Invalid negative duration
    }
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 422

def test_invalid_humidity_rejected():
    payload = {
        "food_category": "Seafood",
        "storage_temperature_c": 1.0,
        "relative_humidity_percent": 125.0,  # Invalid: > 100%
        "packaging_type": "Vacuum Sealed",
        "initial_quality_index": 9.0,
        "storage_duration_days": 1.0
    }
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 422

