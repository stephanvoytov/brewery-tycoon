from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException
from backend.database import engine, Base
from backend.routers import game, brewery, recipes, batches, inventory, staff, market, research, auth, leaderboard

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

app = FastAPI(title="Пивоваренный Тайкун", description="Brewery Tycoon Game API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
