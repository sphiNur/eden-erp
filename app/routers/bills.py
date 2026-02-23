"""Bills API router — generates and retrieves daily bills for stores."""
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from uuid import UUID

from app import models, schemas
from app.dependencies import get_db, get_current_user, require_role
from app.services.billing import generate_bills_for_date

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
    """Generate daily bills for all stores that had delivered orders on the given date."""
    try:
        bills, store_map = await generate_bills_for_date(db, bill_date)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    # Build response
    bill_responses = [
        schemas.DailyBillResponse(
            id=bill.id,
            store_id=bill.store_id,
            store_name=store_map.get(bill.store_id, models.Store()).name if store_map.get(bill.store_id) else None,
            bill_date=bill.bill_date,
            items_total=bill.items_total,
            shared_total=bill.shared_total,
            grand_total=bill.grand_total,
            status=bill.status,
            detail=bill.detail,
            created_at=bill.created_at,
        )
        for bill in bills
    ]

    return schemas.DailyBillSummary(
        bill_date=bill_date,
        total_stores=len(bills),
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

    if not bills:
        return []

    # Enrich with store names
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
