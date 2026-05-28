from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import GameState, Brewery
from backend.schemas import BrewerySchema, UpgradeBreweryRequest
from backend.config import UpgradeCosts

router = APIRouter(prefix="/api/brewery", tags=["brewery"])

UPGRADE_COSTS = {
    "tanks": UpgradeCosts.TANKS,
    "fermenters": UpgradeCosts.FERMENTERS,
    "storage": UpgradeCosts.STORAGE,
    "taproom": UpgradeCosts.TAPROOM,
    "marketing": UpgradeCosts.MARKETING,
}


@router.get("/")
def get_brewery(game_id: int, db: Session = Depends(get_db)):
    brewery = db.query(Brewery).filter(Brewery.game_state_id == game_id).first()
    if not brewery:
        raise HTTPException(404, "Пивоварня не найдена")
    return brewery


@router.post("/upgrade")
def upgrade_brewery(game_id: int, req: UpgradeBreweryRequest, db: Session = Depends(get_db)):
    game = db.query(GameState).filter(GameState.id == game_id).first()
    brewery = db.query(Brewery).filter(Brewery.game_state_id == game_id).first()
    if not game or not brewery:
        raise HTTPException(404, "Игра или пивоварня не найдена")

    upgrade_type = req.upgrade_type
    if upgrade_type == "tanks":
        current = brewery.tank_count
        next_level = current + 1
        cost = UPGRADE_COSTS["tanks"].get(next_level, 999999)
        if game.money < cost:
            raise HTTPException(400, "Недостаточно средств")
        game.money -= cost
        brewery.tank_count = next_level
        return {"message": f"Варочных котлов теперь {next_level}", "cost": cost}

    elif upgrade_type == "fermenters":
        current = brewery.fermenter_count
        upgrade_map = {4: 6, 6: 8, 8: 10}
        next_val = upgrade_map.get(current)
        if not next_val:
            raise HTTPException(400, "Максимальный уровень")
        cost = UPGRADE_COSTS["fermenters"].get(current, 999999)
        if game.money < cost:
            raise HTTPException(400, "Недостаточно средств")
        game.money -= cost
        brewery.fermenter_count = next_val
        return {"message": f"Ферментеров теперь {next_val}", "cost": cost}

    elif upgrade_type == "storage":
        current = brewery.storage_capacity
        upgrade_map = {1000: 2000, 2000: 4000, 4000: 8000}
        next_val = upgrade_map.get(current)
        if not next_val:
            raise HTTPException(400, "Максимальный уровень")
        cost = UPGRADE_COSTS["storage"].get(current, 999999)
        if game.money < cost:
            raise HTTPException(400, "Недостаточно средств")
        game.money -= cost
        brewery.storage_capacity = next_val
        return {"message": f"Вместимость хранилища: {next_val}л", "cost": cost}

    elif upgrade_type == "taproom":
        current = brewery.taproom_level
        next_level = current + 1
        cost = UPGRADE_COSTS["taproom"].get(next_level, 999999)
        if game.money < cost:
            raise HTTPException(400, "Недостаточно средств")
        game.money -= cost
        brewery.taproom_level = next_level
        brewery.has_taproom = True
        return {"message": f"Тапрум улучшен до уровня {next_level}", "cost": cost}

    elif upgrade_type == "marketing":
        current = brewery.marketing_level
        next_level = current + 1
        cost = UPGRADE_COSTS["marketing"].get(next_level, 999999)
        if game.money < cost:
            raise HTTPException(400, "Недостаточно средств")
        game.money -= cost
        brewery.marketing_level = next_level
        return {"message": f"Маркетинг улучшен до уровня {next_level}", "cost": cost}

    raise HTTPException(400, f"Неизвестный тип улучшения: {upgrade_type}")
