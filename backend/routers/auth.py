import hashlib, secrets
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import User
from backend.schemas import AuthRequest, TokenResponse, UserOut
from backend.dependencies import create_token, get_current_user


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    h = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
    return f'{salt}${h.hex()}'


def verify_password(password: str, hashed: str) -> bool:
    salt, h = hashed.split('$', 1)
    return hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000).hex() == h

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register")
def register(req: AuthRequest, db: Session = Depends(get_db)):
    if len(req.username) < 2 or len(req.username) > 20:
        raise HTTPException(400, "Имя пользователя должно быть от 2 до 20 символов")
    if len(req.password) < 6:
        raise HTTPException(400, "Пароль должен быть минимум 6 символов")
    if db.query(User).filter(User.username == req.username).first():
        raise HTTPException(409, "Это имя уже занято")

    user = User(username=req.username, password_hash=hash_password(req.password))
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_token(user.id)
    return TokenResponse(token=token, user=UserOut.model_validate(user))


@router.post("/login")
def login(req: AuthRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == req.username).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(401, "Неверное имя пользователя или пароль")

    token = create_token(user.id)
    return TokenResponse(token=token, user=UserOut.model_validate(user))


@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(401, "Не авторизован")
    return UserOut.model_validate(current_user)
