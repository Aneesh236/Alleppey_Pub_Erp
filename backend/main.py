"""FastAPI service for the Alleppey Pub & Bar ERP."""

from collections import Counter, defaultdict
from contextlib import asynccontextmanager
from datetime import datetime, timezone
import re
from typing import Any

from fastapi import Depends, FastAPI, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database import (
    Bill,
    BillItem,
    InventoryItem,
    MenuItem,
    Order,
    OrderItem,
    get_db,
    init_database,
)
from schemas import (
    BillPayload,
    InventoryItemPayload,
    MenuItemPayload,
    OrderPayload,
    OrderStatusPayload,
)


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_database()
    yield


app = FastAPI(
    title="Alleppey Pub ERP API",
    description="Database, ordering, inventory and analytics API.",
    version="4.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def records(value: Any) -> list[dict[str, Any]]:
    if not isinstance(value, list):
        return []
    return [item for item in value if isinstance(item, dict)]


def number_value(value: Any) -> float:
    try:
        return float(value or 0)
    except (TypeError, ValueError):
        return 0


def text_value(*values: Any) -> str:
    for value in values:
        if isinstance(value, str) and value.strip():
            return value.strip()
    return ""


def money(value: float) -> str:
    return f"â‚¹{value:,.0f}"


def item_name(item: dict[str, Any]) -> str:
    return (
        text_value(
            item.get("name"),
            item.get("itemName"),
            item.get("productName"),
            item.get("title"),
        )
        or "Unnamed item"
    )


def item_quantity(item: dict[str, Any]) -> float:
    return max(
        1,
        number_value(
            item.get("quantity", item.get("qty", item.get("count", 1)))
        ),
    )


def item_price(item: dict[str, Any]) -> float:
    return number_value(
        item.get("price", item.get("unitPrice", item.get("rate", 0)))
    )


def record_items(record: dict[str, Any]) -> list[dict[str, Any]]:
    return records(
        record.get("items", record.get("orderItems", record.get("cart", [])))
    )


def record_total(record: dict[str, Any]) -> float:
    explicit_total = number_value(
        record.get(
            "total",
            record.get(
                "grandTotal",
                record.get("amount", record.get("totalAmount", 0)),
            ),
        )
    )
    if explicit_total > 0:
        return explicit_total

    return sum(
        item_quantity(item) * item_price(item)
        for item in record_items(record)
    )


def analyse_business(payload: dict[str, Any]) -> dict[str, Any]:
    orders = records(payload.get("orders"))
    bills = records(payload.get("bills"))
    inventory = records(payload.get("inventory"))
    question = text_value(payload.get("question")).lower()

    paid_bills = []
    for bill in bills:
        status = text_value(
            bill.get("paymentStatus"),
            bill.get("payment_status"),
            bill.get("status"),
        ).lower()
        if not status or status in {"paid", "completed", "success", "successful"}:
            paid_bills.append(bill)

    billed_revenue = sum(record_total(bill) for bill in paid_bills)
    order_revenue = sum(record_total(order) for order in orders)
    revenue = billed_revenue or order_revenue

    item_quantities: defaultdict[str, float] = defaultdict(float)
    item_source = orders if orders else bills
    for record in item_source:
        for item in record_items(record):
            item_quantities[item_name(item)] += item_quantity(item)

    top_item = (
        max(item_quantities.items(), key=lambda entry: entry[1])
        if item_quantities
        else None
    )

    status_counts: Counter[str] = Counter()
    for order in orders:
        status = text_value(
            order.get("status"),
            order.get("orderStatus"),
        ).lower()
        status_counts[status or "pending"] += 1

    pending_orders = sum(
        count
        for status, count in status_counts.items()
        if "pending" in status or "preparing" in status
    )
    completed_orders = sum(
        count
        for status, count in status_counts.items()
        if (
            "complete" in status
            or "deliver" in status
            or "served" in status
        )
    )

    low_stock = []
    for item in inventory:
        current = number_value(
            item.get(
                "current_stock",
                item.get(
                    "currentStock",
                    item.get("stock", item.get("quantity", 0)),
                ),
            )
        )
        minimum = number_value(
            item.get(
                "minimum_stock",
                item.get(
                    "minimumStock",
                    item.get("minStock", item.get("reorderLevel", 0)),
                ),
            )
        )
        if minimum > 0 and current <= minimum:
            low_stock.append((item, current, minimum))

    payment_counts: Counter[str] = Counter()
    for bill in paid_bills:
        method = text_value(
            bill.get("paymentMethod"),
            bill.get("payment_method"),
            bill.get("method"),
        )
        payment_counts[method or "Unspecified"] += 1

    transaction_count = len(paid_bills) or len(orders)
    sales_insights = [
        (
            f"Recorded revenue is {money(revenue)} from "
            f"{transaction_count} transaction"
            f"{'' if transaction_count == 1 else 's'}."
        ),
        (
            f"{top_item[0]} is the top-selling item with "
            f"{top_item[1]:g} unit"
            f"{'' if top_item[1] == 1 else 's'}."
            if top_item
            else "No item-level sales have been recorded yet."
        ),
        (
            f"{completed_orders} order"
            f"{'' if completed_orders == 1 else 's'} completed; "
            f"{pending_orders} currently pending or preparing."
        ),
    ]

    inventory_alerts = (
        [
            (
                f"{item_name(item)} is low: {current:g} remaining "
                f"(reorder level {minimum:g})."
            )
            for item, current, minimum in low_stock
        ]
        if low_stock
        else ["No items are below their reorder level."]
    )

    low_stock_names = [item_name(item) for item, _, _ in low_stock]
    recommendations = [
        (
            f"Restock {', '.join(low_stock_names[:3])} before the next "
            "busy service."
            if low_stock_names
            else "Inventory levels look healthy; continue routine stock checks."
        ),
        (
            f"Keep {top_item[0]} visible in promotions and verify enough "
            "stock is available."
            if top_item
            else "Record item details on orders to unlock product recommendations."
        ),
        (
            f"Prioritize the {pending_orders} pending/preparing order"
            f"{'' if pending_orders == 1 else 's'}."
            if pending_orders
            else "There is no pending-order backlog."
        ),
    ]

    answer = (
        f"Revenue is {money(revenue)}. There are {len(orders)} orders and "
        f"{len(low_stock)} low-stock items."
    )

    if any(word in question for word in ("revenue", "sales", "earning", "income")):
        paid_text = (
            f" across {len(paid_bills)} paid bill"
            f"{'' if len(paid_bills) == 1 else 's'}"
            if paid_bills
            else ""
        )
        answer = f"Recorded revenue is {money(revenue)}{paid_text}."
    elif any(
        phrase in question
        for phrase in ("top", "best", "popular", "most sold", "selling")
    ):
        answer = (
            f"{top_item[0]} is currently the top seller with "
            f"{top_item[1]:g} units."
            if top_item
            else "There is not enough sales data to identify a top seller yet."
        )
    elif any(
        word in question
        for word in ("stock", "restock", "inventory", "reorder")
    ):
        answer = (
            f"{len(low_stock_names)} item"
            f"{' needs' if len(low_stock_names) == 1 else 's need'} attention: "
            f"{', '.join(low_stock_names)}."
            if low_stock_names
            else "All tracked inventory is above its reorder level."
        )
    elif any(
        word in question
        for word in ("order", "pending", "preparing", "completed", "served")
    ):
        answer = (
            f"{len(orders)} orders are recorded: {completed_orders} completed "
            f"and {pending_orders} pending or preparing."
        )
    elif any(
        word in question
        for word in ("payment", "cash", "card", "upi")
    ):
        payment_summary = ", ".join(
            f"{method}: {count}"
            for method, count in payment_counts.items()
        )
        answer = (
            f"Payment mix: {payment_summary}."
            if payment_summary
            else "No payment-method data has been recorded yet."
        )
    elif any(
        word in question
        for word in ("summary", "report", "performance")
    ):
        top_text = f"{top_item[0]} leads sales, and " if top_item else ""
        answer = (
            f"The business recorded {money(revenue)} revenue from "
            f"{len(orders)} orders. {top_text}{len(low_stock)} inventory item"
            f"{' is' if len(low_stock) == 1 else 's are'} at or below "
            "reorder level."
        )

    return {
        "summary": (
            f"Business snapshot: {len(orders)} order"
            f"{'' if len(orders) == 1 else 's'}, {len(paid_bills)} paid bill"
            f"{'' if len(paid_bills) == 1 else 's'}, {money(revenue)} revenue, "
            f"and {len(low_stock)} low-stock item"
            f"{'' if len(low_stock) == 1 else 's'}."
        ),
        "answer": answer,
        "sales_insights": sales_insights,
        "inventory_alerts": inventory_alerts,
        "recommendations": recommendations,
    }


def customer_answer(question: str) -> str:
    query = question.lower()

    if re.search(r"\b(?:hello|hi|hey|help)\b", query):
        return (
            "Hi! Ask me for a beer, cocktail, food pairing, budget choice, "
            "or today's special."
        )
    if any(
        phrase in query
        for phrase in ("non-alcohol", "without alcohol", "mocktail", "virgin")
    ):
        return (
            "Try a Virgin Mojitoâ€”lime, mint, sugar and soda, with no alcohol. "
            "Ask the team about today's fresh mocktail options too."
        )
    if any(
        word in query
        for word in ("special", "offer", "happy hour", "today")
    ):
        return (
            "Today's picks are the Lager Beer with Chicken Wings, or a Mojito "
            "with the Pub Burger. Check the offers section for happy-hour prices."
        )
    if any(
        phrase in query
        for phrase in ("pair", "with beer", "food", "drink")
    ):
        return (
            "Chicken Wings pair best with Lager Beer; the crisp lager balances "
            "the spice. For something filling, choose the Pub Burger."
        )
    if any(
        word in query
        for word in ("cocktail", "mojito", "margarita")
    ):
        return (
            "For something fresh, choose the Mojito (â‚¹280). For a stronger "
            "citrus profile, try the Margarita (â‚¹350)."
        )
    if "beer" in query or "lager" in query:
        return (
            "I recommend the Lager Beer (â‚¹220): crisp, refreshing, and an easy "
            "match with Chicken Wings or the Pub Burger."
        )
    if "spicy" in query or "wing" in query:
        return (
            "Choose the Chicken Wings (â‚¹320). They are the spicy snack pick and "
            "pair especially well with a cold Lager Beer."
        )
    if any(word in query for word in ("burger", "filling", "hungry")):
        return (
            "The Pub Burger (â‚¹420) is the most filling choice. Pair it with "
            "Lager Beer, or a Mojito for something fresh."
        )
    if "vegetarian" in query or "veg" in query:
        return (
            "Vegetarian availability can change. Ask the floor team for today's "
            "veg snacks; fries and selected starters are usually quick options."
        )

    menu = [
        ("Lager Beer", 220),
        ("Mojito", 280),
        ("Chicken Wings", 320),
        ("Margarita", 350),
        ("Grilled Chicken", 380),
        ("Pub Burger", 420),
    ]
    budget_match = re.search(
        r"(?:under|below|within|budget)\s*â‚¹?\s*(\d+)",
        query,
    )
    if budget_match:
        budget = int(budget_match.group(1))
        choices = [
            f"{name} (â‚¹{price})"
            for name, price in menu
            if price <= budget
        ]
        return (
            f"Within â‚¹{budget}, you can choose {', '.join(choices)}."
            if choices
            else (
                f"I do not have a listed item below â‚¹{budget}. "
                "Ask the team about small snacks or current offers."
            )
        )
    if "price" in query or "cost" in query or "menu" in query:
        return (
            "Popular prices: Lager Beer â‚¹220, Mojito â‚¹280, Chicken Wings â‚¹320, "
            "Margarita â‚¹350, Grilled Chicken â‚¹380, and Pub Burger â‚¹420."
        )

    return (
        "I can help with beer and cocktail recommendations, food pairings, "
        "prices, dietary choices, and today's specials. Try asking "
        "'What can I get under â‚¹350?'"
    )


@app.get("/")
def root() -> dict[str, str]:
    return {
        "message": "Alleppey Pub ERP API and database are running.",
        "docs": "Open http://127.0.0.1:8000/docs",
    }


@app.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "Alleppey Pub ERP API",
    }


