"""Billing service — generates and manages daily bills for stores.

Extracted from app.routers.bills to separate business logic from HTTP handling.
"""
from decimal import Decimal
from datetime import date
from typing import Dict, List
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app import models


async def calculate_store_item_totals(
    orders: List[models.PurchaseOrder],
) -> tuple[Dict[UUID, Decimal], Dict[UUID, list]]:
    """
    Calculate per-store item cost totals from delivered orders.

    Returns:
        (store_item_totals, store_item_details)
    """
    store_item_totals: Dict[UUID, Decimal] = {}
    store_item_details: Dict[UUID, list] = {}

    for order in orders:
        sid = order.store_id
        if sid not in store_item_totals:
            store_item_totals[sid] = Decimal("0")
            store_item_details[sid] = []

        for item in order.items:
            cost = item.allocated_cost_uzs or Decimal("0")
            store_item_totals[sid] += cost

            if cost > 0:
                unit_price = Decimal("0")
                if item.quantity_fulfilled and item.quantity_fulfilled > 0:
                    unit_price = cost / item.quantity_fulfilled

                store_item_details[sid].append({
                    "product_name": item.product.name_i18n if item.product else {"en": "Unknown"},
                    "unit": item.product.unit_i18n if item.product else {"en": "pcs"},
                    "quantity": float(item.quantity_fulfilled or item.quantity_approved or 0),
                    "unit_price": float(unit_price),
                    "subtotal": float(cost),
                })

    return store_item_totals, store_item_details


def calculate_shared_expense_splits(
    expenses: List[models.SharedExpense],
    participating_store_ids: List[UUID],
    store_item_totals: Dict[UUID, Decimal],
) -> tuple[Dict[UUID, Decimal], Dict[UUID, list]]:
    """
    Split shared expenses across participating stores.

    Returns:
        (store_shared_totals, store_expense_details)
    """
    num_stores = len(participating_store_ids)
    total_items_all_stores = sum(store_item_totals.values())
    store_shared_totals: Dict[UUID, Decimal] = {sid: Decimal("0") for sid in participating_store_ids}
    store_expense_details: Dict[UUID, list] = {sid: [] for sid in participating_store_ids}

    for expense in expenses:
        if expense.split_method == models.SplitMethod.EQUAL:
            share = expense.amount / Decimal(str(num_stores))
            for sid in participating_store_ids:
                store_shared_totals[sid] += share
                store_expense_details[sid].append({
                    "expense_type": expense.expense_type,
                    "description": expense.description,
                    "total_amount": float(expense.amount),
                    "split_method": "equal",
                    "store_share": float(share),
                })
        else:
            for sid in participating_store_ids:
                if total_items_all_stores > 0:
                    ratio = store_item_totals[sid] / total_items_all_stores
                else:
                    ratio = Decimal("1") / Decimal(str(num_stores))
                share = expense.amount * ratio
                store_shared_totals[sid] += share
                store_expense_details[sid].append({
                    "expense_type": expense.expense_type,
                    "description": expense.description,
                    "total_amount": float(expense.amount),
                    "split_method": "proportional",
                    "store_share": float(share),
                })

    return store_shared_totals, store_expense_details


async def generate_bills_for_date(
    db: AsyncSession,
    bill_date: date,
) -> tuple[List[models.DailyBill], Dict[UUID, models.Store]]:
    """
    Core bill generation logic:
    1. Find all DELIVERED orders for the date
    2. Calculate per-store item costs
    3. Find & split shared expenses
    4. Create/update DailyBill records

    Returns:
        (bills, store_map)

    Raises:
        ValueError: if no delivered orders found for the date
    """
    # 1. Find delivered orders
    orders_stmt = (
        select(models.PurchaseOrder)
        .options(selectinload(models.PurchaseOrder.items).selectinload(models.OrderItem.product))
        .where(
            models.PurchaseOrder.delivery_date == bill_date,
            models.PurchaseOrder.status == models.OrderStatus.DELIVERED,
        )
    )
    orders_result = await db.execute(orders_stmt)
    orders = orders_result.scalars().all()

    if not orders:
        raise ValueError(f"No delivered orders found for {bill_date}")

    # 2. Per-store item totals
    store_item_totals, store_item_details = await calculate_store_item_totals(orders)
    participating_store_ids = list(store_item_totals.keys())

    # 3. Shared expenses
    expenses_result = await db.execute(
        select(models.SharedExpense).where(models.SharedExpense.expense_date == bill_date)
    )
    expenses = expenses_result.scalars().all()

    store_shared_totals, store_expense_details = calculate_shared_expense_splits(
        expenses, participating_store_ids, store_item_totals
    )

    # 4. Load store names
    stores_result = await db.execute(
        select(models.Store).where(models.Store.id.in_(participating_store_ids))
    )
    store_map = {s.id: s for s in stores_result.scalars().all()}

    # 5. Create/update DailyBill records
    bills = []
    for sid in participating_store_ids:
        items_total = store_item_totals[sid]
        shared_total = store_shared_totals[sid]
        grand_total = items_total + shared_total
        detail = {
            "items": store_item_details.get(sid, []),
            "expenses": store_expense_details.get(sid, []),
        }

        # Check if bill exists
        existing_result = await db.execute(
            select(models.DailyBill).where(
                models.DailyBill.store_id == sid,
                models.DailyBill.bill_date == bill_date,
            )
        )
        existing_bill = existing_result.scalars().first()

        if existing_bill:
            existing_bill.items_total = items_total
            existing_bill.shared_total = shared_total
            existing_bill.grand_total = grand_total
            existing_bill.detail = detail
            existing_bill.status = models.BillStatus.DRAFT
            bill = existing_bill
        else:
            bill = models.DailyBill(
                store_id=sid,
                bill_date=bill_date,
                items_total=items_total,
                shared_total=shared_total,
                grand_total=grand_total,
                detail=detail,
            )
            db.add(bill)

        bills.append(bill)

    await db.commit()

    # Refresh all bills for response
    for bill in bills:
        await db.refresh(bill)

    return bills, store_map
