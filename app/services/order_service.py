from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import Order, OrderStatus
from app.schemas.order import OrderCreate


def calculate_total(order_in: OrderCreate) -> float:
    total = sum(item.quantity * item.unit_price for item in order_in.items)
    return round(total, 2)


def generate_order_code(order_id: int) -> str:
    return f"P{order_id:05d}"


def create_order(db: Session, order_in: OrderCreate) -> Order:
    order = Order(
        customer_name=order_in.customer_name,
        items=[item.model_dump() for item in order_in.items],
        total_amount=calculate_total(order_in),
        status=OrderStatus.AWAITING_PAYMENT,
        code="TEMP",
    )
    db.add(order)
    db.flush()

    order.code = generate_order_code(order.id)
    db.commit()
    db.refresh(order)
    return order


def get_order_or_404(db: Session, order_id: int) -> Order:
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Pedido nao encontrado."
        )
    return order


def mark_as_paid(db: Session, order: Order, payment_method: str) -> Order:
    if order.status != OrderStatus.AWAITING_PAYMENT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Somente pedidos aguardando pagamento podem ser pagos.",
        )

    order.status = OrderStatus.PAID
    order.payment_method = payment_method
    order.paid_at = datetime.utcnow()
    db.commit()
    db.refresh(order)
    return order


def start_preparation(db: Session, order: Order) -> Order:
    if order.status != OrderStatus.PAID:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Somente pedidos pagos podem iniciar preparo.",
        )

    order.status = OrderStatus.IN_PREPARATION
    db.commit()
    db.refresh(order)
    return order


def mark_as_ready(db: Session, order: Order) -> Order:
    if order.status not in {OrderStatus.PAID, OrderStatus.IN_PREPARATION}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Somente pedidos pagos ou em preparo podem ficar prontos.",
        )

    order.status = OrderStatus.READY
    db.commit()
    db.refresh(order)
    return order


def mark_as_delivered(db: Session, order: Order) -> Order:
    if order.status != OrderStatus.READY:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Somente pedidos prontos podem ser entregues.",
        )

    order.status = OrderStatus.DELIVERED
    db.commit()
    db.refresh(order)
    return order
