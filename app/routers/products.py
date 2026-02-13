from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List
from uuid import UUID

from app import models, schemas
from app.dependencies import get_db, require_role

router = APIRouter(prefix="/products", tags=["products"])


@router.get("/", response_model=List[schemas.Product])
async def get_products(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(models.Product)
        .options(selectinload(models.Product.category))
        .where(models.Product.is_active == True)
        .order_by(models.Product.category_id)
    )
    return result.scalars().all()


@router.post("/", response_model=schemas.Product, dependencies=[Depends(require_role(["admin"]))])
async def create_product(
    product: schemas.ProductCreate,
    db: AsyncSession = Depends(get_db)
):
    new_product = models.Product(
        category_id=product.category_id,
        name_i18n=product.name_i18n,
        unit_i18n=product.unit_i18n,
        price_reference=product.price_reference,
        is_active=product.is_active
    )
    db.add(new_product)
    await db.commit()
    # Reload with category relationship (F22)
    stmt = (
        select(models.Product)
        .options(selectinload(models.Product.category))
        .where(models.Product.id == new_product.id)
    )
    result = await db.execute(stmt)
    return result.scalars().first()


@router.put("/{product_id}", response_model=schemas.Product, dependencies=[Depends(require_role(["admin"]))])
async def update_product(
    product_id: UUID,
    product_update: schemas.ProductUpdate,
    db: AsyncSession = Depends(get_db)
):
    query = (
        select(models.Product)
        .where(models.Product.id == product_id)
        .options(selectinload(models.Product.category))
    )
    result = await db.execute(query)
    existing_product = result.scalar_one_or_none()
    
    if not existing_product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Update only provided fields
    if product_update.category_id is not None:
        existing_product.category_id = product_update.category_id
    if product_update.name_i18n is not None:
        existing_product.name_i18n = product_update.name_i18n
    if product_update.unit_i18n is not None:
        existing_product.unit_i18n = product_update.unit_i18n
    if product_update.price_reference is not None:
        existing_product.price_reference = product_update.price_reference
    if product_update.is_active is not None:
        existing_product.is_active = product_update.is_active
        
    await db.commit()
    await db.refresh(existing_product)
    return existing_product


@router.delete("/{product_id}", dependencies=[Depends(require_role(["admin"]))])
async def delete_product(
    product_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Soft-delete a product by setting is_active = False."""
    result = await db.execute(
        select(models.Product).where(models.Product.id == product_id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product.is_active = False
    await db.commit()
    return {"ok": True, "id": str(product_id)}
