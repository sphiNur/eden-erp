import enum
import json
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import List, Optional, Dict
from uuid import UUID, uuid4

from sqlalchemy import (
    BigInteger, Boolean, Date, DateTime, ForeignKey, String, Text,
    Enum, Numeric, ARRAY, UniqueConstraint, JSON, TypeDecorator,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class PortableArray(TypeDecorator):
    """ARRAY on PostgreSQL, JSON on other dialects (e.g. SQLite for tests)."""
    impl = JSON
    cache_ok = True

    def __init__(self, item_type=None):
        super().__init__()
        self._pg_array = ARRAY(item_type) if item_type else None

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql" and self._pg_array is not None:
            return dialect.type_descriptor(self._pg_array)
        return dialect.type_descriptor(JSON())

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if dialect.name != "postgresql":
            # Serialize UUIDs to strings for JSON storage
            return [str(v) for v in value]
        return value

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if dialect.name != "postgresql":
            return [UUID(v) if isinstance(v, str) else v for v in value]
        return value


def _utcnow() -> datetime:
    """Return timezone-aware UTC now (replaces deprecated datetime.utcnow)."""
    return datetime.now(timezone.utc)


# --- Enums ---

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    STORE_MANAGER = "store_manager"
    GLOBAL_PURCHASER = "global_purchaser"
    FINANCE = "finance"

class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    PURCHASING = "purchasing"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

class BatchStatus(str, enum.Enum):
    DRAFT = "draft"
    FINALIZED = "finalized"

class SplitMethod(str, enum.Enum):
    EQUAL = "equal"              # 平均均摊
    PROPORTIONAL = "proportional"  # 按比例均摊

class BillStatus(str, enum.Enum):
    DRAFT = "draft"
    CONFIRMED = "confirmed"

# --- Models ---

class User(Base):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    telegram_id: Mapped[int] = mapped_column(BigInteger, unique=True, index=True)
    username: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.STORE_MANAGER)
    allowed_store_ids: Mapped[Optional[List[UUID]]] = mapped_column(PortableArray(PG_UUID(as_uuid=True)), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), onupdate=_utcnow, nullable=True)

    # Relationships
    orders: Mapped[List["PurchaseOrder"]] = relationship("PurchaseOrder", back_populates="requester")
    batches: Mapped[List["PurchaseBatch"]] = relationship("PurchaseBatch", back_populates="purchaser")


class Store(Base):
    __tablename__ = "stores"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String, unique=True)
    address: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    config: Mapped[Optional[Dict]] = mapped_column(JSONB, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), onupdate=_utcnow, nullable=True)

    orders: Mapped[List["PurchaseOrder"]] = relationship("PurchaseOrder", back_populates="store")
    bills: Mapped[List["DailyBill"]] = relationship("DailyBill", back_populates="store")


class Stall(Base):
    """档口 — 市场中不同的购买点 (e.g. 蔬菜档, 肉类档)"""
    __tablename__ = "stalls"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String, unique=True)
    location: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    sort_order: Mapped[int] = mapped_column(default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), onupdate=_utcnow, nullable=True)

    products: Mapped[List["Product"]] = relationship("Product", back_populates="default_stall")


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    name_i18n: Mapped[Dict[str, str]] = mapped_column(JSONB)
    sort_order: Mapped[int] = mapped_column(default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), onupdate=_utcnow, nullable=True)

    products: Mapped[List["Product"]] = relationship("Product", back_populates="category")


