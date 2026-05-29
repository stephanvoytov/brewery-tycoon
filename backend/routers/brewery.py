from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import GameState, Brewery, Equipment, User
from backend.schemas import BrewerySchema, UpgradeBreweryRequest, RenameBreweryRequest, ChangeBuildingRequest
from backend.config import UpgradeCosts, EquipmentWear, Buildings
from backend.dependencies import get_current_user, resolve_game
from backend.game_engine import get_available_equipment

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
        bld = Buildings.LIST[brewery.building_id]
        max_tanks = bld.get("max_tanks")
        if max_tanks is not None and brewery.tank_count >= max_tanks:
            raise HTTPException(400, f"В этом здании макс. {max_tanks} котёл(ов)")
        current = brewery.tank_count
        next_level = current + 1
        base_cost = UPGRADE_COSTS["tanks"].get(next_level, 999999)
        cost = apply_cost(base_cost)
        brewery.tank_count = next_level
        db.commit()
        return {"message": f"Варочных котлов теперь {next_level}", "cost": cost, "base_cost": base_cost}

    elif upgrade_type == "fermenters":
        bld = Buildings.LIST[brewery.building_id]
        max_ferm = bld.get("max_fermenters")
        if max_ferm is not None and brewery.fermenter_count >= max_ferm:
            raise HTTPException(400, f"В этом здании макс. {max_ferm} ферментер(ов)")
        current = brewery.fermenter_count
        next_val = current + 1
        if next_val > 10:
            raise HTTPException(400, "Максимальное количество ферментеров")
        base_cost = UPGRADE_COSTS["fermenters"].get(next_val, 999999)
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


@router.get("/equipment-list")
def get_equipment_list(game_id: int = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    game = resolve_game(game_id, current_user, db)
    brewery = db.query(Brewery).filter(Brewery.game_state_id == game.id).first()
    if not brewery:
        raise HTTPException(404, "Пивоварня не найдена")

    owned = db.query(Equipment).filter(
        Equipment.game_state_id == game.id,
        Equipment.is_owned == True
    ).all()
    owned_names = {e.name for e in owned}

    all_eq = get_available_equipment(brewery.level)
    result = []
    for i, eq in enumerate(all_eq):
        is_owned = eq["name"] in owned_names
        locked = not is_owned and eq["min_level"] > brewery.level
        result.append({
            "id": eq["name"],
            "name": eq["name"],
            "type": eq["type"].value,
            "price": eq["price"],
            "desc": eq["desc"],
            "min_level": eq["min_level"],
            "is_owned": is_owned,
            "locked": locked,
        })
    return result


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


@router.post("/buy-insurance")
def buy_insurance(game_id: int = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    game = resolve_game(game_id, current_user, db)
    if game.has_insurance:
        raise HTTPException(400, "Страховка уже активна")
    cost = EquipmentWear.INSURANCE_COST
    if game.money < cost:
        raise HTTPException(400, f"Недостаточно средств. Нужно ${cost}")
    game.money -= cost
    game.has_insurance = True
    db.commit()
    return {"message": f"Страховка куплена за ${cost}", "has_insurance": True}


@router.post("/equipment/{equipment_id}/repair")
def repair_equipment(equipment_id: int, game_id: int = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    game = resolve_game(game_id, current_user, db)
    eq = db.query(Equipment).filter(
        Equipment.id == equipment_id,
        Equipment.game_state_id == game.id,
        Equipment.is_owned == True
    ).first()
    if not eq:
        raise HTTPException(404, "Оборудование не найдено")
    if eq.wear_tear >= EquipmentWear.BROKEN_THRESHOLD:
        raise HTTPException(400, "Оборудование ещё не сломалось")
    repair_cost = int(eq.price * EquipmentWear.REPAIR_COST_RATIO)
    if game.money < repair_cost:
        raise HTTPException(400, f"Недостаточно средств. Ремонт стоит ${repair_cost}")
    game.money -= repair_cost
    eq.wear_tear = 100.0
    db.commit()
    return {"message": f"{eq.name} отремонтирован за ${repair_cost}", "wear_tear": eq.wear_tear}


@router.post("/change-building")
def change_building(req: ChangeBuildingRequest, game_id: int = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    game = resolve_game(game_id, current_user, db)
    brewery = db.query(Brewery).filter(Brewery.game_state_id == game.id).first()
    if not brewery:
        raise HTTPException(404, "Пивоварня не найдена")

    bld = Buildings.LIST.get(req.building_id)
    if not bld:
        raise HTTPException(400, "Здание не найдено")

    if brewery.level < bld["min_level"]:
        raise HTTPException(400, f"Требуется уровень пивоварни {bld['min_level']}")

    if brewery.building_id == req.building_id:
        raise HTTPException(400, "Вы уже в этом здании")

    # Calculate move cost
    owned_equip_count = db.query(Equipment).filter(
        Equipment.game_state_id == game.id,
        Equipment.is_owned == True
    ).count()

    move_cost = (
        bld["rent"] * Buildings.MOVE_COST_MULTIPLIER
        + brewery.tank_count * Buildings.MOVE_COST_PER_TANK
        + brewery.fermenter_count * Buildings.MOVE_COST_PER_FERMENTER
        + brewery.conditioning_tank_count * Buildings.MOVE_COST_PER_COND_TANK
        + (Buildings.MOVE_COST_TAPROOM if brewery.has_taproom else 0)
        + owned_equip_count * Buildings.MOVE_COST_PER_EQUIP
    )

    if game.money < move_cost:
        raise HTTPException(400, f"Недостаточно средств для переезда. Нужно ${move_cost}")

    # Apply building
    game.money -= move_cost
    game.total_expenses += move_cost
    brewery.building_id = req.building_id
    brewery.rent = bld["rent"]
    brewery.storage_capacity = max(brewery.storage_capacity, bld["storage"])
    brewery.tank_volume = max(brewery.tank_volume, bld["kettle_vol"])
    brewery.tank_count = max(brewery.tank_count, bld["tanks"])
    brewery.fermenter_count = max(brewery.fermenter_count, bld["fermenters"])
    brewery.conditioning_tank_count = max(brewery.conditioning_tank_count, bld.get("cond_tanks", 2))
    brewery.quality_bonus = bld["quality_bonus"]
    brewery.has_taproom = bld["taproom"]
    db.commit()

    return {"message": f"Переехали в «{bld['name']}» за ${move_cost}", "building_id": req.building_id, "cost": move_cost}
