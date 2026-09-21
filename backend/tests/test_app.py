from app import app


def test_health():
    client = app.test_client()
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json["status"] == "healthy"


def test_get_tasks():
    client = app.test_client()
    response = client.get("/api/tasks")

    assert response.status_code == 200