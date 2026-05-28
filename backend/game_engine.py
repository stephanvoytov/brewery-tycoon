import random
import math
from sqlalchemy.orm import Session
from backend.models import (
    GameState, Brewery, BeerRecipe, BeerBatch, BatchStage,
    Ingredient, IngredientType, Equipment, Staff, Contract,
    Research, BeerStyle, StaffRole, EquipmentType, ResearchCategory
)
from backend.config import (
    Rent, Taproom, Marketing, StaffSkill, Loan, Reputation,
    StartingBalance, Salaries, DAYS_PER_MONTH
)


def get_available_equipment(level: int):
    return [
        {"type": EquipmentType.kettle, "name": "Варочный котёл 50л", "price": 2000, "efficiency_bonus": 0.05},
        {"type": EquipmentType.kettle, "name": "Варочный котёл 100л", "price": 5000, "efficiency_bonus": 0.1},
        {"type": EquipmentType.fermenter, "name": "Ферментер 50л", "price": 1500, "efficiency_bonus": 0.03},
        {"type": EquipmentType.fermenter, "name": "Ферментер 100л", "price": 3000, "efficiency_bonus": 0.06},
        {"type": EquipmentType.bottling_line, "name": "Линия розлива", "price": 4000, "efficiency_bonus": 0.08},
        {"type": EquipmentType.kegging_line, "name": "Линия кегов", "price": 5000, "efficiency_bonus": 0.1},
        {"type": EquipmentType.mash_tun, "name": "Заторный чан", "price": 1800, "efficiency_bonus": 0.04},
        {"type": EquipmentType.cooling_system, "name": "Система охлаждения", "price": 3000, "efficiency_bonus": 0.07},
        {"type": EquipmentType.conditioning_tank, "name": "Лагерный танк", "price": 2500, "efficiency_bonus": 0.05},
    ]


STAFF_NAMES = [
    "Иван Петров", "Мария Соколова", "Алексей Иванов", "Елена Козлова",
    "Дмитрий Новиков", "Ольга Морозова", "Сергей Волков", "Анна Зайцева",
    "Павел Борисов", "Татьяна Кузнецова", "Николай Фёдоров", "Юрий Семёнов"
]

BUYER_NAMES = [
    "Бар 'Тёмная лошадка'", "Ресторан 'Прага'", "Магазин 'Пивной рай'",
    "Бар 'Крафт & Ко'", "Отель 'Центральный'", "Спорт-бар 'Гол'",
    "Паб 'Ирландский'", "Супермаркет 'Продукты+'", "Ресторан 'Бавария'",
    "Бар 'Пенная история'"
]