class Product(Base):
    __tablename__ = "products"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    category_id: Mapped[UUID] = mapped_column(ForeignKey("categories.id"))
    default_stall_id: Mapped[Optional[UUID]] = mapped_column(ForeignKey("stalls.id"), nullable=True)
    name_i18n: Mapped[Dict[str, str]] = mapped_column(JSONB)
    unit_i18n: Mapped[Dict[str, str]] = mapped_column(JSONB)
    price_reference: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), onupdate=_utcnow, nullable=True)

    category: Mapped["Category"] = relationship("Category", back_populates="products")
    default_stall: Mapped[Optional["Stall"]] = relationship("Stall", back_populates="products")


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    store_id: Mapped[UUID] = mapped_column(ForeignKey("stores.id"))
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
    status: Mapped[OrderStatus] = mapped_column(Enum(OrderStatus), default=OrderStatus.PENDING)
    delivery_date: Mapped[date] = mapped_column(Date)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, index=True)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), onupdate=_utcnow, nullable=True)

    store: Mapped["Store"] = relationship("Store", back_populates="orders")
    requester: Mapped["User"] = relationship("User", back_populates="orders")
    items: Mapped[List["OrderItem"]] = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"
    __table_args__ = (
        UniqueConstraint("purchase_order_id", "product_id", name="uq_order_item_product"),
    )

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    purchase_order_id: Mapped[UUID] = mapped_column(ForeignKey("purchase_orders.id"))
    product_id: Mapped[UUID] = mapped_column(ForeignKey("products.id"), index=True)
    quantity_requested: Mapped[Decimal] = mapped_column(Numeric(10, 3))
    quantity_approved: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 3), nullable=True)
    allocated_cost_uzs: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    quantity_fulfilled: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 3), nullable=True)
    notes: Mapped[Optional[Dict[str, str]]] = mapped_column(JSONB, nullable=True)

    order: Mapped["PurchaseOrder"] = relationship("PurchaseOrder", back_populates="items")
    product: Mapped["Product"] = relationship("Product")


class PurchaseBatch(Base):
    __tablename__ = "purchase_batches"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    purchaser_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
    purchase_date: Mapped[date] = mapped_column(Date, default=lambda: _utcnow().date())
    market_location: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    status: Mapped[BatchStatus] = mapped_column(Enum(BatchStatus), default=BatchStatus.DRAFT)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), onupdate=_utcnow, nullable=True)

    purchaser: Mapped["User"] = relationship("User", back_populates="batches")
    items: Mapped[List["BatchItem"]] = relationship("BatchItem", back_populates="batch", cascade="all, delete-orphan")


class BatchItem(Base):
    __tablename__ = "batch_items"
    __table_args__ = (
        UniqueConstraint("purchase_batch_id", "product_id", name="uq_batch_item_product"),
    )

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    purchase_batch_id: Mapped[UUID] = mapped_column(ForeignKey("purchase_batches.id"))
    product_id: Mapped[UUID] = mapped_column(ForeignKey("products.id"))

    total_quantity_bought: Mapped[Decimal] = mapped_column(Numeric(10, 3))
    total_cost_uzs: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    unit_price_calculated: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)

    batch: Mapped["PurchaseBatch"] = relationship("PurchaseBatch", back_populates="items")
    product: Mapped["Product"] = relationship("Product")


class OrderTemplate(Base):
    __tablename__ = "order_templates"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    store_id: Mapped[UUID] = mapped_column(ForeignKey("stores.id"))
    name: Mapped[str] = mapped_column(String)
    items: Mapped[List[Dict]] = mapped_column(JSONB) # List of {product_id, quantity, notes}
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    store: Mapped["Store"] = relationship("Store")


class SharedExpense(Base):
    """共享费用 — 车费/人工/冰块等需要各店铺均摊的费用"""
    __tablename__ = "shared_expenses"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    expense_date: Mapped[date] = mapped_column(Date, index=True)
    expense_type: Mapped[str] = mapped_column(String)  # "transport", "labor", "ice", "other"
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    split_method: Mapped[SplitMethod] = mapped_column(Enum(SplitMethod), default=SplitMethod.EQUAL)
    created_by: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    creator: Mapped["User"] = relationship("User")


class DailyBill(Base):
    """每日账单 — 每店每天一份"""
    __tablename__ = "daily_bills"
    __table_args__ = (
        UniqueConstraint("store_id", "bill_date", name="uq_daily_bill_store_date"),
    )

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    store_id: Mapped[UUID] = mapped_column(ForeignKey("stores.id"), index=True)
    bill_date: Mapped[date] = mapped_column(Date, index=True)
    items_total: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=Decimal("0"))
    shared_total: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=Decimal("0"))
    grand_total: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=Decimal("0"))
    status: Mapped[BillStatus] = mapped_column(Enum(BillStatus), default=BillStatus.DRAFT)
    detail: Mapped[Optional[Dict]] = mapped_column(JSONB, nullable=True)  # Breakdown snapshot
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), onupdate=_utcnow, nullable=True)

    store: Mapped["Store"] = relationship("Store", back_populates="bills")
