from sqlalchemy import desc
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import require_roles
from app.db.session import get_db
from app.models import Order, OrderStatus, User, UserRole
from app.schemas.order import OrderResponse

router = APIRouter(prefix="/display", tags=["Telao"])


@router.get("/orders/ready", response_model=list[OrderResponse])
def list_ready_orders(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.DISPLAY, UserRole.KITCHEN, UserRole.ADMIN)),
):
    return (
        db.query(Order)
        .filter(Order.status.in_([OrderStatus.IN_PREPARATION, OrderStatus.READY]))
        .order_by(desc(Order.updated_at))
        .all()
    )
