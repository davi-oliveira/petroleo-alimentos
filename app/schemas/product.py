from pydantic import BaseModel, Field


class ProductResponse(BaseModel):
    id: int
    name: str
    description: str | None
    price: float
    category: str
    emoji: str | None
    is_available: bool

    class Config:
        from_attributes = True


class ProductCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=500)
    price: float = Field(gt=0)
    category: str = Field(min_length=1, max_length=60)
    emoji: str | None = Field(default=None, max_length=10)
    is_available: bool = True


class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = None
    price: float | None = Field(default=None, gt=0)
    category: str | None = Field(default=None, min_length=1, max_length=60)
    emoji: str | None = None
    is_available: bool | None = None
