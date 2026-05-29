import enum
from datetime import datetime
from sqlalchemy import Column, Integer, Float, String, Boolean, ForeignKey, Enum as SAEnum, JSON, DateTime
from sqlalchemy.orm import relationship
from backend.database import Base


class BeerStyle(str, enum.Enum):
    lager = "lager"
    ale = "ale"
    stout = "stout"
    ipa = "ipa"
    porter = "porter"
    wheat = "wheat"
    pilsner = "pilsner"
    sour = "sour"
    bock = "bock"
    pale_ale = "pale_ale"
    amber_ale = "amber_ale"
    belgian_tripel = "belgian_tripel"
    experimental = "experimental"


class BatchStage(str, enum.Enum):
    mash = "mash"
    boil = "boil"
    ferment = "ferment"
    condition = "condition"
    packaged = "packaged"
    sold = "sold"
    spoiled = "spoiled"


class IngredientType(str, enum.Enum):
    malt = "malt"
    hops = "hops"
    yeast = "yeast"
    adjunct = "adjunct"


class EquipmentType(str, enum.Enum):
    bottling_line = "bottling_line"
    kegging_line = "kegging_line"
    mash_tun = "mash_tun"
    cooling_system = "cooling_system"
    conditioning_tank = "conditioning_tank"


class StaffRole(str, enum.Enum):
    brewer = "brewer"
    sales = "sales"
    admin = "admin"


class ResearchCategory(str, enum.Enum):
    equipment = "equipment"
    recipe = "recipe"
    marketing = "marketing"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    active_game_id = Column(Integer, ForeignKey("game_states.id"), nullable=True)

    games = relationship("GameState", back_populates="owner", foreign_keys="GameState.user_id")
    active_game = relationship("GameState", foreign_keys=[active_game_id], post_update=True)


class GameState(Base):
    __tablename__ = "game_states"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    name = Column(String, default="Моя пивоварня")
    money = Column(Float, default=10000.0)
    bank_loan = Column(Float, default=0.0)
    loan_interest_rate = Column(Float, default=0.05)
    day = Column(Integer, default=1)
    reputation = Column(Float, default=50.0)
    total_revenue = Column(Float, default=0.0)
    total_expenses = Column(Float, default=0.0)
    daily_revenue = Column(Float, default=0.0)
    daily_expenses = Column(Float, default=0.0)
    currency = Column(String, default="$")

    owner = relationship("User", back_populates="games", foreign_keys=[user_id])

    brewery = relationship("Brewery", uselist=False, back_populates="game_state", cascade="all, delete-orphan")
    recipes = relationship("BeerRecipe", back_populates="game_state", cascade="all, delete-orphan")
    batches = relationship("BeerBatch", back_populates="game_state", cascade="all, delete-orphan")
    ingredients = relationship("Ingredient", back_populates="game_state", cascade="all, delete-orphan")
    equipment_list = relationship("Equipment", back_populates="game_state", cascade="all, delete-orphan")
    staff = relationship("Staff", back_populates="game_state", cascade="all, delete-orphan")
    contracts = relationship("Contract", back_populates="game_state", cascade="all, delete-orphan")
    research_list = relationship("Research", back_populates="game_state", cascade="all, delete-orphan")
    days_bankrupt = Column(Integer, default=0)
    game_over = Column(Boolean, default=False)
    game_over_capital = Column(Float, default=0.0)
    achievements = Column(JSON, default=list)
    revenue_history = Column(JSON, default=list)
    expense_history = Column(JSON, default=list)
    has_insurance = Column(Boolean, default=False)
    player_total_liters = Column(Float, default=0.0)
    brewing_level = Column(Integer, default=1)
    total_batches_completed = Column(Integer, default=0)
    active_events = relationship("ActiveEvent", back_populates="game_state")
    competitors = relationship("Competitor", back_populates="game_state")
    quality_history = Column(JSON, default=list)
    inflation_multiplier = Column(Float, default=1.0)
    last_tax_day = Column(Integer, default=0)
    last_revenue_check = Column(Float, default=0.0)


