from sqlalchemy.orm import Session
from backend.models import GameState, Brewery, BeerBatch, Staff, BatchStage
from .templates import ACHIEVEMENT_DEFS


def check_achievements(game: GameState, db: Session) -> list:
    events = []
    unlocked = set(game.achievements or [])
    brewery = db.query(Brewery).filter(Brewery.game_state_id == game.id).first()
    staff_count = db.query(Staff).filter(Staff.game_state_id == game.id).count()
    batch_count = db.query(BeerBatch).filter(
        BeerBatch.game_state_id == game.id,
        BeerBatch.stage.in_([BatchStage.packaged, BatchStage.sold])
    ).count()

    checks = {
        "first_batch": batch_count >= 1,
        "first_staff": staff_count >= 1,
        "first_contract": game.total_revenue > 0,
        "first_upgrade": brewery and (brewery.upgrade_count or 0) > 0,
        "revenue_10k": game.total_revenue >= 10000,
        "revenue_50k": game.total_revenue >= 50000,
        "revenue_100k": game.total_revenue >= 100000,
        "staff_3": staff_count >= 3,
        "reputation_90": game.reputation >= 90,
    }

    for ach in ACHIEVEMENT_DEFS:
        if ach["id"] not in unlocked and checks.get(ach["id"]):
            unlocked.add(ach["id"])
            game.achievements = list(unlocked)
            bonus = ach.get("bonus", {})
            bonus_parts = []
            if "reputation" in bonus:
                game.reputation = min(100, game.reputation + bonus["reputation"])
                bonus_parts.append(f"репутация +{bonus['reputation']}")
            if "upgrade_discount" in bonus and brewery:
                brewery.quality_bonus += 0.05
                bonus_parts.append("скидка на улучшения 10%")
            if "demand_bonus" in bonus and brewery:
                brewery.marketing_level += 1
                bonus_parts.append(f"спрос +{int(bonus['demand_bonus'] * 100)}%")
            bonus_text = f" ({', '.join(bonus_parts)})" if bonus_parts else ""
            events.append(f"🎉 Достижение: {ach['icon']} {ach['name']} — {ach['desc']}{bonus_text}")

    return events
