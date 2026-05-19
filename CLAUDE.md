# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Backend (from repo root)
source .venv/bin/activate
uvicorn app.main:app --reload          # dev server
pytest -q                              # run tests

# Frontend (from frontend/)
npm run dev                            # dev server on :3000
npm run build                          # production build

# Docker (full stack)
docker compose up --build
```

## Architecture

### Backend (FastAPI + SQLAlchemy 2 + SQLite)

Layered structure — routes only do HTTP, all logic lives in services:

```
app/
  api/routes/      auth.py  orders.py  kitchen.py  display.py  products.py
  services/        order_service.py
  schemas/         auth.py  order.py  product.py
  models.py        User, Order, Product + utcnow() helper
  core/            config.py (pydantic-settings)  security.py (JWT + RBAC)
  db/              session.py  init_db.py (create_tables + seed)
```

**`utcnow()`** is defined in `models.py` and used everywhere datetimes are set — it returns naive UTC to stay compatible with SQLite's datetime storage.

### Frontend (Next.js 14, App Router)

```
frontend/src/app/
  page.tsx          Landing — role selector
  totem/            Self-service kiosk (auto-logins as totem/totem123)
  atendente/        Cashier interface (requires manual login)
  cozinha/          Kitchen dashboard (requires KITCHEN or ADMIN)
  telao/            Public display screen (no auth)
  login/            Shared login page
frontend/src/lib/
  api.ts            All API calls, token passed explicitly
  types.ts          Shared TypeScript types
```

## Order State Machine

Enforced in `app/services/order_service.py`:

```
AWAITING_PAYMENT → PAID → IN_PREPARATION → READY → DELIVERED
                              ↑____________/   (mark_as_ready accepts both)
```

## Auth & RBAC

JWT OAuth2 Password Flow. Login returns `{ access_token, token_type, role, username }`.

`require_roles(*roles)` dependency factory gates routes. Roles: `ADMIN CUSTOMER KITCHEN DISPLAY`.

Seed users (dev only):

| username   | password       | role     |
|------------|----------------|----------|
| admin      | admin123       | ADMIN    |
| totem      | totem123       | CUSTOMER |
| cozinha    | cozinha123     | KITCHEN  |
| painel     | painel123      | DISPLAY  |
| atendente  | atendente123   | CUSTOMER |

## Key Business Rules

- **Display (`/display/orders/ready`)**: public endpoint. Returns `IN_PREPARATION` + `READY` orders, but READY orders older than 5 minutes are excluded (SQL filter on `updated_at`).
- **Kitchen (`/kitchen/orders`)**: shows PAID, IN_PREPARATION, and READY orders sorted oldest-first (FIFO). KITCHEN or ADMIN role required.
- **Totem page**: auto-logins as `totem` user on mount; token is kept in component state only.
- **Telão page**: public, polls every 15s, shows countdown ring (SVG) for each READY order.

## Configuration (`.env`)

Copy `.env copy.example` → `.env`. Key vars: `SECRET_KEY`, `DATABASE_URL` (default `sqlite:///./food.db`), `CORS_ORIGINS`.

## Commit Convention

`feat:` / `fix:` / `refactor:` / `test:` / `docs:` / `chore:`
