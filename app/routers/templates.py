from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Dict, Any
from uuid import UUID
from pydantic import BaseModel
from datetime import datetime

from app import models
from app.dependencies import get_db, get_current_user

router = APIRouter(prefix="/templates", tags=["templates"])

# --- Schemas ---

class TemplateItem(BaseModel):
    product_id: UUID
    quantity: float
    notes: Dict[str, str] = {}

class TemplateCreate(BaseModel):
    store_id: UUID
    name: str
    items: List[TemplateItem]

class TemplateResponse(BaseModel):
    id: UUID
    store_id: UUID
    name: str
    items: List[TemplateItem]
    created_at: datetime

    class Config:
        from_attributes = True

# --- Endpoints ---

@router.get("/", response_model=List[TemplateResponse])
async def list_templates(
    store_id: UUID,
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List templates for a specific store."""
    # Auth check: Store Managers can only see templates for their stores
    if (
        current_user.role == models.UserRole.STORE_MANAGER
        and current_user.allowed_store_ids
        and store_id not in current_user.allowed_store_ids
    ):
        raise HTTPException(status_code=403, detail="Not authorized for this store")

    stmt = select(models.OrderTemplate).where(models.OrderTemplate.store_id == store_id).order_by(models.OrderTemplate.name)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("/", response_model=TemplateResponse)
async def create_template(
    template_in: TemplateCreate,
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new template."""
    # Auth check
    if (
        current_user.role == models.UserRole.STORE_MANAGER
        and current_user.allowed_store_ids
        and template_in.store_id not in current_user.allowed_store_ids
    ):
        raise HTTPException(status_code=403, detail="Not authorized for this store")

    # Serialize items to Dict for JSONB
    items_data = [item.model_dump() for item in template_in.items]

    new_template = models.OrderTemplate(
        store_id=template_in.store_id,
        name=template_in.name,
        items=items_data
    )
    db.add(new_template)
    await db.commit()
    await db.refresh(new_template)
    return new_template

@router.delete("/{template_id}")
async def delete_template(
    template_id: UUID,
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a template."""
    stmt = select(models.OrderTemplate).where(models.OrderTemplate.id == template_id)
    result = await db.execute(stmt)
    template = result.scalars().first()
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    # Auth check
    if (
        current_user.role == models.UserRole.STORE_MANAGER
        and current_user.allowed_store_ids
        and template.store_id not in current_user.allowed_store_ids
    ):
        raise HTTPException(status_code=403, detail="Not authorized for this store")

    await db.delete(template)
    await db.commit()
    return {"message": "Template deleted"}
