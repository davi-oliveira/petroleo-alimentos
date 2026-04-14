from fastapi import APIRouter

from app.api.routes import auth, display, kitchen, orders

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(orders.router)
api_router.include_router(kitchen.router)
api_router.include_router(display.router)
