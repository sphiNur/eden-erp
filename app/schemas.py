from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, Field, field_validator

from app.models import UserRole, OrderStatus, BatchStatus, SplitMethod, BillStatus

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

# --- Stall Schemas ---

class StallCreate(BaseModel):
    name: str
    location: Optional[str] = None
    sort_order: int = 0

class StallUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None

class StallResponse(BaseModel):
    id: UUID
    name: str
    location: Optional[str] = None
    sort_order: int
    is_active: bool

    class Config:
        from_attributes = True

# --- Product Schemas ---

class Product(BaseModel):
    id: UUID
    category_id: UUID
    default_stall_id: Optional[UUID] = None
    category: Optional[Category] = None
    name_i18n: Dict[str, str]
    unit_i18n: Dict[str, str]
    price_reference: Optional[Decimal] = None
    is_active: bool

    class Config:
        from_attributes = True

class ProductCreate(BaseModel):
    category_id: UUID
    default_stall_id: Optional[UUID] = None
    name_i18n: Dict[str, str]
    unit_i18n: Dict[str, str]
    price_reference: Optional[Decimal] = None
    is_active: bool = True

class ProductUpdate(BaseModel):
    category_id: Optional[UUID] = None
    default_stall_id: Optional[UUID] = None
    name_i18n: Optional[Dict[str, str]] = None
    unit_i18n: Optional[Dict[str, str]] = None
    price_reference: Optional[Decimal] = None
    is_active: Optional[bool] = None

# --- Order Schemas ---

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

# --- Purchase Batch Schemas ---

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

# --- Stall-based Consolidation ---

class StallConsolidatedProduct(BaseModel):
    product_id: UUID
    product_name: Dict[str, str]
    unit: Dict[str, str]
    price_reference: Optional[Decimal] = None
    total_quantity: Decimal
    breakdown: List[StoreNeed] = []

class StallConsolidation(BaseModel):
    stall: Optional[StallResponse] = None
    stall_name: str  # Fallback name if stall is None (unassigned)
    items: List[StallConsolidatedProduct] = []

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

# --- Shared Expense Schemas ---

class SharedExpenseCreate(BaseModel):
    expense_date: date
    expense_type: str  # "transport", "labor", "ice", "other"
    description: Optional[str] = None
    amount: Decimal = Field(..., gt=0)
    split_method: SplitMethod = SplitMethod.EQUAL

class SharedExpenseResponse(BaseModel):
    id: UUID
    expense_date: date
    expense_type: str
    description: Optional[str] = None
    amount: Decimal
    split_method: SplitMethod
    created_by: UUID
    created_at: datetime

    class Config:
        from_attributes = True

# --- Daily Bill Schemas ---

class BillItemDetail(BaseModel):
    """Single item in the bill breakdown"""
    product_name: Dict[str, str]
    unit: Dict[str, str]
    quantity: Decimal
    unit_price: Decimal
    subtotal: Decimal

class BillExpenseDetail(BaseModel):
    """Single shared expense line in the bill"""
    expense_type: str
    description: Optional[str] = None
    total_amount: Decimal
    split_method: str
    store_share: Decimal

class DailyBillResponse(BaseModel):
    id: UUID
    store_id: UUID
    store_name: Optional[str] = None
    bill_date: date
    items_total: Decimal
    shared_total: Decimal
    grand_total: Decimal
    status: BillStatus
    detail: Optional[Dict] = None
    created_at: datetime

    class Config:
        from_attributes = True

class DailyBillSummary(BaseModel):
    """Summary view of all stores' bills for a given date"""
    bill_date: date
    total_stores: int
    total_items_amount: Decimal
    total_shared_amount: Decimal
    grand_total: Decimal
    bills: List[DailyBillResponse] = []

