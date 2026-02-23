"""Initial schema — all existing models.

Revision ID: 0001
Revises: None
Create Date: 2026-02-22
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- Users ---
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("telegram_id", sa.BigInteger, unique=True, index=True, nullable=False),
        sa.Column("username", sa.String, nullable=True),
        sa.Column("role", sa.Enum("admin", "store_manager", "global_purchaser", "finance", name="userrole"), nullable=False, server_default="store_manager"),
        sa.Column("allowed_store_ids", postgresql.ARRAY(postgresql.UUID(as_uuid=True)), nullable=True),
        sa.Column("is_active", sa.Boolean, default=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )

    # --- Stores ---
    op.create_table(
        "stores",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String, unique=True, nullable=False),
        sa.Column("address", sa.String, nullable=True),
        sa.Column("config", postgresql.JSONB, nullable=True),
        sa.Column("is_active", sa.Boolean, default=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )

    # --- Stalls ---
    op.create_table(
        "stalls",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String, unique=True, nullable=False),
        sa.Column("location", sa.String, nullable=True),
        sa.Column("sort_order", sa.Integer, default=0),
        sa.Column("is_active", sa.Boolean, default=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )

    # --- Categories ---
    op.create_table(
        "categories",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name_i18n", postgresql.JSONB, nullable=False),
        sa.Column("sort_order", sa.Integer, default=0),
        sa.Column("is_active", sa.Boolean, default=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )

    # --- Products ---
    op.create_table(
        "products",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("category_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("categories.id"), nullable=False),
        sa.Column("default_stall_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("stalls.id"), nullable=True),
        sa.Column("name_i18n", postgresql.JSONB, nullable=False),
        sa.Column("unit_i18n", postgresql.JSONB, nullable=False),
        sa.Column("price_reference", sa.Numeric(12, 2), nullable=True),
        sa.Column("is_active", sa.Boolean, default=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )

    # --- Purchase Orders ---
    op.create_table(
        "purchase_orders",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("store_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("stores.id"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("status", sa.Enum("pending", "approved", "purchasing", "delivered", "cancelled", name="orderstatus"), nullable=False, server_default="pending"),
        sa.Column("delivery_date", sa.Date, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, index=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )

    # --- Order Items ---
    op.create_table(
        "order_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("purchase_order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("purchase_orders.id"), nullable=False),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("products.id"), nullable=False, index=True),
        sa.Column("quantity_requested", sa.Numeric(10, 3), nullable=False),
        sa.Column("quantity_approved", sa.Numeric(10, 3), nullable=True),
        sa.Column("allocated_cost_uzs", sa.Numeric(12, 2), nullable=True),
        sa.Column("quantity_fulfilled", sa.Numeric(10, 3), nullable=True),
        sa.Column("notes", postgresql.JSONB, nullable=True),
        sa.UniqueConstraint("purchase_order_id", "product_id", name="uq_order_item_product"),
    )

    # --- Purchase Batches ---
    op.create_table(
        "purchase_batches",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("purchaser_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("purchase_date", sa.Date, nullable=False),
        sa.Column("market_location", sa.String, nullable=True),
        sa.Column("status", sa.Enum("draft", "finalized", name="batchstatus"), nullable=False, server_default="draft"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )

    # --- Batch Items ---
    op.create_table(
        "batch_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("purchase_batch_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("purchase_batches.id"), nullable=False),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("products.id"), nullable=False),
        sa.Column("total_quantity_bought", sa.Numeric(10, 3), nullable=False),
        sa.Column("total_cost_uzs", sa.Numeric(12, 2), nullable=False),
        sa.Column("unit_price_calculated", sa.Numeric(12, 2), nullable=True),
        sa.UniqueConstraint("purchase_batch_id", "product_id", name="uq_batch_item_product"),
    )

    # --- Order Templates ---
    op.create_table(
        "order_templates",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("store_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("stores.id"), nullable=False),
        sa.Column("name", sa.String, nullable=False),
        sa.Column("items", postgresql.JSONB, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    # --- Shared Expenses ---
    op.create_table(
        "shared_expenses",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("expense_date", sa.Date, nullable=False, index=True),
        sa.Column("expense_type", sa.String, nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("split_method", sa.Enum("equal", "proportional", name="splitmethod"), nullable=False, server_default="equal"),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    # --- Daily Bills ---
    op.create_table(
        "daily_bills",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("store_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("stores.id"), nullable=False, index=True),
        sa.Column("bill_date", sa.Date, nullable=False, index=True),
        sa.Column("items_total", sa.Numeric(14, 2), nullable=False, server_default="0"),
        sa.Column("shared_total", sa.Numeric(14, 2), nullable=False, server_default="0"),
        sa.Column("grand_total", sa.Numeric(14, 2), nullable=False, server_default="0"),
        sa.Column("status", sa.Enum("draft", "confirmed", name="billstatus"), nullable=False, server_default="draft"),
        sa.Column("detail", postgresql.JSONB, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("store_id", "bill_date", name="uq_daily_bill_store_date"),
    )


def downgrade() -> None:
    op.drop_table("daily_bills")
    op.drop_table("shared_expenses")
    op.drop_table("order_templates")
    op.drop_table("batch_items")
    op.drop_table("purchase_batches")
    op.drop_table("order_items")
    op.drop_table("purchase_orders")
    op.drop_table("products")
    op.drop_table("categories")
    op.drop_table("stalls")
    op.drop_table("stores")
    op.drop_table("users")

    # Drop enums
    op.execute("DROP TYPE IF EXISTS userrole")
    op.execute("DROP TYPE IF EXISTS orderstatus")
    op.execute("DROP TYPE IF EXISTS batchstatus")
    op.execute("DROP TYPE IF EXISTS splitmethod")
    op.execute("DROP TYPE IF EXISTS billstatus")
