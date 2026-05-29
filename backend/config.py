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


class EquipmentPrices:
    KETTLE_50L = 2000
    KETTLE_100L = 5000
    FERMENTER_50L = 1500
    FERMENTER_100L = 3000
    BOTTLING_LINE = 4000
    KEGGING_LINE = 5000
    MASH_TUN = 1800
    COOLING_SYSTEM = 3000
    CONDITIONING_TANK = 2500


class EquipmentBonuses:
    KETTLE_50L_EXTRA_TANK = 1
    KETTLE_100L_VOLUME_BONUS = 50
    BOTTLING_LINE_PRICE_BONUS = 0.15
    COOLING_SYSTEM_FERMENT_DAYS = -1
    CONDITIONING_TANK_CONDITION_DAYS = -2


class EquipmentWear:
    PER_DAY = 0.1
    BROKEN_THRESHOLD = 20
    REPAIR_COST_RATIO = 0.3
    INSURANCE_COST = 500


EVENT_CHANCE_PER_TICK = 0.10
