DAYS_PER_MONTH = 30


class StartingBalance:
    MONEY = 10000.0
    LOAN = 0.0
    LOAN_INTEREST_RATE = 0.05
    REPUTATION = 50.0
    INGREDIENT_QUANTITY = 50.0


class Rent:
    MONTHLY = 1500
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


class Loan:
    DAILY_INTEREST_RATE = 0.005


class Reputation:
    CHANGE_PER_DAY = 0.3


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
