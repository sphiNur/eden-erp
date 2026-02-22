from decimal import Decimal
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func
from typing import List, Optional
from uuid import UUID

from app import models, schemas
from app.dependencies import get_db, get_current_user, require_role

router = APIRouter(prefix="/bills", tags=["bills"])


@router.post(
    "/generate",
    response_model=schemas.DailyBillSummary,
    dependencies=[Depends(require_role(["global_purchaser", "admin"]))],
)
async def generate_daily_bills(
    bill_date: date = Query(..., description="Date to generate bills for"),
    db: AsyncSession = Depends(get_db),
):
    """
    Generate daily bills for all stores that had delivered orders on the given date.
    
    Steps:
    1. Find all DELIVERED orders for the given date
    2. Sum up each store's allocated item costs
    3. Find all shared expenses for the date
    4. Split shared expenses across participating stores
    5. Create/update DailyBill records
    """

    # 1. Find all delivered orders for this date with their items
    orders_stmt = (
        select(models.PurchaseOrder)
        .options(selectinload(models.PurchaseOrder.items).selectinload(models.OrderItem.product))
        .where(
            models.PurchaseOrder.delivery_date == bill_date,
            models.PurchaseOrder.status == models.OrderStatus.DELIVERED,
        )
    )
    orders_result = await db.execute(orders_stmt)
    orders = orders_result.scalars().all()

    if not orders:
        raise HTTPException(
            status_code=404,
            detail=f"No delivered orders found for {bill_date}"
        )

    # 2. Calculate per-store item totals
    store_item_totals: dict[UUID, Decimal] = {}
    store_item_details: dict[UUID, list] = {}

    for order in orders:
        sid = order.store_id
        if sid not in store_item_totals:
            store_item_totals[sid] = Decimal("0")
            store_item_details[sid] = []

        for item in order.items:
            cost = item.allocated_cost_uzs or Decimal("0")
            store_item_totals[sid] += cost

            if cost > 0:
                unit_price = Decimal("0")
                if item.quantity_fulfilled and item.quantity_fulfilled > 0:
                    unit_price = cost / item.quantity_fulfilled

                store_item_details[sid].append({
                    "product_name": item.product.name_i18n if item.product else {"en": "Unknown"},
                    "unit": item.product.unit_i18n if item.product else {"en": "pcs"},
                    "quantity": float(item.quantity_fulfilled or item.quantity_approved or 0),
                    "unit_price": float(unit_price),
                    "subtotal": float(cost),
                })

    participating_store_ids = list(store_item_totals.keys())
    num_stores = len(participating_store_ids)

    # 3. Find shared expenses for this date
    expenses_stmt = select(models.SharedExpense).where(
        models.SharedExpense.expense_date == bill_date
    )
    expenses_result = await db.execute(expenses_stmt)
    expenses = expenses_result.scalars().all()

    # 4. Calculate shared expense per store
    total_items_all_stores = sum(store_item_totals.values())
    store_shared_totals: dict[UUID, Decimal] = {sid: Decimal("0") for sid in participating_store_ids}
    store_expense_details: dict[UUID, list] = {sid: [] for sid in participating_store_ids}

    for expense in expenses:
        if expense.split_method == models.SplitMethod.EQUAL:
            # Equal split across all participating stores
            share = expense.amount / Decimal(str(num_stores))
            for sid in participating_store_ids:
                store_shared_totals[sid] += share
                store_expense_details[sid].append({
                    "expense_type": expense.expense_type,
                    "description": expense.description,
                    "total_amount": float(expense.amount),
                    "split_method": "equal",
                    "store_share": float(share),
                })
        else:
            # Proportional split based on item totals
            for sid in participating_store_ids:
                if total_items_all_stores > 0:
                    ratio = store_item_totals[sid] / total_items_all_stores
                else:
                    ratio = Decimal("1") / Decimal(str(num_stores))
                share = expense.amount * ratio
                store_shared_totals[sid] += share
                store_expense_details[sid].append({
                    "expense_type": expense.expense_type,
                    "description": expense.description,
                    "total_amount": float(expense.amount),
                    "split_method": "proportional",
                    "store_share": float(share),
                })

    # 5. Create/update DailyBill records
    # Load store names for response
    stores_stmt = select(models.Store).where(models.Store.id.in_(participating_store_ids))
    stores_result = await db.execute(stores_stmt)
    store_map = {s.id: s for s in stores_result.scalars().all()}

    bills = []
    for sid in participating_store_ids:
        items_total = store_item_totals[sid]
        shared_total = store_shared_totals[sid]
        grand_total = items_total + shared_total

        detail = {
            "items": store_item_details.get(sid, []),
            "expenses": store_expense_details.get(sid, []),
        }

        # Check if bill already exists for this store+date
        existing_stmt = select(models.DailyBill).where(
            models.DailyBill.store_id == sid,
            models.DailyBill.bill_date == bill_date,
        )
        existing_result = await db.execute(existing_stmt)
        existing_bill = existing_result.scalars().first()

        if existing_bill:
            # Update existing bill
            existing_bill.items_total = items_total
            existing_bill.shared_total = shared_total
            existing_bill.grand_total = grand_total
            existing_bill.detail = detail
            existing_bill.status = models.BillStatus.DRAFT
            bill = existing_bill
        else:
            # Create new bill
            bill = models.DailyBill(
                store_id=sid,
                bill_date=bill_date,
                items_total=items_total,
                shared_total=shared_total,
                grand_total=grand_total,
                detail=detail,
            )
            db.add(bill)

        bills.append(bill)

    await db.commit()

    # Build response
    bill_responses = []
    for bill in bills:
        await db.refresh(bill)
        store = store_map.get(bill.store_id)
        bill_responses.append(schemas.DailyBillResponse(
            id=bill.id,
            store_id=bill.store_id,
            store_name=store.name if store else None,
            bill_date=bill.bill_date,
            items_total=bill.items_total,
            shared_total=bill.shared_total,
            grand_total=bill.grand_total,
            status=bill.status,
            detail=bill.detail,
            created_at=bill.created_at,
        ))

    return schemas.DailyBillSummary(
        bill_date=bill_date,
        total_stores=num_stores,
        total_items_amount=sum(b.items_total for b in bills),
        total_shared_amount=sum(b.shared_total for b in bills),
        grand_total=sum(b.grand_total for b in bills),
        bills=bill_responses,
    )


