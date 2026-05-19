from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Order, OrderStatus
from app.schemas.order import OrderResponse

router = APIRouter(prefix="/display", tags=["Telao"])

READY_DISPLAY_MINUTES = 5


@router.get("/orders/ready", response_model=list[OrderResponse])
def list_ready_orders(db: Session = Depends(get_db)):
    cutoff = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(minutes=READY_DISPLAY_MINUTES)

    return (
        db.query(Order)
        .filter(
            or_(
                Order.status == OrderStatus.IN_PREPARATION,
                and_(
                    Order.status == OrderStatus.READY,
                    Order.updated_at >= cutoff,
                ),
            )
        )
        .order_by(Order.updated_at)
        .all()
    )
