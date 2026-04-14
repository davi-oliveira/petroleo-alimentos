# API FastAPI - Lanchonete de Shopping

API para fluxo completo de pedidos de lanchonete:

1. Cliente faz pedido no totem.
2. Cliente paga o pedido.
3. Pedido pago vai para fila da cozinha.
4. Cozinha marca pedido como pronto.
5. Telão consulta pedidos prontos para chamar o cliente.

## Tecnologias

- FastAPI
- SQLAlchemy 2
- SQLite
- JWT (OAuth2 Password Flow)
- Swagger/OpenAPI (nativo do FastAPI)

## Estrutura

```text
app/
  api/
    routes/
      auth.py
      orders.py
      kitchen.py
      display.py
    router.py
  core/
    config.py
    security.py
  db/
    session.py
    init_db.py
  schemas/
    auth.py
    order.py
  services/
    order_service.py
  models.py
  main.py
```

## Como executar

1. Criar ambiente virtual:

```bash
python -m venv .venv
```

2. Ativar ambiente virtual (PowerShell):

```bash
.\.venv\Scripts\Activate.ps1
```

3. Instalar dependencias:

```bash
pip install -r requirements.txt
```

4. (Opcional) Criar arquivo `.env` com base em `.env.example`.

5. Iniciar a API:

```bash
uvicorn app.main:app --reload
```

## Documentacao Swagger

- Swagger UI: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc
- OpenAPI JSON: http://127.0.0.1:8000/openapi.json

## Testes automatizados

Executar os testes com pytest:

```bash
pytest -q
```

Os testes cobrem:

- Health check
- Fluxo ponta a ponta do pedido (totem -> pagamento -> cozinha -> pronto -> entregue)
- Controle de acesso por perfil (cliente sem acesso a cozinha)
- Validacao de regra de negocio (nao permite pagar pedido duas vezes)

Arquivos de teste:

- tests/conftest.py
- tests/test_api_flow.py

## Docker

### Build e execucao com Dockerfile

```bash
docker build -t food-api .
docker run --rm -p 8000:8000 food-api
```

### Execucao com docker-compose

```bash
docker compose up --build
```

Depois acesse:

- API: http://127.0.0.1:8000
- Swagger: http://127.0.0.1:8000/docs

## Autenticacao JWT

Fluxo:

1. Fazer login em `/auth/login` com `username` e `password` (form-data).
2. Copiar `access_token` retornado.
3. Enviar header: `Authorization: Bearer <token>` nas rotas protegidas.

Usuarios padrao criados no startup (altere em producao):

- admin / admin123 (ADMIN)
- totem / totem123 (CUSTOMER)
- cozinha / cozinha123 (KITCHEN)
- painel / painel123 (DISPLAY)

## Regras de negocio

- Pedido novo inicia em `AWAITING_PAYMENT`.
- Quando pago, muda para `PAID` e entra no fluxo da cozinha.
- Cozinha pode mover para `IN_PREPARATION` e depois `READY`.
- Telao exibe pedidos `IN_PREPARATION` e `READY`.
- Cozinha pode finalizar entrega com `DELIVERED`.

## Rotas

### Sistema

- `GET /health` - Health check

### Autenticacao

- `POST /auth/register` - Cadastra cliente (CUSTOMER)
- `POST /auth/login` - Gera token JWT

### Totem / Cliente

- `POST /orders` - Criar pedido
- `GET /orders/{order_id}` - Consultar pedido
- `POST /orders/{order_id}/pay` - Pagar pedido

### Cozinha

- `GET /kitchen/orders` - Lista pedidos pagos/em preparo
- `POST /kitchen/orders/{order_id}/start` - Inicia preparo
- `POST /kitchen/orders/{order_id}/ready` - Marca como pronto
- `POST /kitchen/orders/{order_id}/deliver` - Marca como entregue

### Telao

- `GET /display/orders/ready` - Lista pedidos em preparo e prontos para acompanhamento/chamada

## Exemplo rapido de uso

1. Login do totem:

```bash
curl -X POST "http://127.0.0.1:8000/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=totem&password=totem123"
```

2. Criar pedido:

```bash
curl -X POST "http://127.0.0.1:8000/orders" \
  -H "Authorization: Bearer TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Carlos",
    "items": [
      {"name": "X-Burger", "quantity": 2, "unit_price": 20.0},
      {"name": "Refrigerante", "quantity": 1, "unit_price": 8.0}
    ]
  }'
```

3. Pagar pedido:

```bash
curl -X POST "http://127.0.0.1:8000/orders/1/pay" \
  -H "Authorization: Bearer TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{"payment_method": "PIX"}'
```

4. Cozinha marca pronto e telao consulta pedidos prontos.

## Boas praticas aplicadas

- Separacao por camadas (rotas, servicos, schemas, seguranca, persistencia)
- Validacao com Pydantic
- Controle de permissao por papeis (RBAC)
- Estados de pedido com enum e transicoes validadas
- OpenAPI e Swagger automaticos


python -m uvicorn app.main:app --reload