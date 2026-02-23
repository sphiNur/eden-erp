"""Purchasing service — handles purchase batch recording and cost allocation.

Extracted from app.routers.purchases to separate business logic from HTTP handling.
"""
from decimal import Decimal
from typing import List, Set

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app import models, schemas


async def allocate_costs_for_batch_item(
    db: AsyncSession,
    product_id,
    total_quantity_bought: Decimal,
    total_cost_uzs: Decimal,
) -> Set:
    """
    Allocate costs from a purchased batch item to pending order items.

    1. Calculate unit price
    2. Find all unallocated order items for this product
    3. Distribute cost proportionally based on fulfillment ratio

    Returns:
        Set of affected order IDs
    """
    affected_order_ids = set()
    unit_price = total_cost_uzs / total_quantity_bought

    # Find unallocated order items for this product
    stmt = (
        select(models.OrderItem)
        .join(models.PurchaseOrder)
        .where(
            models.OrderItem.product_id == product_id,
            models.OrderItem.quantity_approved > 0,
            models.OrderItem.allocated_cost_uzs == None,  # noqa: E711
            models.PurchaseOrder.status.in_([
                models.OrderStatus.APPROVED,
                models.OrderStatus.PURCHASING,
                models.OrderStatus.PENDING,
            ]),
        )
    )
    result = await db.execute(stmt)
    order_items = result.scalars().all()

    if not order_items:
        return affected_order_ids

    total_requested = sum(oi.quantity_approved for oi in order_items)
    if total_requested <= 0:
        return affected_order_ids

    # Cap fulfillment ratio at 1.0
    fulfillment_ratio = min(total_quantity_bought / total_requested, Decimal("1.0"))

    for oi in order_items:
        qty_fulfilled = oi.quantity_approved * fulfillment_ratio
        cost_for_store = qty_fulfilled * unit_price

        oi.quantity_fulfilled = qty_fulfilled
        oi.allocated_cost_uzs = cost_for_store
        db.add(oi)
        affected_order_ids.add(oi.purchase_order_id)

    return affected_order_ids


async def update_order_statuses(db: AsyncSession, order_ids: Set) -> None:
    """
    Update order statuses based on allocation completeness.
    Orders with all items allocated → DELIVERED, otherwise → PURCHASING.
    """
    for order_id in order_ids:
        order_result = await db.execute(
            select(models.PurchaseOrder)
            .options(selectinload(models.PurchaseOrder.items))
            .where(models.PurchaseOrder.id == order_id)
        )
        order = order_result.scalars().first()
        if not order:
            continue

        all_allocated = all(
            item.allocated_cost_uzs is not None for item in order.items
        )
        order.status = models.OrderStatus.DELIVERED if all_allocated else models.OrderStatus.PURCHASING


async def submit_purchase_batch(
    db: AsyncSession,
    current_user: models.User,
    batch_in: schemas.BatchCreate,
) -> models.PurchaseBatch:
    """
    Record a purchase batch and allocate costs to pending orders.

    1. Create PurchaseBatch record
    2. For each item, calculate unit price and allocate to order items
    3. Update affected order statuses
    4. Return the completed batch

    Returns:
        The created PurchaseBatch with items loaded.
    """
    # 1. Create batch
    new_batch = models.PurchaseBatch(
        purchaser_id=current_user.id,
        market_location=batch_in.market_location,
        status=models.BatchStatus.FINALIZED,
    )
    db.add(new_batch)
    await db.flush()

    # 2. Process items and allocate costs
    all_affected_order_ids = set()
    for item_in in batch_in.items:
        unit_price = item_in.total_cost_uzs / item_in.total_quantity_bought

        new_batch_item = models.BatchItem(
            purchase_batch_id=new_batch.id,
            product_id=item_in.product_id,
            total_quantity_bought=item_in.total_quantity_bought,
            total_cost_uzs=item_in.total_cost_uzs,
            unit_price_calculated=unit_price,
        )
        db.add(new_batch_item)

        affected = await allocate_costs_for_batch_item(
            db, item_in.product_id, item_in.total_quantity_bought, item_in.total_cost_uzs
        )
        all_affected_order_ids |= affected

    # 3. Update order statuses
    await update_order_statuses(db, all_affected_order_ids)

    await db.commit()

    # 4. Reload with items
    stmt = (
        select(models.PurchaseBatch)
        .options(selectinload(models.PurchaseBatch.items))
        .where(models.PurchaseBatch.id == new_batch.id)
    )
    result = await db.execute(stmt)
    return result.scalars().first()
