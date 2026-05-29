import os
from datetime import datetime, timedelta, timezone
from fastapi import Header, HTTPException, Depends
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from backend.database import get_db
from backend.models import GameState, User

JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET не задан в переменных окружения")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 24


def create_token(user_id: int) -> str:
    payload = {
        "sub": str(user_id),
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def get_current_user(authorization: str = Header(default=None), db: Session = Depends(get_db)):
    if not authorization:
        return None
    try:
        scheme, _, token = authorization.partition(" ")
        if scheme.lower() != "bearer" or not token:
            return None
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM], options={"require": ["exp"]})
        user_id = int(payload.get("sub"))
        return db.query(User).filter(User.id == user_id).first()
    except (JWTError, ValueError, TypeError):
        return None


def resolve_game(game_id: int | None, current_user: User | None, db: Session) -> GameState:
    if game_id is not None:
        game = db.query(GameState).filter(GameState.id == game_id).first()
    elif current_user and current_user.active_game_id:
        game = db.query(GameState).filter(GameState.id == current_user.active_game_id).first()
    else:
        raise HTTPException(400, "Укажите game_id")
    if not game:
        raise HTTPException(404, "Игра не найдена")
    if current_user and game.user_id and game.user_id != current_user.id:
        raise HTTPException(403, "Это не ваша игра")
    return game
