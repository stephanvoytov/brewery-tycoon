from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import GameState, BeerRecipe, BeerBatch, BatchStage, Brewery, Ingredient, IngredientType, User
from backend.schemas import BeerRecipeCreate, BeerRecipeSchema, BrewRequest
from backend.dependencies import get_current_user, resolve_game
from backend.game_engine import STYLE_INGREDIENT_MAP, INGREDIENT_TEMPLATES

router = APIRouter(prefix="/api/recipes", tags=["recipes"])


def _calc_recipe_cost(malt_name, hops_name, yeast_name, malt_amount, hops_amount):
    def unit_cost(name):
        for ing in INGREDIENT_TEMPLATES:
            if ing["name"] == name:
                return ing["unit_cost"]
        return 1.0
    malt_cost = unit_cost(malt_name) * malt_amount
    hops_cost = unit_cost(hops_name) * hops_amount
    yeast_cost = unit_cost(yeast_name) * 0.1
    return (malt_cost + hops_cost + yeast_cost) / 10


@router.get("/")
def get_recipes(game_id: int = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    game = resolve_game(game_id, current_user, db)
    recipes = db.query(BeerRecipe).filter(BeerRecipe.game_state_id == game.id).all()
    return recipes


@router.post("/")
def create_recipe(req: BeerRecipeCreate, game_id: int = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    game = resolve_game(game_id, current_user, db)
    cost_per_liter = _calc_recipe_cost(
        req.malt_ingredient_name, req.hops_ingredient_name,
        req.yeast_ingredient_name, req.malt_amount, req.hops_amount
    )
    data = req.model_dump()
    data["cost_per_liter"] = cost_per_liter
    data["base_price_per_liter"] = cost_per_liter * 3.5
    db_recipe = BeerRecipe(game_state_id=game.id, **data)
    db.add(db_recipe)
    db.commit()
    db.refresh(db_recipe)
    return db_recipe


@router.post("/{recipe_id}/brew")
def start_brew(recipe_id: int, req: BrewRequest, game_id: int = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    game = resolve_game(game_id, current_user, db)
    recipe = db.query(BeerRecipe).filter(
        BeerRecipe.id == recipe_id,
        BeerRecipe.game_state_id == game.id
    ).first()
    brewery = db.query(Brewery).filter(Brewery.game_state_id == game.id).first()

    if not recipe or not brewery:
        raise HTTPException(404, "Рецепт или пивоварня не найдена")

    if req.batch_size_liters > brewery.storage_capacity:
        raise HTTPException(400, f"Объём партии превышает вместимость хранилища ({brewery.storage_capacity}л)")

    active_batches = db.query(BeerBatch).filter(
        BeerBatch.game_state_id == game_id,
        BeerBatch.stage.in_([BatchStage.mash, BatchStage.boil, BatchStage.ferment])
    ).count()

    if active_batches >= brewery.tank_count:
        raise HTTPException(400, "Все варочные котлы заняты")

    total_ingredient_cost = recipe.cost_per_liter * req.batch_size_liters
    if game.money < total_ingredient_cost:
        raise HTTPException(400, f"Недостаточно средств. Нужно ${total_ingredient_cost:.0f}")

    malt_needed = recipe.malt_amount * req.batch_size_liters / 10
    hops_needed = recipe.hops_amount * req.batch_size_liters / 10
    yeast_needed = 0.1 * req.batch_size_liters / 10

    malt_ing = db.query(Ingredient).filter(
        Ingredient.game_state_id == game_id,
        Ingredient.name == recipe.malt_ingredient_name
    ).first()
    if not malt_ing or malt_ing.quantity < malt_needed:
        raise HTTPException(400, f"Недостаточно '{recipe.malt_ingredient_name}'. Нужно {malt_needed:.1f}кг, есть {malt_ing.quantity:.1f}кг" if malt_ing else f"'{recipe.malt_ingredient_name}' не найден")
    malt_ing.quantity -= malt_needed

    hops_ing = db.query(Ingredient).filter(
        Ingredient.game_state_id == game_id,
        Ingredient.name == recipe.hops_ingredient_name
    ).first()
    if not hops_ing or hops_ing.quantity < hops_needed:
        raise HTTPException(400, f"Недостаточно '{recipe.hops_ingredient_name}'. Нужно {hops_needed:.1f}кг" if hops_ing else f"'{recipe.hops_ingredient_name}' не найден")
    hops_ing.quantity -= hops_needed

    yeast_ing = db.query(Ingredient).filter(
        Ingredient.game_state_id == game_id,
        Ingredient.name == recipe.yeast_ingredient_name
    ).first()
    if not yeast_ing or yeast_ing.quantity < yeast_needed:
        raise HTTPException(400, f"Недостаточно дрожжей. Нужно {yeast_needed:.1f}кг" if yeast_ing else f"Дрожжи не найдены")
    yeast_ing.quantity -= yeast_needed

    quality = 50.0
    recommended = STYLE_INGREDIENT_MAP.get(recipe.style)
    if recommended:
        if recipe.malt_ingredient_name != recommended["malt"]:
            quality -= 10
        if recipe.hops_ingredient_name != recommended["hops"]:
            quality -= 10
        if recipe.yeast_ingredient_name != recommended["yeast"]:
            quality -= 5
    quality = max(10, min(100, quality))

    game.money -= total_ingredient_cost
    game.total_expenses += total_ingredient_cost
    game.daily_expenses += total_ingredient_cost

    batch = BeerBatch(
        game_state_id=game_id,
        recipe_id=recipe_id,
        batch_size_liters=req.batch_size_liters,
        stage=BatchStage.mash,
        started_day=game.day,
        stage_progress=0,
        quality=quality,
        days_in_stage=0,
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)

    quality_note = ""
    if quality < 50:
        quality_note = " (качество снижено из-за нерекомендованных ингредиентов)"

    return {
        "message": f"Варка начата! Партия #{batch.id}{quality_note}",
        "batch_id": batch.id,
        "cost": total_ingredient_cost,
    }
