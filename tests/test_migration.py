import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.models import Base, Brewery, BreweryKettle, BreweryFermenter, BreweryCondTank
from backend.game_engine import migrate_old_brewery_equipment

DB_PATH = os.path.join(os.path.dirname(__file__), 'test_migration.db')

def test_migration():
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)

    engine = create_engine(f'sqlite:///{DB_PATH}')
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    db = Session()

    brewery = Brewery(
        tank_count=3, tank_volume=100,
        fermenter_count=4, conditioning_tank_count=2,
        building_id=0, level=1, rent=3,
        has_taproom=False, taproom_level=0, storage_capacity=100,
        quality_bonus=0.0, marketing_level=1,
    )
    db.add(brewery)
    db.commit()

    migrate_old_brewery_equipment(db)

    kettles = db.query(BreweryKettle).filter(BreweryKettle.brewery_id == brewery.id).all()
    ferms = db.query(BreweryFermenter).filter(BreweryFermenter.brewery_id == brewery.id).all()
    conds = db.query(BreweryCondTank).filter(BreweryCondTank.brewery_id == brewery.id).all()

    assert len(kettles) == 3, f"Expected 3 kettles, got {len(kettles)}"
    assert len(ferms) == 4, f"Expected 4 fermenters, got {len(ferms)}"
    assert len(conds) == 2, f"Expected 2 cond tanks, got {len(conds)}"

    for k in kettles:
        assert k.type_id is not None
        assert k.purchase_price > 0

    print(f"OK: {len(kettles)} kettles, {len(ferms)} fermenters, {len(conds)} cond tanks")
    db.close()
    db.bind.dispose()
    os.remove(DB_PATH)

if __name__ == '__main__':
    test_migration()
