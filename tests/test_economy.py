from backend.game_engine import get_market_conditions, generate_contracts


def test_get_market_conditions(db):
    conditions = get_market_conditions(db, day=1)
    assert len(conditions) >= 12
    for c in conditions:
        assert "beer_style" in c
        assert "base_demand" in c
        assert "price_modifier" in c
        assert "season_factor" in c
        assert 20 <= c["base_demand"] <= 100
        assert 0.5 <= c["price_modifier"] <= 1.5


def test_get_market_conditions_seasonal(db):
    summer = get_market_conditions(db, day=180)
    winter = get_market_conditions(db, day=1)
    assert len(summer) == len(winter)


def test_generate_contracts(db, game):
    contracts = generate_contracts(game, db, 5)
    assert len(contracts) == 5
    for c in contracts:
        assert "buyer_name" in c
        assert "beer_style" in c
        assert "quantity_liters" in c
        assert "price_per_liter" in c
        assert "duration_days" in c
        assert "days_left" in c
        assert "penalty" in c
        assert c["quantity_liters"] >= 100
        assert c["price_per_liter"] >= 1.5
        assert c["duration_days"] >= 10


def test_generate_contracts_different_styles(db, game):
    contracts = generate_contracts(game, db, 20)
    styles = {c["beer_style"] for c in contracts}
    assert len(styles) > 3
