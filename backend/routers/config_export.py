from fastapi import APIRouter

from backend.config import (
    KettleTypes,
    FermenterTypes,
    CondTankTypes,
    Buildings,
    UpgradeCosts,
    EquipmentBonuses,
    EquipmentWear,
    Tax,
    Inflation,
    BANKRUPTCY_THRESHOLD,
    BANKRUPTCY_DAYS,
    EVENT_CHANCE_PER_TICK,
    SELL_REFUND_RATIO,
)


def _flat_attrs(cls):
    return {
        k: v
        for k, v in vars(cls).items()
        if not k.startswith("_") and not callable(v)
    }


router = APIRouter(prefix="/api/config", tags=["config"])


@router.get("/export")
def export_config():
    return {
        "KETTLE_TYPES": KettleTypes.LIST,
        "FERMENTER_TYPES": FermenterTypes.LIST,
        "COND_TANK_TYPES": CondTankTypes.LIST,
        "BUILDINGS": Buildings.LIST,
        "UPGRADE_COSTS": _flat_attrs(UpgradeCosts),
        "EQUIPMENT_BONUSES": _flat_attrs(EquipmentBonuses),
        "EQUIPMENT_WEAR": _flat_attrs(EquipmentWear),
        "TAX_RATE": Tax.RATE,
        "INFLATION_RATE": {
            "min_rate": Inflation.MIN_RATE,
            "max_rate": Inflation.MAX_RATE,
            "interval_days": Inflation.INTERVAL_DAYS,
        },
        "BANKRUPTCY_THRESHOLD": BANKRUPTCY_THRESHOLD,
        "BANKRUPTCY_DAYS": BANKRUPTCY_DAYS,
        "EVENT_CHANCE": EVENT_CHANCE_PER_TICK,
        "SELL_REFUND_RATIO": SELL_REFUND_RATIO,
        "BUILDINGS_MOVE_COSTS": {
            "MOVE_COST_MULTIPLIER": Buildings.MOVE_COST_MULTIPLIER,
            "MOVE_COST_PER_TANK": Buildings.MOVE_COST_PER_TANK,
            "MOVE_COST_PER_FERMENTER": Buildings.MOVE_COST_PER_FERMENTER,
            "MOVE_COST_PER_COND_TANK": Buildings.MOVE_COST_PER_COND_TANK,
            "MOVE_COST_TAPROOM": Buildings.MOVE_COST_TAPROOM,
            "MOVE_COST_PER_EQUIP": Buildings.MOVE_COST_PER_EQUIP,
        },
    }
