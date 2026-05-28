from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import GameState, Contract
from backend.game_engine import get_market_conditions, generate_contracts

router = APIRouter(prefix="/api/market", tags=["market"])


@router.get("/")
def get_market(game_id: int, db: Session = Depends(get_db)):
    game = db.query(GameState).filter(GameState.id == game_id).first()
    if not game:
        raise HTTPException(404, "Игра не найдена")
    return get_market_conditions(db, game.day)


@router.get("/contracts")
def get_contracts(game_id: int, db: Session = Depends(get_db)):
    game = db.query(GameState).filter(GameState.id == game_id).first()
    if not game:
        raise HTTPException(404, "Игра не найдена")

    existing_active = db.query(Contract).filter(
        Contract.game_state_id == game_id,
        Contract.is_active == True
    ).all()

    available_unsigned = db.query(Contract).filter(
        Contract.game_state_id == game_id,
        Contract.is_active == False
    ).count()

    if available_unsigned < 3:
        new_contracts = generate_contracts(game, db, 5)
        saved = []
        for c in new_contracts:
            contract = Contract(game_state_id=game_id, **c)
            db.add(contract)
            db.flush()
            saved.append(contract)
        db.commit()
        return saved + existing_active

    all_contracts = db.query(Contract).filter(
        Contract.game_state_id == game_id
    ).order_by(Contract.id.desc()).limit(20).all()
    return all_contracts


@router.post("/contracts/{contract_id}/sign")
def sign_contract(game_id: int, contract_id: int, db: Session = Depends(get_db)):
    contract = db.query(Contract).filter(
        Contract.id == contract_id,
        Contract.game_state_id == game_id
    ).first()
    if not contract:
        raise HTTPException(404, "Контракт не найден")
    if contract.is_active:
        raise HTTPException(400, "Контракт уже активен")
    contract.is_active = True
    db.commit()
    return {"message": f"Контракт с {contract.buyer_name} подписан!", "contract": contract}
