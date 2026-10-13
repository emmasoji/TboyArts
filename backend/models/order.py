from decimal import Decimal
from typing import List, Literal, Optional

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
    receiver_address_code: int = Field(gt=0)
    shipping_courier_id: str = Field(min_length=1, max_length=100)
    shipping_service_code: str = Field(min_length=1, max_length=100)
    shipping_rate_amount: Decimal = Field(ge=0)
    delivery_instructions: str = Field(default="", max_length=500)
    payment_currency: Literal["NGN", "USD"] = "NGN"


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
    payment_amount: float = 0
    payment_currency: str = "NGN"
    payment_exchange_rate: float = 1
    customer: CustomerDetails
    items: List[OrderItem]
    status: str
    payment_status: str = "pending"
    payment_reference: Optional[str] = None
