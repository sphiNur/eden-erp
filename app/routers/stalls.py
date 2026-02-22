from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from uuid import UUID

from app import models, schemas
from app.dependencies import get_db, require_role

router = APIRouter(prefix="/stalls", tags=["stalls"])


@router.get("/", response_model=List[schemas.StallResponse])
async def list_stalls(db: AsyncSession = Depends(get_db)):
    """List all stalls, ordered by sort_order."""
    stmt = select(models.Stall).order_by(models.Stall.sort_order)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post(
    "/",
    response_model=schemas.StallResponse,
    dependencies=[Depends(require_role(["admin"]))],
)
async def create_stall(
    stall_in: schemas.StallCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new stall (admin only)."""
    new_stall = models.Stall(
        name=stall_in.name,
        location=stall_in.location,
        sort_order=stall_in.sort_order,
    )
    db.add(new_stall)
    await db.commit()
    await db.refresh(new_stall)
    return new_stall


@router.put(
    "/{stall_id}",
    response_model=schemas.StallResponse,
    dependencies=[Depends(require_role(["admin"]))],
)
async def update_stall(
    stall_id: UUID,
    stall_in: schemas.StallUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update a stall (admin only)."""
    result = await db.execute(
        select(models.Stall).where(models.Stall.id == stall_id)
    )
    stall = result.scalars().first()
    if not stall:
        raise HTTPException(status_code=404, detail="Stall not found")

    update_data = stall_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(stall, key, value)

    await db.commit()
    await db.refresh(stall)
    return stall


@router.delete(
    "/{stall_id}",
    dependencies=[Depends(require_role(["admin"]))],
)
async def delete_stall(
    stall_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Delete a stall (admin only). Unlinks any products first."""
    result = await db.execute(
        select(models.Stall).where(models.Stall.id == stall_id)
    )
    stall = result.scalars().first()
    if not stall:
        raise HTTPException(status_code=404, detail="Stall not found")

    # Unlink products that reference this stall
    products_result = await db.execute(
        select(models.Product).where(models.Product.default_stall_id == stall_id)
    )
    for product in products_result.scalars().all():
        product.default_stall_id = None

    await db.delete(stall)
    await db.commit()
    return {"ok": True}
