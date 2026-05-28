import random
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import GameState, Staff, StaffRole
from backend.game_engine import STAFF_NAMES
from backend.config import Salaries

router = APIRouter(prefix="/api/staff", tags=["staff"])

SALARIES = {
    StaffRole.brewer: Salaries.BREWER_DAILY(),
    StaffRole.sales: Salaries.SALES_DAILY(),
    StaffRole.admin: Salaries.ADMIN_DAILY(),
}


@router.get("/")
def get_staff(game_id: int, db: Session = Depends(get_db)):
    staff = db.query(Staff).filter(Staff.game_state_id == game_id).all()
    return staff


@router.post("/hire")
def hire_staff(game_id: int, role: str, db: Session = Depends(get_db)):
    game = db.query(GameState).filter(GameState.id == game_id).first()
    if not game:
        raise HTTPException(404, "Игра не найдена")

    try:
        staff_role = StaffRole(role)
    except ValueError:
        raise HTTPException(400, f"Неизвестная роль: {role}")

    salary = SALARIES[staff_role]
    hired_day = game.day
    name = random.choice(STAFF_NAMES)

    staff = Staff(
        game_state_id=game_id,
        name=name,
        role=staff_role,
        skill_level=random.randint(1, 5),
        salary=salary,
        morale=70.0,
        hired_day=hired_day,
    )
    db.add(staff)
    db.commit()
    db.refresh(staff)
    return {"message": f"Нанят {name} ({role}) за ${salary}/день", "staff": staff}


@router.post("/{staff_id}/fire")
def fire_staff(game_id: int, staff_id: int, db: Session = Depends(get_db)):
    staff = db.query(Staff).filter(
        Staff.id == staff_id,
        Staff.game_state_id == game_id
    ).first()
    if not staff:
        raise HTTPException(404, "Сотрудник не найден")
    db.delete(staff)
    db.commit()
    return {"message": f"{staff.name} уволен"}


@router.post("/{staff_id}/train")
def train_staff(game_id: int, staff_id: int, db: Session = Depends(get_db)):
    staff = db.query(Staff).filter(
        Staff.id == staff_id,
        Staff.game_state_id == game_id
    ).first()
    game = db.query(GameState).filter(GameState.id == game_id).first()
    if not staff or not game:
        raise HTTPException(404, "Сотрудник или игра не найдена")
    if staff.skill_level >= 10:
        raise HTTPException(400, "Максимальный уровень навыка")

    cost = staff.skill_level * 200
    if game.money < cost:
        raise HTTPException(400, f"Недостаточно средств. Нужно ${cost}")
    game.money -= cost
    staff.skill_level += 1
    staff.salary *= 1.1
    db.commit()
    return {"message": f"{staff.name} обучен до уровня {staff.skill_level}", "cost": cost}
