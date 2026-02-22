from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from uuid import UUID
from datetime import date

from app import models, schemas
from app.dependencies import get_db, get_current_user, require_role

router = APIRouter(prefix="/expenses", tags=["expenses"])


@router.get("/", response_model=List[schemas.SharedExpenseResponse])
async def list_expenses(
    expense_date: Optional[date] = Query(None, description="Filter by date"),
    db: AsyncSession = Depends(get_db),
):
    """List shared expenses, optionally filtered by date."""
    stmt = select(models.SharedExpense).order_by(models.SharedExpense.expense_date.desc())
    if expense_date:
        stmt = stmt.where(models.SharedExpense.expense_date == expense_date)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post(
    "/",
    response_model=schemas.SharedExpenseResponse,
    dependencies=[Depends(require_role(["global_purchaser", "admin"]))],
)
async def create_expense(
    expense_in: schemas.SharedExpenseCreate,
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a new shared expense (transport, labor, etc.)."""
    new_expense = models.SharedExpense(
        expense_date=expense_in.expense_date,
        expense_type=expense_in.expense_type,
        description=expense_in.description,
        amount=expense_in.amount,
        split_method=expense_in.split_method,
        created_by=current_user.id,
    )
    db.add(new_expense)
    await db.commit()
    await db.refresh(new_expense)
    return new_expense


@router.delete(
    "/{expense_id}",
    dependencies=[Depends(require_role(["global_purchaser", "admin"]))],
)
async def delete_expense(
    expense_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Delete a shared expense."""
    result = await db.execute(
        select(models.SharedExpense).where(models.SharedExpense.id == expense_id)
    )
    expense = result.scalars().first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    await db.delete(expense)
    await db.commit()
    return {"ok": True}
