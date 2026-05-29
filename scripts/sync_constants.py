"""Read backend/config.py and generate frontend JS constants file."""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

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
    EVENT_CHANCE_PER_TICK as EVENT_CHANCE,
    SELL_REFUND_RATIO,
)


def _js_value(val):
    """Convert a Python value to a JavaScript literal string."""
    if val is None:
        return "null"
    if isinstance(val, bool):
        return "true" if val else "false"
    if isinstance(val, (int, float)):
        return str(val)
    if isinstance(val, str):
        return json.dumps(val, ensure_ascii=False)
    if isinstance(val, (list, tuple)):
        items = ", ".join(_js_value(v) for v in val)
        return f"[{items}]"
    if isinstance(val, dict):
        pairs = []
        for k, v in val.items():
            pairs.append(f"{_js_key(k)}: {_js_value(v)}")
        return "{" + ", ".join(pairs) + "}"
    return json.dumps(val, ensure_ascii=False)


def _js_key(k):
    """Convert a dict key to a JS object key (bracket notation if numeric)."""
    if isinstance(k, str) and k.isidentifier():
        return k
    return json.dumps(k, ensure_ascii=False)


def _flat_attrs(cls):
    """Return a dict of non-callable, non-dunder class attributes."""
    return {
        k: v
        for k, v in vars(cls).items()
        if not k.startswith("_") and not callable(v)
    }


def generate_js():
    parts = []

    def add(name, val):
        parts.append(f"  {name}: {_js_value(val)}")

    add("KETTLE_TYPES", KettleTypes.LIST)
    add("FERMENTER_TYPES", FermenterTypes.LIST)
    add("COND_TANK_TYPES", CondTankTypes.LIST)
    add("BUILDINGS", Buildings.LIST)
    add("UPGRADE_COSTS", _flat_attrs(UpgradeCosts))
    add("EQUIPMENT_BONUSES", _flat_attrs(EquipmentBonuses))
    add("EQUIPMENT_WEAR", _flat_attrs(EquipmentWear))
    add("TAX_RATE", Tax.RATE)
    add("INFLATION_RATE", {"min_rate": Inflation.MIN_RATE, "max_rate": Inflation.MAX_RATE, "interval_days": Inflation.INTERVAL_DAYS})
    add("BANKRUPTCY_THRESHOLD", BANKRUPTCY_THRESHOLD)
    add("BANKRUPTCY_DAYS", BANKRUPTCY_DAYS)
    add("EVENT_CHANCE", EVENT_CHANCE)
    add("SELL_REFUND_RATIO", SELL_REFUND_RATIO)
    add("BUILDINGS_MOVE_COSTS", {
        "MOVE_COST_MULTIPLIER": Buildings.MOVE_COST_MULTIPLIER,
        "MOVE_COST_PER_TANK": Buildings.MOVE_COST_PER_TANK,
        "MOVE_COST_PER_FERMENTER": Buildings.MOVE_COST_PER_FERMENTER,
        "MOVE_COST_PER_COND_TANK": Buildings.MOVE_COST_PER_COND_TANK,
        "MOVE_COST_TAPROOM": Buildings.MOVE_COST_TAPROOM,
        "MOVE_COST_PER_EQUIP": Buildings.MOVE_COST_PER_EQUIP,
    })

    body = ",\n".join(parts)

    return f"""// AUTO-GENERATED from backend/config.py — DO NOT EDIT DIRECTLY
// Run `python scripts/sync_constants.py` to regenerate

const _CONFIG = {{
{body}
}};
"""


def main():
    frontend_path = Path(__file__).resolve().parent.parent / "frontend" / "js" / "utils"
    frontend_path.mkdir(parents=True, exist_ok=True)
    out_file = frontend_path / "_generated_constants.js"
    out_file.write_text(generate_js(), encoding="utf-8")
    print(f"Wrote {out_file}")


if __name__ == "__main__":
    main()
