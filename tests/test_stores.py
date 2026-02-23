"""Tests for the Stores API (/api/stores/)."""
import pytest


async def test_list_stores(client):
    """GET /api/stores/ returns seeded stores."""
    response = await client.get("/api/stores/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["name"] == "Test Store"


async def test_create_store(client):
    """POST /api/stores/ creates a new store."""
    payload = {"name": "New Branch", "address": "456 New St"}
    response = await client.post("/api/stores/", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "New Branch"
    assert data["address"] == "456 New St"
    assert "id" in data