@router.get("/", response_model=List[schemas.DailyBillResponse])
async def list_bills(
    bill_date: Optional[date] = Query(None, description="Filter by date"),
    store_id: Optional[UUID] = Query(None, description="Filter by store"),
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List daily bills, with optional date/store filters. Store managers see only their stores."""
    stmt = select(models.DailyBill).join(models.Store)

    if bill_date:
        stmt = stmt.where(models.DailyBill.bill_date == bill_date)
    if store_id:
        stmt = stmt.where(models.DailyBill.store_id == store_id)

    # Store managers can only see their own stores
    if (
        current_user.role == models.UserRole.STORE_MANAGER
        and current_user.allowed_store_ids
    ):
        stmt = stmt.where(models.DailyBill.store_id.in_(current_user.allowed_store_ids))

    stmt = stmt.order_by(models.DailyBill.bill_date.desc())
    result = await db.execute(stmt)
    bills = result.scalars().all()

    # Enrich with store names
    if bills:
        store_ids = list({b.store_id for b in bills})
        stores_result = await db.execute(
            select(models.Store).where(models.Store.id.in_(store_ids))
        )
        store_map = {s.id: s.name for s in stores_result.scalars().all()}

        return [
            schemas.DailyBillResponse(
                id=b.id,
                store_id=b.store_id,
                store_name=store_map.get(b.store_id),
                bill_date=b.bill_date,
                items_total=b.items_total,
                shared_total=b.shared_total,
                grand_total=b.grand_total,
                status=b.status,
                detail=b.detail,
                created_at=b.created_at,
            )
            for b in bills
        ]

    return []


@router.get("/{bill_id}", response_model=schemas.DailyBillResponse)
async def get_bill(
    bill_id: UUID,
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single bill by ID."""
    result = await db.execute(
        select(models.DailyBill).where(models.DailyBill.id == bill_id)
    )
    bill = result.scalars().first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")

    # Store managers can only see their own stores
    if (
        current_user.role == models.UserRole.STORE_MANAGER
        and current_user.allowed_store_ids
        and bill.store_id not in current_user.allowed_store_ids
    ):
        raise HTTPException(status_code=403, detail="Not authorized for this store")

    # Get store name
    store_result = await db.execute(
        select(models.Store).where(models.Store.id == bill.store_id)
    )
    store = store_result.scalars().first()

    return schemas.DailyBillResponse(
        id=bill.id,
        store_id=bill.store_id,
        store_name=store.name if store else None,
        bill_date=bill.bill_date,
        items_total=bill.items_total,
        shared_total=bill.shared_total,
        grand_total=bill.grand_total,
        status=bill.status,
        detail=bill.detail,
        created_at=bill.created_at,
    )
