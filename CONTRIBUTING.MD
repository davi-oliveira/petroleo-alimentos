# 🤝 Contributing Guide

Obrigado por considerar contribuir com o projeto **Petroleo Alimentos API**!
Este guia vai te ajudar a começar rapidamente e manter um padrão consistente no código.

---

## 📌 Como Contribuir

Você pode contribuir de várias formas:

* 🐛 Reportando bugs
* 💡 Sugerindo melhorias
* ✨ Implementando novas funcionalidades
* 🧪 Melhorando testes
* 📚 Melhorando a documentação

---

## 🚀 Setup do Ambiente

1. Faça um fork do repositório
2. Clone o projeto:

```bash
git clone https://github.com/davi-oliveira/petroleo-alimentos.git
cd petroleo-alimentos
```

3. Crie e ative o ambiente virtual:

```bash
python -m venv .venv
```

**Windows (PowerShell):**

```bash
.\.venv\Scripts\Activate.ps1
```

**Linux/macOS:**

```bash
source .venv/bin/activate
```

4. Instale as dependências:

```bash
pip install -r requirements.txt
```

5. Execute a aplicação:

```bash
uvicorn app.main:app --reload
```

---

## 🧪 Executando os Testes

Antes de enviar qualquer alteração, rode:

```bash
pytest -q
```

Certifique-se de que:

* Todos os testes passam
* Novas funcionalidades possuem testes

---

## 📐 Padrões de Código

Siga estas diretrizes:

### 🐍 Python

* Use **PEP 8**
* Prefira tipagem (`type hints`)
* Funções pequenas e objetivas
* Evite lógica de negócio nas rotas (use `services/`)

### 🏗️ Arquitetura

* `routes/` → apenas HTTP
* `services/` → regras de negócio
* `schemas/` → validação (Pydantic)
* `models.py` → ORM

### 🔐 Segurança

* Nunca commitar `.env`
* Nunca expor secrets
* Sempre usar autenticação nas rotas protegidas

---

## 🔄 Fluxo de Contribuição

1. Crie uma branch:

```bash
git checkout -b feat/minha-feature
```

2. Faça commits claros:

```bash
git commit -m "feat: adiciona endpoint de cancelamento de pedido"
```

### Convenção de commits:

* `feat:` nova funcionalidade
* `fix:` correção de bug
* `refactor:` refatoração
* `test:` testes
* `docs:` documentação
* `chore:` manutenção

3. Envie sua branch:

```bash
git push origin feat/minha-feature
```

4. Abra um Pull Request

---

## ✅ Checklist para Pull Request

Antes de abrir o PR:

* [ ] Código segue o padrão do projeto
* [ ] Testes passam
* [ ] Novos testes foram adicionados (se necessário)
* [ ] Documentação atualizada (se aplicável)
* [ ] Nenhum segredo foi commitado

---

## 🐛 Reportando Bugs

Abra uma issue contendo:

* Descrição clara do problema
* Passos para reproduzir
* Comportamento esperado vs atual
* Logs/prints (se possível)

---

## 💡 Sugestões de Feature

Para novas ideias:

* Explique o problema que resolve
* Descreva a solução proposta
* Se possível, sugira implementação

---

## 📜 Código de Conduta

* Seja respeitoso
* Feedbacks devem ser construtivos
* Colaboração acima de ego

---

## ❓ Dúvidas

Se tiver dúvidas, abra uma issue ou discussão no repositório.