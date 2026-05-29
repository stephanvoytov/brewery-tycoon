import random
from sqlalchemy.orm import Session
from backend.models import GameState, Brewery, BeerRecipe, Ingredient, IngredientType, Equipment, Research, Competitor, Contract
from backend.config import StartingBalance, Buildings, KettleTypes, FermenterTypes, CondTankTypes
from .templates import RECIPE_TEMPLATES, INGREDIENT_TEMPLATES, RESEARCH_TREE
from .utils import get_available_equipment, _create_initial_equipment
from .economy import generate_contracts


def init_new_game(db: Session) -> GameState:
    game = GameState(
        name="Моя пивоварня",
        money=StartingBalance.MONEY,
        day=1,
        reputation=StartingBalance.REPUTATION,
        revenue_history=[],
        expense_history=[],
        currency="$",
    )
    db.add(game)
    db.flush()

    default_bld = Buildings.LIST[Buildings.DEFAULT_ID]
    brewery = Brewery(
        game_state_id=game.id,
        name="Моя пивоварня",
        level=1,
        tank_count=default_bld["tanks"],
        tank_volume=default_bld["kettle_vol"],
        building_id=Buildings.DEFAULT_ID,
        fermenter_count=default_bld["fermenters"],
        conditioning_tank_count=default_bld.get("cond_tanks", 2),
        storage_capacity=default_bld["storage"],
        rent=default_bld["rent"],
    )
    db.add(brewery)
    db.flush()
    _create_initial_equipment(brewery, db)

    for tpl in RECIPE_TEMPLATES:
        if tpl["name"] in ("Классический Лагер", "Золотой Эль"):
            recipe = BeerRecipe(game_state_id=game.id, is_unlocked=True, **tpl)
            db.add(recipe)

    for ing in INGREDIENT_TEMPLATES:
        ingredient = Ingredient(
            game_state_id=game.id,
            type=ing["type"],
            name=ing["name"],
            quantity=StartingBalance.INGREDIENT_QUANTITY,
            unit_cost=ing["unit_cost"],
        )
        db.add(ingredient)

    db.flush()

    def _unit_cost(name):
        for ing in INGREDIENT_TEMPLATES:
            if ing["name"] == name:
                return ing["unit_cost"]
        return 1.0

    for recipe in db.query(BeerRecipe).filter(BeerRecipe.game_state_id == game.id).all():
        malt_cost = _unit_cost(recipe.malt_ingredient_name) * recipe.malt_amount
        hops_cost = _unit_cost(recipe.hops_ingredient_name) * recipe.hops_amount
        yeast_cost = _unit_cost(recipe.yeast_ingredient_name) * 0.1
        recipe.cost_per_liter = (malt_cost + hops_cost + yeast_cost) / 10
        recipe.base_price_per_liter = recipe.cost_per_liter * 4.5

    for eq in get_available_equipment(1):
        equipment = Equipment(
            game_state_id=game.id,
            type=eq["type"],
            name=eq["name"],
            price=eq["price"],
            efficiency_bonus=eq["efficiency_bonus"],
            is_owned=False,
        )
        db.add(equipment)

    for idx, res in enumerate(RESEARCH_TREE):
        research = Research(
            game_state_id=game.id,
            **res
        )
        if idx == 0:
            research.prerequisite_id = None
        db.add(research)

    db.commit()

    init_competitors(game, db)

    for c in generate_contracts(game, db, 5):
        db.add(Contract(game_state_id=game.id, **c))
    db.commit()

    db.refresh(game)
    return game


def init_competitors(game: GameState, db: Session):
    from backend.models import COMPETITOR_NAMES
    existing = db.query(Competitor).filter(Competitor.game_state_id == game.id).count()
    if existing > 0:
        return
    count = random.randint(3, 5)
    names = random.sample(COMPETITOR_NAMES, min(count, len(COMPETITOR_NAMES)))
    for name in names:
        comp = Competitor(
            game_state_id=game.id,
            name=name,
            daily_sales_liters=random.uniform(80, 250),
            total_sales_liters=0.0,
            reputation=random.uniform(40, 80),
        )
        db.add(comp)
    db.commit()
