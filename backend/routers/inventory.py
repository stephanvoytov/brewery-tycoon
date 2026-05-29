from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import GameState, Ingredient, Equipment, Brewery, User, EquipmentType
from backend.schemas import BuyIngredientRequest, BuyEquipmentRequest
from backend.config import BulkDiscount, Buildings
from backend.dependencies import get_current_user, resolve_game
from backend.game_engine import get_available_equipment

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

    brewery = db.query(Brewery).filter(Brewery.game_state_id == game.id).first()
    bld = Buildings.LIST.get(brewery.building_id, Buildings.LIST[Buildings.DEFAULT_ID])

    all_eq = get_available_equipment(brewery.level)
    eq_def = next((e for e in all_eq if e["name"] == equip.name), None)
    if eq_def and brewery.level < eq_def["min_level"]:
        raise HTTPException(400, f"Требуется уровень {eq_def['min_level']} для покупки {equip.name}")

    forbidden = bld.get("forbidden_equipment_types", [])
    if equip.type.value in forbidden:
        raise HTTPException(400, "Это оборудование нельзя установить в текущем здании")

    game.money -= equip.price
    game.total_expenses += equip.price
    equip.is_owned = True

    db.commit()

    msg = f"Куплено: {equip.name} за {equip.price:.0f} {game.currency}"

    return {"message": msg, "cost": equip.price}
