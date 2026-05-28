from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import GameState, BeerRecipe, BeerBatch, BatchStage, Brewery, Ingredient, IngredientType, User
from backend.schemas import BeerRecipeCreate, BeerRecipeSchema, BrewRequest
from backend.dependencies import get_current_user, resolve_game

router = APIRouter(prefix="/api/recipes", tags=["recipes"])


@router.get("/")
def get_recipes(game_id: int = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    game = resolve_game(game_id, current_user, db)
    recipes = db.query(BeerRecipe).filter(BeerRecipe.game_state_id == game.id).all()
    return recipes


@router.post("/")
def create_recipe(recipe: BeerRecipeCreate, game_id: int = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    game = resolve_game(game_id, current_user, db)
    db_recipe = BeerRecipe(game_state_id=game.id, **recipe.model_dump())
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

    malt_ingredients = db.query(Ingredient).filter(
        Ingredient.game_state_id == game_id,
        Ingredient.type == IngredientType.malt
    ).all()
    total_malt = sum(i.quantity for i in malt_ingredients)
    if total_malt < malt_needed:
        raise HTTPException(400, f"Недостаточно солода. Нужно {malt_needed:.1f}кг")

    hops_ingredients = db.query(Ingredient).filter(
        Ingredient.game_state_id == game_id,
        Ingredient.type == IngredientType.hops
    ).all()
    total_hops = sum(i.quantity for i in hops_ingredients)
    if total_hops < hops_needed:
        raise HTTPException(400, f"Недостаточно хмеля. Нужно {hops_needed:.1f}кг")

    deduction_malt = malt_needed / len(malt_ingredients) if malt_ingredients else 0
    for ing in malt_ingredients:
        ing.quantity = max(0, ing.quantity - deduction_malt)

    deduction_hops = hops_needed / len(hops_ingredients) if hops_ingredients else 0
    for ing in hops_ingredients:
        ing.quantity = max(0, ing.quantity - deduction_hops)

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
        quality=50.0,
        days_in_stage=0,
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)

    return {
        "message": f"Варка начата! Партия #{batch.id}",
        "batch_id": batch.id,
        "cost": total_ingredient_cost,
    }
