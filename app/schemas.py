from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, Field, field_validator

from app.models import UserRole, OrderStatus, BatchStatus

# --- Base Models ---

class User(BaseModel):
    id: UUID
    telegram_id: int
    username: Optional[str]
    role: UserRole
    allowed_store_ids: Optional[List[UUID]] = None
    is_active: bool = True
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Category(BaseModel):
    id: UUID
    name_i18n: Dict[str, str]
    sort_order: int
    is_active: bool

    class Config:
        from_attributes = True

class Product(BaseModel):
    id: UUID
    category_id: UUID
    category: Optional[Category] = None
    name_i18n: Dict[str, str]
    unit_i18n: Dict[str, str]
    price_reference: Optional[Decimal] = None
    is_active: bool

    class Config:
        from_attributes = True

class ProductCreate(BaseModel):
    category_id: UUID
    name_i18n: Dict[str, str]
    unit_i18n: Dict[str, str]
    price_reference: Optional[Decimal] = None
    is_active: bool = True

class ProductUpdate(BaseModel):
    category_id: Optional[UUID] = None
    name_i18n: Optional[Dict[str, str]] = None
    unit_i18n: Optional[Dict[str, str]] = None
    price_reference: Optional[Decimal] = None
    is_active: Optional[bool] = None

class ItemBase(BaseModel):
    product_id: UUID
    quantity_requested: Decimal = Field(..., gt=0)
    notes: Optional[Dict[str, str]] = None

class OrderItemCreate(ItemBase):
    pass

class OrderItemResponse(ItemBase):
    id: UUID
    quantity_approved: Optional[Decimal] = None
    allocated_cost_uzs: Optional[Decimal] = None
    quantity_fulfilled: Optional[Decimal] = None

class OrderBase(BaseModel):
    store_id: UUID
    delivery_date: date

class OrderCreate(OrderBase):
    items: List[OrderItemCreate]

class OrderResponse(OrderBase):
    id: UUID
    user_id: UUID
    status: OrderStatus
    created_at: datetime
    items: List[OrderItemResponse]

    class Config:
        from_attributes = True

# --- Purchase Batch Models ---

class BatchItemInput(BaseModel):
    product_id: UUID
    total_quantity_bought: Decimal = Field(..., gt=0)
    total_cost_uzs: Decimal = Field(..., gt=0)


class StoreNeed(BaseModel):
    store_name: str
    quantity: Decimal

class ConsolidatedItem(BaseModel):
    product_id: UUID
    product_name: Dict[str, str]
    unit: Dict[str, str]
    category_name: Dict[str, str]
    price_reference: Optional[Decimal] = None
    total_quantity_needed: Decimal
    breakdown: List[StoreNeed] = []

class OrderStatusUpdate(BaseModel):
    status: OrderStatus

# --- Store Schemas ---

class StoreCreate(BaseModel):
    name: str
    address: Optional[str] = None

class StoreResponse(BaseModel):
    id: UUID
    name: str
    address: Optional[str] = None
    is_active: bool = True
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- User Schemas ---

class UserUpdate(BaseModel):
    role: Optional[str] = None
    allowed_store_ids: Optional[List[UUID]] = None

class BatchCreate(BaseModel):
    market_location: str
    items: List[BatchItemInput]

class BatchItemResponse(BatchItemInput):
    id: UUID
    unit_price_calculated: Optional[Decimal] = None

class BatchResponse(BaseModel):
    id: UUID
    purchaser_id: UUID
    purchase_date: date
    status: BatchStatus
    items: List[BatchItemResponse]

    class Config:
        from_attributes = True
