from fastapi import APIRouter, Depends
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.core.security import require_roles
from app.db.session import get_db
from app.models import Order, OrderStatus, User, UserRole
from app.schemas.order import OrderResponse
from app.services.order_service import (
    get_order_or_404,
    mark_as_delivered,
    mark_as_ready,
    start_preparation,
)

router = APIRouter(prefix="/kitchen", tags=["Cozinha"])


@router.get("/orders", response_model=list[OrderResponse])
def list_kitchen_orders(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.KITCHEN, UserRole.ADMIN)),
):
    return (
        db.query(Order)
        .filter(Order.status.in_([OrderStatus.PAID, OrderStatus.IN_PREPARATION]))
        .order_by(desc(Order.created_at))
        .all()
    )


@router.post("/orders/{order_id}/start", response_model=OrderResponse)
def start_order_preparation(
    order_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.KITCHEN, UserRole.ADMIN)),
):
    order = get_order_or_404(db, order_id)
    return start_preparation(db, order)


@router.post("/orders/{order_id}/ready", response_model=OrderResponse)
def mark_order_ready(
    order_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.KITCHEN, UserRole.ADMIN)),
):
    order = get_order_or_404(db, order_id)
    return mark_as_ready(db, order)


@router.post("/orders/{order_id}/deliver", response_model=OrderResponse)
def deliver_order(
    order_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.KITCHEN, UserRole.ADMIN)),
):
    order = get_order_or_404(db, order_id)
    return mark_as_delivered(db, order)
