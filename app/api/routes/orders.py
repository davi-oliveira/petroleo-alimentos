from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import get_current_user, require_roles
from app.db.session import get_db
from app.models import User, UserRole
from app.schemas.order import OrderCreate, OrderResponse, PaymentRequest
from app.services.order_service import create_order, get_order_or_404, mark_as_paid

router = APIRouter(prefix="/orders", tags=["Pedidos Totem"])


@router.post("", response_model=OrderResponse)
def create_new_order(
    order_in: OrderCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.CUSTOMER, UserRole.ADMIN)),
):
    return create_order(db, order_in)


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return get_order_or_404(db, order_id)


@router.post("/{order_id}/pay", response_model=OrderResponse)
def pay_order(
    order_id: int,
    payment: PaymentRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.CUSTOMER, UserRole.ADMIN)),
):
    order = get_order_or_404(db, order_id)
    return mark_as_paid(db, order, payment.payment_method)
