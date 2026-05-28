from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import GameState, Research, User
from backend.dependencies import get_current_user, resolve_game

router = APIRouter(prefix="/api/research", tags=["research"])


@router.get("/")
def get_research(game_id: int = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    game = resolve_game(game_id, current_user, db)
    research = db.query(Research).filter(Research.game_state_id == game.id).all()
    return research


@router.post("/{research_id}/start")
def start_research(research_id: int, game_id: int = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    game = resolve_game(game_id, current_user, db)
    res = db.query(Research).filter(
        Research.id == research_id,
        Research.game_state_id == game.id
    ).first()

    if not res:
        raise HTTPException(404, "Исследование не найдено")
    if res.is_completed:
        raise HTTPException(400, "Исследование уже завершено")
    if res.is_started:
        raise HTTPException(400, "Исследование уже начато")
    if res.prerequisite_id:
        prereq = db.query(Research).filter(Research.id == res.prerequisite_id).first()
        if not prereq or not prereq.is_completed:
            raise HTTPException(400, "Не выполнено prerequisite-исследование")
    if game.money < res.cost:
        raise HTTPException(400, f"Недостаточно средств. Нужно ${res.cost:.0f}")

    game.money -= res.cost
    res.is_started = True
    db.commit()

    return {"message": f"Исследование '{res.name}' начато!", "cost": res.cost}