class Brewery(Base):
    __tablename__ = "breweries"

    id = Column(Integer, primary_key=True, index=True)
    game_state_id = Column(Integer, ForeignKey("game_states.id"), unique=True)
    name = Column(String, default="Моя пивоварня")
    level = Column(Integer, default=1)
    tank_count = Column(Integer, default=2)
    tank_volume = Column(Integer, default=100)
    building_id = Column(Integer, default=1)
    fermenter_count = Column(Integer, default=4)
    conditioning_tank_count = Column(Integer, default=2)
    storage_capacity = Column(Integer, default=1000)
    has_taproom = Column(Boolean, default=False)
    taproom_level = Column(Integer, default=0)
    rent = Column(Float, default=500.0)
    quality_bonus = Column(Float, default=0.0)
    marketing_level = Column(Integer, default=1)
    upgrade_count = Column(Integer, default=0)

    game_state = relationship("GameState", back_populates="brewery")
    kettles = relationship("BreweryKettle", back_populates="brewery", cascade="all, delete-orphan")
    fermenters_list = relationship("BreweryFermenter", back_populates="brewery", cascade="all, delete-orphan")
    cond_tanks_list = relationship("BreweryCondTank", back_populates="brewery", cascade="all, delete-orphan")


class BreweryKettle(Base):
    __tablename__ = "brewery_kettles"

    id = Column(Integer, primary_key=True, index=True)
    brewery_id = Column(Integer, ForeignKey("breweries.id", ondelete="CASCADE"), index=True)
    type_id = Column(Integer)
    purchase_price = Column(Float, default=0)

    brewery = relationship("Brewery", back_populates="kettles")


class BreweryFermenter(Base):
    __tablename__ = "brewery_fermenters"

    id = Column(Integer, primary_key=True, index=True)
    brewery_id = Column(Integer, ForeignKey("breweries.id", ondelete="CASCADE"), index=True)
    type_id = Column(Integer)
    purchase_price = Column(Float, default=0)

    brewery = relationship("Brewery", back_populates="fermenters_list")


class BreweryCondTank(Base):
    __tablename__ = "brewery_cond_tanks"

    id = Column(Integer, primary_key=True, index=True)
    brewery_id = Column(Integer, ForeignKey("breweries.id", ondelete="CASCADE"), index=True)
    type_id = Column(Integer)
    purchase_price = Column(Float, default=0)

    brewery = relationship("Brewery", back_populates="cond_tanks_list")


class BeerRecipe(Base):
    __tablename__ = "beer_recipes"

    id = Column(Integer, primary_key=True, index=True)
    game_state_id = Column(Integer, ForeignKey("game_states.id"))
    name = Column(String)
    style = Column(SAEnum(BeerStyle))
    malt_amount = Column(Float, default=5.0)
    hops_amount = Column(Float, default=0.5)
    malt_ingredient_name = Column(String, default="Солод Пильзнер")
    hops_ingredient_name = Column(String, default="Хмель Каскад")
    yeast_ingredient_name = Column(String, default="Дрожжи Элевые")
    adjuncts_amount = Column(Float, default=0.0)
    abv = Column(Float, default=5.0)
    ibu = Column(Integer, default=20)
    srm = Column(Integer, default=5)
    complexity = Column(Float, default=1.0)
    brew_time_days = Column(Integer, default=1)
    ferment_time_days = Column(Integer, default=5)
    condition_time_days = Column(Integer, default=7)
    cost_per_liter = Column(Float, default=0.5)
    base_price_per_liter = Column(Float, default=2.0)
    is_unlocked = Column(Boolean, default=True)
    mastery_count = Column(Integer, default=0)
    hidden_params = Column(JSON, default=dict)

    game_state = relationship("GameState", back_populates="recipes")
    batches = relationship("BeerBatch", back_populates="recipe")


class BeerBatch(Base):
    __tablename__ = "beer_batches"

    id = Column(Integer, primary_key=True, index=True)
    game_state_id = Column(Integer, ForeignKey("game_states.id"))
    recipe_id = Column(Integer, ForeignKey("beer_recipes.id"))
    batch_size_liters = Column(Float)
    stage = Column(SAEnum(BatchStage), default=BatchStage.mash)
    started_day = Column(Integer)
    stage_progress = Column(Integer, default=0)
    quality = Column(Float, default=50.0)
    days_in_stage = Column(Integer, default=0)
    actual_abv = Column(Float, default=0.0)
    actual_ibu = Column(Integer, default=0)
    actual_srm = Column(Integer, default=0)
    skip_condition = Column(Boolean, default=False)

    game_state = relationship("GameState", back_populates="batches")
    recipe = relationship("BeerRecipe", back_populates="batches")


