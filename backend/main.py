from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException
from backend.database import engine, Base
from backend.routers import game, brewery, recipes, batches, inventory, staff, market, research, auth, leaderboard, finance, config_export

Base.metadata.create_all(bind=engine)

from backend.database import SessionLocal
from alembic.config import Config as AlembicConfig
from alembic import command

try:
    alembic_cfg = AlembicConfig(Path(__file__).resolve().parent / "alembic.ini")
    command.upgrade(alembic_cfg, "head")
except Exception as e:
    print(f"[alembic] {e}")

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
app.include_router(config_export.router)


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
