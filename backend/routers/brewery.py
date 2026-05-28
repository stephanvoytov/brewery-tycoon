from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import GameState, Brewery, User
from backend.schemas import BrewerySchema, UpgradeBreweryRequest, RenameBreweryRequest
from backend.config import UpgradeCosts
from backend.dependencies import get_current_user, resolve_game

ACHIEVEMENT_UPGRADE_DISCOUNT = 0.1

router = APIRouter(prefix="/api/brewery", tags=["brewery"])

UPGRADE_COSTS = {
    "tanks": UpgradeCosts.TANKS,
    "fermenters": UpgradeCosts.FERMENTERS,
    "storage": UpgradeCosts.STORAGE,
    "taproom": UpgradeCosts.TAPROOM,
    "marketing": UpgradeCosts.MARKETING,
}


@router.get("/")
def get_brewery(game_id: int = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    game = resolve_game(game_id, current_user, db)
    brewery = db.query(Brewery).filter(Brewery.game_state_id == game.id).first()
    if not brewery:
        raise HTTPException(404, "Пивоварня не найдена")
    return brewery


def _get_upgrade_discount(game) -> float:
    achievements = game.achievements or []
    discount = 0.0
    if "first_upgrade" in achievements:
        discount += ACHIEVEMENT_UPGRADE_DISCOUNT
    return discount

@router.post("/upgrade")
def upgrade_brewery(req: UpgradeBreweryRequest, game_id: int = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    game = resolve_game(game_id, current_user, db)
    brewery = db.query(Brewery).filter(Brewery.game_state_id == game.id).first()
    if not brewery:
        raise HTTPException(404, "Пивоварня не найдена")

    discount = _get_upgrade_discount(game)
    def apply_cost(base_cost):
        final_cost = int(base_cost * (1 - discount))
        if game.money < final_cost:
            raise HTTPException(400, f"Недостаточно средств. Нужно ${final_cost}")
        game.money -= final_cost
        return final_cost

    upgrade_type = req.upgrade_type
    if upgrade_type == "tanks":
        current = brewery.tank_count
        next_level = current + 1
        base_cost = UPGRADE_COSTS["tanks"].get(next_level, 999999)
        cost = apply_cost(base_cost)
        brewery.tank_count = next_level
        db.commit()
        return {"message": f"Варочных котлов теперь {next_level}", "cost": cost, "base_cost": base_cost}

    elif upgrade_type == "fermenters":
        current = brewery.fermenter_count
        upgrade_map = {4: 6, 6: 8, 8: 10}
        next_val = upgrade_map.get(current)
        if not next_val:
            raise HTTPException(400, "Максимальный уровень")
        base_cost = UPGRADE_COSTS["fermenters"].get(current, 999999)
        cost = apply_cost(base_cost)
        brewery.fermenter_count = next_val
        db.commit()
        return {"message": f"Ферментеров теперь {next_val}", "cost": cost, "base_cost": base_cost}

    elif upgrade_type == "storage":
        current = brewery.storage_capacity
        upgrade_map = {1000: 2000, 2000: 4000, 4000: 8000}
        next_val = upgrade_map.get(current)
        if not next_val:
            raise HTTPException(400, "Максимальный уровень")
        base_cost = UPGRADE_COSTS["storage"].get(current, 999999)
        cost = apply_cost(base_cost)
        brewery.storage_capacity = next_val
        db.commit()
        return {"message": f"Вместимость хранилища: {next_val}л", "cost": cost, "base_cost": base_cost}

    elif upgrade_type == "taproom":
        current = brewery.taproom_level
        next_level = current + 1
        base_cost = UPGRADE_COSTS["taproom"].get(next_level, 999999)
        cost = apply_cost(base_cost)
        brewery.taproom_level = next_level
        brewery.has_taproom = True
        db.commit()
        return {"message": f"Тапрум улучшен до уровня {next_level}", "cost": cost, "base_cost": base_cost}

    elif upgrade_type == "marketing":
        current = brewery.marketing_level
        next_level = current + 1
        base_cost = UPGRADE_COSTS["marketing"].get(next_level, 999999)
        cost = apply_cost(base_cost)
        brewery.marketing_level = next_level
        db.commit()
        return {"message": f"Маркетинг улучшен до уровня {next_level}", "cost": cost, "base_cost": base_cost}

    raise HTTPException(400, f"Неизвестный тип улучшения: {upgrade_type}")


@router.post("/rename")
def rename_brewery(req: RenameBreweryRequest, game_id: int = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    game = resolve_game(game_id, current_user, db)
    brewery = db.query(Brewery).filter(Brewery.game_state_id == game.id).first()
    if not brewery:
        raise HTTPException(404, "Пивоварня не найдена")
    if not req.name or len(req.name.strip()) < 1:
        raise HTTPException(400, "Название не может быть пустым")
    brewery.name = req.name.strip()
    db.commit()
    return {"message": f"Пивоварня переименована в «{brewery.name}»", "name": brewery.name}
