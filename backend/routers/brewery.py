from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import GameState, Brewery, BreweryKettle, BreweryFermenter, BreweryCondTank, Equipment, User
from backend.schemas import BrewerySchema, UpgradeBreweryRequest, RenameBreweryRequest, ChangeBuildingRequest
from backend.config import UpgradeCosts, EquipmentWear, Buildings, KettleTypes, FermenterTypes, CondTankTypes, SELL_REFUND_RATIO
from backend.dependencies import get_current_user, resolve_game
from backend.game_engine import get_available_equipment, get_kettle_count, get_fermenter_count, get_cond_tank_count, get_bld

ACHIEVEMENT_UPGRADE_DISCOUNT = 0.1

router = APIRouter(prefix="/api/brewery", tags=["brewery"])

UPGRADE_COSTS = {
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
    data = {c.name: getattr(brewery, c.name) for c in Brewery.__table__.columns}
    data["kettle_count"] = len(brewery.kettles)
    data["fermenter_count_actual"] = len(brewery.fermenters_list)
    data["cond_tank_count_actual"] = len(brewery.cond_tanks_list)
    data["kettles"] = [{"id": k.id, "type_id": k.type_id, **KettleTypes.LIST.get(k.type_id, {})} for k in brewery.kettles]
    data["fermenters"] = [{"id": f.id, "type_id": f.type_id, **FermenterTypes.LIST.get(f.type_id, {})} for f in brewery.fermenters_list]
    data["cond_tanks"] = [{"id": t.id, "type_id": t.type_id, **CondTankTypes.LIST.get(t.type_id, {})} for t in brewery.cond_tanks_list]
    return data


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
    if upgrade_type == "storage":
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

    bld = get_bld(brewery.building_id)
    forbidden_types = bld.get("forbidden_equipment_types", [])

    all_eq = get_available_equipment(brewery.level)
    result = []
    for i, eq in enumerate(all_eq):
        is_owned = eq["name"] in owned_names
        type_forbidden = eq["type"].value in forbidden_types
        locked = not is_owned and (eq["min_level"] > brewery.level or type_forbidden)
        if not is_owned and type_forbidden:
            continue
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


@router.get("/shop")
def get_shop(game_id: int = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    game = resolve_game(game_id, current_user, db)
    brewery = db.query(Brewery).filter(Brewery.game_state_id == game.id).first()
    if not brewery:
        raise HTTPException(404, "Пивоварня не найдена")

    bld = get_bld(brewery.building_id)
    lvl = brewery.level

    available_kettles = []
    for tid, t in KettleTypes.LIST.items():
        if lvl >= t["min_level"] and t["volume"] <= bld.get("max_kettle_vol", 9999):
            available_kettles.append({"id": tid, **t})

    available_fermenters = []
    for tid, t in FermenterTypes.LIST.items():
        if lvl >= t["min_level"] and t["volume"] <= bld.get("max_fermenter_vol", 9999):
            available_fermenters.append({"id": tid, **t})

    available_tanks = []
    if bld.get("max_cond_tanks", 0) > 0:
        for tid, t in CondTankTypes.LIST.items():
            if lvl >= t["min_level"] and t["volume"] <= bld.get("max_cond_vol", 9999):
                available_tanks.append({"id": tid, **t})

    return {
        "kettles": available_kettles,
        "fermenters": available_fermenters,
        "cond_tanks": available_tanks,
        "owned_kettles": [{"id": k.id, "type_id": k.type_id, "purchase_price": k.purchase_price, **KettleTypes.LIST[k.type_id]} for k in brewery.kettles],
        "owned_fermenters": [{"id": f.id, "type_id": f.type_id, "purchase_price": f.purchase_price, **FermenterTypes.LIST[f.type_id]} for f in brewery.fermenters_list],
        "owned_cond_tanks": [{"id": t.id, "type_id": t.type_id, "purchase_price": t.purchase_price, **CondTankTypes.LIST[t.type_id]} for t in brewery.cond_tanks_list],
    }


@router.post("/buy-kettle")
def buy_kettle(type_id: int, game_id: int = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    game = resolve_game(game_id, current_user, db)
    brewery = db.query(Brewery).filter(Brewery.game_state_id == game.id).first()
    if not brewery:
        raise HTTPException(404, "Пивоварня не найдена")

    kt = KettleTypes.LIST.get(type_id)
    if not kt:
        raise HTTPException(400, "Неизвестный тип котла")

    if brewery.level < kt["min_level"]:
        raise HTTPException(400, f"Требуется уровень {kt['min_level']} для покупки {kt['name']}")

    bld = get_bld(brewery.building_id)
    if kt["volume"] > bld.get("max_kettle_vol", 9999):
        raise HTTPException(400, f"В этом здании нельзя установить котёл >{bld['max_kettle_vol']}л")

    if len(brewery.kettles) >= bld.get("max_tanks", 999):
        raise HTTPException(400, f"В этом здании макс. {bld['max_tanks']} котёл(ов). Продайте лишний.")

    if game.money < kt["price"]:
        raise HTTPException(400, f"Недостаточно средств. Нужно ${kt['price']}")

    game.money -= kt["price"]
    game.total_expenses += kt["price"]
    db.add(BreweryKettle(brewery_id=brewery.id, type_id=type_id, purchase_price=kt["price"]))
    db.commit()
    return {"message": f"Куплен {kt['name']} за ${kt['price']}", "cost": kt["price"]}


@router.post("/buy-fermenter")
def buy_fermenter(type_id: int, game_id: int = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    game = resolve_game(game_id, current_user, db)
    brewery = db.query(Brewery).filter(Brewery.game_state_id == game.id).first()
    if not brewery:
        raise HTTPException(404, "Пивоварня не найдена")

    ft = FermenterTypes.LIST.get(type_id)
    if not ft:
        raise HTTPException(400, "Неизвестный тип ферментера")

    if brewery.level < ft["min_level"]:
        raise HTTPException(400, f"Требуется уровень {ft['min_level']} для покупки {ft['name']}")

    bld = get_bld(brewery.building_id)
    if ft["volume"] > bld.get("max_fermenter_vol", 9999):
        raise HTTPException(400, f"В этом здании нельзя установить ферментер >{bld['max_fermenter_vol']}л")

    if len(brewery.fermenters_list) >= bld.get("max_fermenters", 999):
        raise HTTPException(400, f"В этом здании макс. {bld['max_fermenters']} ферментер(ов). Продайте лишний.")

    if game.money < ft["price"]:
        raise HTTPException(400, f"Недостаточно средств. Нужно ${ft['price']}")

    game.money -= ft["price"]
    game.total_expenses += ft["price"]
    db.add(BreweryFermenter(brewery_id=brewery.id, type_id=type_id, purchase_price=ft["price"]))
    db.commit()
    return {"message": f"Куплен {ft['name']} за ${ft['price']}", "cost": ft["price"]}


@router.post("/buy-cond-tank")
def buy_cond_tank(type_id: int, game_id: int = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    game = resolve_game(game_id, current_user, db)
    brewery = db.query(Brewery).filter(Brewery.game_state_id == game.id).first()
    if not brewery:
        raise HTTPException(404, "Пивоварня не найдена")

    ct = CondTankTypes.LIST.get(type_id)
    if not ct:
        raise HTTPException(400, "Неизвестный тип танка")

    if brewery.level < ct["min_level"]:
        raise HTTPException(400, f"Требуется уровень {ct['min_level']} для покупки {ct['name']}")

    bld = get_bld(brewery.building_id)
    if bld.get("max_cond_tanks", 0) == 0:
        raise HTTPException(400, "В этом здании нет места для танков дозревания")
    if ct["volume"] > bld.get("max_cond_vol", 9999):
        raise HTTPException(400, f"В этом здании нельзя установить танк >{bld['max_cond_vol']}л")

    if len(brewery.cond_tanks_list) >= bld.get("max_cond_tanks", 999):
        raise HTTPException(400, f"В этом здании макс. {bld['max_cond_tanks']} танк(ов). Продайте лишний.")

    if game.money < ct["price"]:
        raise HTTPException(400, f"Недостаточно средств. Нужно ${ct['price']}")

    game.money -= ct["price"]
    game.total_expenses += ct["price"]
    db.add(BreweryCondTank(brewery_id=brewery.id, type_id=type_id, purchase_price=ct["price"]))
    db.commit()
    return {"message": f"Куплен {ct['name']} за ${ct['price']}", "cost": ct["price"]}


@router.post("/sell-kettle/{kettle_id}")
def sell_kettle(kettle_id: int, game_id: int = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    game = resolve_game(game_id, current_user, db)
    brewery = db.query(Brewery).filter(Brewery.game_state_id == game.id).first()
    if not brewery:
        raise HTTPException(404, "Пивоварня не найдена")

    kettle = db.query(BreweryKettle).filter(BreweryKettle.id == kettle_id, BreweryKettle.brewery_id == brewery.id).first()
    if not kettle:
        raise HTTPException(404, "Котёл не найден")

    refund = int(kettle.purchase_price * SELL_REFUND_RATIO)
    type_info = KettleTypes.LIST.get(kettle.type_id, {})
    game.money += refund
    db.delete(kettle)
    db.commit()
    return {"message": f"Продан {type_info.get('name', 'котёл')} за ${refund}", "refund": refund}


@router.post("/sell-fermenter/{fermenter_id}")
def sell_fermenter(fermenter_id: int, game_id: int = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    game = resolve_game(game_id, current_user, db)
    brewery = db.query(Brewery).filter(Brewery.game_state_id == game.id).first()
    if not brewery:
        raise HTTPException(404, "Пивоварня не найдена")

    fermenter = db.query(BreweryFermenter).filter(BreweryFermenter.id == fermenter_id, BreweryFermenter.brewery_id == brewery.id).first()
    if not fermenter:
        raise HTTPException(404, "Ферментер не найден")

    refund = int(fermenter.purchase_price * SELL_REFUND_RATIO)
    type_info = FermenterTypes.LIST.get(fermenter.type_id, {})
    game.money += refund
    db.delete(fermenter)
    db.commit()
    return {"message": f"Продан {type_info.get('name', 'ферментер')} за ${refund}", "refund": refund}


@router.post("/sell-cond-tank/{tank_id}")
def sell_cond_tank(tank_id: int, game_id: int = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    game = resolve_game(game_id, current_user, db)
    brewery = db.query(Brewery).filter(Brewery.game_state_id == game.id).first()
    if not brewery:
        raise HTTPException(404, "Пивоварня не найдена")

    tank = db.query(BreweryCondTank).filter(BreweryCondTank.id == tank_id, BreweryCondTank.brewery_id == brewery.id).first()
    if not tank:
        raise HTTPException(404, "Танк не найден")

    refund = int(tank.purchase_price * SELL_REFUND_RATIO)
    type_info = CondTankTypes.LIST.get(tank.type_id, {})
    game.money += refund
    db.delete(tank)
    db.commit()
    return {"message": f"Продан {type_info.get('name', 'танк')} за ${refund}", "refund": refund}


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


def _check_excess_and_refund(brewery, bld, game, db: Session):
    """Sell excess equipment when moving to a smaller building, return total refund."""
    total_refund = 0
    max_tanks = bld.get("max_tanks", 999)
    max_kettle_vol = bld.get("max_kettle_vol", 9999)
    while len(brewery.kettles) > max_tanks:
        kettle = brewery.kettles[0]
        refund = int(kettle.purchase_price * SELL_REFUND_RATIO)
        total_refund += refund
        db.delete(kettle)
    for kettle in list(brewery.kettles):
        vol = KettleTypes.LIST[kettle.type_id]["volume"]
        if vol > max_kettle_vol:
            refund = int(kettle.purchase_price * SELL_REFUND_RATIO)
            total_refund += refund
            db.delete(kettle)

    max_ferm = bld.get("max_fermenters", 999)
    max_ferm_vol = bld.get("max_fermenter_vol", 9999)
    while len(brewery.fermenters_list) > max_ferm:
        ferm = brewery.fermenters_list[0]
        refund = int(ferm.purchase_price * SELL_REFUND_RATIO)
        total_refund += refund
        db.delete(ferm)
    for ferm in list(brewery.fermenters_list):
        vol = FermenterTypes.LIST[ferm.type_id]["volume"]
        if vol > max_ferm_vol:
            refund = int(ferm.purchase_price * SELL_REFUND_RATIO)
            total_refund += refund
            db.delete(ferm)

    max_cond = bld.get("max_cond_tanks", 0)
    max_cond_vol = bld.get("max_cond_vol", 0)
    while len(brewery.cond_tanks_list) > max_cond:
        tank = brewery.cond_tanks_list[0]
        refund = int(tank.purchase_price * SELL_REFUND_RATIO)
        total_refund += refund
        db.delete(tank)
    for tank in list(brewery.cond_tanks_list):
        vol = CondTankTypes.LIST[tank.type_id]["volume"]
        if vol > max_cond_vol:
            refund = int(tank.purchase_price * SELL_REFUND_RATIO)
            total_refund += refund
            db.delete(tank)

    game.money += total_refund
    return total_refund


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

    owned_equip_count = db.query(Equipment).filter(
        Equipment.game_state_id == game.id,
        Equipment.is_owned == True
    ).count()

    move_cost = (
        bld["rent"] * Buildings.MOVE_COST_MULTIPLIER
        + get_kettle_count(brewery) * Buildings.MOVE_COST_PER_TANK
        + get_fermenter_count(brewery) * Buildings.MOVE_COST_PER_FERMENTER
        + get_cond_tank_count(brewery) * Buildings.MOVE_COST_PER_COND_TANK
        + (Buildings.MOVE_COST_TAPROOM if brewery.has_taproom else 0)
        + owned_equip_count * Buildings.MOVE_COST_PER_EQUIP
    )

    if game.money < move_cost:
        raise HTTPException(400, f"Недостаточно средств для переезда. Нужно ${move_cost}")

    game.money -= move_cost
    game.total_expenses += move_cost
    brewery.building_id = req.building_id
    brewery.rent = bld["rent"]
    brewery.storage_capacity = max(brewery.storage_capacity, bld["storage"])
    brewery.quality_bonus = bld["quality_bonus"]
    brewery.has_taproom = bld["taproom"]

    refund = _check_excess_and_refund(brewery, bld, game, db)
    db.commit()

    msg = f"Переехали в «{bld['name']}» за ${move_cost}"
    if refund > 0:
        msg += f". Продано лишнее оборудование, возвращено ${refund}"

    return {"message": msg, "building_id": req.building_id, "cost": move_cost, "refund": refund}
