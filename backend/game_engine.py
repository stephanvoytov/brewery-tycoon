import random
import math
from sqlalchemy.orm import Session
from backend.models import (
    GameState, Brewery, BeerRecipe, BeerBatch, BatchStage,
    Ingredient, IngredientType, Equipment, Staff, Contract,
    Research, BeerStyle, StaffRole, EquipmentType, ResearchCategory,
    Competitor, COMPETITOR_NAMES, ActiveEvent
)
from backend.config import (
    Rent, Taproom, Marketing, StaffSkill, Loan, Reputation,
    StartingBalance, Salaries, DAYS_PER_MONTH, EquipmentWear,
    BANKRUPTCY_THRESHOLD, BANKRUPTCY_DAYS, EVENT_CHANCE_PER_TICK,
    Inflation, Tax, BulkSpoilage, EquipmentBonuses, TankVolume, LevelFormula, Buildings,
)


def get_available_equipment(level: int):
    return [
        {"type": EquipmentType.bottling_line, "name": "🍾 Линия розлива", "price": 4000, "efficiency_bonus": EquipmentBonuses.BOTTLING_LINE_PRICE_BONUS, "desc": "+15% к цене продажи"},
        {"type": EquipmentType.cooling_system, "name": "🧊 Система охлаждения", "price": 3000, "efficiency_bonus": EquipmentBonuses.COOLING_SYSTEM_FERMENT_DAYS, "desc": "−1 день ферментации"},
        {"type": EquipmentType.conditioning_tank, "name": "🛢 Лагерный танк", "price": 2500, "efficiency_bonus": EquipmentBonuses.CONDITIONING_TANK_CONDITION_DAYS, "desc": "−2 дня дозревания"},
        {"type": EquipmentType.kegging_line, "name": "🛞 Линия кегов", "price": 5000, "efficiency_bonus": EquipmentBonuses.KEGGING_LINE_BATCH_BONUS, "desc": "+10% к объёму партии при варке"},
        {"type": EquipmentType.mash_tun, "name": "🏺 Заторный чан", "price": 1800, "efficiency_bonus": EquipmentBonuses.MASH_TUN_QUALITY_BONUS, "desc": "+5% к качеству при варке"},
        {"type": EquipmentType.mash_tun, "name": "🔬 Фильтрация", "price": 3500, "efficiency_bonus": EquipmentBonuses.FILTRATION_BREW_DAYS, "desc": "−1 день варки (затирание+кипячение)"},
    ]


STAFF_NAMES = [
    "Иван Петров", "Мария Соколова", "Алексей Иванов", "Елена Козлова",
    "Дмитрий Новиков", "Ольга Морозова", "Сергей Волков", "Анна Зайцева",
    "Павел Борисов", "Татьяна Кузнецова", "Николай Фёдоров", "Юрий Семёнов"
]

STYLE_INGREDIENT_MAP = {
    BeerStyle.lager: {"malt": "Солод Пильзнер", "hops": "Хмель Сааз", "yeast": "Дрожжи Лагерные"},
    BeerStyle.ale: {"malt": "Солод Карамельный", "hops": "Хмель Каскад", "yeast": "Дрожжи Элевые"},
    BeerStyle.stout: {"malt": "Солод Тёмный", "hops": "Хмель Магнум", "yeast": "Дрожжи Элевые"},
    BeerStyle.ipa: {"malt": "Солод Пильзнер", "hops": "Хмель Цитра", "yeast": "Дрожжи Элевые"},
    BeerStyle.porter: {"malt": "Солод Тёмный", "hops": "Хмель Магнум", "yeast": "Дрожжи Элевые"},
    BeerStyle.wheat: {"malt": "Солод Пшеничный", "hops": "Хмель Сааз", "yeast": "Дрожжи Пшеничные"},
    BeerStyle.pilsner: {"malt": "Солод Пильзнер", "hops": "Хмель Сааз", "yeast": "Дрожжи Лагерные"},
    BeerStyle.sour: {"malt": "Солод Пильзнер", "hops": "Хмель Каскад", "yeast": "Дрожжи Штамм Бельгийский"},
    BeerStyle.bock: {"malt": "Солод Карамельный", "hops": "Хмель Магнум", "yeast": "Дрожжи Лагерные"},
    BeerStyle.pale_ale: {"malt": "Солод Пильзнер", "hops": "Хмель Каскад", "yeast": "Дрожжи Элевые"},
    BeerStyle.amber_ale: {"malt": "Солод Карамельный", "hops": "Хмель Каскад", "yeast": "Дрожжи Элевые"},
    BeerStyle.belgian_tripel: {"malt": "Солод Пильзнер", "hops": "Хмель Сааз", "yeast": "Дрожжи Штамм Бельгийский"},
}

