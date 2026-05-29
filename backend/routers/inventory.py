from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import GameState, Ingredient, Equipment, User
from backend.schemas import BuyIngredientRequest
from backend.config import BulkDiscount
from backend.dependencies import get_current_user, resolve_game

router = APIRouter(prefix="/api/inventory", tags=["inventory"])


@router.get("/")
def get_inventory(game_id: int = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    game = resolve_game(game_id, current_user, db)
    ingredients = db.query(Ingredient).filter(Ingredient.game_state_id == game.id).all()
    return ingredients


@router.post("/buy")
def buy_ingredient(req: BuyIngredientRequest, game_id: int = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    game = resolve_game(game_id, current_user, db)
    ingredient = db.query(Ingredient).filter(
        Ingredient.id == req.ingredient_id,
        Ingredient.game_state_id == game.id
    ).first()

    if not ingredient:
        raise HTTPException(404, "Ингредиент не найден")

    inflation_mult = game.inflation_multiplier or 1.0
    base_cost = ingredient.unit_cost * req.quantity * inflation_mult

    discount = 1.0
    if req.quantity >= BulkDiscount.TIER2_KG:
        discount = 1 - BulkDiscount.TIER2_DISCOUNT
    elif req.quantity >= BulkDiscount.TIER1_KG:
        discount = 1 - BulkDiscount.TIER1_DISCOUNT

    cost = round(base_cost * discount, 2)
    if game.money < cost:
        raise HTTPException(400, f"Недостаточно средств. Нужно ${cost:.0f}")

    game.money -= cost
    game.total_expenses += cost
    game.daily_expenses += cost
    ingredient.quantity += req.quantity
    db.commit()

    return {
        "message": f"Куплено {req.quantity} ед. {ingredient.name} за {cost:.0f} {game.currency}",
        "cost": cost,
        "new_quantity": ingredient.quantity,
    }


@router.get("/equipment")
def get_equipment(game_id: int = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    game = resolve_game(game_id, current_user, db)
    equipment = db.query(Equipment).filter(Equipment.game_state_id == game.id).all()
    return equipment


@router.post("/equipment/buy")
def buy_equipment(req: BuyEquipmentRequest, game_id: int = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    game = resolve_game(game_id, current_user, db)
    equip = db.query(Equipment).filter(
        Equipment.id == req.equipment_id,
        Equipment.game_state_id == game.id
    ).first()

    if not equip:
        raise HTTPException(404, "Оборудование не найдено")
    if equip.is_owned:
        raise HTTPException(400, "Оборудование уже приобретено")
    if game.money < equip.price:
        raise HTTPException(400, f"Недостаточно средств. Нужно ${equip.price:.0f}")

    game.money -= equip.price
    game.total_expenses += equip.price
    equip.is_owned = True
    db.commit()

    return {"message": f"Куплено: {equip.name} за {equip.price:.0f} {game.currency}", "cost": equip.price}
