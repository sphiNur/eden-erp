"""Tests for the Orders API (/api/orders/)."""
import pytest
from uuid import uuid4

from tests.conftest import TestSessionLocal
from app.models import Category, Product, Store


@pytest.fixture
async def order_fixtures():
    """Seed a category, product, and store for order tests. Returns (store_id, product_id)."""
    cat_id = uuid4()
    prod_id = uuid4()
    store_id = uuid4()

    async with TestSessionLocal() as session:
        cat = Category(
            id=cat_id,
            name_i18n={"en": "Meat"},
            sort_order=2,
        )
        prod = Product(
            id=prod_id,
            category_id=cat_id,
            name_i18n={"en": "Chicken"},
            unit_i18n={"en": "kg"},
            price_reference=25000,
            is_active=True,
        )
        store = Store(
            id=store_id,
            name="Order Test Store",
        )
        session.add_all([cat, prod, store])
        await session.commit()

    return store_id, prod_id


async def test_create_order(client, order_fixtures):
    """POST /api/orders/ creates an order with items."""
    store_id, product_id = order_fixtures
    payload = {
        "store_id": str(store_id),
        "delivery_date": "2026-02-23",
        "items": [
            {
                "product_id": str(product_id),
                "quantity_requested": 5.0,
            }
        ],
    }
    response = await client.post("/api/orders/", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "pending"
    assert len(data["items"]) == 1
    assert float(data["items"][0]["quantity_requested"]) == 5.0


async def test_list_orders(client, order_fixtures):
    """GET /api/orders/ returns created orders."""
    store_id, product_id = order_fixtures

    # Create an order first
    await client.post("/api/orders/", json={
        "store_id": str(store_id),
        "delivery_date": "2026-02-23",
        "items": [{"product_id": str(product_id), "quantity_requested": 3.0}],
    })

    response = await client.get("/api/orders/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1


async def test_list_orders_filter_by_status(client, order_fixtures):
    """GET /api/orders/?status=pending filters correctly."""
    store_id, product_id = order_fixtures

    await client.post("/api/orders/", json={
        "store_id": str(store_id),
        "delivery_date": "2026-02-23",
        "items": [{"product_id": str(product_id), "quantity_requested": 2.0}],
    })

    response = await client.get("/api/orders/?status=pending")
    assert response.status_code == 200
    for order in response.json():
        assert order["status"] == "pending"


async def test_create_order_invalid_store(client):
    """POST /api/orders/ with non-existent store returns 404."""
    payload = {
        "store_id": str(uuid4()),
        "delivery_date": "2026-02-23",
        "items": [{"product_id": str(uuid4()), "quantity_requested": 1.0}],
    }
    response = await client.post("/api/orders/", json=payload)
    assert response.status_code == 404
