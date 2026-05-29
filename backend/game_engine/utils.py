from sqlalchemy.orm import Session
from backend.models import BreweryKettle, BreweryFermenter, BreweryCondTank, EquipmentType
from backend.config import EquipmentBonuses, KettleTypes, FermenterTypes, CondTankTypes, Buildings


def get_available_equipment(level: int):
    all_items = [
        {"type": EquipmentType.mash_tun, "name": "🏺 Заторный чан", "price": 1800, "efficiency_bonus": EquipmentBonuses.MASH_TUN_QUALITY_BONUS, "desc": "+5% к качеству при варке", "min_level": 1},
        {"type": EquipmentType.cooling_system, "name": "🧊 Система охлаждения", "price": 3000, "efficiency_bonus": EquipmentBonuses.COOLING_SYSTEM_FERMENT_DAYS, "desc": "−1 день ферментации", "min_level": 1},
        {"type": EquipmentType.mash_tun, "name": "🔬 Фильтрация", "price": 3500, "efficiency_bonus": EquipmentBonuses.FILTRATION_BREW_DAYS, "desc": "−1 день варки (затирание+кипячение)", "min_level": 2},
        {"type": EquipmentType.conditioning_tank, "name": "🛢 Лагерный танк", "price": 2500, "efficiency_bonus": EquipmentBonuses.CONDITIONING_TANK_CONDITION_DAYS, "desc": "−2 дня дозревания", "min_level": 2},
        {"type": EquipmentType.bottling_line, "name": "🍾 Линия розлива", "price": 4000, "efficiency_bonus": EquipmentBonuses.BOTTLING_LINE_PRICE_BONUS, "desc": "+15% к цене продажи", "min_level": 3},
        {"type": EquipmentType.kegging_line, "name": "🛞 Линия кегов", "price": 5000, "efficiency_bonus": EquipmentBonuses.KEGGING_LINE_BATCH_BONUS, "desc": "+10% к объёму партии при варке", "min_level": 4},
    ]
    return [item for item in all_items if item["min_level"] <= level]


def detect_style(malt_name: str, hops_name: str, yeast_name: str):
    from .templates import DETECTABLE_STYLES
    key = malt_name + "|" + hops_name + "|" + yeast_name
    return DETECTABLE_STYLES.get(key)


def get_bld(building_id: int):
    return Buildings.LIST.get(building_id, Buildings.LIST[Buildings.DEFAULT_ID])


def get_kettle_count(brewery):
    return len(brewery.kettles)


def get_total_kettle_volume(brewery):
    return sum(KettleTypes.LIST[k.type_id]["volume"] for k in brewery.kettles)


def get_fermenter_count(brewery):
    return len(brewery.fermenters_list)


def get_cond_tank_count(brewery):
    return len(brewery.cond_tanks_list)


def _best_kettle_type_for_vol(volume: int):
    best_id = 1
    for tid, t in KettleTypes.LIST.items():
        if t["volume"] <= volume:
            best_id = tid
    return best_id


def _best_fermenter_type_for_vol(volume: int):
    best_id = 1
    for tid, t in FermenterTypes.LIST.items():
        if t["volume"] <= volume:
            best_id = tid
    return best_id


def _best_cond_type_for_vol(volume: int):
    best_id = 1
    for tid, t in CondTankTypes.LIST.items():
        if t["volume"] <= volume:
            best_id = tid
    return best_id


def _best_type_for_bld(type_list: dict, max_vol: int, min_lv: int) -> int:
    best_id = 1
    for tid, t in type_list.items():
        if t["volume"] <= max_vol and t["min_level"] <= min_lv:
            best_id = tid
    return best_id


def _create_initial_equipment(brewery, db: Session):
    if brewery.kettles:
        return
    bld = get_bld(brewery.building_id)
    min_lv = bld.get("min_level", 1)
    for _ in range(bld["tanks"]):
        tid = _best_kettle_type_for_vol(bld["kettle_vol"])
        db.add(BreweryKettle(brewery_id=brewery.id, type_id=tid, purchase_price=KettleTypes.LIST[tid]["price"]))
    for _ in range(bld["fermenters"]):
        tid = _best_type_for_bld(FermenterTypes.LIST, bld.get("max_fermenter_vol", 50), min_lv)
        db.add(BreweryFermenter(brewery_id=brewery.id, type_id=tid, purchase_price=FermenterTypes.LIST[tid]["price"]))
    for _ in range(bld.get("cond_tanks", 0)):
        tid = _best_type_for_bld(CondTankTypes.LIST, bld.get("max_cond_vol", 50), min_lv)
        db.add(BreweryCondTank(brewery_id=brewery.id, type_id=tid, purchase_price=CondTankTypes.LIST[tid]["price"]))
    db.flush()


def migrate_old_brewery_equipment(db: Session):
    from backend.models import Brewery
    breweries = db.query(Brewery).all()
    for brewery in breweries:
        if brewery.kettles:
            continue
        for _ in range(brewery.tank_count):
            tid = _best_kettle_type_for_vol(brewery.tank_volume)
            db.add(BreweryKettle(brewery_id=brewery.id, type_id=tid, purchase_price=KettleTypes.LIST[tid]["price"]))
        for _ in range(brewery.fermenter_count):
            db.add(BreweryFermenter(brewery_id=brewery.id, type_id=1, purchase_price=FermenterTypes.LIST[1]["price"]))
        for _ in range(brewery.conditioning_tank_count):
            db.add(BreweryCondTank(brewery_id=brewery.id, type_id=1, purchase_price=CondTankTypes.LIST[1]["price"]))
    db.commit()
