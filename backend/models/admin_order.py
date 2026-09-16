from typing import Literal

from pydantic import BaseModel


OrderStatus = Literal[
    "pending",
    "processing",
    "shipping",
    "completed",
    "cancelled",
]


class UpdateOrderStatusRequest(BaseModel):
    status: OrderStatus
