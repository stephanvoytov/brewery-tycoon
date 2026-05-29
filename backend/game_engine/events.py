import random
from sqlalchemy.orm import Session
from backend.models import GameState, ActiveEvent, Ingredient, IngredientType
from .templates import EVENT_DEFS


def try_generate_random_event(game: GameState, db: Session) -> list:
    events = []
    active_count = db.query(ActiveEvent).filter(
        ActiveEvent.game_state_id == game.id,
        ActiveEvent.resolved == False
    ).count()
    if active_count > 2:
        return events

    valid_events = [e for e in EVENT_DEFS if game.day >= e.get("min_day", 0)]
    if not valid_events:
        return events
    event_def = random.choice(valid_events)
    existing = db.query(ActiveEvent).filter(
        ActiveEvent.game_state_id == game.id,
        ActiveEvent.event_type == event_def["event_type"],
        ActiveEvent.resolved == False
    ).first()
    if existing:
        return events

    active = ActiveEvent(
        game_state_id=game.id,
        event_type=event_def["event_type"],
        title=event_def["title"],
        description=event_def["description"],
        duration_days=event_def.get("duration_days", 0),
        days_left=event_def.get("duration_days", 0),
        is_choice_event=event_def.get("is_choice_event", False),
        effect_data=event_def.get("effect_data", {}),
    )
    db.add(active)
    db.flush()

    if "effect_instant" in event_def:
        eff = event_def["effect_instant"]
        if "money" in eff:
            game.money += eff["money"]
        events.append(f"📰 {event_def['title']}: {event_def['description']}")

    if not event_def.get("is_choice_event") and "effect_instant" not in event_def:
        events.append(f"📰 {event_def['title']}: {event_def['description']}")

    if event_def.get("is_choice_event"):
        events.append(f"⚖️ {event_def['title']}: {event_def['description']}")

    db.flush()
    return events


def process_active_events(game: GameState, db: Session) -> list:
    events = []
    active_events = db.query(ActiveEvent).filter(
        ActiveEvent.game_state_id == game.id,
        ActiveEvent.resolved == False
    ).all()

    for ae in active_events:
        if ae.duration_days > 0:
            ae.days_left -= 1
            if ae.days_left <= 0:
                ae.resolved = True
                eff = ae.effect_data or {}
                if "reputation_bonus" in eff:
                    game.reputation = min(100, max(0, game.reputation + eff["reputation_bonus"]))
                events.append(f"✅ Событие '{ae.title}' завершилось")

    db.flush()
    return events


def get_active_events(game: GameState, db: Session) -> list:
    events = db.query(ActiveEvent).filter(
        ActiveEvent.game_state_id == game.id,
        ActiveEvent.resolved == False
    ).all()
    result = []
    for ae in events:
        d = {
            "id": ae.id,
            "event_type": ae.event_type,
            "title": ae.title,
            "description": ae.description,
            "duration_days": ae.duration_days,
            "days_left": ae.days_left,
            "is_choice_event": ae.is_choice_event,
            "choice_made": ae.choice_made,
            "resolved": ae.resolved,
            "choices": [],
        }
        if ae.is_choice_event and not ae.choice_made:
            event_def = next((e for e in EVENT_DEFS if e["event_type"] == ae.event_type), None)
            if event_def:
                d["choices"] = [
                    {"key": "a", "label": event_def.get("choice_a", {}).get("label", "Вариант А")},
                    {"key": "b", "label": event_def.get("choice_b", {}).get("label", "Вариант Б")},
                ]
        result.append(d)
    return result


def resolve_choice_event(event_id: int, choice: str, game: GameState, db: Session) -> dict:
    ae = db.query(ActiveEvent).filter(
        ActiveEvent.id == event_id,
        ActiveEvent.game_state_id == game.id
    ).first()
    if not ae:
        raise ValueError("Событие не найдено")
    if ae.choice_made:
        raise ValueError("Выбор уже сделан")

    event_def = next((e for e in EVENT_DEFS if e["event_type"] == ae.event_type), None)
    if not event_def or not event_def.get("is_choice_event"):
        raise ValueError("Это событие не требует выбора")

    key = "choice_a" if choice == "a" else "choice_b"
    choice_data = event_def.get(key)
    if not choice_data:
        raise ValueError("Неверный выбор")

    eff = choice_data["effect"]
    result_parts = []
    if "money" in eff and eff["money"] != 0:
        game.money += eff["money"]
        result_parts.append(f"{'+' if eff['money'] > 0 else ''}${eff['money']}")
    if "reputation" in eff and eff["reputation"] != 0:
        game.reputation = min(100, max(0, game.reputation + eff["reputation"]))
        result_parts.append(f"{'+' if eff['reputation'] > 0 else ''}реп {eff['reputation']}")
    if "lose_ingredients" in eff:
        ingredients = db.query(Ingredient).filter(Ingredient.game_state_id == game.id, Ingredient.type != IngredientType.adjunct).all()
        for ing in ingredients:
            loss = min(ing.quantity, eff["lose_ingredients"])
            ing.quantity -= loss
            break
        result_parts.append(f"-{eff['lose_ingredients']} кг ингредиентов")

    ae.choice_made = True
    ae.resolved = True
    db.commit()

    return {
        "message": f"{ae.title}: {choice_data['label']}. {' '.join(result_parts)}",
    }
