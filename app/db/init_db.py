from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models import Base, User, UserRole


def create_tables(engine) -> None:
    Base.metadata.create_all(bind=engine)


def seed_users(db: Session) -> None:
    default_users = [
        ("admin", "admin123", UserRole.ADMIN),
        ("totem", "totem123", UserRole.CUSTOMER),
        ("cozinha", "cozinha123", UserRole.KITCHEN),
        ("painel", "painel123", UserRole.DISPLAY),
    ]

    for username, password, role in default_users:
        exists = db.query(User).filter(User.username == username).first()
        if exists:
            continue
        db.add(
            User(
                username=username,
                hashed_password=get_password_hash(password),
                role=role,
                is_active=True,
            )
        )

    db.commit()
