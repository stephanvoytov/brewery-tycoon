from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException
from backend.database import engine, Base
from backend.routers import game, brewery, recipes, batches, inventory, staff, market, research

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Пивоваренный Тайкун", description="Brewery Tycoon Game API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(game.router)
app.include_router(brewery.router)
app.include_router(recipes.router)
app.include_router(batches.router)
app.include_router(inventory.router)
app.include_router(staff.router)
app.include_router(market.router)
app.include_router(research.router)


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
