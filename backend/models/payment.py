from pydantic import BaseModel, EmailStr, Field


class InitializePaymentRequest(BaseModel):
    order_id: str = Field(min_length=1)
    email: EmailStr
    payment_method: str = Field(min_length=1)


class VerifyPaymentResponse(BaseModel):
    success: bool
    reference: str
    status: str
    amount: int
    currency: str
    message: str
