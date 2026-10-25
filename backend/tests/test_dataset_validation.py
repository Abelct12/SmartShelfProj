import io
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_active_dataset_info():
    response = client.get("/api/dataset/active-info")
    assert response.status_code == 200
    data = response.json()
    assert data["is_valid_for_training"] is True
    assert data["total_rows"] >= 1000
    assert data["target_column_found"] is True
    assert len(data["columns"]) > 0

def test_upload_valid_dataset():
    csv_content = (
        "food_category,packaging_type,storage_temperature_c,relative_humidity_percent,initial_quality_index,storage_duration_days,remaining_shelf_life_days\n"
        + "\n".join([
            f"Dairy,Sealed Plastic Container,4.0,60.0,9.0,{i * 0.5},{10.0 - i * 0.5}"
            for i in range(60)
        ])
    )
    files = {"file": ("test_upload.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    response = client.post("/api/dataset/validate", files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["is_valid_for_training"] is True
    assert data["total_rows"] == 60
    assert data["target_column_found"] is True

def test_upload_invalid_dataset():
    # Missing required target and numerical features
    csv_content = "some_random_column,another_col\n1,2\n3,4"
    files = {"file": ("bad_data.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    response = client.post("/api/dataset/validate", files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["is_valid_for_training"] is False
    assert data["target_column_found"] is False
    assert len(data["missing_required_features"]) > 0

def test_upload_empty_dataset():
    files = {"file": ("empty.csv", io.BytesIO(b""), "text/csv")}
    response = client.post("/api/dataset/validate", files=files)
    assert response.status_code == 400
    data = response.json()
    assert "empty" in data["detail"].lower()

def test_upload_oversized_dataset():
    # 16 MB dummy bytes
    oversized_bytes = b"a" * (16 * 1024 * 1024)
    files = {"file": ("oversized.csv", io.BytesIO(oversized_bytes), "text/csv")}
    response = client.post("/api/dataset/validate", files=files)
    assert response.status_code == 413
    data = response.json()
    assert "exceeds" in data["detail"].lower()

