"""Local AI service for the Alleppey Pub & Bar ERP demo."""

from collections import Counter, defaultdict
import re
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(
    title="Alleppey Pub ERP AI",
    description="Local customer recommendations and business analytics.",
    version="2.0.0",
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
    return f"₹{value:,.0f}"


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
            "Try a Virgin Mojito—lime, mint, sugar and soda, with no alcohol. "
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
            "For something fresh, choose the Mojito (₹280). For a stronger "
            "citrus profile, try the Margarita (₹350)."
        )
    if "beer" in query or "lager" in query:
        return (
            "I recommend the Lager Beer (₹220): crisp, refreshing, and an easy "
            "match with Chicken Wings or the Pub Burger."
        )
    if "spicy" in query or "wing" in query:
        return (
            "Choose the Chicken Wings (₹320). They are the spicy snack pick and "
            "pair especially well with a cold Lager Beer."
        )
    if any(word in query for word in ("burger", "filling", "hungry")):
        return (
            "The Pub Burger (₹420) is the most filling choice. Pair it with "
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
        r"(?:under|below|within|budget)\s*₹?\s*(\d+)",
        query,
    )
    if budget_match:
        budget = int(budget_match.group(1))
        choices = [
            f"{name} (₹{price})"
            for name, price in menu
            if price <= budget
        ]
        return (
            f"Within ₹{budget}, you can choose {', '.join(choices)}."
            if choices
            else (
                f"I do not have a listed item below ₹{budget}. "
                "Ask the team about small snacks or current offers."
            )
        )
    if "price" in query or "cost" in query or "menu" in query:
        return (
            "Popular prices: Lager Beer ₹220, Mojito ₹280, Chicken Wings ₹320, "
            "Margarita ₹350, Grilled Chicken ₹380, and Pub Burger ₹420."
        )

    return (
        "I can help with beer and cocktail recommendations, food pairings, "
        "prices, dietary choices, and today's specials. Try asking "
        "'What can I get under ₹350?'"
    )


@app.get("/")
def root() -> dict[str, str]:
    return {
        "message": "Alleppey Pub ERP AI backend is running.",
        "docs": "Open http://127.0.0.1:8000/docs",
    }


@app.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "Alleppey Pub ERP AI",
    }


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
