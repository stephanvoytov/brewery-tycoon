from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import GameState, Brewery, BeerRecipe, BeerBatch, Ingredient, Equipment, Staff, Contract, Research, User
from backend.schemas import FullGameState, GameStateSchema, TickResult, CurrencyRequest, SelectGameRequest
from backend.game_engine import init_new_game, process_tick, get_market_conditions
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
    research = db.query(Research).filter(Research.game_state_id == game.id).all()
    market = get_market_conditions(db, game.day)

    return FullGameState(
        game=GameStateSchema.model_validate(game),
        brewery=brewery,
        recipes=recipes,
        batches=batches,
        ingredients=ingredients,
        equipment=equipment,
        staff=staff,
        contracts=contracts,
        market=market,
        research=research,
    )


@router.post("/tick")
def tick(game_id: int = None, days: int = 1, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    game = resolve_game(game_id, current_user, db)

    all_events = []
    for _ in range(days):
        events = process_tick(game, db)
        all_events.extend(events)

    return TickResult(
        day=game.day,
        money=game.money,
        events=all_events,
        batches_updated=0,
        contracts_fulfilled=0,
        costs_deducted=0,
    )


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
