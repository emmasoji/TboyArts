from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field


class CustomerDetails(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    phone: str = Field(min_length=7, max_length=30)
    address: str = Field(min_length=5, max_length=250)
    city: str = Field(default="", max_length=100)
    state: Optional[str] = Field(default=None, max_length=100)
    country: str = Field(default="Nigeria", max_length=100)


class CartItemRequest(BaseModel):
    artwork_id: str = Field(min_length=1)
    quantity: int = Field(default=1, ge=1, le=10)


class CreateOrderRequest(BaseModel):
    customer: CustomerDetails
    items: List[CartItemRequest] = Field(min_length=1)


class OrderItem(BaseModel):
    artwork_id: str
    title: str
    quantity: int
    unit_price: int
    subtotal: int


class OrderResponse(BaseModel):
    order_id: str
    reference: str
    amount: int
    shipping: int = 0
    tax: int = 0
    currency: str = "NGN"
    customer: CustomerDetails
    items: List[OrderItem]
    status: str
    payment_status: str = "pending"
    payment_reference: Optional[str] = None