BUYER_NAMES = [
    "Бар 'Тёмная лошадка'", "Ресторан 'Прага'", "Магазин 'Пивной рай'",
    "Бар 'Крафт & Ко'", "Отель 'Центральный'", "Спорт-бар 'Гол'",
    "Паб 'Ирландский'", "Супермаркет 'Продукты+'", "Ресторан 'Бавария'",
    "Бар 'Пенная история'"
]

def _make_recipe(name, style, malt_amount, hops_amount, abv, ibu, srm, brew_time, ferment_time, condition_time):
    ing = STYLE_INGREDIENT_MAP[style]
    return {
        "name": name, "style": style,
        "malt_amount": malt_amount, "hops_amount": hops_amount,
        "malt_ingredient_name": ing["malt"], "hops_ingredient_name": ing["hops"],
        "yeast_ingredient_name": ing["yeast"],
        "abv": abv, "ibu": ibu, "srm": srm,
        "brew_time_days": brew_time, "ferment_time_days": ferment_time,
        "condition_time_days": condition_time,
        "cost_per_liter": 0, "base_price_per_liter": 0,
    }

RECIPE_TEMPLATES = [
    _make_recipe("Классический Лагер", BeerStyle.lager, 4.5, 0.3, 4.8, 18, 3, 1, 7, 14),
    _make_recipe("Золотой Эль", BeerStyle.ale, 5.0, 0.4, 5.2, 25, 6, 1, 4, 5),
    _make_recipe("Тёмный Стаут", BeerStyle.stout, 6.5, 0.5, 5.5, 35, 40, 1, 5, 10),
    _make_recipe("Хмельная IPA", BeerStyle.ipa, 5.5, 1.5, 6.5, 70, 8, 1, 5, 7),
    _make_recipe("Портер", BeerStyle.porter, 6.0, 0.6, 5.8, 30, 30, 1, 5, 12),
    _make_recipe("Пшеничное", BeerStyle.wheat, 4.5, 0.3, 4.5, 12, 4, 1, 4, 4),
    _make_recipe("Пильзнер", BeerStyle.pilsner, 4.0, 0.4, 4.5, 22, 3, 1, 6, 14),
    _make_recipe("Кислый Эль", BeerStyle.sour, 4.5, 0.2, 4.0, 8, 5, 1, 10, 20),
    _make_recipe("Бок", BeerStyle.bock, 7.0, 0.4, 7.0, 20, 20, 1, 7, 21),
    _make_recipe("Пэйл Эль", BeerStyle.pale_ale, 5.0, 0.8, 5.5, 40, 10, 1, 4, 7),
    _make_recipe("Янтарный Эль", BeerStyle.amber_ale, 5.2, 0.6, 5.5, 28, 18, 1, 4, 7),
    _make_recipe("Бельгийский Трипель", BeerStyle.belgian_tripel, 7.5, 0.5, 9.5, 25, 6, 1, 8, 21),
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


EXPERIMENTAL_STYLE = "experimental"

DETECTABLE_STYLES = {v["malt"] + "|" + v["hops"] + "|" + v["yeast"]: k for k, v in STYLE_INGREDIENT_MAP.items()}


def detect_style(malt_name: str, hops_name: str, yeast_name: str):
    key = malt_name + "|" + hops_name + "|" + yeast_name
    return DETECTABLE_STYLES.get(key)


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

    default_bld = Buildings.LIST[Buildings.DEFAULT_ID]
    brewery = Brewery(
        game_state_id=game.id,
        name="Моя пивоварня",
        level=1,
        tank_count=default_bld["tanks"],
        tank_volume=default_bld["kettle_vol"],
        building_id=Buildings.DEFAULT_ID,
        fermenter_count=default_bld["fermenters"],
        conditioning_tank_count=default_bld.get("cond_tanks", 2),
        storage_capacity=default_bld["storage"],
        rent=default_bld["rent"],
    )
    db.add(brewery)

    for tpl in RECIPE_TEMPLATES:
        if tpl["name"] in ("Классический Лагер", "Золотой Эль"):
            recipe = BeerRecipe(game_state_id=game.id, is_unlocked=True, **tpl)
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

    db.flush()

    def _unit_cost(name):
        for ing in INGREDIENT_TEMPLATES:
            if ing["name"] == name:
                return ing["unit_cost"]
        return 1.0

    for recipe in db.query(BeerRecipe).filter(BeerRecipe.game_state_id == game.id).all():
        malt_cost = _unit_cost(recipe.malt_ingredient_name) * recipe.malt_amount
        hops_cost = _unit_cost(recipe.hops_ingredient_name) * recipe.hops_amount
        yeast_cost = _unit_cost(recipe.yeast_ingredient_name) * 0.1
        recipe.cost_per_liter = (malt_cost + hops_cost + yeast_cost) / 10
        recipe.base_price_per_liter = recipe.cost_per_liter * 3.5

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

    init_competitors(game, db)

    for c in generate_contracts(game, db, 5):
        db.add(Contract(game_state_id=game.id, **c))
    db.commit()

    db.refresh(game)
    return game


def init_competitors(game: GameState, db: Session):
    existing = db.query(Competitor).filter(Competitor.game_state_id == game.id).count()
    if existing > 0:
        return
    count = random.randint(3, 5)
    names = random.sample(COMPETITOR_NAMES, min(count, len(COMPETITOR_NAMES)))
    for name in names:
        comp = Competitor(
            game_state_id=game.id,
            name=name,
            daily_sales_liters=random.uniform(80, 250),
            total_sales_liters=0.0,
            reputation=random.uniform(40, 80),
        )
        db.add(comp)
    db.commit()


ACHIEVEMENT_DEFS = [
    {"id": "first_batch", "name": "Первая партия", "desc": "Сварите первую партию пива", "icon": "🍺", "bonus": {"reputation": 5}},
    {"id": "first_staff", "name": "Кадровое пополнение", "desc": "Наймите первого сотрудника", "icon": "👤", "bonus": {"reputation": 5}},
    {"id": "first_contract", "name": "Первая сделка", "desc": "Выполните первый контракт", "icon": "📋", "bonus": {"reputation": 5}},
    {"id": "first_upgrade", "name": "Модернизация", "desc": "Купите первое улучшение пивоварни", "icon": "🔧", "bonus": {"upgrade_discount": 0.1}},
    {"id": "revenue_10k", "name": "Первая выручка", "desc": "Достигните $10,000 общей выручки", "icon": "💰", "bonus": {"reputation": 5}},
    {"id": "revenue_50k", "name": "Серьёзный пивовар", "desc": "Достигните $50,000 общей выручки", "icon": "💵", "bonus": {"reputation": 10}},
    {"id": "revenue_100k", "name": "Пивной магнат", "desc": "Достигните $100,000 общей выручки", "icon": "🏆", "bonus": {"reputation": 15}},
    {"id": "staff_3", "name": "Дружная команда", "desc": "Наймите 3 сотрудников", "icon": "👥", "bonus": {"reputation": 5}},
    {"id": "reputation_90", "name": "Народная любовь", "desc": "Достигните 90% репутации", "icon": "⭐", "bonus": {"demand_bonus": 0.1}},
]

def check_achievements(game: GameState, db: Session) -> list:
    events = []
    unlocked = set(game.achievements or [])
    brewery = db.query(Brewery).filter(Brewery.game_state_id == game.id).first()
    staff_count = db.query(Staff).filter(Staff.game_state_id == game.id).count()
    batch_count = db.query(BeerBatch).filter(
        BeerBatch.game_state_id == game.id,
        BeerBatch.stage.in_([BatchStage.packaged, BatchStage.sold])
    ).count()

    checks = {
        "first_batch": batch_count >= 1,
        "first_staff": staff_count >= 1,
        "first_contract": game.total_revenue > 0,
        "first_upgrade": brewery and (brewery.tank_count > 2 or brewery.fermenter_count > 4 or brewery.taproom_level > 0 or brewery.marketing_level > 1 or brewery.storage_capacity > 1000),
        "revenue_10k": game.total_revenue >= 10000,
        "revenue_50k": game.total_revenue >= 50000,
        "revenue_100k": game.total_revenue >= 100000,
        "staff_3": staff_count >= 3,
        "reputation_90": game.reputation >= 90,
    }

    for ach in ACHIEVEMENT_DEFS:
        if ach["id"] not in unlocked and checks.get(ach["id"]):
            unlocked.add(ach["id"])
            game.achievements = list(unlocked)
            bonus = ach.get("bonus", {})
            bonus_parts = []
            if "reputation" in bonus:
                game.reputation = min(100, game.reputation + bonus["reputation"])
                bonus_parts.append(f"репутация +{bonus['reputation']}")
            if "upgrade_discount" in bonus and brewery:
                brewery.quality_bonus += 0.05
                bonus_parts.append("скидка на улучшения 10%")
            if "demand_bonus" in bonus and brewery:
                brewery.marketing_level += 1
                bonus_parts.append(f"спрос +{int(bonus['demand_bonus'] * 100)}%")
            bonus_text = f" ({', '.join(bonus_parts)})" if bonus_parts else ""
            events.append(f"🎉 Достижение: {ach['icon']} {ach['name']} — {ach['desc']}{bonus_text}")

    return events


EVENT_DEFS = [
    {
        "event_type": "boiler_breakdown",
        "title": "Поломка котла",
        "description": "Варочный котёл вышел из строя!",
        "is_choice_event": True,
        "min_day": 3,
        "choice_a": {"label": "Заплатить $500 за срочный ремонт", "effect": {"money": -500, "reputation": 0}},
        "choice_b": {"label": "Подождать 3 дня (простой производства)", "effect": {"downtime_days": 3, "reputation": 0}},
    },
    {
        "event_type": "festival",
        "title": "Пивной фестиваль!",
        "description": "В городе проходит пивной фестиваль! Спрос вырос, репутация +5",
        "duration_days": 2,
        "effect_data": {"demand_multiplier": 2.0, "reputation_bonus": 5},
    },
    {
        "event_type": "heatwave",
        "title": "Аномальная жара",
        "description": "Жара +35°C! Спрос на пшеничное пиво вырос на 50%",
        "duration_days": 3,
        "effect_data": {"style_demand_bonus": {"wheat": 1.5}},
    },
    {
        "event_type": "hops_price_surge",
        "title": "Скачок цен на хмель",
        "min_day": 3,
        "description": "Неурожай хмеля! Цены на хмель выросли на 30% на 7 дней",
        "duration_days": 7,
        "effect_data": {"hops_cost_multiplier": 1.3},
    },
    {
        "event_type": "tax_audit",
        "title": "Налоговая проверка",
        "description": "Внеплановая налоговая проверка. Штраф $300",
        "is_choice_event": False,
        "min_day": 3,
        "effect_instant": {"money": -300},
    },
    {
        "event_type": "chain_store",
        "title": "Предложение от сети",
        "description": "Сетевой магазин 'Продукты+' просит пиво пониженной крепости",
        "is_choice_event": True,
        "choice_a": {"label": "Согласиться: получить $2000", "effect": {"money": 2000, "reputation": 0}},
        "choice_b": {"label": "Отказаться: репутация +5", "effect": {"money": 0, "reputation": 5}},
    },
    {
        "event_type": "local_press",
        "title": "Статья в газете",
        "description": "Местная газета хочет написать о вашей пивоварне",
        "is_choice_event": True,
        "choice_a": {"label": "Заплатить $500 за рекламную статью (+10 репутации)", "effect": {"money": -500, "reputation": 10}},
        "choice_b": {"label": "Отказаться", "effect": {"money": 0, "reputation": 0}},
    },
    {
        "event_type": "pest_infestation",
        "title": "Вредители на складе",
        "description": "На складе ингредиентов завелись вредители!",
        "is_choice_event": True,
        "min_day": 3,
        "choice_a": {"label": "Вызвать дезинсекцию ($300)", "effect": {"money": -300, "reputation": 0}},
        "choice_b": {"label": "Рискнуть — потерять 5 кг ингредиентов", "effect": {"lose_ingredients": 5, "reputation": 0}},
    },
]


def try_generate_random_event(game: GameState, db: Session) -> list:
    events = []
    active_count = db.query(ActiveEvent).filter(
        ActiveEvent.game_state_id == game.id,
        ActiveEvent.resolved == False
    ).count()
    if active_count > 2:
        return events

    valid_events = [e for e in EVENT_DEFS if game.day >= e.get("min_day", 0)]
    if not valid_events:
        return events
    event_def = random.choice(valid_events)
    existing = db.query(ActiveEvent).filter(
        ActiveEvent.game_state_id == game.id,
        ActiveEvent.event_type == event_def["event_type"],
        ActiveEvent.resolved == False
    ).first()
    if existing:
        return events

    active = ActiveEvent(
        game_state_id=game.id,
        event_type=event_def["event_type"],
        title=event_def["title"],
        description=event_def["description"],
        duration_days=event_def.get("duration_days", 0),
        days_left=event_def.get("duration_days", 0),
        is_choice_event=event_def.get("is_choice_event", False),
        effect_data=event_def.get("effect_data", {}),
    )
    db.add(active)
    db.flush()

    if "effect_instant" in event_def:
        eff = event_def["effect_instant"]
        if "money" in eff:
            game.money += eff["money"]
        events.append(f"📰 {event_def['title']}: {event_def['description']}")

    if not event_def.get("is_choice_event") and "effect_instant" not in event_def:
        events.append(f"📰 {event_def['title']}: {event_def['description']}")

    if event_def.get("is_choice_event"):
        events.append(f"⚖️ {event_def['title']}: {event_def['description']}")

    db.flush()
    return events


def process_active_events(game: GameState, db: Session) -> list:
    events = []
    active_events = db.query(ActiveEvent).filter(
        ActiveEvent.game_state_id == game.id,
        ActiveEvent.resolved == False
    ).all()

    for ae in active_events:
        if ae.duration_days > 0:
            ae.days_left -= 1
            if ae.days_left <= 0:
                ae.resolved = True
                eff = ae.effect_data or {}
                if "reputation_bonus" in eff:
                    game.reputation = min(100, max(0, game.reputation + eff["reputation_bonus"]))
                events.append(f"✅ Событие '{ae.title}' завершилось")

    db.flush()
    return events


def get_active_events(game: GameState, db: Session) -> list:
    events = db.query(ActiveEvent).filter(
        ActiveEvent.game_state_id == game.id,
        ActiveEvent.resolved == False
    ).all()
    result = []
    for ae in events:
        d = {
            "id": ae.id,
            "event_type": ae.event_type,
            "title": ae.title,
            "description": ae.description,
            "duration_days": ae.duration_days,
            "days_left": ae.days_left,
            "is_choice_event": ae.is_choice_event,
            "choice_made": ae.choice_made,
            "resolved": ae.resolved,
            "choices": [],
        }
        if ae.is_choice_event and not ae.choice_made:
            event_def = next((e for e in EVENT_DEFS if e["event_type"] == ae.event_type), None)
            if event_def:
                d["choices"] = [
                    {"key": "a", "label": event_def.get("choice_a", {}).get("label", "Вариант А")},
                    {"key": "b", "label": event_def.get("choice_b", {}).get("label", "Вариант Б")},
                ]
        result.append(d)
    return result


def resolve_choice_event(event_id: int, choice: str, game: GameState, db: Session) -> dict:
    ae = db.query(ActiveEvent).filter(
        ActiveEvent.id == event_id,
        ActiveEvent.game_state_id == game.id
    ).first()
    if not ae:
        raise ValueError("Событие не найдено")
    if ae.choice_made:
        raise ValueError("Выбор уже сделан")

    event_def = next((e for e in EVENT_DEFS if e["event_type"] == ae.event_type), None)
    if not event_def or not event_def.get("is_choice_event"):
        raise ValueError("Это событие не требует выбора")

    key = "choice_a" if choice == "a" else "choice_b"
    choice_data = event_def.get(key)
    if not choice_data:
        raise ValueError("Неверный выбор")

    eff = choice_data["effect"]
    result_parts = []
    if "money" in eff and eff["money"] != 0:
        game.money += eff["money"]
        result_parts.append(f"{'+' if eff['money'] > 0 else ''}${eff['money']}")
    if "reputation" in eff and eff["reputation"] != 0:
        game.reputation = min(100, max(0, game.reputation + eff["reputation"]))
        result_parts.append(f"{'+' if eff['reputation'] > 0 else ''}реп {eff['reputation']}")
    if "lose_ingredients" in eff:
        ingredients = db.query(Ingredient).filter(Ingredient.game_state_id == game.id, Ingredient.type != IngredientType.adjunct).all()
        for ing in ingredients:
            loss = min(ing.quantity, eff["lose_ingredients"])
            ing.quantity -= loss
            break
        result_parts.append(f"-{eff['lose_ingredients']} кг ингредиентов")

    ae.choice_made = True
    ae.resolved = True
    db.commit()

    return {
        "message": f"{ae.title}: {choice_data['label']}. {' '.join(result_parts)}",
    }


def process_tick(game: GameState, db: Session) -> dict:
    events = []
    game_over = False

    if game.game_over:
        return {"events": events, "game_over": True}

    game.day += 1

    equipment_owned = db.query(Equipment).filter(
        Equipment.game_state_id == game.id,
        Equipment.is_owned == True
    ).all()

    total_efficiency = 1.0 + sum(eq.efficiency_bonus for eq in equipment_owned if eq.wear_tear >= EquipmentWear.BROKEN_THRESHOLD)

    all_staff = db.query(Staff).filter(Staff.game_state_id == game.id).all()
    def _effective_skill(staff_list):
        total = 0
        for s in staff_list:
            mult = 1.0
            if s.morale < 30:
                mult = 0.5
            total += s.skill_level * mult
        return total

    brewer_skill = _effective_skill([s for s in all_staff if s.role == StaffRole.brewer])
    sales_skill = _effective_skill([s for s in all_staff if s.role == StaffRole.sales])
    admin_skill = _effective_skill([s for s in all_staff if s.role == StaffRole.admin])

    staff_efficiency = 1.0 + brewer_skill * StaffSkill.EFFICIENCY_PER_SKILL
    total_efficiency *= staff_efficiency

    brewery = db.query(Brewery).filter(Brewery.game_state_id == game.id).first()
    if not brewery:
        return {"events": events, "game_over": game_over}

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
            brew_days = recipe.brew_time_days
            has_filtration = db.query(Equipment).filter(
                Equipment.game_state_id == game.id,
                Equipment.is_owned == True,
                Equipment.name == "🔬 Фильтрация"
            ).first()
            if has_filtration:
                brew_days = max(1, brew_days + EquipmentBonuses.FILTRATION_BREW_DAYS)
            stage_duration = max(1, int(brew_days / total_efficiency))
        elif batch.stage == BatchStage.boil:
            stage_duration = max(1, int(1 / total_efficiency))
        elif batch.stage == BatchStage.ferment:
            ferment_days = recipe.ferment_time_days
            has_cooling = db.query(Equipment).filter(
                Equipment.game_state_id == game.id,
                Equipment.is_owned == True,
                Equipment.type == EquipmentType.cooling_system
            ).first()
            if has_cooling:
                ferment_days = max(1, ferment_days + EquipmentBonuses.COOLING_SYSTEM_FERMENT_DAYS)
            stage_duration = max(1, int(ferment_days / total_efficiency))
        elif batch.stage == BatchStage.condition:
            condition_days = recipe.condition_time_days
            has_cond_tank = db.query(Equipment).filter(
                Equipment.game_state_id == game.id,
                Equipment.is_owned == True,
                Equipment.type == EquipmentType.conditioning_tank
            ).first()
            if has_cond_tank:
                condition_days = max(1, condition_days + EquipmentBonuses.CONDITIONING_TANK_CONDITION_DAYS)
            stage_duration = max(1, int(condition_days / total_efficiency))

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

                quality = (batch.quality or 50) * 0.7 + recipe.complexity * 5 + (brewery.quality_bonus or 0) * 10 + random.uniform(-5, 10)
                quality = max(10, min(100, quality))
                batch.quality = quality

                hp = recipe.hidden_params or {}
                mash_temp = hp.get("mash_temp", "medium")
                water_type = hp.get("water_type", "soft")
                abv_mod = 1.0
                ibu_mod = 1.0
                srm_mod = 1.0
                if mash_temp == "low":
                    abv_mod = 1.10
                    srm_mod = 0.95
                elif mash_temp == "high":
                    abv_mod = 0.90
                    srm_mod = 1.05
                if water_type == "hard":
                    ibu_mod = 1.10
                    srm_mod = 1.05
                elif water_type == "soft":
                    ibu_mod = 0.95
                batch.actual_abv = round(recipe.abv * abv_mod, 1)
                batch.actual_ibu = max(1, int(recipe.ibu * ibu_mod))
                batch.actual_srm = max(1, int(recipe.srm * srm_mod))

                events.append(f"Партия #{batch.id} начала ферментацию (качество: {quality:.0f})")
            elif batch.stage == BatchStage.ferment:
                batch.stage = BatchStage.condition
                batch.stage_progress = 0
                batch.days_in_stage = 0
                events.append(f"Партия #{batch.id} на дозревании")
            elif batch.stage == BatchStage.condition:
                batch.stage = BatchStage.packaged
                batch.stage_progress = 100
                recipe.mastery_count = (recipe.mastery_count or 0) + 1
                game.total_batches_completed = (game.total_batches_completed or 0) + 1
                game.brewing_level = min(10, 1 + (game.total_batches_completed // 5))
                quality_val = round(batch.quality or 50)
                qh = list(game.quality_history or [])
                qh.append({"day": game.day, "quality": quality_val, "name": recipe.name})
                if len(qh) > 30:
                    qh = qh[-30:]
                game.quality_history = qh
                if batch.quality and batch.quality < 30:
                    game.reputation = max(0, game.reputation - 10)
                    events.append(f"⚠️ Партия #{batch.id} получена с качеством {batch.quality:.0f}! Репутация -10, пивоварня простаивает")
                    if batch.quality < 20:
                        events.append(f"🚫 Партия #{batch.id} ужасного качества! Придётся вылить и стерилизовать оборудование")
                else:
                    rep_change = (batch.quality - 50) * 0.2 if batch.quality else 0
                    game.reputation = min(100, max(0, game.reputation + rep_change))
                events.append(f"🍺 Партия #{batch.id} готова к продаже! (качество: {batch.quality:.0f})")

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
                sales_bonus = 1.0 + sales_skill * 0.02
                quality_factor = (batch.quality or 50) / 50
                revenue = deliver_amount * contract.price_per_liter * sales_bonus * quality_factor
                game.money += revenue
                game.total_revenue += revenue
                game.daily_revenue += revenue
                contract.total_revenue += revenue
                contract.delivered_liters += deliver_amount
                batch.batch_size_liters -= deliver_amount
                game.player_total_liters = (game.player_total_liters or 0) + deliver_amount
                if batch.batch_size_liters <= 0:
                    batch.stage = BatchStage.sold
                    game.reputation = min(100, max(0, game.reputation + (batch.quality - 50) * 0.2))
                events.append(f"Продажа {deliver_amount:.0f}л по контракту с {contract.buyer_name} (+${revenue:.0f})")

        if contract.days_left == 3 and contract.delivered_liters < contract.quantity_liters:
            events.append(f"⚠️ Внимание! Контракт с {contract.buyer_name} истекает через 3 дня!")

        if contract.days_left <= 0 and contract.delivered_liters < contract.quantity_liters:
            penalty_amount = contract.penalty
            game.money -= penalty_amount
            game.total_expenses += penalty_amount
            game.daily_expenses += penalty_amount
            contract.is_active = False
            game.reputation = min(100, max(0, game.reputation - 5))
            events.append(f"Контракт с {contract.buyer_name} просрочен! Штраф ${penalty_amount:.0f}, репутация -5")

        if contract.delivered_liters >= contract.quantity_liters:
            contract.is_active = False
            game.reputation = min(100, max(0, game.reputation + 1))
            events.append(f"Контракт с {contract.buyer_name} выполнен! Репутация +1")

    # Generate new contracts if few available
    unsigned_count = db.query(Contract).filter(
        Contract.game_state_id == game.id,
        Contract.is_active == False
    ).count()
    if unsigned_count < 3:
        new_contracts = generate_contracts(game, db, 5)
        for c in new_contracts:
            db.add(Contract(game_state_id=game.id, **c))

    # Competitors processing
    competitors = db.query(Competitor).filter(Competitor.game_state_id == game.id).all()
    if competitors:
        total_market_liters = game.player_total_liters or 0
        for comp in competitors:
            daily = random.uniform(50, 300) * (comp.reputation / 100)
            comp.daily_sales_liters = daily
            comp.total_sales_liters += daily
            comp.reputation = max(0, min(100, comp.reputation + random.uniform(-0.1, 0.2)))
            total_market_liters += comp.total_sales_liters

    total_salary = 0
    fired_staff = []
    for s in all_staff:
        total_salary += s.salary
        s.morale = max(0, min(100, s.morale + random.uniform(-0.5, 0.5)))
        if s.morale < 10:
            fired_staff.append(s)
    for s in fired_staff:
        role_ru = {"brewer": "Пивовар", "sales": "Продавец", "admin": "Администратор"}
        events.append(f"🚫 {s.name} ({role_ru.get(s.role, s.role)}) уволился по собственному желанию — мораль упала ниже 10%!")
        db.delete(s)

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

    admin_discount = max(0, 1.0 - admin_skill * 0.02)
    effective_rent = brewery.rent * admin_discount
    game.money -= effective_rent
    game.total_expenses += effective_rent
    game.daily_expenses += effective_rent
    events.append(f"Аренда: ${effective_rent:.0f}")

    if game.bank_loan > 0:
        interest_rate = Loan.MIN_RATE + (1 - game.reputation / 100) * Loan.RATE_RANGE
        interest_rate = min(0.01, max(0.003, interest_rate))
        interest = game.bank_loan * interest_rate
        game.money -= interest
        game.total_expenses += interest
        game.daily_expenses += interest
        events.append(f"Проценты по кредиту: ${interest:.0f} ({(interest_rate*100):.1f}%/день)")

    # Equipment wear & tear
    for eq in equipment_owned:
        was_broken = eq.wear_tear < EquipmentWear.BROKEN_THRESHOLD
        eq.wear_tear = max(0, eq.wear_tear - EquipmentWear.PER_DAY)
        if not was_broken and eq.wear_tear < EquipmentWear.BROKEN_THRESHOLD:
            if game.has_insurance:
                eq.wear_tear = 100.0
                game.has_insurance = False
                events.append(f"🔧 {eq.name} сломался, страховка покрыла ремонт! Износ восстановлен.")
            else:
                repair_cost = int(eq.price * EquipmentWear.REPAIR_COST_RATIO)
                events.append(f"⚙️ {eq.name} износился до {eq.wear_tear:.0f}%! Ремонт ${repair_cost}")

    revenue_history = list(game.revenue_history or [])
    expense_history = list(game.expense_history or [])
    revenue_history.append(game.daily_revenue)
    expense_history.append(game.daily_expenses)
    print(f"HISTORY day={game.day}: rev={game.daily_revenue} exp={game.daily_expenses} hist_len={len(revenue_history)}")
    if len(revenue_history) > 30:
        revenue_history = revenue_history[-30:]
    if len(expense_history) > 30:
        expense_history = expense_history[-30:]
    game.revenue_history = revenue_history
    game.expense_history = expense_history
    game.daily_revenue = 0
    game.daily_expenses = 0

    # Inflation: every 30 days, prices increase 1-3%
    inflation_mult = game.inflation_multiplier or 1.0
    if game.day % Inflation.INTERVAL_DAYS == 0:
        inflation_mult *= (1 + random.uniform(Inflation.MIN_RATE, Inflation.MAX_RATE))
        game.inflation_multiplier = round(inflation_mult, 4)
        events.append(f"📈 Инфляция! Цены выросли на {(inflation_mult - 1)*100:.1f}%")

    # Tax: every 7 days, 10% of profit since last check or $200 flat (whichever larger)
    if game.day % Tax.INTERVAL_DAYS == 0:
        profit_since_last = game.total_revenue - (game.last_revenue_check or 0)
        tax_amount = max(Tax.FLAT_MIN, profit_since_last * Tax.RATE)
        tax_amount = min(tax_amount, game.money) if game.money > 0 else 0
        if tax_amount > 0:
            game.money -= tax_amount
            game.total_expenses += tax_amount
            game.daily_expenses += tax_amount
        game.last_revenue_check = game.total_revenue
        game.last_tax_day = game.day
        events.append(f"💰 Налог: ${tax_amount:.0f} (10% от прибыли)")

    # Brewery level progression: exponential
    new_level = LevelFormula.level_from_revenue(game.total_revenue or 0)
    if new_level > brewery.level:
        brewery.level = new_level
        events.append(f"🏭 Пивоварня повысила уровень до {new_level}! +5% к цене продажи, +1 слот контрактов")

    # Ingredient spoilage — scales with bulk, modified by building
    bld = Buildings.LIST.get(brewery.building_id, Buildings.LIST[Buildings.DEFAULT_ID])
    spoil_mod = bld.get("spoil_mod", 1.0)
    ingredients = db.query(Ingredient).filter(Ingredient.game_state_id == game.id).all()
    total_ing_kg = sum(ing.quantity for ing in ingredients)
    if total_ing_kg > BulkSpoilage.TIER2_KG:
        spoilage_rate = BulkSpoilage.TIER2_RATE
    elif total_ing_kg > BulkSpoilage.TIER1_KG:
        spoilage_rate = BulkSpoilage.TIER1_RATE
    else:
        spoilage_rate = BulkSpoilage.NORMAL_RATE
    spoilage_rate *= spoil_mod
    spoiled_total = 0
    for ing in ingredients:
        lost = ing.quantity * spoilage_rate
        if lost > 0:
            ing.quantity -= lost
            spoiled_total += lost
    if spoiled_total > 0:
        events.append(f"Списание ингредиентов: {spoiled_total:.1f}кг ({(spoilage_rate*100):.1f}%/день)")

    # Game over: money < BANKRUPTCY_THRESHOLD for BANKRUPTCY_DAYS consecutive days
    if game.money < BANKRUPTCY_THRESHOLD:
        game.days_bankrupt += 1
        if game.days_bankrupt >= BANKRUPTCY_DAYS:
            game.game_over = True
            game.game_over_capital = max(500, game.money / 2)
            game_over = True
            events.append(f"💀 БАНКРОТСТВО! Долг превысил ${abs(BANKRUPTCY_THRESHOLD):.0f} более чем на месяц. Игра окончена.")
    else:
        if game.days_bankrupt > 0:
            game.days_bankrupt = 0

    # Random events
    if not game.game_over and random.random() < EVENT_CHANCE_PER_TICK:
        event_events = try_generate_random_event(game, db)
        events.extend(event_events)

    if not game.game_over:
        processed = process_active_events(game, db)
        events.extend(processed)

    # Check achievements
    ach_events = check_achievements(game, db)
    events.extend(ach_events)

    db.commit()
    return {"events": events, "game_over": game_over}


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
