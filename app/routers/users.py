from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app.dependencies import get_db, get_current_user, require_role
from app import models, schemas

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=schemas.User)
async def get_me(current_user: models.User = Depends(get_current_user)):
    """Return the currently authenticated user."""
    return current_user


@router.post("/switch-role")
async def switch_role(
    role: str,
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Dev helper: quickly switch the current user's role. Only available in development."""
    import os
    if os.getenv("APP_ENV", "development") != "development":
        raise HTTPException(status_code=403, detail="switch-role is only available in development")

    try:
        new_role = models.UserRole(role)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid role: {role}")

    current_user.role = new_role
    await db.commit()
    return {"ok": True, "role": new_role.value}


@router.get("/", response_model=List[schemas.User], dependencies=[Depends(require_role(["admin"]))])
async def list_users(db: AsyncSession = Depends(get_db)):
    """List all users (admin only)."""
    result = await db.execute(select(models.User).order_by(models.User.created_at))
    return result.scalars().all()


@router.put("/{user_id}", response_model=schemas.User, dependencies=[Depends(require_role(["admin"]))])
async def update_user(
    user_id: str,
    update: schemas.UserUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update a user's role and/or allowed stores (admin only)."""
    result = await db.execute(select(models.User).where(models.User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if update.role is not None:
        try:
            user.role = models.UserRole(update.role)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid role: {update.role}")

    if update.allowed_store_ids is not None:
        user.allowed_store_ids = update.allowed_store_ids

    await db.commit()
    await db.refresh(user)
    return user
