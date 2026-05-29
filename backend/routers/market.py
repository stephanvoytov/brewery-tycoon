from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import GameState, Contract, Brewery, User
from backend.game_engine import get_market_conditions, generate_contracts
from backend.dependencies import get_current_user, resolve_game

router = APIRouter(prefix="/api/market", tags=["market"])


@router.get("/")
def get_market(game_id: int = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    game = resolve_game(game_id, current_user, db)
    return get_market_conditions(db, game.day)


@router.get("/contracts")
def get_contracts(game_id: int = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    game = resolve_game(game_id, current_user, db)

    existing_active = db.query(Contract).filter(
        Contract.game_state_id == game.id,
        Contract.is_active == True
    ).all()

    available_unsigned = db.query(Contract).filter(
        Contract.game_state_id == game.id,
        Contract.is_active == False
    ).count()

    if available_unsigned < 3:
        new_contracts = generate_contracts(game, db, 5)
        saved = []
        for c in new_contracts:
            contract = Contract(game_state_id=game.id, **c)
            db.add(contract)
            db.flush()
            saved.append(contract)
        db.commit()
        return saved + existing_active

    all_contracts = db.query(Contract).filter(
        Contract.game_state_id == game.id
    ).order_by(Contract.id.desc()).limit(20).all()
    return all_contracts


@router.post("/contracts/{contract_id}/sign")
def sign_contract(contract_id: int, game_id: int = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    game = resolve_game(game_id, current_user, db)
    contract = db.query(Contract).filter(
        Contract.id == contract_id,
        Contract.game_state_id == game.id
    ).first()
    if not contract:
        raise HTTPException(404, "Контракт не найден")
    if contract.is_active:
        raise HTTPException(400, "Контракт уже активен")

    brewery = db.query(Brewery).filter(Brewery.game_state_id == game.id).first()
    max_slots = 1 + (brewery.level - 1) if brewery else 1
    active_count = db.query(Contract).filter(
        Contract.game_state_id == game.id,
        Contract.is_active == True
    ).count()
    if active_count >= max_slots:
        raise HTTPException(400, f"Достигнут лимит активных контрактов ({max_slots}). Повысьте уровень пивоварни.")

    contract.is_active = True
    db.commit()
    return {"message": f"Контракт с {contract.buyer_name} подписан!", "contract": contract}