@app.get("/api/health")
def api_health() -> dict[str, str]:
    return health()


def serialize_menu_item(item: MenuItem) -> dict[str, Any]:
    return {
        "id": item.id,
        "image": item.image,
        "name": item.name,
        "description": item.description,
        "category": item.category,
        "price": item.price,
        "status": item.status,
    }


def serialize_inventory_item(item: InventoryItem) -> dict[str, Any]:
    return {
        "id": item.id,
        "name": item.name,
        "category": item.category,
        "currentStock": item.current_stock,
        "unit": item.unit,
        "minimumStock": item.minimum_stock,
        "costPerUnit": item.cost_per_unit,
        "supplier": item.supplier,
        "notes": item.notes,
    }


def serialize_order(order: Order) -> dict[str, Any]:
    created_at = order.created_at or datetime.now(timezone.utc)
    return {
        "id": order.id,
        "customer": order.customer,
        "phone": order.phone,
        "table": order.table,
        "type": (
            f"Dine-in Â· Table {order.table}"
            if order.order_type.lower().startswith("dine")
            else order.order_type
        ),
        "orderType": order.order_type,
        "payment": order.payment,
        "items": [
            {
                "id": item.menu_item_id or item.id,
                "name": item.name,
                "description": item.description,
                "image": item.image,
                "price": item.price,
                "qty": item.quantity,
                "quantity": item.quantity,
            }
            for item in order.items
        ],
        "itemCount": sum(item.quantity for item in order.items),
        "subtotal": order.subtotal,
        "discount": order.discount,
        "coupon": order.coupon,
        "gst": order.gst,
        "gstRate": order.gst_rate,
        "serviceCharge": order.service_charge,
        "total": order.total,
        "notes": order.notes,
        "status": order.status,
        "date": created_at.isoformat(),
        "createdAt": created_at.isoformat(),
    }


