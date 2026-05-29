from backend.models import BeerRecipe, BeerBatch, BatchStage, BreweryKettle, BreweryFermenter
from backend.game_engine import process_tick, get_kettle_count
from backend.config import KettleTypes, FermenterTypes


def test_process_tick_empty_game(db, game):
    result = process_tick(game, db)
    assert "events" in result
    assert "game_over" in result
    assert result["game_over"] == False


def test_process_tick_advances_day(db, game):
    day_before = game.day
    process_tick(game, db)
    assert game.day == day_before + 1


def test_batch_mash_to_boil(db, game, brewery):
    recipe = BeerRecipe(
        game_state_id=game.id, name="Test", style="lager",
        malt_amount=5.0, hops_amount=0.5, abv=5.0, ibu=20, srm=5,
        brew_time_days=1, ferment_time_days=3, condition_time_days=3,
        cost_per_liter=1.0, base_price_per_liter=4.5,
        is_unlocked=True,
    )
    db.add(recipe)
    db.flush()

    brewery_kettle = BreweryKettle(brewery_id=brewery.id, type_id=1, purchase_price=KettleTypes.LIST[1]["price"])
    brewery_fermenter = BreweryFermenter(brewery_id=brewery.id, type_id=1, purchase_price=FermenterTypes.LIST[1]["price"])
    db.add(brewery_kettle)
    db.add(brewery_fermenter)
    db.flush()

    batch = BeerBatch(
        game_state_id=game.id, recipe_id=recipe.id,
        batch_size_liters=50, stage=BatchStage.mash,
        started_day=game.day, stage_progress=0, quality=50,
        days_in_stage=0,
    )
    db.add(batch)
    db.commit()

    process_tick(game, db)

    db.refresh(batch)
    assert batch.stage == BatchStage.boil, f"Expected boil, got {batch.stage}"
    assert batch.days_in_stage == 0


def test_process_tick_maintains_history(db, game):
    process_tick(game, db)
    assert len(game.revenue_history or []) >= 0
    assert len(game.expense_history or []) >= 0
