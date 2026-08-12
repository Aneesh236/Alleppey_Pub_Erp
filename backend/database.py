"""Database models and helpers for the Alleppey Pub ERP.

The app uses SQLite automatically for local development.  Set DATABASE_URL to
the PostgreSQL connection string supplied by Supabase when deploying.
"""

from __future__ import annotations

import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Generator

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, create_engine, select
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship, sessionmaker


BACKEND_DIR = Path(__file__).resolve().parent


def _database_url() -> str:
    configured = os.getenv("DATABASE_URL", "").strip()
    if not configured:
        return f"sqlite:///{BACKEND_DIR / 'erp.db'}"
    if configured.startswith("postgres://"):
        return configured.replace("postgres://", "postgresql+psycopg://", 1)
    if configured.startswith("postgresql://"):
        return configured.replace("postgresql://", "postgresql+psycopg://", 1)
    return configured


DATABASE_URL = _database_url()
CONNECT_ARGS = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=CONNECT_ARGS, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class MenuItem(Base):
    __tablename__ = "menu_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    image: Mapped[str] = mapped_column(String(500), default="")
    name: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    description: Mapped[str] = mapped_column(Text, default="")
    category: Mapped[str] = mapped_column(String(80), index=True)
    price: Mapped[float] = mapped_column(Float, default=0)
    status: Mapped[str] = mapped_column(String(40), default="Available")


class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    category: Mapped[str] = mapped_column(String(80), index=True)
    current_stock: Mapped[float] = mapped_column(Float, default=0)
    unit: Mapped[str] = mapped_column(String(40), default="Piece")
    minimum_stock: Mapped[float] = mapped_column(Float, default=0)
    cost_per_unit: Mapped[float] = mapped_column(Float, default=0)
    supplier: Mapped[str] = mapped_column(String(160), default="Not specified")
    notes: Mapped[str] = mapped_column(Text, default="")


class StaffUser(Base):
    __tablename__ = "staff_users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(
        String(80), unique=True, index=True
    )
    password_hash: Mapped[str] = mapped_column(String(500))
    role: Mapped[str] = mapped_column(String(40), index=True)
    display_name: Mapped[str] = mapped_column(String(120))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    actor_username: Mapped[str] = mapped_column(String(80), index=True)
    actor_role: Mapped[str] = mapped_column(String(40), index=True)
    action: Mapped[str] = mapped_column(String(80), index=True)
    entity_type: Mapped[str] = mapped_column(String(80), index=True)
    entity_id: Mapped[str] = mapped_column(String(80), default="")
    details: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    customer: Mapped[str] = mapped_column(String(120), default="Walk-in Customer")
    phone: Mapped[str] = mapped_column(String(40), default="Not provided")
    table: Mapped[str] = mapped_column(String(40), default="Takeaway")
    order_type: Mapped[str] = mapped_column(String(40), default="Dine In")
    payment: Mapped[str] = mapped_column(String(40), default="Not specified")
    subtotal: Mapped[float] = mapped_column(Float, default=0)
    discount: Mapped[float] = mapped_column(Float, default=0)
    coupon: Mapped[str] = mapped_column(String(60), default="None")
    gst: Mapped[float] = mapped_column(Float, default=0)
    gst_rate: Mapped[float] = mapped_column(Float, default=0.05)
    service_charge: Mapped[float] = mapped_column(Float, default=0)
    total: Mapped[float] = mapped_column(Float, default=0)
    notes: Mapped[str] = mapped_column(Text, default="None")
    status: Mapped[str] = mapped_column(String(40), default="Pending", index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )

    items: Mapped[list["OrderItem"]] = relationship(
        back_populates="order", cascade="all, delete-orphan", lazy="selectin"
    )


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    order_id: Mapped[str] = mapped_column(
        ForeignKey("orders.id", ondelete="CASCADE"), index=True
    )
    menu_item_id: Mapped[str] = mapped_column(String(40), default="")
    name: Mapped[str] = mapped_column(String(120))
    description: Mapped[str] = mapped_column(Text, default="")
    image: Mapped[str] = mapped_column(String(500), default="")
    price: Mapped[float] = mapped_column(Float, default=0)
    quantity: Mapped[float] = mapped_column(Float, default=1)

    order: Mapped[Order] = relationship(back_populates="items")


