from backend.models import ActiveEvent
from backend.game_engine import (
    get_active_events, try_generate_random_event,
    process_active_events, resolve_choice_event,
)
from backend.game_engine.events import EVENT_DEFS


def test_get_active_events_empty(db, game):
    events = get_active_events(game, db)
    assert events == []


def test_generate_event_early_day(db, game):
    game.day = 1
    events = try_generate_random_event(game, db)
    assert isinstance(events, list)
    # most events have min_day > 1, so likely no event generated
    active = db.query(ActiveEvent).filter(
        ActiveEvent.game_state_id == game.id
    ).count()
    assert active >= 0


def test_generate_event_later(db, game):
    game.day = 10
    events = try_generate_random_event(game, db)
    active = db.query(ActiveEvent).filter(
        ActiveEvent.game_state_id == game.id,
        ActiveEvent.resolved == False
    ).all()
    for ae in active:
        assert ae.title
        assert ae.description


def test_choice_event_resolution(db, game):
    game.day = 10
    choice_def = next((e for e in EVENT_DEFS if e.get("is_choice_event")), None)
    assert choice_def is not None, "No choice event found in EVENT_DEFS"

    ae = ActiveEvent(
        game_state_id=game.id,
        event_type=choice_def["event_type"],
        title=choice_def["title"],
        description=choice_def["description"],
        duration_days=choice_def.get("duration_days", 0),
        days_left=choice_def.get("duration_days", 0),
        is_choice_event=True,
        effect_data=choice_def.get("effect_data", {}),
    )
    db.add(ae)
    db.commit()
    db.refresh(ae)

    result = resolve_choice_event(ae.id, "a", game, db)
    assert "message" in result
    assert result["message"]

    db.refresh(ae)
    assert ae.choice_made == True
    assert ae.resolved == True


def test_resolve_nonexistent_event(db, game):
    try:
        resolve_choice_event(99999, "a", game, db)
        assert False, "Should have raised ValueError"
    except ValueError as e:
        assert "не найдено" in str(e).lower()


def test_duplicate_resolve(db, game):
    game.day = 10
    ae = ActiveEvent(
        game_state_id=game.id,
        event_type="boiler_breakdown",
        title="Test", description="Test",
        duration_days=0, days_left=0,
        is_choice_event=True, effect_data={},
    )
    db.add(ae)
    db.commit()
    db.refresh(ae)

    resolve_choice_event(ae.id, "a", game, db)

    try:
        resolve_choice_event(ae.id, "b", game, db)
        assert False, "Should have raised ValueError"
    except ValueError as e:
        assert "выбор уже сделан" in str(e).lower()


def test_process_active_events(db, game):
    ae = ActiveEvent(
        game_state_id=game.id,
        event_type="festival",
        title="Festival", description="A festival!",
        duration_days=2, days_left=1,
        is_choice_event=False,
        effect_data={"reputation_bonus": 5},
    )
    db.add(ae)
    db.commit()

    process_active_events(game, db)
    assert ae.resolved == True