class Ingredient(Base):
    __tablename__ = "ingredients"

    id = Column(Integer, primary_key=True, index=True)
    game_state_id = Column(Integer, ForeignKey("game_states.id"))
    type = Column(SAEnum(IngredientType))
    name = Column(String)
    quantity = Column(Float, default=0.0)
    unit_cost = Column(Float)

    game_state = relationship("GameState", back_populates="ingredients")


class Equipment(Base):
    __tablename__ = "equipment"

    id = Column(Integer, primary_key=True, index=True)
    game_state_id = Column(Integer, ForeignKey("game_states.id"))
    type = Column(SAEnum(EquipmentType))
    name = Column(String)
    level = Column(Integer, default=1)
    price = Column(Float)
    efficiency_bonus = Column(Float, default=0.0)
    is_owned = Column(Boolean, default=False)
    is_busy = Column(Boolean, default=False)
    wear_tear = Column(Float, default=100.0)

    game_state = relationship("GameState", back_populates="equipment_list")


class Staff(Base):
    __tablename__ = "staff"

    id = Column(Integer, primary_key=True, index=True)
    game_state_id = Column(Integer, ForeignKey("game_states.id"))
    name = Column(String)
    role = Column(SAEnum(StaffRole))
    skill_level = Column(Integer, default=1)
    salary = Column(Float)
    morale = Column(Float, default=70.0)
    hired_day = Column(Integer)

    game_state = relationship("GameState", back_populates="staff")


class Contract(Base):
    __tablename__ = "contracts"

    id = Column(Integer, primary_key=True, index=True)
    game_state_id = Column(Integer, ForeignKey("game_states.id"))
    buyer_name = Column(String)
    beer_style = Column(SAEnum(BeerStyle))
    quantity_liters = Column(Float)
    price_per_liter = Column(Float)
    duration_days = Column(Integer)
    days_left = Column(Integer)
    penalty = Column(Float)
    is_active = Column(Boolean, default=False)
    total_revenue = Column(Float, default=0.0)
    delivered_liters = Column(Float, default=0.0)

    game_state = relationship("GameState", back_populates="contracts")


class ActiveEvent(Base):
    __tablename__ = "active_events"

    id = Column(Integer, primary_key=True, index=True)
    game_state_id = Column(Integer, ForeignKey("game_states.id"))
    event_type = Column(String, index=True)
    title = Column(String)
    description = Column(String)
    duration_days = Column(Integer, default=0)
    days_left = Column(Integer, default=0)
    is_choice_event = Column(Boolean, default=False)
    choice_made = Column(Boolean, default=False)
    effect_data = Column(JSON, default=dict)
    resolved = Column(Boolean, default=False)

    game_state = relationship("GameState", back_populates="active_events")


class Competitor(Base):
    __tablename__ = "competitors"

    id = Column(Integer, primary_key=True, index=True)
    game_state_id = Column(Integer, ForeignKey("game_states.id"))
    name = Column(String)
    daily_sales_liters = Column(Float, default=150.0)
    total_sales_liters = Column(Float, default=0.0)
    reputation = Column(Float, default=60.0)

    game_state = relationship("GameState", back_populates="competitors")


COMPETITOR_NAMES = [
    "Балтика Крафт", "Московский Пивовар", "Томское Пиво",
    "Волковская Пивоварня", "Донское Золото"
]


class Research(Base):
    __tablename__ = "research"

    id = Column(Integer, primary_key=True, index=True)
    game_state_id = Column(Integer, ForeignKey("game_states.id"))
    name = Column(String)
    category = Column(SAEnum(ResearchCategory))
    cost = Column(Float)
    duration_days = Column(Integer)
    progress_days = Column(Integer, default=0)
    is_completed = Column(Boolean, default=False)
    is_started = Column(Boolean, default=False)
    effect_description = Column(String)
    effect = Column(JSON, default=dict)
    prerequisite_id = Column(Integer, default=None)

    game_state = relationship("GameState", back_populates="research_list")
