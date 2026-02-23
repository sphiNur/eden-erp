"""Purchases API router — batch recording, consolidation, and stall grouping."""
from decimal import Decimal
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional

from app import models, schemas
from app.dependencies import get_db, get_current_user, require_role
from app.services.purchasing import submit_purchase_batch

router = APIRouter(prefix="/purchases", tags=["purchases"])


@router.post(
    "/",
    response_model=schemas.BatchResponse,
    dependencies=[Depends(require_role(["global_purchaser", "admin"]))],
)
async def submit_batch(
    batch_in: schemas.BatchCreate,
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Purchaser records what they bought.
    System calculates unit price and allocates costs to APPROVED OrderItems.
    """
    return await submit_purchase_batch(db, current_user, batch_in)


@router.get(
    "/consolidation",
    response_model=List[schemas.ConsolidatedItem],
    dependencies=[Depends(require_role(["global_purchaser", "admin"]))],
)
async def get_consolidated_requirements(db: AsyncSession = Depends(get_db)):
    """
    Phase 2: System Consolidation
    Aggregates all PENDING/APPROVED items by Product.
    Returns Total Quantity + Per-Store Breakdown.
    """
    stmt = (
        select(
            models.Product,
            models.Category,
            models.OrderItem.quantity_approved,
            models.Store.name.label("store_name"),
        )
        .join(models.OrderItem, models.Product.id == models.OrderItem.product_id)
        .join(models.PurchaseOrder, models.OrderItem.purchase_order_id == models.PurchaseOrder.id)
        .join(models.Store, models.PurchaseOrder.store_id == models.Store.id)
        .join(models.Category, models.Product.category_id == models.Category.id)
        .where(
            models.OrderItem.quantity_approved > 0,
            models.OrderItem.allocated_cost_uzs == None,  # noqa: E711
            models.PurchaseOrder.status.in_([
                models.OrderStatus.APPROVED,
                models.OrderStatus.PENDING,
                models.OrderStatus.PURCHASING,
            ]),
        )
        .order_by(models.Category.sort_order, models.Product.name_i18n)
    )

    results = await db.execute(stmt)

    grouped = {}
    for product, category, qty, store_name in results:
        pid = product.id
        if pid not in grouped:
            grouped[pid] = {
                "product_id": product.id,
                "product_name": product.name_i18n,
                "unit": product.unit_i18n,
                "category_name": category.name_i18n if category else {"en": "Uncategorized"},
                "price_reference": product.price_reference,
                "total_quantity_needed": Decimal("0"),
                "breakdown": []
            }

        grouped[pid]["total_quantity_needed"] += qty

        existing_store = next((b for b in grouped[pid]["breakdown"] if b["store_name"] == store_name), None)
        if existing_store:
            existing_store["quantity"] += qty
        else:
            grouped[pid]["breakdown"].append({
                "store_name": store_name,
                "quantity": qty
            })

    return list(grouped.values())


@router.get(
    "/by-stall",
    response_model=List[schemas.StallConsolidation],
    dependencies=[Depends(require_role(["global_purchaser", "admin"]))],
)
async def get_consolidation_by_stall(
    target_date: Optional[date] = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Consolidate requirements grouped by Stall (档口).
    Products without a stall go to "Unassigned" group.
    """
    stmt = (
        select(
            models.Product,
            models.Stall,
            models.OrderItem.quantity_approved,
            models.Store.name.label("store_name"),
        )
        .join(models.OrderItem, models.Product.id == models.OrderItem.product_id)
        .join(models.PurchaseOrder, models.OrderItem.purchase_order_id == models.PurchaseOrder.id)
        .join(models.Store, models.PurchaseOrder.store_id == models.Store.id)
        .outerjoin(models.Stall, models.Product.default_stall_id == models.Stall.id)
        .where(
            models.OrderItem.quantity_approved > 0,
            models.OrderItem.allocated_cost_uzs == None,  # noqa: E711
            models.PurchaseOrder.status.in_([
                models.OrderStatus.APPROVED,
                models.OrderStatus.PENDING,
                models.OrderStatus.PURCHASING,
            ]),
        )
    )

    if target_date:
        stmt = stmt.where(models.PurchaseOrder.delivery_date == target_date)

    stmt = stmt.order_by(models.Product.name_i18n)
    results = await db.execute(stmt)

    stall_groups: dict = {}
    for product, stall, qty, store_name in results:
        stall_key = str(stall.id) if stall else "__unassigned__"
        stall_name = stall.name if stall else "Unassigned"

        if stall_key not in stall_groups:
            stall_groups[stall_key] = {
                "stall": stall,
                "stall_name": stall_name,
                "items": {},
            }

        pid = str(product.id)
        if pid not in stall_groups[stall_key]["items"]:
            stall_groups[stall_key]["items"][pid] = {
                "product_id": product.id,
                "product_name": product.name_i18n,
                "unit": product.unit_i18n,
                "price_reference": product.price_reference,
                "total_quantity": Decimal("0"),
                "breakdown": [],
            }

        item_data = stall_groups[stall_key]["items"][pid]
        item_data["total_quantity"] += qty

        existing_store = next(
            (b for b in item_data["breakdown"] if b["store_name"] == store_name),
            None,
        )
        if existing_store:
            existing_store["quantity"] += qty
        else:
            item_data["breakdown"].append({
                "store_name": store_name,
                "quantity": qty,
            })

    # Build response
    result_list = []
    for group in stall_groups.values():
        stall_resp = None
        if group["stall"]:
            stall_resp = schemas.StallResponse.model_validate(group["stall"])

        result_list.append(schemas.StallConsolidation(
            stall=stall_resp,
            stall_name=group["stall_name"],
            items=[
                schemas.StallConsolidatedProduct(**item_data)
                for item_data in group["items"].values()
            ],
        ))

    result_list.sort(key=lambda x: (x.stall is None, x.stall.sort_order if x.stall else 999))
    return result_list
