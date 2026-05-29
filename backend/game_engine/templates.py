from backend.models import BeerStyle, IngredientType, ResearchCategory

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
    _make_recipe("Классический Лагер", BeerStyle.lager, 4.5, 0.3, 4.8, 18, 3, 1, 4, 7),
    _make_recipe("Золотой Эль", BeerStyle.ale, 5.0, 0.4, 5.2, 25, 6, 1, 3, 3),
    _make_recipe("Тёмный Стаут", BeerStyle.stout, 6.5, 0.5, 5.5, 35, 40, 1, 3, 6),
    _make_recipe("Хмельная IPA", BeerStyle.ipa, 5.5, 1.5, 6.5, 70, 8, 1, 3, 5),
    _make_recipe("Портер", BeerStyle.porter, 6.0, 0.6, 5.8, 30, 30, 1, 3, 7),
    _make_recipe("Пшеничное", BeerStyle.wheat, 4.5, 0.3, 4.5, 12, 4, 1, 2, 2),
    _make_recipe("Пильзнер", BeerStyle.pilsner, 4.0, 0.4, 4.5, 22, 3, 1, 4, 7),
    _make_recipe("Кислый Эль", BeerStyle.sour, 4.5, 0.2, 4.0, 8, 5, 1, 6, 10),
    _make_recipe("Бок", BeerStyle.bock, 7.0, 0.4, 7.0, 20, 20, 1, 4, 10),
    _make_recipe("Пэйл Эль", BeerStyle.pale_ale, 5.0, 0.8, 5.5, 40, 10, 1, 3, 4),
    _make_recipe("Янтарный Эль", BeerStyle.amber_ale, 5.2, 0.6, 5.5, 28, 18, 1, 3, 4),
    _make_recipe("Бельгийский Трипель", BeerStyle.belgian_tripel, 7.5, 0.5, 9.5, 25, 6, 1, 5, 12),
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
