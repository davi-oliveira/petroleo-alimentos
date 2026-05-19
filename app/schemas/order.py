from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.models import OrderStatus


class OrderItem(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    quantity: int = Field(ge=1, le=50)
    unit_price: float = Field(gt=0)


class OrderCreate(BaseModel):
    customer_name: str | None = Field(default=None, max_length=120)
    items: list[OrderItem] = Field(min_length=1)


class PaymentRequest(BaseModel):
    payment_method: str = Field(min_length=3, max_length=30)


class OrderResponse(BaseModel):
    id: int
    code: str
    customer_name: str | None
    items: list[OrderItem]
    total_amount: float
    status: OrderStatus
    payment_method: str | None
    paid_at: datetime | None
    created_at: datetime
    updated_at: datetime

    @field_validator("total_amount")
    @classmethod
    def round_total(cls, value: float) -> float:
        return round(value, 2)

    class Config:
        from_attributes = True
