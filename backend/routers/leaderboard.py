from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from backend.database import get_db
from backend.models import GameState, User
from backend.schemas import LeaderboardResponse, LeaderboardEntry

router = APIRouter(prefix="/api/leaderboard", tags=["leaderboard"])


@router.get("")
def get_leaderboard(
    metric: str = Query("money", description="money, total_revenue, reputation, day"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    valid_metrics = {
        "money": GameState.money,
        "total_revenue": GameState.total_revenue,
        "reputation": GameState.reputation,
        "day": GameState.day,
    }
    sort_col = valid_metrics.get(metric)
    if not sort_col:
        sort_col = GameState.money

    rows = (
        db.query(GameState, User)
        .join(User, GameState.user_id == User.id)
        .filter(GameState.user_id.isnot(None))
        .order_by(desc(sort_col))
        .limit(limit)
        .all()
    )

    entries = [
        LeaderboardEntry(
            rank=idx + 1,
            username=user.username,
            money=round(game.money, 2),
            day=game.day,
            reputation=round(game.reputation, 2),
            total_revenue=round(game.total_revenue, 2),
        )
        for idx, (game, user) in enumerate(rows)
    ]

    return LeaderboardResponse(entries=entries)
