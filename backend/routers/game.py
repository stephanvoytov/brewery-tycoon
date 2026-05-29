from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import GameState, Brewery, BeerRecipe, BeerBatch, BatchStage, Ingredient, Equipment, Staff, Contract, Research, Competitor, ActiveEvent, User
from backend.schemas import FullGameState, GameStateSchema, BrewerySchema, TickResult, CurrencyRequest, SelectGameRequest, ResolveEventRequest, BeerBatchSchema
from backend.game_engine import init_new_game, process_tick, get_market_conditions, get_active_events, resolve_choice_event, generate_contracts, get_kettle_count, get_total_kettle_volume, get_fermenter_count, get_cond_tank_count
from backend.dependencies import get_current_user, resolve_game

router = APIRouter(prefix="/api/game", tags=["game"])


@router.post("/new")
def new_game(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    game = init_new_game(db)
    if current_user:
        game.user_id = current_user.id
        current_user.active_game_id = game.id
        db.commit()
    return {"game_id": game.id, "message": "Новая игра создана!"}


@router.get("/state")
def get_state(game_id: int = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    game = resolve_game(game_id, current_user, db)

    brewery = db.query(Brewery).filter(Brewery.game_state_id == game.id).first()
    recipes = db.query(BeerRecipe).filter(BeerRecipe.game_state_id == game.id).all()
    batches = db.query(BeerBatch).filter(BeerBatch.game_state_id == game.id).all()
    ingredients = db.query(Ingredient).filter(Ingredient.game_state_id == game.id).all()
    equipment = db.query(Equipment).filter(Equipment.game_state_id == game.id).all()
    staff = db.query(Staff).filter(Staff.game_state_id == game.id).all()
    contracts = db.query(Contract).filter(Contract.game_state_id == game.id).all()

    batch_list = []
    for b in batches:
        r = db.query(BeerRecipe).filter(BeerRecipe.id == b.recipe_id).first()
        batch_list.append(BeerBatchSchema(
            id=b.id,
            recipe_id=b.recipe_id,
            recipe_name=r.name if r else "Unknown",
            batch_size_liters=b.batch_size_liters,
            stage=b.stage.value,
            started_day=b.started_day,
            stage_progress=b.stage_progress,
            quality=b.quality,
            days_in_stage=b.days_in_stage,
            actual_abv=b.actual_abv or 0.0,
            actual_ibu=b.actual_ibu or 0,
            actual_srm=b.actual_srm or 0,
            skip_condition=b.skip_condition or False,
            waiting_for_tank=(b.stage == BatchStage.ferment and b.stage_progress >= 100 and not b.skip_condition),
        ))
    unsigned_count = sum(1 for c in contracts if not c.is_active)
    if unsigned_count < 3:
        new_contracts = generate_contracts(game, db, 5)
        for c in new_contracts:
            db.add(Contract(game_state_id=game.id, **c))
        db.commit()
        contracts = db.query(Contract).filter(Contract.game_state_id == game.id).all()

    research = db.query(Research).filter(Research.game_state_id == game.id).all()
    market = get_market_conditions(db, game.day)
    competitors = db.query(Competitor).filter(Competitor.game_state_id == game.id).all()
    total_market = game.player_total_liters or 0
    for comp in competitors:
        total_market += comp.total_sales_liters
    market_share = round((game.player_total_liters or 0) / total_market * 100, 1) if total_market > 0 else 0

    active_events = get_active_events(game, db)

    return FullGameState(
        game=GameStateSchema.model_validate(game),
        brewery=BrewerySchema(
            id=brewery.id,
            name=brewery.name,
            level=brewery.level,
            tank_count=brewery.tank_count,
            tank_volume=brewery.tank_volume,
            building_id=brewery.building_id,
            fermenter_count=brewery.fermenter_count,
            conditioning_tank_count=brewery.conditioning_tank_count,
            storage_capacity=brewery.storage_capacity,
            has_taproom=brewery.has_taproom,
            taproom_level=brewery.taproom_level,
            rent=brewery.rent,
            quality_bonus=brewery.quality_bonus,
            marketing_level=brewery.marketing_level,
            kettle_count_actual=get_kettle_count(brewery),
            kettle_vol_actual=get_total_kettle_volume(brewery),
            fermenter_count_actual=get_fermenter_count(brewery),
            cond_tank_count_actual=get_cond_tank_count(brewery),
        ),
        recipes=recipes,
        batches=batch_list,
        ingredients=ingredients,
        equipment=equipment,
        staff=staff,
        contracts=contracts,
        market=market,
        research=research,
        competitors=competitors,
        market_share=market_share,
        active_events=active_events,
    )


@router.post("/tick")
def tick(game_id: int = None, days: int = 1, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    game = resolve_game(game_id, current_user, db)

    all_events = []
    game_over = False
    for _ in range(days):
        result = process_tick(game, db)
        all_events.extend(result["events"])
        if result["game_over"]:
            game_over = True
            break

    return TickResult(
        day=game.day,
        money=game.money,
        events=all_events,
        batches_updated=0,
        contracts_fulfilled=0,
        costs_deducted=0,
        game_over=game_over,
    )


@router.post("/restart-after-game-over")
def restart_after_game_over(game_id: int = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    game = resolve_game(game_id, current_user, db)
    if not game.game_over:
        raise HTTPException(400, "Игра ещё не окончена")

    game.money = game.game_over_capital if game.game_over_capital > 0 else 500
    game.game_over = False
    game.days_bankrupt = 0
    game.bank_loan = 0
    game.day = 1
    db.commit()
    return {"message": f"Новый старт с капиталом ${game.money:.0f}", "money": game.money}


@router.get("/saves")
def list_saves(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user:
        raise HTTPException(401, "Только для зарегистрированных")
    games = db.query(GameState).filter(GameState.user_id == current_user.id).all()
    return [{"id": g.id, "name": g.name, "day": g.day, "money": g.money, "currency": g.currency} for g in games]


@router.put("/select")
def select_game(req: SelectGameRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user:
        raise HTTPException(401, "Только для зарегистрированных")
    game = db.query(GameState).filter(GameState.id == req.game_id, GameState.user_id == current_user.id).first()
    if not game:
        raise HTTPException(404, "Игра не найдена")
    current_user.active_game_id = game.id
    db.commit()
    return {"game_id": game.id, "message": f"Выбрано сохранение: {game.name}"}


@router.post("/currency")
def set_currency(game_id: int = None, req: CurrencyRequest = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    game = resolve_game(game_id, current_user, db)
    valid = ["$", "€", "₽", "£", "¥"]
    if req.currency not in valid:
        raise HTTPException(400, f"Неподдерживаемая валюта. Допустимые: {', '.join(valid)}")
    game.currency = req.currency
    db.commit()
    return {"currency": game.currency, "message": f"Валюта изменена на {game.currency}"}


@router.get("/events")
def list_events(game_id: int = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    game = resolve_game(game_id, current_user, db)
    active_events = get_active_events(game, db)
    return active_events


@router.post("/events/{event_id}/resolve")
def resolve_event(event_id: int, req: ResolveEventRequest, game_id: int = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    game = resolve_game(game_id, current_user, db)
    try:
        result = resolve_choice_event(event_id, req.choice, game, db)
        return result
    except ValueError as e:
        raise HTTPException(400, str(e))
