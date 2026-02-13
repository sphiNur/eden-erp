from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app import models, schemas
from app.dependencies import get_db

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("/", response_model=List[schemas.Category])
async def list_categories(db: AsyncSession = Depends(get_db)):
    """List all active categories, ordered by sort_order."""
    stmt = (
        select(models.Category)
        .where(models.Category.is_active == True)
        .order_by(models.Category.sort_order)
    )
    result = await db.execute(stmt)
    return result.scalars().all()
