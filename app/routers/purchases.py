from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func
from typing import List

from app import models, schemas
from app.dependencies import get_db, get_current_user, require_role

router = APIRouter(prefix="/purchases", tags=["purchases"])


@router.post(
    "/",
    response_model=schemas.BatchResponse,
    dependencies=[Depends(require_role(["global_purchaser", "admin"]))],
)
async def submit_purchase_batch(
    batch_in: schemas.BatchCreate,
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Purchaser records what they bought.
    System calculates unit price and allocates costs to APPROVED OrderItems.
    """

    # 1. Create Batch — use the authenticated user as purchaser
    new_batch = models.PurchaseBatch(
        purchaser_id=current_user.id,
        market_location=batch_in.market_location,
        status=models.BatchStatus.FINALIZED,
    )
    db.add(new_batch)
    await db.flush()

    # Track which orders were affected for status update
    affected_order_ids = set()

    for item_in in batch_in.items:
        # 2. Calculate Unit Price = Total_Cost / Total_Qty
        unit_price = item_in.total_cost_uzs / item_in.total_quantity_bought

        # Create Batch Item
        new_batch_item = models.BatchItem(
            purchase_batch_id=new_batch.id,
            product_id=item_in.product_id,
            total_quantity_bought=item_in.total_quantity_bought,
            total_cost_uzs=item_in.total_cost_uzs,
            unit_price_calculated=unit_price,
        )
        db.add(new_batch_item)

        # 3. Cost Allocation Logic
        # Find all PENDING/APPROVED items for this product that haven't been allocated yet.
        stmt = (
            select(models.OrderItem)
            .join(models.PurchaseOrder)
            .where(
                models.OrderItem.product_id == item_in.product_id,
                models.OrderItem.quantity_approved > 0,
                models.OrderItem.allocated_cost_uzs == None,  # NOT yet allocated
                models.PurchaseOrder.status.in_([
                    models.OrderStatus.APPROVED,
                    models.OrderStatus.PURCHASING,
                    models.OrderStatus.PENDING,
                ]),
            )
        )
        related_order_items = await db.execute(stmt)
        order_items = related_order_items.scalars().all()

        if not order_items:
            # No pending orders to allocate — just record the batch item
            continue

        # Calculate Fulfillment Ratio with safety guards
        total_requested = sum(oi.quantity_approved for oi in order_items)

        if total_requested <= 0:
            continue

        fulfillment_ratio = item_in.total_quantity_bought / total_requested
        # Cap at 1.0 to prevent over-allocation
        if isinstance(fulfillment_ratio, Decimal):
            fulfillment_ratio = min(fulfillment_ratio, Decimal("1.0"))
        else:
            fulfillment_ratio = min(fulfillment_ratio, 1.0)

        for oi in order_items:
            qty_fulfilled = oi.quantity_approved * fulfillment_ratio
            cost_for_store = qty_fulfilled * unit_price

            oi.quantity_fulfilled = qty_fulfilled
            oi.allocated_cost_uzs = cost_for_store
            db.add(oi)
            affected_order_ids.add(oi.purchase_order_id)

    # 4. Update order statuses for affected orders
    for order_id in affected_order_ids:
        order_result = await db.execute(
            select(models.PurchaseOrder)
            .options(selectinload(models.PurchaseOrder.items))
            .where(models.PurchaseOrder.id == order_id)
        )
        order = order_result.scalars().first()
        if not order:
            continue

        # Check if all items in this order are now allocated
        all_allocated = all(
            item.allocated_cost_uzs is not None for item in order.items
        )
        if all_allocated:
            order.status = models.OrderStatus.DELIVERED
        else:
            order.status = models.OrderStatus.PURCHASING

    await db.commit()

    # Reload with items for response
    stmt = (
        select(models.PurchaseBatch)
        .options(selectinload(models.PurchaseBatch.items))
        .where(models.PurchaseBatch.id == new_batch.id)
    )
    result = await db.execute(stmt)
    return result.scalars().first()


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
            models.OrderItem.allocated_cost_uzs == None,
            models.PurchaseOrder.status.in_([
                models.OrderStatus.APPROVED,
                models.OrderStatus.PENDING,
                models.OrderStatus.PURCHASING,
            ]),
        )
        .order_by(models.Category.sort_order, models.Product.name_i18n)
    )

    results = await db.execute(stmt)

    # Group by Product ID in Python
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
        
        # Accumulate totals
        grouped[pid]["total_quantity_needed"] += qty
        
        # Add to breakdown
        # Check if store already in breakdown (to merge multiple orders from same store if necessary)
        # Assuming one order per store per day usually, but simpler to just append or merge.
        # Let's simple append for now, frontend can handle, or we merge here.
        # Merging by store name for cleaner UI:
        existing_store = next((b for b in grouped[pid]["breakdown"] if b["store_name"] == store_name), None)
        if existing_store:
            existing_store["quantity"] += qty
        else:
            grouped[pid]["breakdown"].append({
                "store_name": store_name,
                "quantity": qty
            })

    return list(grouped.values())
