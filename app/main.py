from fastapi import FastAPI

from app.api.router import api_router
from app.core.config import settings
from app.db.init_db import create_tables, seed_users
from app.db.session import SessionLocal, engine

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=(
        "API para operacao de lanchonete em shopping: totem, pagamento, cozinha e telao."
    ),
)


@app.on_event("startup")
def on_startup() -> None:
    create_tables(engine)
    db = SessionLocal()
    try:
        seed_users(db)
    finally:
        db.close()


@app.get("/health", tags=["Sistema"])
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(api_router)
