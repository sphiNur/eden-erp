from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from uuid import UUID

from app import models, schemas
from app.dependencies import get_db, get_current_user, require_role, require_store_access

router = APIRouter(prefix="/orders", tags=["orders"])

# Valid status transitions
VALID_TRANSITIONS = {
    models.OrderStatus.PENDING: [models.OrderStatus.APPROVED, models.OrderStatus.CANCELLED],
    models.OrderStatus.APPROVED: [models.OrderStatus.PURCHASING, models.OrderStatus.CANCELLED],
    models.OrderStatus.PURCHASING: [models.OrderStatus.DELIVERED, models.OrderStatus.CANCELLED],
    models.OrderStatus.DELIVERED: [],
    models.OrderStatus.CANCELLED: [],
}


@router.post("/", response_model=schemas.OrderResponse)
async def create_order(
    order_in: schemas.OrderCreate,
    current_user: models.User = Depends(get_current_user),
    _=Depends(require_store_access()),
    db: AsyncSession = Depends(get_db)
):
    """Create a new purchase order with items."""
    
    # Validate store exists
    store_result = await db.execute(
        select(models.Store).where(models.Store.id == order_in.store_id)
    )
    store = store_result.scalars().first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    
    # Create Order
    new_order = models.PurchaseOrder(
        store_id=order_in.store_id,
        user_id=current_user.id,
        delivery_date=order_in.delivery_date,
        status=models.OrderStatus.PENDING
    )
    db.add(new_order)
    await db.flush()

    # Create Items — quantity_approved defaults to None until explicitly approved
    for item_in in order_in.items:
        new_item = models.OrderItem(
            purchase_order_id=new_order.id,
            product_id=item_in.product_id,
            quantity_requested=item_in.quantity_requested,
            quantity_approved=item_in.quantity_requested,  # Auto-approve for demo phase
            notes=item_in.notes
        )
        db.add(new_item)

    await db.commit()

    # Reload with items for response
    stmt = (
        select(models.PurchaseOrder)
        .options(selectinload(models.PurchaseOrder.items))
        .where(models.PurchaseOrder.id == new_order.id)
    )
    result = await db.execute(stmt)
    return result.scalars().first()


@router.get("/", response_model=List[schemas.OrderResponse])
async def list_orders(
    status: Optional[str] = Query(None, description="Filter by order status"),
    store_id: Optional[str] = Query(None, description="Filter by store ID"),
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all orders, optionally filtered by status and/or store."""
    stmt = select(models.PurchaseOrder).options(
        selectinload(models.PurchaseOrder.items)
    )

    # Validate status if provided
    if status:
        try:
            status_enum = models.OrderStatus(status)
            stmt = stmt.where(models.PurchaseOrder.status == status_enum)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status '{status}'. Valid: {[s.value for s in models.OrderStatus]}"
            )
    if store_id:
        stmt = stmt.where(models.PurchaseOrder.store_id == store_id)

    # Store managers can only see their own stores
    if (
        current_user.role == models.UserRole.STORE_MANAGER
        and current_user.allowed_store_ids
    ):
        stmt = stmt.where(models.PurchaseOrder.store_id.in_(current_user.allowed_store_ids))

    stmt = stmt.order_by(models.PurchaseOrder.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{order_id}", response_model=schemas.OrderResponse)
async def get_order(
    order_id: UUID,
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single order by ID."""
    stmt = (
        select(models.PurchaseOrder)
        .options(selectinload(models.PurchaseOrder.items))
        .where(models.PurchaseOrder.id == order_id)
    )
    result = await db.execute(stmt)
    order = result.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.patch(
    "/{order_id}/status",
    response_model=schemas.OrderResponse,
    dependencies=[Depends(require_role(["admin", "global_purchaser"]))],
)
async def update_order_status(
    order_id: UUID,
    body: schemas.OrderStatusUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Transition an order to a new status with validation."""
    stmt = (
        select(models.PurchaseOrder)
        .options(selectinload(models.PurchaseOrder.items))
        .where(models.PurchaseOrder.id == order_id)
    )
    result = await db.execute(stmt)
    order = result.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    allowed = VALID_TRANSITIONS.get(order.status, [])
    if body.status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot transition from {order.status.value} to {body.status.value}. "
                   f"Allowed: {[s.value for s in allowed]}"
        )

    order.status = body.status
    await db.commit()

    # Reload with items for response (F19 fix)
    stmt2 = (
        select(models.PurchaseOrder)
        .options(selectinload(models.PurchaseOrder.items))
        .where(models.PurchaseOrder.id == order_id)
    )
    result2 = await db.execute(stmt2)
    return result2.scalars().first()
