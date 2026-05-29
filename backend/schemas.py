from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class GameStateSchema(BaseModel):
    id: int
    name: str
    money: float
    bank_loan: float
    day: int
    reputation: float
    total_revenue: float
    total_expenses: float
    daily_revenue: float
    daily_expenses: float
    days_bankrupt: int = 0
    game_over: bool = False
    game_over_capital: float = 0.0
    achievements: list = []
    revenue_history: list = []
    expense_history: list = []
    currency: str = "$"
    has_insurance: bool = False
    player_total_liters: float = 0.0
    brewing_level: int = 1
    total_batches_completed: int = 0
    quality_history: list = []
    inflation_multiplier: float = 1.0
    last_tax_day: int = 0
    last_revenue_check: float = 0.0

    class Config:
        from_attributes = True


class BrewerySchema(BaseModel):
    id: int
    name: str
    level: int
    tank_count: int
    tank_volume: int
    building_id: int
    fermenter_count: int
    conditioning_tank_count: int
    storage_capacity: int
    has_taproom: bool
    taproom_level: int
    rent: float
    quality_bonus: float
    marketing_level: int
    kettle_count_actual: int = 0
    kettle_vol_actual: int = 0
    fermenter_count_actual: int = 0
    cond_tank_count_actual: int = 0

    class Config:
        from_attributes = True


class BeerRecipeCreate(BaseModel):
    name: str
    style: str = ""
    malt_amount: float = 5.0
    hops_amount: float = 0.5
    malt_ingredient_name: str = "Солод Пильзнер"
    hops_ingredient_name: str = "Хмель Каскад"
    yeast_ingredient_name: str = "Дрожжи Элевые"
    adjuncts_amount: float = 0.0
    abv: float = 5.0
    ibu: int = 20
    srm: int = 5
    complexity: float = 1.0
    brew_time_days: int = 1
    ferment_time_days: int = 5
    condition_time_days: int = 7
    hidden_params: dict = {"mash_temp": "medium", "water_type": "soft", "boil_time": 60}


class BeerRecipeSchema(BaseModel):
    id: int
    name: str
    style: str
    malt_amount: float
    hops_amount: float
    malt_ingredient_name: str = "Солод Пильзнер"
    hops_ingredient_name: str = "Хмель Каскад"
    yeast_ingredient_name: str = "Дрожжи Элевые"
    adjuncts_amount: float
    abv: float
    ibu: int
    srm: int
    complexity: float
    brew_time_days: int
    ferment_time_days: int
    condition_time_days: int
    cost_per_liter: float
    base_price_per_liter: float
    is_unlocked: bool = True
    mastery_count: int = 0
    hidden_params: dict = {}

    class Config:
        from_attributes = True


class BeerBatchSchema(BaseModel):
    id: int
    recipe_id: int
    recipe_name: Optional[str] = None
    batch_size_liters: float
    stage: str
    started_day: int
    stage_progress: int
    quality: float
    days_in_stage: int
    actual_abv: float = 0.0
    actual_ibu: int = 0
    actual_srm: int = 0
    skip_condition: bool = False
    waiting_for_tank: bool = False

    class Config:
        from_attributes = True


class IngredientSchema(BaseModel):
    id: int
    type: str
    name: str
    quantity: float
    unit_cost: float

    class Config:
        from_attributes = True


class EquipmentSchema(BaseModel):
    id: int
    type: str
    name: str
    level: int
    price: float
    efficiency_bonus: float
    is_owned: bool
    is_busy: bool
    wear_tear: float = 100.0

    class Config:
        from_attributes = True


class StaffSchema(BaseModel):
    id: int
    name: str
    role: str
    skill_level: int
    salary: float
    morale: float
    hired_day: int

    class Config:
        from_attributes = True


class ContractSchema(BaseModel):
    id: int
    buyer_name: str
    beer_style: str
    quantity_liters: float
    price_per_liter: float
    duration_days: int
    days_left: int
    penalty: float
    is_active: bool
    total_revenue: float
    delivered_liters: float

    class Config:
        from_attributes = True


class ActiveEventSchema(BaseModel):
    id: int
    event_type: str
    title: str
    description: str
    duration_days: int = 0
    days_left: int = 0
    is_choice_event: bool = False
    choice_made: bool = False
    resolved: bool = False
    choices: list = []

    class Config:
        from_attributes = True


class ResolveEventRequest(BaseModel):
    choice: str


class CompetitorSchema(BaseModel):
    id: int
    name: str
    daily_sales_liters: float
    total_sales_liters: float
    reputation: float
    market_share: float = 0.0

    class Config:
        from_attributes = True


class MarketConditionSchema(BaseModel):
    beer_style: str
    base_demand: float
    price_modifier: float
    season_factor: float

    class Config:
        from_attributes = True


class ResearchSchema(BaseModel):
    id: int
    name: str
    category: str
    cost: float
    duration_days: int
    progress_days: int
    is_completed: bool
    is_started: bool
    effect_description: str
    prerequisite_id: Optional[int] = None

    class Config:
        from_attributes = True


class FullGameState(BaseModel):
    game: GameStateSchema
    brewery: BrewerySchema
    recipes: List[BeerRecipeSchema]
    batches: List[BeerBatchSchema]
    ingredients: List[IngredientSchema]
    equipment: List[EquipmentSchema]
    staff: List[StaffSchema]
    contracts: List[ContractSchema]
    market: List[MarketConditionSchema]
    research: List[ResearchSchema]
    competitors: List[CompetitorSchema] = []
    market_share: float = 0.0
    active_events: List[ActiveEventSchema] = []


class TickResult(BaseModel):
    day: int
    money: float
    events: List[str]
    batches_updated: int
    contracts_fulfilled: int
    costs_deducted: float
    game_over: bool = False

class RestartAfterGameOverRequest(BaseModel):
    pass


class LoanActionRequest(BaseModel):
    amount: float


class LoanInfo(BaseModel):
    max_loan: float
    current_debt: float
    interest_rate: float
    reputation: float
    brewery_level: int


class BrewRequest(BaseModel):
    recipe_id: int
    batch_size_liters: float


class BuyIngredientRequest(BaseModel):
    ingredient_id: int
    quantity: float


class BuyEquipmentRequest(BaseModel):
    equipment_id: int


class HireStaffRequest(BaseModel):
    role: str


class UpgradeBreweryRequest(BaseModel):
    upgrade_type: str


class BatchActionRequest(BaseModel):
    action: str


class StartResearchRequest(BaseModel):
    research_id: int


class ContractSignRequest(BaseModel):
    contract_id: int


class UserOut(BaseModel):
    id: int
    username: str
    created_at: datetime
    active_game_id: Optional[int] = None

    class Config:
        from_attributes = True


class AuthRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    token: str
    user: UserOut


class LeaderboardEntry(BaseModel):
    rank: int
    username: str
    money: float
    day: int
    reputation: float
    total_revenue: float


class LeaderboardResponse(BaseModel):
    entries: List[LeaderboardEntry]


class SelectGameRequest(BaseModel):
    game_id: int


class CurrencyRequest(BaseModel):
    currency: str


class RenameBreweryRequest(BaseModel):
    name: str


class ChangeBuildingRequest(BaseModel):
    building_id: int
