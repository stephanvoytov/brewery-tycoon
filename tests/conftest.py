import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.models import Base, GameState, Brewery
from backend.config import Buildings, StartingBalance


@pytest.fixture(scope="function")
def db():
    DB_PATH = os.path.join(os.path.dirname(__file__), '_test.db')
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
    engine = create_engine(f'sqlite:///{DB_PATH}', connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(bind=engine)
    session = TestingSession()
    yield session
    session.close()
    engine.dispose()
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)


@pytest.fixture(scope="function")
def game(db):
    g = GameState(
        name="Test Game",
        money=StartingBalance.MONEY,
        day=1,
        reputation=StartingBalance.REPUTATION,
        revenue_history=[],
        expense_history=[],
        currency="$",
    )
    db.add(g)
    db.flush()
    return g


@pytest.fixture(scope="function")
def brewery(db, game):
    default_bld = Buildings.LIST[Buildings.DEFAULT_ID]
    b = Brewery(
        game_state_id=game.id,
        name="Test Brewery",
        level=1,
        tank_count=default_bld["tanks"],
        tank_volume=default_bld["kettle_vol"],
        building_id=Buildings.DEFAULT_ID,
        fermenter_count=default_bld["fermenters"],
        conditioning_tank_count=default_bld.get("cond_tanks", 0),
        storage_capacity=default_bld["storage"],
        rent=default_bld["rent"],
    )
    db.add(b)
    db.flush()
    return b
