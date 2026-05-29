import random
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import GameState, BeerRecipe, BeerBatch, BatchStage, Brewery, Equipment, Ingredient, IngredientType, User
from backend.schemas import BeerRecipeCreate, BeerRecipeSchema, BrewRequest
from backend.dependencies import get_current_user, resolve_game
from backend.game_engine import STYLE_INGREDIENT_MAP, INGREDIENT_TEMPLATES, detect_style, EXPERIMENTAL_STYLE

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

    style = req.style.strip() if req.style else ""
    is_discovery = False
    discovered_style = None

    if not style or style == "experimental":
        detected = detect_style(req.malt_ingredient_name, req.hops_ingredient_name, req.yeast_ingredient_name)
        if detected:
            existing = db.query(BeerRecipe).filter(
                BeerRecipe.game_state_id == game.id,
                BeerRecipe.style == detected.value
            ).first()
            if not existing:
                discovered_style = detected
                is_discovery = True
                style = detected.value
            else:
                style = detected.value
                # already unlocked, but add_mastery later
        else:
            style = EXPERIMENTAL_STYLE

    base_price_mult = 3.5
    if style == EXPERIMENTAL_STYLE:
        base_price_mult = 2.5

    data = req.model_dump()
    data["style"] = style
    data["cost_per_liter"] = cost_per_liter
    data["base_price_per_liter"] = cost_per_liter * base_price_mult
    if "hidden_params" not in data or not data["hidden_params"]:
        data["hidden_params"] = {"mash_temp": "medium", "water_type": "soft", "boil_time": 60}

    db_recipe = BeerRecipe(game_state_id=game.id, is_unlocked=True, **data)
    db.add(db_recipe)
    db.commit()
    db.refresh(db_recipe)

    result = {
        "recipe": db_recipe,
        "is_discovery": is_discovery,
        "discovered_style": discovered_style.value if discovered_style else None,
        "message": f"Рецепт '{db_recipe.name}' создан!",
    }
    if is_discovery and discovered_style:
        game.reputation = min(100, game.reputation + 5)
        db.commit()
        result["message"] = f"🔬 Открыт новый стиль: {discovered_style.value}! Репутация +5"
        result["is_discovery"] = True

    return result


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

    max_batch = brewery.tank_count * brewery.tank_volume
    if req.batch_size_liters > max_batch:
        raise HTTPException(400, f"Объём партии превышает ёмкость котлов ({brewery.tank_count}×{brewery.tank_volume}л = {max_batch}л)")

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

    ingredient_score = 40
    recommended = STYLE_INGREDIENT_MAP.get(recipe.style)
    if recommended:
        if recipe.malt_ingredient_name != recommended["malt"]:
            ingredient_score -= 10
        if recipe.hops_ingredient_name != recommended["hops"]:
            ingredient_score -= 10
        if recipe.yeast_ingredient_name != recommended["yeast"]:
            ingredient_score -= 5
    ingredient_score = max(15, ingredient_score)

    avg_wear = db.query(Equipment).filter(
        Equipment.game_state_id == game.id,
        Equipment.is_owned == True
    ).with_entities(func.avg(Equipment.wear_tear)).scalar() or 100

    equipment_score = int(30 * (avg_wear / 100))

    skill_score = min(20, game.brewing_level * 2)

    mastery_score = min(5, int(recipe.mastery_count * 0.5))

    random_score = random.randint(-5, 5)

    quality = ingredient_score + equipment_score + skill_score + mastery_score + random_score
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
        quality_note = f" (качество: {quality:.0f})"

    return {
        "message": f"Варка начата! Партия #{batch.id}{quality_note}",
        "batch_id": batch.id,
        "cost": total_ingredient_cost,
        "quality_breakdown": {
            "ingredient": ingredient_score,
            "equipment": equipment_score,
            "skill": skill_score,
            "mastery": mastery_score,
            "random": random_score,
            "total": quality,
        },
    }
