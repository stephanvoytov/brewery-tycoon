from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException
from backend.database import engine, Base
from backend.routers import game, brewery, recipes, batches, inventory, staff, market, research, auth, leaderboard, finance

Base.metadata.create_all(bind=engine)

from sqlalchemy import inspect, text
insp = inspect(engine)
cols = [c["name"] for c in insp.get_columns("game_states")]
if "user_id" not in cols:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE game_states ADD COLUMN user_id INTEGER REFERENCES users(id)"))
        conn.commit()

recipe_cols = [c["name"] for c in insp.get_columns("beer_recipes")]
for col_name, default in [("malt_ingredient_name", "'Солод Пильзнер'"), ("hops_ingredient_name", "'Хмель Каскад'"), ("yeast_ingredient_name", "'Дрожжи Элевые'")]:
    if col_name not in recipe_cols:
        with engine.connect() as conn:
            conn.execute(text(f"ALTER TABLE beer_recipes ADD COLUMN {col_name} VARCHAR DEFAULT {default}"))
            conn.commit()

game_cols = [c["name"] for c in insp.get_columns("game_states")]
for col_name in ["days_bankrupt", "game_over", "game_over_capital", "achievements"]:
    if col_name not in game_cols:
        with engine.connect() as conn:
            if col_name in ("days_bankrupt",):
                conn.execute(text(f"ALTER TABLE game_states ADD COLUMN {col_name} INTEGER DEFAULT 0"))
            elif col_name == "game_over":
                conn.execute(text(f"ALTER TABLE game_states ADD COLUMN {col_name} INTEGER DEFAULT 0"))
            elif col_name == "game_over_capital":
                conn.execute(text(f"ALTER TABLE game_states ADD COLUMN {col_name} FLOAT DEFAULT 0.0"))
            elif col_name == "achievements":
                conn.execute(text(f"ALTER TABLE game_states ADD COLUMN {col_name} JSON DEFAULT '[]'"))
            conn.commit()

for col_name in ["has_insurance", "player_total_liters"]:
    if col_name not in game_cols:
        with engine.connect() as conn:
            if col_name == "has_insurance":
                conn.execute(text("ALTER TABLE game_states ADD COLUMN has_insurance INTEGER DEFAULT 0"))
            elif col_name == "player_total_liters":
                conn.execute(text("ALTER TABLE game_states ADD COLUMN player_total_liters FLOAT DEFAULT 0.0"))
            conn.commit()

for col_name in ["brewing_level", "total_batches_completed", "quality_history"]:
    if col_name not in game_cols:
        with engine.connect() as conn:
            if col_name == "brewing_level":
                conn.execute(text("ALTER TABLE game_states ADD COLUMN brewing_level INTEGER DEFAULT 1"))
            elif col_name == "total_batches_completed":
                conn.execute(text("ALTER TABLE game_states ADD COLUMN total_batches_completed INTEGER DEFAULT 0"))
            elif col_name == "quality_history":
                conn.execute(text("ALTER TABLE game_states ADD COLUMN quality_history JSON DEFAULT '[]'"))
            conn.commit()

game_cols = [c["name"] for c in insp.get_columns("game_states")]
for col_name, col_type in [("inflation_multiplier", "FLOAT DEFAULT 1.0"), ("last_tax_day", "INTEGER DEFAULT 0"), ("last_revenue_check", "FLOAT DEFAULT 0.0")]:
    if col_name not in game_cols:
        with engine.connect() as conn:
            conn.execute(text(f"ALTER TABLE game_states ADD COLUMN {col_name} {col_type}"))
            conn.commit()

eq_cols = [c["name"] for c in insp.get_columns("equipment")]
if "wear_tear" not in eq_cols:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE equipment ADD COLUMN wear_tear FLOAT DEFAULT 100.0"))
        conn.commit()

recipe_cols_new = [c["name"] for c in insp.get_columns("beer_recipes")]
for col_name, col_type in [("mastery_count", "INTEGER DEFAULT 0"), ("hidden_params", "JSON DEFAULT '{}'"), ("is_unlocked", "INTEGER DEFAULT 1")]:
    if col_name not in recipe_cols_new:
        with engine.connect() as conn:
            conn.execute(text(f"ALTER TABLE beer_recipes ADD COLUMN {col_name} {col_type}"))
            conn.commit()

batch_cols = [c["name"] for c in insp.get_columns("beer_batches")]
for col_name, col_type in [("actual_abv", "FLOAT DEFAULT 0.0"), ("actual_ibu", "INTEGER DEFAULT 0"), ("actual_srm", "INTEGER DEFAULT 0"), ("skip_condition", "INTEGER DEFAULT 0")]:
    if col_name not in batch_cols:
        with engine.connect() as conn:
            conn.execute(text(f"ALTER TABLE beer_batches ADD COLUMN {col_name} {col_type}"))
            conn.commit()

brewery_cols = [c["name"] for c in insp.get_columns("breweries")]
if "tank_volume" not in brewery_cols:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE breweries ADD COLUMN tank_volume INTEGER DEFAULT 100"))
        conn.commit()
if "building_id" not in brewery_cols:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE breweries ADD COLUMN building_id INTEGER DEFAULT 1"))
        conn.commit()

# Remove legacy equipment (дублировали улучшения или не имели эффекта)
old_equipment_names = [
    "Варочный котёл 50л", "Варочный котёл 100л",
    "Ферментер 50л", "Ферментер 100л",
]
eq_cols_new = [c["name"] for c in insp.get_columns("equipment")]
if "name" in eq_cols_new:
    with engine.connect() as conn:
        for eq_name in old_equipment_names:
            conn.execute(
                text("DELETE FROM equipment WHERE name = :name AND is_owned = 0"),
                {"name": eq_name}
            )
        conn.commit()

# Rename legacy equipment names to new emoji-prefixed names
equip_rename_map = {
    "Линия розлива": "🍾 Линия розлива",
    "Система охлаждения": "🧊 Система охлаждения",
    "Лагерный танк": "🛢 Лагерный танк",
    "Линия кегов": "🛞 Линия кегов",
    "Заторный чан": "🏺 Заторный чан",
}
if "name" in eq_cols_new:
    with engine.connect() as conn:
        for old_name, new_name in equip_rename_map.items():
            conn.execute(
                text("UPDATE equipment SET name = :new WHERE name = :old"),
                {"new": new_name, "old": old_name}
            )
        conn.commit()

# Migrate old brewery equipment to new individual equipment system
try:
    from sqlalchemy.orm import Session as _Session
    from backend.game_engine import migrate_old_brewery_equipment
    with _Session(engine) as _s:
        migrate_old_brewery_equipment(_s)
except Exception as e:
    print(f"[migrate_equipment] {e}")

app = FastAPI(title="Пивоваренный Тайкун", description="Brewery Tycoon Game API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://brewery-tycoon.mooo.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(game.router)
app.include_router(brewery.router)
app.include_router(recipes.router)
app.include_router(batches.router)
app.include_router(inventory.router)
app.include_router(staff.router)
app.include_router(market.router)
app.include_router(research.router)
app.include_router(leaderboard.router)
app.include_router(finance.router)


class SPAStaticFiles(StaticFiles):
    async def get_response(self, path: str, scope):
        try:
            return await super().get_response(path, scope)
        except StarletteHTTPException as ex:
            if ex.status_code == 404:
                return await super().get_response(".", scope)
            raise


frontend_path = Path(__file__).resolve().parent.parent / "frontend"
app.mount("/", SPAStaticFiles(directory=str(frontend_path), html=True), name="frontend")
