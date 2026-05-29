import math
import random
from sqlalchemy.orm import Session
from backend.models import GameState, Brewery, BeerStyle, Contract
from backend.config import LevelFormula
from .templates import BUYER_NAMES


def get_market_conditions(db: Session, day: int) -> list:
    conditions = []
    season = (day % 365) / 365
    season_factor = 1.0 + 0.3 * math.sin(2 * math.pi * (season - 0.25))

    for style in BeerStyle:
        base_demand = random.uniform(30, 80)
        price_modifier = random.uniform(0.8, 1.2)

        if style in [BeerStyle.wheat, BeerStyle.pilsner, BeerStyle.lager]:
            demand = base_demand * (1.0 + 0.2 * math.sin(2 * math.pi * (season - 0.1)))
        elif style in [BeerStyle.stout, BeerStyle.porter, BeerStyle.bock]:
            demand = base_demand * (1.0 + 0.3 * math.sin(2 * math.pi * (season - 0.6)))
        else:
            demand = base_demand

        conditions.append({
            "beer_style": style.value,
            "base_demand": round(demand, 1),
            "price_modifier": round(price_modifier, 2),
            "season_factor": round(season_factor, 2),
        })

    return conditions


def generate_contracts(game: GameState, db: Session, count: int = 5) -> list:
    contracts = []
    brewery = db.query(Brewery).filter(Brewery.game_state_id == game.id).first()
    level_mult = 1 + (brewery.level - 1) * 0.05 if brewery else 1.0
    for _ in range(count):
        style = random.choice(list(BeerStyle))
        base_price = 1.5 + random.uniform(0, 2.0)
        quantity = random.randint(100, 1000)
        duration = random.randint(10, 60)
        contracts.append({
            "buyer_name": random.choice(BUYER_NAMES),
            "beer_style": style.value,
            "quantity_liters": quantity,
            "price_per_liter": round(base_price * level_mult, 2),
            "duration_days": duration,
            "days_left": duration,
            "penalty": round(quantity * base_price * 0.2, 0),
        })
    return contracts
