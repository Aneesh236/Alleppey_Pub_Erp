"""Request validation models for the ERP REST API."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class MenuItemPayload(BaseModel):
    image: str = ""
    name: str = Field(min_length=1, max_length=120)
    description: str = ""
    category: str = Field(default="Food", min_length=1, max_length=80)
    price: float = Field(default=0, ge=0)
    status: str = "Available"


class InventoryItemPayload(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    category: str = "Supplies"
    currentStock: float = Field(default=0, ge=0)
    unit: str = "Piece"
    minimumStock: float = Field(default=0, ge=0)
    costPerUnit: float = Field(default=0, ge=0)
    supplier: str = "Not specified"
    notes: str = ""


class OrderItemPayload(BaseModel):
    id: Any = None
    name: str = "Menu Item"
    description: str = ""
    image: str = ""
    price: float = Field(default=0, ge=0)
    quantity: float = Field(default=1, gt=0)
    qty: float | None = Field(default=None, gt=0)


class OrderPayload(BaseModel):
    id: Any = None
    customer: str = "Walk-in Customer"
    phone: str = "Not provided"
    table: Any = "Takeaway"
    orderType: str = "Dine In"
    payment: str = "Not specified"
    items: list[OrderItemPayload] = []
    itemCount: float | None = None
    subtotal: float = Field(default=0, ge=0)
    discount: float = Field(default=0, ge=0)
    coupon: str = "None"
    gst: float = Field(default=0, ge=0)
    gstRate: float = Field(default=0.05, ge=0)
    serviceCharge: float = Field(default=0, ge=0)
    total: float = Field(default=0, ge=0)
    notes: str = "None"
    status: str = "Pending"
    date: str | None = None
    createdAt: datetime | None = None


class OrderStatusPayload(BaseModel):
    status: str = Field(min_length=1, max_length=40)