RECIPE_TEMPLATES = [
    {"name": "Классический Лагер", "style": BeerStyle.lager, "malt_amount": 4.5, "hops_amount": 0.3, "abv": 4.8, "ibu": 18, "srm": 3, "brew_time_days": 1, "ferment_time_days": 7, "condition_time_days": 14, "cost_per_liter": 0.4, "base_price_per_liter": 1.8},
    {"name": "Золотой Эль", "style": BeerStyle.ale, "malt_amount": 5.0, "hops_amount": 0.4, "abv": 5.2, "ibu": 25, "srm": 6, "brew_time_days": 1, "ferment_time_days": 4, "condition_time_days": 5, "cost_per_liter": 0.45, "base_price_per_liter": 2.0},
    {"name": "Тёмный Стаут", "style": BeerStyle.stout, "malt_amount": 6.5, "hops_amount": 0.5, "abv": 5.5, "ibu": 35, "srm": 40, "brew_time_days": 1, "ferment_time_days": 5, "condition_time_days": 10, "cost_per_liter": 0.55, "base_price_per_liter": 2.5},
    {"name": "Хмельная IPA", "style": BeerStyle.ipa, "malt_amount": 5.5, "hops_amount": 1.5, "abv": 6.5, "ibu": 70, "srm": 8, "brew_time_days": 1, "ferment_time_days": 5, "condition_time_days": 7, "cost_per_liter": 0.6, "base_price_per_liter": 3.0},
    {"name": "Портер", "style": BeerStyle.porter, "malt_amount": 6.0, "hops_amount": 0.6, "abv": 5.8, "ibu": 30, "srm": 30, "brew_time_days": 1, "ferment_time_days": 5, "condition_time_days": 12, "cost_per_liter": 0.5, "base_price_per_liter": 2.3},
    {"name": "Пшеничное", "style": BeerStyle.wheat, "malt_amount": 4.5, "hops_amount": 0.3, "abv": 4.5, "ibu": 12, "srm": 4, "brew_time_days": 1, "ferment_time_days": 4, "condition_time_days": 4, "cost_per_liter": 0.4, "base_price_per_liter": 1.9},
    {"name": "Пильзнер", "style": BeerStyle.pilsner, "malt_amount": 4.0, "hops_amount": 0.4, "abv": 4.5, "ibu": 22, "srm": 3, "brew_time_days": 1, "ferment_time_days": 6, "condition_time_days": 14, "cost_per_liter": 0.4, "base_price_per_liter": 1.8},
    {"name": "Кислый Эль", "style": BeerStyle.sour, "malt_amount": 4.5, "hops_amount": 0.2, "abv": 4.0, "ibu": 8, "srm": 5, "brew_time_days": 1, "ferment_time_days": 10, "condition_time_days": 20, "cost_per_liter": 0.6, "base_price_per_liter": 3.2},
    {"name": "Бок", "style": BeerStyle.bock, "malt_amount": 7.0, "hops_amount": 0.4, "abv": 7.0, "ibu": 20, "srm": 20, "brew_time_days": 1, "ferment_time_days": 7, "condition_time_days": 21, "cost_per_liter": 0.55, "base_price_per_liter": 2.8},
    {"name": "Пэйл Эль", "style": BeerStyle.pale_ale, "malt_amount": 5.0, "hops_amount": 0.8, "abv": 5.5, "ibu": 40, "srm": 10, "brew_time_days": 1, "ferment_time_days": 4, "condition_time_days": 7, "cost_per_liter": 0.5, "base_price_per_liter": 2.2},
    {"name": "Янтарный Эль", "style": BeerStyle.amber_ale, "malt_amount": 5.2, "hops_amount": 0.6, "abv": 5.5, "ibu": 28, "srm": 18, "brew_time_days": 1, "ferment_time_days": 4, "condition_time_days": 7, "cost_per_liter": 0.5, "base_price_per_liter": 2.2},
    {"name": "Бельгийский Трипель", "style": BeerStyle.belgian_tripel, "malt_amount": 7.5, "hops_amount": 0.5, "abv": 9.5, "ibu": 25, "srm": 6, "brew_time_days": 1, "ferment_time_days": 8, "condition_time_days": 21, "cost_per_liter": 0.7, "base_price_per_liter": 3.5},
]

INGREDIENT_TEMPLATES = [
    {"type": IngredientType.malt, "name": "Солод Пильзнер", "unit_cost": 0.8},
    {"type": IngredientType.malt, "name": "Солод Карамельный", "unit_cost": 1.2},
    {"type": IngredientType.malt, "name": "Солод Тёмный", "unit_cost": 1.0},
    {"type": IngredientType.malt, "name": "Солод Пшеничный", "unit_cost": 0.9},
    {"type": IngredientType.hops, "name": "Хмель Каскад", "unit_cost": 2.5},
    {"type": IngredientType.hops, "name": "Хмель Сааз", "unit_cost": 2.0},
    {"type": IngredientType.hops, "name": "Хмель Цитра", "unit_cost": 3.0},
    {"type": IngredientType.hops, "name": "Хмель Магнум", "unit_cost": 2.2},
    {"type": IngredientType.yeast, "name": "Дрожжи Лагерные", "unit_cost": 1.5},
    {"type": IngredientType.yeast, "name": "Дрожжи Элевые", "unit_cost": 1.5},
    {"type": IngredientType.yeast, "name": "Дрожжи Пшеничные", "unit_cost": 1.8},
    {"type": IngredientType.yeast, "name": "Дрожжи Штамм Бельгийский", "unit_cost": 2.5},
    {"type": IngredientType.adjunct, "name": "Кукурузные хлопья", "unit_cost": 0.5},
    {"type": IngredientType.adjunct, "name": "Кориандр", "unit_cost": 3.0},
    {"type": IngredientType.adjunct, "name": "Цедра апельсина", "unit_cost": 2.5},
    {"type": IngredientType.adjunct, "name": "Копчёный солод", "unit_cost": 1.8},
]