class Bill(Base):
    __tablename__ = "bills"

    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    order_id: Mapped[str] = mapped_column(
        String(40), unique=True, index=True
    )
    customer: Mapped[str] = mapped_column(
        String(120), default="Walk-in Customer"
    )
    table: Mapped[str] = mapped_column(String(40), default="Takeaway")
    order_type: Mapped[str] = mapped_column(String(40), default="Dine In")
    subtotal: Mapped[float] = mapped_column(Float, default=0)
    discount: Mapped[float] = mapped_column(Float, default=0)
    gst: Mapped[float] = mapped_column(Float, default=0)
    service_charge: Mapped[float] = mapped_column(Float, default=0)
    total: Mapped[float] = mapped_column(Float, default=0)
    payment_method: Mapped[str] = mapped_column(String(40), default="Cash")
    payment_status: Mapped[str] = mapped_column(
        String(40), default="Pending", index=True
    )
    notes: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )

    items: Mapped[list["BillItem"]] = relationship(
        back_populates="bill",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class BillItem(Base):
    __tablename__ = "bill_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    bill_id: Mapped[str] = mapped_column(
        ForeignKey("bills.id", ondelete="CASCADE"), index=True
    )
    source_item_id: Mapped[str] = mapped_column(String(40), default="")
    name: Mapped[str] = mapped_column(String(120), default="Billing Item")
    price: Mapped[float] = mapped_column(Float, default=0)
    quantity: Mapped[float] = mapped_column(Float, default=1)
    notes: Mapped[str] = mapped_column(Text, default="")

    bill: Mapped[Bill] = relationship(back_populates="items")


MENU_SEED = [
    (1, "../img/lager.jpeg", "Lager Beer", "Crisp premium lager served chilled.", "Beer", 220, "Available"),
    (2, "../img/mojito.jpeg", "Mojito", "Fresh mint, lime and soda.", "Cocktails", 350, "Available"),
    (3, "../img/burger.jpeg", "Pub Burger", "Signature burger served with fries.", "Food", 420, "Available"),
    (4, "../img/wings.jpeg", "Chicken Wings", "Crispy wings with house spicy sauce.", "Food", 390, "Available"),
    (5, "../img/margarita.jpeg", "Margarita", "Classic lime cocktail with a salted rim.", "Cocktails", 380, "Available"),
    (6, "../img/grill.jpeg", "Grilled Chicken", "Pub-style grilled chicken and vegetables.", "Food", 460, "Available"),
    (7, "../img/beer.jpeg", "House Beer", "Smooth and refreshing house beer.", "Beer", 250, "Available"),
    (8, "../img/wine.png", "Red Wine", "Rich house red wine with a smooth finish.", "Wine", 420, "Available"),
    (9, "../img/fries.png", "French Fries", "Golden fries served with ketchup.", "Snacks", 180, "Available"),
    (10, "../img/brownie.png", "Chocolate Brownie", "Warm brownie with vanilla ice cream.", "Desserts", 240, "Available"),
]

INVENTORY_SEED = [
    (1001, "Lager Beer", "Alcohol", 42, "Bottle", 15, 120, "Kerala Beverage Suppliers", "Premium bottled lager beer"),
    (1002, "Mojito Mint", "Ingredients", 5, "Kilogram", 8, 180, "Fresh Farm Produce", "Fresh mint used for mojito"),
    (1003, "Burger Buns", "Food", 25, "Piece", 10, 25, "Alleppey Bakery", "Burger buns for pub burgers"),
    (1004, "Chicken Wings", "Food", 18, "Kilogram", 8, 260, "Coastal Meat Suppliers", "Fresh chicken wings"),
    (1005, "Cheese Slices", "Ingredients", 6, "Packet", 7, 210, "Dairy Foods India", "Cheese slices for burgers"),
    (1006, "Whisky", "Alcohol", 0, "Bottle", 5, 950, "Kerala Beverage Suppliers", "Premium whisky bottles"),
    (1007, "French Fries", "Snacks", 14, "Kilogram", 6, 150, "Frozen Food Distributors", "Frozen potato fries"),
    (1008, "Paper Napkins", "Supplies", 12, "Packet", 10, 75, "Hospitality Supplies Kerala", "Dining table napkins"),
]


def get_db() -> Generator[Session, None, None]:
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def init_database() -> None:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as session:
        if session.scalar(select(MenuItem.id).limit(1)) is None:
            session.add_all(
                [
                    MenuItem(
                        id=item_id,
                        image=image,
                        name=name,
                        description=description,
                        category=category,
                        price=price,
                        status=status,
                    )
                    for item_id, image, name, description, category, price, status in MENU_SEED
                ]
            )
        if session.scalar(select(InventoryItem.id).limit(1)) is None:
            session.add_all(
                [
                    InventoryItem(
                        id=item_id,
                        name=name,
                        category=category,
                        current_stock=current_stock,
                        unit=unit,
                        minimum_stock=minimum_stock,
                        cost_per_unit=cost_per_unit,
                        supplier=supplier,
                        notes=notes,
                    )
                    for (
                        item_id,
                        name,
                        category,
                        current_stock,
                        unit,
                        minimum_stock,
                        cost_per_unit,
                        supplier,
                        notes,
                    ) in INVENTORY_SEED
                ]
            )
        session.commit()
