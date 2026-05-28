from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import GameState, BeerBatch, BatchStage, BeerRecipe, User
from backend.schemas import BatchActionRequest
from backend.dependencies import get_current_user, resolve_game

router = APIRouter(prefix="/api/batches", tags=["batches"])


@router.get("/")
def get_batches(game_id: int = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    game = resolve_game(game_id, current_user, db)
    batches = db.query(BeerBatch).filter(BeerBatch.game_state_id == game.id).all()
    result = []
    for b in batches:
        recipe = db.query(BeerRecipe).filter(BeerRecipe.id == b.recipe_id).first()
        result.append({
            "id": b.id,
            "recipe_id": b.recipe_id,
            "recipe_name": recipe.name if recipe else "Unknown",
            "recipe_style": recipe.style.value if recipe else "unknown",
            "batch_size_liters": b.batch_size_liters,
            "stage": b.stage.value,
            "started_day": b.started_day,
            "stage_progress": b.stage_progress,
            "quality": b.quality,
            "days_in_stage": b.days_in_stage,
        })
    return result


@router.get("/{batch_id}")
def get_batch(batch_id: int, game_id: int = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    game = resolve_game(game_id, current_user, db)
    batch = db.query(BeerBatch).filter(
        BeerBatch.id == batch_id,
        BeerBatch.game_state_id == game.id
    ).first()
    if not batch:
        raise HTTPException(404, "Партия не найдена")
    recipe = db.query(BeerRecipe).filter(BeerRecipe.id == batch.recipe_id).first()
    return {
        "id": batch.id,
        "recipe_id": batch.recipe_id,
        "recipe_name": recipe.name if recipe else "Unknown",
        "recipe_style": recipe.style.value if recipe else "unknown",
        "batch_size_liters": batch.batch_size_liters,
        "stage": batch.stage.value,
        "started_day": batch.started_day,
        "stage_progress": batch.stage_progress,
        "quality": batch.quality,
        "days_in_stage": batch.days_in_stage,
    }


@router.post("/{batch_id}/sell")
def sell_batch(batch_id: int, game_id: int = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    game = resolve_game(game_id, current_user, db)
    batch = db.query(BeerBatch).filter(
        BeerBatch.id == batch_id,
        BeerBatch.game_state_id == game.id
    ).first()
    if not batch:
        raise HTTPException(404, "Партия не найдена")
    if batch.stage != BatchStage.packaged:
        raise HTTPException(400, "Партия ещё не готова к продаже")

    recipe = db.query(BeerRecipe).filter(BeerRecipe.id == batch.recipe_id).first()
    if not recipe:
        raise HTTPException(404, "Рецепт не найден")

    price = recipe.base_price_per_liter * (batch.quality / 50)
    revenue = batch.batch_size_liters * price
    game.money += revenue
    game.total_revenue += revenue
    game.daily_revenue += revenue
    game.reputation = min(100, game.reputation + (batch.quality - 50) * 0.1)
    game.player_total_liters = (game.player_total_liters or 0) + batch.batch_size_liters

    batch.stage = BatchStage.sold

    db.commit()
    return {"message": f"Продано! Выручка: ${revenue:.0f}", "revenue": revenue, "price_per_liter": price}