RESEARCH_TREE = [
    {"name": "Автоматизация варки", "category": ResearchCategory.equipment, "cost": 5000, "duration_days": 5, "effect_description": "Скорость варки +20%", "effect": {"brew_speed": 1.2}, "prerequisite_id": None},
    {"name": "Крафтовая линия", "category": ResearchCategory.equipment, "cost": 8000, "duration_days": 7, "effect_description": "Качество пива +10%", "effect": {"quality_bonus": 10}, "prerequisite_id": None},
    {"name": "Солодовня", "category": ResearchCategory.recipe, "cost": 3000, "duration_days": 3, "effect_description": "Открывает новые рецепты", "effect": {"unlock_recipes": ["smoked", "barleywine"]}, "prerequisite_id": None},
    {"name": "Маркетинг в соцсетях", "category": ResearchCategory.marketing, "cost": 2000, "duration_days": 2, "effect_description": "Репутация +5, спрос +10%", "effect": {"reputation_bonus": 5, "demand_multiplier": 1.1}, "prerequisite_id": None},
    {"name": "Экскурсии на пивоварню", "category": ResearchCategory.marketing, "cost": 4000, "duration_days": 4, "effect_description": "Доход от тапрума +30%", "effect": {"taproom_income_multiplier": 1.3}, "prerequisite_id": None},
    {"name": "Контроль качества", "category": ResearchCategory.equipment, "cost": 6000, "duration_days": 6, "effect_description": "Меньше испорченных партий", "effect": {"spoilage_reduction": 0.5}, "prerequisite_id": None},
]


def init_new_game(db: Session) -> GameState:
    game = GameState(
        name="Моя пивоварня",
        money=StartingBalance.MONEY,
        day=1,
        reputation=StartingBalance.REPUTATION,
        revenue_history=[],
        expense_history=[],
        currency="$",
    )
    db.add(game)
    db.flush()

    brewery = Brewery(
        game_state_id=game.id,
        name="Моя пивоварня",
        level=1,
        tank_count=2,
        fermenter_count=4,
        conditioning_tank_count=2,
        storage_capacity=1000,
        rent=Rent.DAILY(),
    )
    db.add(brewery)

    for tpl in RECIPE_TEMPLATES:
        recipe = BeerRecipe(game_state_id=game.id, **tpl)
        db.add(recipe)

    for ing in INGREDIENT_TEMPLATES:
        ingredient = Ingredient(
            game_state_id=game.id,
            type=ing["type"],
            name=ing["name"],
            quantity=StartingBalance.INGREDIENT_QUANTITY,
            unit_cost=ing["unit_cost"],
        )
        db.add(ingredient)

    for eq in get_available_equipment(1):
        equipment = Equipment(
            game_state_id=game.id,
            type=eq["type"],
            name=eq["name"],
            price=eq["price"],
            efficiency_bonus=eq["efficiency_bonus"],
            is_owned=False,
        )
        db.add(equipment)

    for idx, res in enumerate(RESEARCH_TREE):
        research = Research(
            game_state_id=game.id,
            **res
        )
        if idx == 0:
            research.prerequisite_id = None
        db.add(research)

    db.commit()
    db.refresh(game)
    return game