def serialize_bill(bill: Bill) -> dict[str, Any]:
    created_at = bill.created_at or datetime.now(timezone.utc)
    return {
        "id": bill.id,
        "orderId": bill.order_id,
        "customer": bill.customer,
        "table": bill.table,
        "orderType": bill.order_type,
        "items": [
            {
                "id": item.source_item_id or item.id,
                "name": item.name,
                "price": item.price,
                "quantity": item.quantity,
                "qty": item.quantity,
                "notes": item.notes,
            }
            for item in bill.items
        ],
        "subtotal": bill.subtotal,
        "discount": bill.discount,
        "gst": bill.gst,
        "serviceCharge": bill.service_charge,
        "total": bill.total,
        "paymentMethod": bill.payment_method,
        "paymentStatus": bill.payment_status,
        "notes": bill.notes,
        "createdAt": created_at.isoformat(),
    }


def commit_or_conflict(db: Session, message: str) -> None:
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(status_code=409, detail=message) from error


@app.get("/api/menu")
def list_menu(db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    items = db.scalars(select(MenuItem).order_by(MenuItem.id)).all()
    return [serialize_menu_item(item) for item in items]


@app.post("/api/menu", status_code=status.HTTP_201_CREATED)
def create_menu_item(
    payload: MenuItemPayload,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    item = MenuItem(**payload.model_dump())
    db.add(item)
    commit_or_conflict(db, "A menu item with this name already exists.")
    db.refresh(item)
    return serialize_menu_item(item)


@app.put("/api/menu/{item_id}")
def update_menu_item(
    item_id: int,
    payload: MenuItemPayload,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    item = db.get(MenuItem, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Menu item not found.")
    for field, value in payload.model_dump().items():
        setattr(item, field, value)
    commit_or_conflict(db, "A menu item with this name already exists.")
    db.refresh(item)
    return serialize_menu_item(item)


@app.delete("/api/menu/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_menu_item(item_id: int, db: Session = Depends(get_db)) -> Response:
    item = db.get(MenuItem, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Menu item not found.")
    db.delete(item)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.get("/api/inventory")
def list_inventory(db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    items = db.scalars(select(InventoryItem).order_by(InventoryItem.id)).all()
    return [serialize_inventory_item(item) for item in items]


@app.post("/api/inventory", status_code=status.HTTP_201_CREATED)
def create_inventory_item(
    payload: InventoryItemPayload,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    item = InventoryItem(
        name=payload.name,
        category=payload.category,
        current_stock=payload.currentStock,
        unit=payload.unit,
        minimum_stock=payload.minimumStock,
        cost_per_unit=payload.costPerUnit,
        supplier=payload.supplier,
        notes=payload.notes,
    )
    db.add(item)
    commit_or_conflict(db, "An inventory item with this name already exists.")
    db.refresh(item)
    return serialize_inventory_item(item)


@app.put("/api/inventory/{item_id}")
def update_inventory_item(
    item_id: int,
    payload: InventoryItemPayload,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    item = db.get(InventoryItem, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Inventory item not found.")
    item.name = payload.name
    item.category = payload.category
    item.current_stock = payload.currentStock
    item.unit = payload.unit
    item.minimum_stock = payload.minimumStock
    item.cost_per_unit = payload.costPerUnit
    item.supplier = payload.supplier
    item.notes = payload.notes
    commit_or_conflict(db, "An inventory item with this name already exists.")
    db.refresh(item)
    return serialize_inventory_item(item)


@app.delete("/api/inventory/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_inventory_item(item_id: int, db: Session = Depends(get_db)) -> Response:
    item = db.get(InventoryItem, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Inventory item not found.")
    db.delete(item)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


def generate_order_id(db: Session, requested_id: Any = None) -> str:
    if requested_id not in (None, ""):
        candidate = str(requested_id).strip()
        if candidate.isdigit():
            candidate = f"ORD-{candidate}"
        if db.get(Order, candidate) is None:
            return candidate

    existing_ids = db.scalars(select(Order.id)).all()
    largest = 1000
    for existing_id in existing_ids:
        match = re.search(r"(\d+)$", existing_id)
        if match:
            largest = max(largest, int(match.group(1)))
    return f"ORD-{largest + 1}"


@app.get("/api/orders")
def list_orders(db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    orders = db.scalars(select(Order).order_by(Order.created_at.desc())).all()
    return [serialize_order(order) for order in orders]


@app.post("/api/orders", status_code=status.HTTP_201_CREATED)
def create_order(
    payload: OrderPayload,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    order = Order(
        id=generate_order_id(db, payload.id),
        customer=payload.customer,
        phone=payload.phone,
        table=str(payload.table),
        order_type=payload.orderType,
        payment=payload.payment,
        subtotal=payload.subtotal,
        discount=payload.discount,
        coupon=payload.coupon,
        gst=payload.gst,
        gst_rate=payload.gstRate,
        service_charge=payload.serviceCharge,
        total=payload.total,
        notes=payload.notes,
        status=payload.status,
        created_at=payload.createdAt or datetime.now(timezone.utc),
    )
    order.items = [
        OrderItem(
            menu_item_id=str(item.id or ""),
            name=item.name,
            description=item.description,
            image=item.image,
            price=item.price,
            quantity=item.qty or item.quantity,
        )
        for item in payload.items
    ]
    db.add(order)
    commit_or_conflict(db, "An order with this ID already exists.")
    db.refresh(order)
    return serialize_order(order)


@app.get("/api/orders/{order_id}")
def get_order(order_id: str, db: Session = Depends(get_db)) -> dict[str, Any]:
    order = db.get(Order, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found.")
    return serialize_order(order)


@app.patch("/api/orders/{order_id}/status")
def update_order_status(
    order_id: str,
    payload: OrderStatusPayload,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    order = db.get(Order, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found.")
    order.status = payload.status
    db.commit()
    db.refresh(order)
    return serialize_order(order)


@app.delete("/api/orders/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(order_id: str, db: Session = Depends(get_db)) -> Response:
    order = db.get(Order, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found.")
    db.delete(order)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


def generate_bill_id(db: Session, requested_id: Any = None) -> str:
    if requested_id not in (None, ""):
        candidate = str(requested_id).strip()
        if candidate.isdigit():
            candidate = f"BILL-{candidate}"
        if db.get(Bill, candidate) is None:
            return candidate

    existing_ids = db.scalars(select(Bill.id)).all()
    largest = 5000
    for existing_id in existing_ids:
        match = re.search(r"(\d+)$", existing_id)
        if match:
            largest = max(largest, int(match.group(1)))
    return f"BILL-{largest + 1}"


def apply_bill_payload(bill: Bill, payload: BillPayload) -> None:
    bill.customer = payload.customer
    bill.table = str(payload.table)
    bill.order_type = payload.orderType
    bill.subtotal = payload.subtotal
    bill.discount = payload.discount
    bill.gst = payload.gst
    bill.service_charge = payload.serviceCharge
    bill.total = payload.total
    bill.payment_method = payload.paymentMethod
    bill.payment_status = payload.paymentStatus
    bill.notes = payload.notes
    bill.items = [
        BillItem(
            source_item_id=str(item.id or ""),
            name=item.name,
            price=item.price,
            quantity=item.qty or item.quantity,
            notes=item.notes,
        )
        for item in payload.items
    ]


@app.get("/api/bills")
def list_bills(db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    bills = db.scalars(select(Bill).order_by(Bill.created_at.desc())).all()
    return [serialize_bill(bill) for bill in bills]


@app.get("/api/bills/{bill_id}")
def get_bill(bill_id: str, db: Session = Depends(get_db)) -> dict[str, Any]:
    bill = db.get(Bill, bill_id)
    if bill is None:
        raise HTTPException(status_code=404, detail="Bill not found.")
    return serialize_bill(bill)


@app.post("/api/bills")
def save_bill(
    payload: BillPayload,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    order_id = payload.orderId.strip()
    bill = db.scalar(select(Bill).where(Bill.order_id == order_id))

    if bill is None:
        bill = Bill(
            id=generate_bill_id(db, payload.id),
            order_id=order_id,
            created_at=payload.createdAt or datetime.now(timezone.utc),
        )
        db.add(bill)

    apply_bill_payload(bill, payload)

    order = db.get(Order, order_id)
    if order is not None and payload.paymentStatus.lower() == "paid":
        order.status = "Completed"

    commit_or_conflict(db, "A bill already exists for this order.")
    db.refresh(bill)
    return serialize_bill(bill)


@app.delete("/api/bills/{bill_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bill(bill_id: str, db: Session = Depends(get_db)) -> Response:
    bill = db.get(Bill, bill_id)
    if bill is None:
        raise HTTPException(status_code=404, detail="Bill not found.")
    db.delete(bill)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.post("/api/ai/analyse")
def analytics_endpoint(payload: dict[str, Any]) -> dict[str, Any]:
    return analyse_business(payload)


@app.post("/api/ai/customer")
def customer_endpoint(payload: dict[str, Any]) -> dict[str, str]:
    question = text_value(payload.get("question"))
    if not question:
        raise HTTPException(status_code=400, detail="Please enter a question.")
    return {"answer": customer_answer(question)}


@app.post("/ask-ai")
def legacy_analytics_endpoint(payload: dict[str, Any]) -> dict[str, str]:
    result = analyse_business(payload)
    return {"answer": result["answer"]}