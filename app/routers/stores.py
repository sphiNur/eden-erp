from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app import models, schemas
from app.dependencies import get_db, require_role

router = APIRouter(prefix="/stores", tags=["stores"])


@router.get("/", response_model=List[schemas.StoreResponse])
async def list_stores(db: AsyncSession = Depends(get_db)):
    """List all active stores."""
    result = await db.execute(
        select(models.Store)
        .where(models.Store.is_active == True)
        .order_by(models.Store.name)
    )
    return result.scalars().all()


@router.post("/", response_model=schemas.StoreResponse, dependencies=[Depends(require_role(["admin"]))])
async def create_store(store_in: schemas.StoreCreate, db: AsyncSession = Depends(get_db)):
    new_store = models.Store(
        name=store_in.name,
        address=store_in.address,
    )
    db.add(new_store)
    await db.commit()
    await db.refresh(new_store)
    return new_store
