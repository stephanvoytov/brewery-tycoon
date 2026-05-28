from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import GameState, Ingredient, Equipment
from backend.schemas import BuyIngredientRequest, BuyEquipmentRequest

router = APIRouter(prefix="/api/inventory", tags=["inventory"])


@router.get("/")
def get_inventory(game_id: int, db: Session = Depends(get_db)):
    ingredients = db.query(Ingredient).filter(Ingredient.game_state_id == game_id).all()
    return ingredients


@router.post("/buy")
def buy_ingredient(game_id: int, req: BuyIngredientRequest, db: Session = Depends(get_db)):
    game = db.query(GameState).filter(GameState.id == game_id).first()
    ingredient = db.query(Ingredient).filter(
        Ingredient.id == req.ingredient_id,
        Ingredient.game_state_id == game_id
    ).first()

    if not game or not ingredient:
        raise HTTPException(404, "Игра или ингредиент не найден")

    cost = ingredient.unit_cost * req.quantity
    if game.money < cost:
        raise HTTPException(400, f"Недостаточно средств. Нужно ${cost:.0f}")

    game.money -= cost
    game.total_expenses += cost
    game.daily_expenses += cost
    ingredient.quantity += req.quantity
    db.commit()

    return {
        "message": f"Куплено {req.quantity} ед. {ingredient.name} за ${cost:.0f}",
        "cost": cost,
        "new_quantity": ingredient.quantity,
    }


@router.get("/equipment")
def get_equipment(game_id: int, db: Session = Depends(get_db)):
    equipment = db.query(Equipment).filter(Equipment.game_state_id == game_id).all()
    return equipment


@router.post("/equipment/buy")
def buy_equipment(game_id: int, req: BuyEquipmentRequest, db: Session = Depends(get_db)):
    game = db.query(GameState).filter(GameState.id == game_id).first()
    equip = db.query(Equipment).filter(
        Equipment.id == req.equipment_id,
        Equipment.game_state_id == game_id
    ).first()

    if not game or not equip:
        raise HTTPException(404, "Игра или оборудование не найдено")
    if equip.is_owned:
        raise HTTPException(400, "Оборудование уже приобретено")
    if game.money < equip.price:
        raise HTTPException(400, f"Недостаточно средств. Нужно ${equip.price:.0f}")

    game.money -= equip.price
    game.total_expenses += equip.price
    equip.is_owned = True
    db.commit()

    return {"message": f"Куплено: {equip.name} за ${equip.price:.0f}", "cost": equip.price}