def process_tick(game: GameState, db: Session) -> list:
    events = []
    game.day += 1

    equipment_owned = db.query(Equipment).filter(
        Equipment.game_state_id == game.id,
        Equipment.is_owned == True
    ).all()

    total_efficiency = 1.0 + sum(eq.efficiency_bonus for eq in equipment_owned)

    all_staff = db.query(Staff).filter(Staff.game_state_id == game.id).all()
    staff_efficiency = 1.0 + sum(
        s.skill_level * StaffSkill.EFFICIENCY_PER_SKILL for s in all_staff
    )
    total_efficiency *= staff_efficiency

    brewery = db.query(Brewery).filter(Brewery.game_state_id == game.id).first()
    if not brewery:
        return events

    batches = db.query(BeerBatch).filter(
        BeerBatch.game_state_id == game.id,
        BeerBatch.stage.notin_([BatchStage.sold, BatchStage.spoiled])
    ).all()

    batches_updated = 0
    for batch in batches:
        batches_updated += 1
        batch.days_in_stage += 1
        recipe = db.query(BeerRecipe).filter(BeerRecipe.id == batch.recipe_id).first()
        if not recipe:
            continue

        stage_duration = 0
        if batch.stage == BatchStage.mash:
            stage_duration = max(1, int(recipe.brew_time_days / total_efficiency))
        elif batch.stage == BatchStage.boil:
            stage_duration = max(1, int(1 / total_efficiency))
        elif batch.stage == BatchStage.ferment:
            stage_duration = max(1, int(recipe.ferment_time_days / total_efficiency))
        elif batch.stage == BatchStage.condition:
            stage_duration = max(1, int(recipe.condition_time_days / total_efficiency))

        if stage_duration > 0:
            batch.stage_progress = min(100, int((batch.days_in_stage / stage_duration) * 100))

        if batch.days_in_stage >= stage_duration:
            if batch.stage == BatchStage.mash:
                batch.stage = BatchStage.boil
                batch.stage_progress = 0
                batch.days_in_stage = 0
                events.append(f"Партия #{batch.id} перешла к кипячению")
            elif batch.stage == BatchStage.boil:
                batch.stage = BatchStage.ferment
                batch.stage_progress = 0
                batch.days_in_stage = 0

                quality = 50.0
                quality += recipe.complexity * 5
                quality += (brewery.quality_bonus * 10)
                quality += random.uniform(-5, 10)
                quality = max(10, min(100, quality))
                batch.quality = quality
                events.append(f"Партия #{batch.id} начала ферментацию (качество: {quality:.0f})")
            elif batch.stage == BatchStage.ferment:
                batch.stage = BatchStage.condition
                batch.stage_progress = 0
                batch.days_in_stage = 0
                events.append(f"Партия #{batch.id} на дозревании")
            elif batch.stage == BatchStage.condition:
                batch.stage = BatchStage.packaged
                batch.stage_progress = 100
                events.append(f"Партия #{batch.id} готова к продаже!")

    contracts = db.query(Contract).filter(
        Contract.game_state_id == game.id,
        Contract.is_active == True
    ).all()

    for contract in contracts:
        contract.days_left -= 1

        matching_batches = db.query(BeerBatch).filter(
            BeerBatch.game_state_id == game.id,
            BeerBatch.stage == BatchStage.packaged,
            BeerBatch.recipe.has(style=contract.beer_style)
        ).all()

        if matching_batches:
            batch = matching_batches[0]
            deliver_amount = min(batch.batch_size_liters, contract.quantity_liters - contract.delivered_liters)
            if deliver_amount > 0:
                revenue = deliver_amount * contract.price_per_liter
                game.money += revenue
                game.total_revenue += revenue
                game.daily_revenue += revenue
                contract.total_revenue += revenue
                contract.delivered_liters += deliver_amount
                batch.batch_size_liters -= deliver_amount
                if batch.batch_size_liters <= 0:
                    batch.stage = BatchStage.sold
                events.append(f"Продажа {deliver_amount:.0f}л по контракту с {contract.buyer_name} (+${revenue:.0f})")

        if contract.days_left <= 0 and contract.delivered_liters < contract.quantity_liters:
            penalty_amount = contract.penalty
            game.money -= penalty_amount
            game.total_expenses += penalty_amount
            game.daily_expenses += penalty_amount
            contract.is_active = False
            events.append(f"Контракт с {contract.buyer_name} просрочен! Штраф ${penalty_amount:.0f}")

        if contract.delivered_liters >= contract.quantity_liters:
            contract.is_active = False
            events.append(f"Контракт с {contract.buyer_name} выполнен!")

    total_salary = 0
    for s in all_staff:
        total_salary += s.salary
        s.morale = max(0, min(100, s.morale + random.uniform(-0.5, 0.5)))

    if total_salary > 0:
        game.money -= total_salary
        game.total_expenses += total_salary
        game.daily_expenses += total_salary
        events.append(f"Выплачена зарплата: ${total_salary:.0f}")

    taproom_income = 0.0
    if brewery.has_taproom:
        taproom_income = Taproom.INCOME_PER_LEVEL * brewery.taproom_level
        completed_research = db.query(Research).filter(
            Research.game_state_id == game.id,
            Research.is_completed == True,
            Research.category == ResearchCategory.marketing,
        ).all()
        for res in completed_research:
            multiplier = res.effect.get("taproom_income_multiplier", 1.0)
            taproom_income *= multiplier
        game.money += taproom_income
        game.total_revenue += taproom_income
        game.daily_revenue += taproom_income
        events.append(f"Тапрум принёс: ${taproom_income:.0f}")

    active_research = db.query(Research).filter(
        Research.game_state_id == game.id,
        Research.is_started == True,
        Research.is_completed == False
    ).all()
    for res in active_research:
        res.progress_days += 1
        if res.progress_days >= res.duration_days:
            res.is_completed = True
            res.is_started = False
            effect = res.effect or {}
            if "reputation_bonus" in effect:
                game.reputation = min(100, game.reputation + effect["reputation_bonus"])
            if "quality_bonus" in effect:
                brewery.quality_bonus += effect["quality_bonus"]
            events.append(f"Исследование '{res.name}' завершено!")

    game.money -= brewery.rent
    game.total_expenses += brewery.rent
    game.daily_expenses += brewery.rent
    events.append(f"Аренда: ${brewery.rent:.0f}")

    if game.bank_loan > 0:
        interest = game.bank_loan * Loan.DAILY_INTEREST_RATE
        game.money -= interest
        game.total_expenses += interest
        game.daily_expenses += interest

    reputation_change = random.uniform(-0.2, Reputation.CHANGE_PER_DAY)
    if game.reputation < 100:
        game.reputation = min(100, max(0, game.reputation + reputation_change))

    revenue_history = game.revenue_history or []
    expense_history = game.expense_history or []
    revenue_history.append(game.daily_revenue)
    expense_history.append(game.daily_expenses)
    if len(revenue_history) > 30:
        revenue_history = revenue_history[-30:]
    if len(expense_history) > 30:
        expense_history = expense_history[-30:]
    game.revenue_history = revenue_history
    game.expense_history = expense_history
    game.daily_revenue = 0
    game.daily_expenses = 0

    if game.money < 0 and game.bank_loan <= 0:
        game.bank_loan = abs(game.money) * 1.1
        game.money = 0
        events.append(f"Взят кредит: ${game.bank_loan:.0f}")

    db.commit()
    return events


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
    for _ in range(count):
        style = random.choice(list(BeerStyle))
        base_price = 1.5 + random.uniform(0, 2.0)
        quantity = random.randint(100, 1000)
        duration = random.randint(10, 60)
        contracts.append({
            "buyer_name": random.choice(BUYER_NAMES),
            "beer_style": style.value,
            "quantity_liters": quantity,
            "price_per_liter": round(base_price, 2),
            "duration_days": duration,
            "days_left": duration,
            "penalty": round(quantity * base_price * 0.2, 0),
        })
    return contracts
