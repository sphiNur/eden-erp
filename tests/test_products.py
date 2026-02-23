"""Tests for the Products API (/api/products/)."""
import pytest
from uuid import uuid4

from tests.conftest import TestSessionLocal
from app.models import Category, Product


@pytest.fixture
async def seed_category():
    """Seed a test category and return its ID."""
    cat_id = uuid4()
    async with TestSessionLocal() as session:
        category = Category(
            id=cat_id,
            name_i18n={"en": "Vegetables", "cn": "蔬菜"},
            sort_order=1,
        )
        session.add(category)
        await session.commit()
    return cat_id


@pytest.fixture
async def seed_product(seed_category):
    """Seed a test product under the test category."""
    prod_id = uuid4()
    async with TestSessionLocal() as session:
        product = Product(
            id=prod_id,
            category_id=seed_category,
            name_i18n={"en": "Tomato", "cn": "西红柿"},
            unit_i18n={"en": "kg", "cn": "公斤"},
            price_reference=5000,
            is_active=True,
        )
        session.add(product)
        await session.commit()
    return prod_id


async def test_list_products_empty(client):
    """GET /api/products/ with no products returns empty list."""
    response = await client.get("/api/products/")
    assert response.status_code == 200
    assert response.json() == []


async def test_list_products_with_data(client, seed_product):
    """GET /api/products/ returns seeded products."""
    response = await client.get("/api/products/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name_i18n"]["en"] == "Tomato"


async def test_create_product(client, seed_category):
    """POST /api/products/ creates a new product."""
    payload = {
        "category_id": str(seed_category),
        "name_i18n": {"en": "Potato", "cn": "土豆"},
        "unit_i18n": {"en": "kg", "cn": "公斤"},
        "price_reference": 3000,
        "is_active": True,
    }
    response = await client.post("/api/products/", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["name_i18n"]["en"] == "Potato"
    assert data["is_active"] is True


async def test_delete_product_soft(client, seed_product):
    """DELETE /api/products/{id} soft-deletes (sets is_active=False)."""
    response = await client.delete(f"/api/products/{seed_product}")
    assert response.status_code == 200
    assert response.json()["ok"] is True

    # Verify it's no longer in the active list
    list_resp = await client.get("/api/products/")
    assert len(list_resp.json()) == 0
