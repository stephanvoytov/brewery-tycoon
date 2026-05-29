DAYS_PER_MONTH = 30


class StartingBalance:
    MONEY = 3000.0
    LOAN = 0.0
    LOAN_INTEREST_RATE = 0.05
    REPUTATION = 50.0
    INGREDIENT_QUANTITY = 10.0


class Rent:
    MONTHLY = 3000
    @classmethod
    def DAILY(cls):
        return cls.MONTHLY / DAYS_PER_MONTH


class Salaries:
    BREWER_MONTHLY = 750
    SALES_MONTHLY = 600
    ADMIN_MONTHLY = 450

    @classmethod
    def BREWER_DAILY(cls):
        return cls.BREWER_MONTHLY / DAYS_PER_MONTH

    @classmethod
    def SALES_DAILY(cls):
        return cls.SALES_MONTHLY / DAYS_PER_MONTH

    @classmethod
    def ADMIN_DAILY(cls):
        return cls.ADMIN_MONTHLY / DAYS_PER_MONTH


class Taproom:
    INCOME_PER_LEVEL = 30.0


class Marketing:
    DEMAND_BONUS_PER_LEVEL = 0.05


class StaffSkill:
    EFFICIENCY_PER_SKILL = 0.02


BANKRUPTCY_THRESHOLD = -5000
BANKRUPTCY_DAYS = 30


class Loan:
    BASE_LIMIT = 5000
    REP_PER_LIMIT = 200
    LEVEL_PER_LIMIT = 1000
    MIN_RATE = 0.001
    RATE_RANGE = 0.004


class Inflation:
    INTERVAL_DAYS = 30
    MIN_RATE = 0.01
    MAX_RATE = 0.03


class Tax:
    INTERVAL_DAYS = 7
    FLAT_MIN = 0
    RATE = 0.10


class BulkDiscount:
    TIER1_KG = 50
    TIER1_DISCOUNT = 0.05
    TIER2_KG = 200
    TIER2_DISCOUNT = 0.10


class BulkSpoilage:
    NORMAL_RATE = 0.003
    TIER1_KG = 100
    TIER1_RATE = 0.005
    TIER2_KG = 300
    TIER2_RATE = 0.008


class Reputation:
    CHANGE_PER_DAY = 0.3


class TankVolume:
    DEFAULT = 100


class LevelFormula:
    @staticmethod
    def revenue_for_level(level: int) -> int:
        return 5000 * level * (level - 1)

    @staticmethod
    def level_from_revenue(revenue: float) -> int:
        if revenue <= 0:
            return 1
        lv = 1
        while LevelFormula.revenue_for_level(lv + 1) <= revenue:
            lv += 1
        return lv


class UpgradeCosts:
    TANKS = {2: 3000, 3: 6000, 4: 10000}
    FERMENTERS = {4: 2000, 6: 5000, 8: 9000}
    STORAGE = {1000: 2000, 2000: 4000, 4000: 8000}
    TAPROOM = {1: 5000, 2: 10000}
    MARKETING = {2: 2000, 3: 4000, 4: 7000}


class EquipmentBonuses:
    BOTTLING_LINE_PRICE_BONUS = 0.15
    COOLING_SYSTEM_FERMENT_DAYS = -1
    CONDITIONING_TANK_CONDITION_DAYS = -2
    KEGGING_LINE_BATCH_BONUS = 0.10
    MASH_TUN_QUALITY_BONUS = 0.05
    FILTRATION_BREW_DAYS = -1


class EquipmentWear:
    PER_DAY = 0.1
    BROKEN_THRESHOLD = 20
    REPAIR_COST_RATIO = 0.3
    INSURANCE_COST = 500


EVENT_CHANCE_PER_TICK = 0.10


class Buildings:
    DEFAULT_ID = 2

    LIST = {
        1: {"name": "Подвал", "desc": "Сырой подвал, дёшево и сердито. Порча ингредиентов −50%.",
            "min_level": 1, "rent": 40, "storage": 500, "tanks": 1, "fermenters": 2,
            "cond_tanks": 1, "quality_bonus": -0.05, "taproom": False, "kettle_vol": 50,
            "spoilage_reduction": 0.5, "spoil_mod": 0.5},
        2: {"name": "Небольшой цех", "desc": "Стандартное помещение для старта. Без излишеств.",
            "min_level": 1, "rent": 100, "storage": 1000, "tanks": 2, "fermenters": 4,
            "cond_tanks": 2, "quality_bonus": 0, "taproom": False, "kettle_vol": 100,
            "spoilage_reduction": 0, "spoil_mod": 1.0},
        3: {"name": "Промышленное здание", "desc": "Большой цех с выгодным расположением. Спрос +5%.",
            "min_level": 4, "rent": 200, "storage": 2000, "tanks": 3, "fermenters": 6,
            "cond_tanks": 3, "quality_bonus": -0.05, "taproom": False, "kettle_vol": 100,
            "spoilage_reduction": 0, "spoil_mod": 1.0, "demand_bonus": 0.05},
        4: {"name": "Крафт-лофт", "desc": "Престижный лофт с дегустационным залом. Качество +10%, тапрум встроен.",
            "min_level": 7, "rent": 300, "storage": 1500, "tanks": 2, "fermenters": 4,
            "cond_tanks": 2, "quality_bonus": 0.1, "taproom": True, "kettle_vol": 100,
            "spoilage_reduction": 0, "spoil_mod": 1.0, "max_batch_limit": 1000},
        5: {"name": "Пивоваренный завод", "desc": "Промышленные масштабы! Себестоимость −15%, +1 слот контракта.",
            "min_level": 12, "rent": 500, "storage": 5000, "tanks": 4, "fermenters": 8,
            "cond_tanks": 4, "quality_bonus": -0.1, "taproom": False, "kettle_vol": 200,
            "spoilage_reduction": 0, "spoil_mod": 1.0, "cost_reduction": 0.15, "extra_contract_slot": 1,
            "brewing_speed_bonus": 0.05},
        6: {"name": "Лаборатория", "desc": "Экспериментальный цех для премиум-пива. Quality может >100%, легендарные рецепты.",
            "min_level": 15, "rent": 800, "storage": 3000, "tanks": 2, "fermenters": 6,
            "cond_tanks": 3, "quality_bonus": 0.2, "taproom": False, "kettle_vol": 100,
            "spoilage_reduction": 0, "spoil_mod": 1.0, "unlock_legendary": True, "quality_cap_100": False},
        7: {"name": "Холдинг", "desc": "Империя пивоварения. −30% себестоимость, +2 слота контрактов, +10% спрос на всё.",
            "min_level": 18, "rent": 1200, "storage": 8000, "tanks": 6, "fermenters": 12,
            "cond_tanks": 6, "quality_bonus": -0.05, "taproom": False, "kettle_vol": 200,
            "spoilage_reduction": 0, "spoil_mod": 1.0, "cost_reduction": 0.3, "extra_contract_slot": 2, "demand_bonus": 0.1},
    }

    MOVE_COST_MULTIPLIER = 15
    MOVE_COST_PER_TANK = 500
    MOVE_COST_PER_FERMENTER = 300
    MOVE_COST_PER_COND_TANK = 300
    MOVE_COST_TAPROOM = 2000
    MOVE_COST_PER_EQUIP = 200
