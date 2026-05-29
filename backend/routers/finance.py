from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import GameState, Brewery, User
from backend.schemas import LoanActionRequest, LoanInfo
from backend.dependencies import get_current_user, resolve_game
from backend.config import Loan

router = APIRouter(prefix="/api/finance", tags=["finance"])


def calc_max_loan(game: GameState, brewery: Brewery) -> float:
    return Loan.BASE_LIMIT + game.reputation * Loan.REP_PER_LIMIT + brewery.level * Loan.LEVEL_PER_LIMIT


def calc_interest_rate(reputation: float) -> float:
    rate = Loan.MIN_RATE + (1 - reputation / 100) * Loan.RATE_RANGE
    return round(min(0.01, max(0.003, rate)), 4)


@router.get("/loan/info")
def get_loan_info(game_id: int = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    game = resolve_game(game_id, current_user, db)
    brewery = db.query(Brewery).filter(Brewery.game_state_id == game.id).first()
    return LoanInfo(
        max_loan=calc_max_loan(game, brewery),
        current_debt=game.bank_loan or 0,
        interest_rate=calc_interest_rate(game.reputation),
        reputation=game.reputation,
        brewery_level=brewery.level if brewery else 1,
    )


@router.post("/loan/take")
def take_loan(req: LoanActionRequest, game_id: int = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    game = resolve_game(game_id, current_user, db)
    brewery = db.query(Brewery).filter(Brewery.game_state_id == game.id).first()

    if req.amount <= 0:
        raise HTTPException(400, "Сумма должна быть положительной")

    max_loan = calc_max_loan(game, brewery)
    current_debt = game.bank_loan or 0
    if current_debt + req.amount > max_loan:
        raise HTTPException(400, f"Превышен лимит кредитования. Доступно: ${max_loan - current_debt:.0f}")

    game.bank_loan = current_debt + req.amount
    game.money += req.amount
    db.commit()
    return {"message": f"Кредит ${req.amount:.0f} выдан! Долг: ${game.bank_loan:.0f}", "bank_loan": game.bank_loan, "money": game.money}


@router.post("/loan/repay")
def repay_loan(req: LoanActionRequest, game_id: int = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    game = resolve_game(game_id, current_user, db)

    if req.amount <= 0:
        raise HTTPException(400, "Сумма должна быть положительной")

    current_debt = game.bank_loan or 0
    if req.amount > current_debt:
        req.amount = current_debt

    if game.money < req.amount:
        raise HTTPException(400, f"Недостаточно средств. Нужно ${req.amount:.0f}, есть ${game.money:.0f}")

    game.money -= req.amount
    game.bank_loan = current_debt - req.amount

    db.commit()
    remaining = game.bank_loan or 0
    msg = f"Погашено ${req.amount:.0f}. Остаток долга: ${remaining:.0f}" if remaining > 0 else "💰 Кредит полностью погашен!"
    return {"message": msg, "bank_loan": remaining, "money": game.money}
