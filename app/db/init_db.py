from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models import Base, Product, User, UserRole


def create_tables(engine) -> None:
    Base.metadata.create_all(bind=engine)


def seed_users(db: Session) -> None:
    default_users = [
        ("admin", "admin123", UserRole.ADMIN),
        ("totem", "totem123", UserRole.CUSTOMER),
        ("cozinha", "cozinha123", UserRole.KITCHEN),
        ("painel", "painel123", UserRole.DISPLAY),
        ("atendente", "atendente123", UserRole.CUSTOMER),
    ]
    for username, password, role in default_users:
        if db.query(User).filter(User.username == username).first():
            continue
        db.add(User(
            username=username,
            hashed_password=get_password_hash(password),
            role=role,
            is_active=True,
        ))
    db.commit()


def seed_products(db: Session) -> None:
    if db.query(Product).first():
        return

    products = [
        ("X-Burger", "Pão artesanal, blend 180g, queijo cheddar, alface e tomate", 25.90, "LANCHES", "🍔"),
        ("X-Bacon", "Pão brioche, blend 180g, bacon crocante e queijo prato", 29.90, "LANCHES", "🥓"),
        ("X-Salada", "Pão integral, frango grelhado, alface, tomate e maionese", 22.90, "LANCHES", "🥗"),
        ("Hot Dog Gourmet", "Pão macio, salsicha premium, mostarda e ketchup artesanal", 16.90, "LANCHES", "🌭"),
        ("Pizza Slice", "Fatia de pizza de mussarela com borda recheada de catupiry", 18.90, "LANCHES", "🍕"),
        ("Wrap de Frango", "Wrap com frango grelhado, queijo, alface e molho especial", 21.90, "LANCHES", "🌯"),
        ("Coca-Cola Lata", "Refrigerante gelado 350ml", 7.90, "BEBIDAS", "🥤"),
        ("Suco de Laranja", "Suco natural espremido na hora 300ml", 9.90, "BEBIDAS", "🍊"),
        ("Água Mineral", "Água sem gás 500ml gelada", 4.90, "BEBIDAS", "💧"),
        ("Milk Shake", "Milk shake cremoso 400ml — chocolate, morango ou baunilha", 16.90, "BEBIDAS", "🥛"),
        ("Limonada Suíça", "Limonada cremosa com leite condensado 400ml", 12.90, "BEBIDAS", "🍋"),
        ("Batata Frita", "Porção de batata frita crocante com sal e ervas 200g", 14.90, "ACOMPANHAMENTOS", "🍟"),
        ("Onion Rings", "Anéis de cebola empanados crocantes 150g", 13.90, "ACOMPANHAMENTOS", "🧅"),
        ("Nuggets 8un", "8 unidades de nuggets de frango crocantes com molho", 15.90, "ACOMPANHAMENTOS", "🍗"),
        ("Sorvete Casquinha", "Casquinha com 2 bolas de sorvete sabor à escolha", 8.90, "SOBREMESAS", "🍦"),
        ("Brownie com Sorvete", "Brownie de chocolate quente com sorvete de creme", 14.90, "SOBREMESAS", "🍫"),
        ("Cheesecake", "Fatia de cheesecake com calda de frutas vermelhas", 16.90, "SOBREMESAS", "🎂"),
    ]
    for name, description, price, category, emoji in products:
        db.add(Product(
            name=name,
            description=description,
            price=price,
            category=category,
            emoji=emoji,
            is_available=True,
        ))
    db.commit()
