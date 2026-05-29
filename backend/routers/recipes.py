import random
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import GameState, BeerRecipe, BeerBatch, BatchStage, Brewery, Equipment, EquipmentType, Ingredient, IngredientType, User
from backend.schemas import BeerRecipeCreate, BeerRecipeSchema, BrewRequest
from backend.dependencies import get_current_user, resolve_game
from backend.game_engine import STYLE_INGREDIENT_MAP, INGREDIENT_TEMPLATES, detect_style, EXPERIMENTAL_STYLE, get_total_kettle_volume, get_kettle_count, get_fermenter_count, get_cond_tank_count
from backend.config import Buildings, EquipmentBonuses, KettleTypes

router = APIRouter(prefix="/api/recipes", tags=["recipes"])


def _calc_recipe_cost(malt_name, hops_name, yeast_name, malt_amount, hops_amount):
    def unit_cost(name):
        for ing in INGREDIENT_TEMPLATES:
            if ing["name"] == name:
                return ing["unit_cost"]
        return 1.0
    malt_cost = unit_cost(malt_name) * malt_amount
    hops_cost = unit_cost(hops_name) * hops_amount
    yeast_cost = unit_cost(yeast_name) * 0.1
    return (malt_cost + hops_cost + yeast_cost) / 10


@router.get("/")
def get_recipes(game_id: int = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    game = resolve_game(game_id, current_user, db)
    recipes = db.query(BeerRecipe).filter(BeerRecipe.game_state_id == game.id).all()
    return recipes


@router.post("/")
def create_recipe(req: BeerRecipeCreate, game_id: int = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    game = resolve_game(game_id, current_user, db)
    cost_per_liter = _calc_recipe_cost(
        req.malt_ingredient_name, req.hops_ingredient_name,
        req.yeast_ingredient_name, req.malt_amount, req.hops_amount
    )

    style = req.style.value if req.style else ""
    is_discovery = False
    discovered_style = None

    if not style or style == BeerStyle.experimental.value:
        detected = detect_style(req.malt_ingredient_name, req.hops_ingredient_name, req.yeast_ingredient_name)
        if detected:
            existing = db.query(BeerRecipe).filter(
                BeerRecipe.game_state_id == game.id,
                BeerRecipe.style == detected.value
            ).first()
            if not existing:
                discovered_style = detected
                is_discovery = True
                style = detected.value
            else:
                style = detected.value
                # already unlocked, but add_mastery later
        else:
            style = EXPERIMENTAL_STYLE

    base_price_mult = 4.5
    if style == EXPERIMENTAL_STYLE:
        base_price_mult = 2.5

    data = req.model_dump()
    data["style"] = style
    data["cost_per_liter"] = cost_per_liter
    data["base_price_per_liter"] = cost_per_liter * base_price_mult
    if "hidden_params" not in data or not data["hidden_params"]:
        data["hidden_params"] = {"mash_temp": "medium", "water_type": "soft", "boil_time": 60}

    db_recipe = BeerRecipe(game_state_id=game.id, is_unlocked=True, **data)
    db.add(db_recipe)
    db.commit()
    db.refresh(db_recipe)

    result = {
        "recipe": db_recipe,
        "is_discovery": is_discovery,
        "discovered_style": discovered_style.value if discovered_style else None,
        "message": f"Рецепт '{db_recipe.name}' создан!",
    }
    if is_discovery and discovered_style:
        game.reputation = min(100, game.reputation + 5)
        db.commit()
        result["message"] = f"🔬 Открыт новый стиль: {discovered_style.value}! Репутация +5"
        result["is_discovery"] = True

    return result


@router.post("/{recipe_id}/brew")
def start_brew(recipe_id: int, req: BrewRequest, game_id: int = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    game = resolve_game(game_id, current_user, db)
    recipe = db.query(BeerRecipe).filter(
        BeerRecipe.id == recipe_id,
        BeerRecipe.game_state_id == game.id
    ).first()
    brewery = db.query(Brewery).filter(Brewery.game_state_id == game.id).first()

    if not recipe or not brewery:
        raise HTTPException(404, "Рецепт или пивоварня не найдена")

    total_kettle_vol = get_total_kettle_volume(brewery)
    max_batch = total_kettle_vol

    has_kegging = db.query(Equipment).filter(
        Equipment.game_state_id == game.id,
        Equipment.is_owned == True,
        Equipment.name == "🛞 Линия кегов"
    ).first()
    if has_kegging:
        max_batch = int(max_batch * (1 + EquipmentBonuses.KEGGING_LINE_BATCH_BONUS))
    batch_size = req.batch_size_liters
    if batch_size > max_batch:
        kettle_count = get_kettle_count(brewery)
        raise HTTPException(400, f"Объём партии превышает ёмкость котлов ({kettle_count} шт. = {max_batch}л)")

    brew_plus_boil = 1 + 1

    active_tanks = db.query(BeerBatch).filter(
        BeerBatch.game_state_id == game_id,
        BeerBatch.stage.in_([BatchStage.mash, BatchStage.boil])
    ).count()

    if active_tanks >= get_kettle_count(brewery):
        raise HTTPException(400, "Все варочные котлы заняты")

    active_fermenters = db.query(BeerBatch).filter(
        BeerBatch.game_state_id == game_id,
        BeerBatch.stage == BatchStage.ferment
    ).count()
    fermenter_count = get_fermenter_count(brewery)
    if active_fermenters >= fermenter_count:
        earliest_ferm = db.query(BeerBatch).filter(
            BeerBatch.game_state_id == game.id,
            BeerBatch.stage == BatchStage.ferment
        ).first()
        ferm_wait = max(1, (recipe.ferment_time_days or 5) - (earliest_ferm.days_in_stage or 0)) if earliest_ferm else 1
        if ferm_wait > brew_plus_boil:
            raise HTTPException(400, f"Все ферментеры заняты. Ближайший освободится через {ferm_wait} дн., а нужен через {brew_plus_boil} дн.")

    active_cond = db.query(BeerBatch).filter(
        BeerBatch.game_state_id == game_id,
        BeerBatch.stage == BatchStage.condition
    ).count()
    if get_cond_tank_count(brewery) > 0 and active_cond >= get_cond_tank_count(brewery):
        raise HTTPException(400, "Все танки дозревания заняты. Дождитесь освобождения.")

    total_ingredient_cost = recipe.cost_per_liter * batch_size
    bld = Buildings.LIST.get(brewery.building_id, Buildings.LIST[Buildings.DEFAULT_ID])
    cost_reduction = bld.get("cost_reduction", 0)
    total_ingredient_cost *= (1 - cost_reduction)
    if game.money < total_ingredient_cost:
        raise HTTPException(400, f"Недостаточно средств. Нужно ${total_ingredient_cost:.0f}")

    malt_needed = recipe.malt_amount * batch_size / 10
    hops_needed = recipe.hops_amount * batch_size / 10
    yeast_needed = 0.1 * batch_size / 10

    malt_ing = db.query(Ingredient).filter(
        Ingredient.game_state_id == game_id,
        Ingredient.name == recipe.malt_ingredient_name
    ).first()
    if not malt_ing or malt_ing.quantity < malt_needed:
        raise HTTPException(400, f"Недостаточно '{recipe.malt_ingredient_name}'. Нужно {malt_needed:.1f}кг, есть {malt_ing.quantity:.1f}кг" if malt_ing else f"'{recipe.malt_ingredient_name}' не найден")
    malt_ing.quantity -= malt_needed

    hops_ing = db.query(Ingredient).filter(
        Ingredient.game_state_id == game_id,
        Ingredient.name == recipe.hops_ingredient_name
    ).first()
    if not hops_ing or hops_ing.quantity < hops_needed:
        raise HTTPException(400, f"Недостаточно '{recipe.hops_ingredient_name}'. Нужно {hops_needed:.1f}кг" if hops_ing else f"'{recipe.hops_ingredient_name}' не найден")
    hops_ing.quantity -= hops_needed

    yeast_ing = db.query(Ingredient).filter(
        Ingredient.game_state_id == game_id,
        Ingredient.name == recipe.yeast_ingredient_name
    ).first()
    if not yeast_ing or yeast_ing.quantity < yeast_needed:
        raise HTTPException(400, f"Недостаточно дрожжей. Нужно {yeast_needed:.1f}кг" if yeast_ing else f"Дрожжи не найдены")
    yeast_ing.quantity -= yeast_needed

    ingredient_score = 40
    recommended = STYLE_INGREDIENT_MAP.get(recipe.style)
    if recommended:
        if recipe.malt_ingredient_name != recommended["malt"]:
            ingredient_score -= 10
        if recipe.hops_ingredient_name != recommended["hops"]:
            ingredient_score -= 10
        if recipe.yeast_ingredient_name != recommended["yeast"]:
            ingredient_score -= 5
    ingredient_score = max(15, ingredient_score)

    avg_wear = db.query(Equipment).filter(
        Equipment.game_state_id == game.id,
        Equipment.is_owned == True
    ).with_entities(func.avg(Equipment.wear_tear)).scalar() or 100

    equipment_score = int(30 * (avg_wear / 100))

    skill_score = min(20, game.brewing_level * 2)

    mastery_score = min(5, int(recipe.mastery_count * 0.5))

    random_score = random.randint(-5, 5)

    quality = ingredient_score + equipment_score + skill_score + mastery_score + random_score
    quality = max(10, min(100, quality))

    has_mash_tun = db.query(Equipment).filter(
        Equipment.game_state_id == game.id,
        Equipment.is_owned == True,
        Equipment.name == "🏺 Заторный чан"
    ).first()
    if has_mash_tun:
        quality = min(100, quality + int(quality * EquipmentBonuses.MASH_TUN_QUALITY_BONUS))

    game.money -= total_ingredient_cost
    game.total_expenses += total_ingredient_cost
    game.daily_expenses += total_ingredient_cost

    batch = BeerBatch(
        game_state_id=game_id,
        recipe_id=recipe_id,
        batch_size_liters=batch_size,
        stage=BatchStage.mash,
        started_day=game.day,
        stage_progress=0,
        quality=quality,
        days_in_stage=0,
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)

    quality_note = ""
    if quality < 50:
        quality_note = f" (качество: {quality:.0f})"

    return {
        "message": f"Варка начата! Партия #{batch.id}{quality_note}",
        "batch_id": batch.id,
        "cost": total_ingredient_cost,
        "quality_breakdown": {
            "ingredient": ingredient_score,
            "equipment": equipment_score,
            "skill": skill_score,
            "mastery": mastery_score,
            "random": random_score,
            "total": quality,
        },
    }


@router.get("/{recipe_id}/can-brew")
def can_brew(recipe_id: int, game_id: int = None, batch_size: int = 50, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    game = resolve_game(game_id, current_user, db)
    recipe = db.query(BeerRecipe).filter(
        BeerRecipe.id == recipe_id,
        BeerRecipe.game_state_id == game.id
    ).first()
    brewery = db.query(Brewery).filter(Brewery.game_state_id == game.id).first()

    if not recipe or not brewery:
        raise HTTPException(404, "Рецепт или пивоварня не найдена")

    max_batch = get_total_kettle_volume(brewery)

    active_tanks = db.query(BeerBatch).filter(
        BeerBatch.game_state_id == game.id,
        BeerBatch.stage.in_([BatchStage.mash, BatchStage.boil])
    ).count()
    free_tanks = get_kettle_count(brewery) - active_tanks

    active_ferm = db.query(BeerBatch).filter(
        BeerBatch.game_state_id == game.id,
        BeerBatch.stage == BatchStage.ferment
    ).count()
    free_ferm = get_fermenter_count(brewery) - active_ferm

    active_cond = db.query(BeerBatch).filter(
        BeerBatch.game_state_id == game.id,
        BeerBatch.stage == BatchStage.condition
    ).count()
    free_cond = get_cond_tank_count(brewery) - active_cond

    brew_plus_boil = 2
    total_brew_ferment = brew_plus_boil + (recipe.ferment_time_days or 5)

    tank_free = free_tanks > 0
    if not tank_free:
        earliest_tank = db.query(BeerBatch).filter(
            BeerBatch.game_state_id == game.id,
            BeerBatch.stage.in_([BatchStage.mash, BatchStage.boil])
        ).first()
        tank_wait = max(1, 2 - (earliest_tank.days_in_stage or 0)) if earliest_tank else 1
    else:
        tank_wait = 0

    fermenter_ready = free_ferm > 0
    if not fermenter_ready:
        earliest_ferm = db.query(BeerBatch).filter(
            BeerBatch.game_state_id == game.id,
            BeerBatch.stage == BatchStage.ferment
        ).first()
        ferm_wait = max(1, (recipe.ferment_time_days or 7) - (earliest_ferm.days_in_stage or 0)) if earliest_ferm else 1
    else:
        ferm_wait = 0

    cond_ready = free_cond > 0 or get_cond_tank_count(brewery) == 0
    cond_wait = 0
    if not cond_ready:
        earliest_cond = db.query(BeerBatch).filter(
            BeerBatch.game_state_id == game.id,
            BeerBatch.stage == BatchStage.condition
        ).first()
        cond_wait = max(1, (recipe.condition_time_days or 7) - (earliest_cond.days_in_stage or 0)) if earliest_cond else 1

    need_ferm_by = brew_plus_boil
    need_cond_by = total_brew_ferment

    fermenter_ok = free_ferm > 0 or ferm_wait <= need_ferm_by or (free_ferm == 0 and get_fermenter_count(brewery) == 0)
    cond_ok = free_cond > 0 or cond_wait <= need_cond_by or get_cond_tank_count(brewery) == 0

    earliest_start = tank_wait
    if not fermenter_ok and brew_plus_boil < ferm_wait:
        earliest_start = max(earliest_start, ferm_wait - brew_plus_boil)
    if not cond_ok and total_brew_ferment < cond_wait:
        earliest_start = max(earliest_start, cond_wait - total_brew_ferment)

    has_kegging = db.query(Equipment).filter(
        Equipment.game_state_id == game.id,
        Equipment.is_owned == True,
        Equipment.name == "🛞 Линия кегов"
    ).first()
    effective_max = max_batch
    if has_kegging:
        effective_max = int(max_batch * (1 + EquipmentBonuses.KEGGING_LINE_BATCH_BONUS))

    malt_cost = recipe.cost_per_liter or 1.0
    bld = Buildings.LIST.get(brewery.building_id, Buildings.LIST[Buildings.DEFAULT_ID])
    cost_red = bld.get("cost_reduction", 0)
    est_cost_per_batch = malt_cost * batch_size * (1 - cost_red)

    malt_needed = recipe.malt_amount * batch_size / 10
    hops_needed = recipe.hops_amount * batch_size / 10
    yeast_needed = 0.1 * batch_size / 10

    malt_ing = db.query(Ingredient).filter(
        Ingredient.game_state_id == game.id,
        Ingredient.name == recipe.malt_ingredient_name
    ).first()
    hops_ing = db.query(Ingredient).filter(
        Ingredient.game_state_id == game.id,
        Ingredient.name == recipe.hops_ingredient_name
    ).first()
    yeast_ing = db.query(Ingredient).filter(
        Ingredient.game_state_id == game.id,
        Ingredient.name == recipe.yeast_ingredient_name
    ).first()

    ing_ok = (malt_ing and malt_ing.quantity >= malt_needed) and \
             (hops_ing and hops_ing.quantity >= hops_needed) and \
             (yeast_ing and yeast_ing.quantity >= yeast_needed)

    money_ok = game.money >= est_cost_per_batch

    can_brew = tank_free and fermenter_ok and cond_ok and ing_ok and money_ok and earliest_start == 0

    resources = {
        "kettle": {"total": get_kettle_count(brewery), "occupied": active_tanks, "free_in_days": tank_wait, "need_by_day": 0, "ok": tank_free},
        "fermenter": {"total": get_fermenter_count(brewery), "occupied": active_ferm, "free_in_days": ferm_wait, "need_by_day": need_ferm_by, "ok": fermenter_ok},
        "cond_tank": {"total": get_cond_tank_count(brewery), "occupied": active_cond, "free_in_days": cond_wait, "need_by_day": need_cond_by, "ok": cond_ok},
    }

    blockers = []
    if not tank_free:
        blockers.append({"resource": "kettle", "message": f"Котёл занят, освободится через {tank_wait} дн."})
    if not fermenter_ok:
        blockers.append({"resource": "fermenter", "message": f"Ферментер освободится через {ferm_wait} дн., а нужен через {need_ferm_by} дн."})
    if not cond_ok:
        blockers.append({"resource": "cond_tank", "message": f"Танк освободится через {cond_wait} дн., а нужен через {need_cond_by} дн."})
    if not ing_ok:
        blockers.append({"resource": "ingredients", "message": "Недостаточно ингредиентов"})
    if not money_ok:
        blockers.append({"resource": "money", "message": f"Недостаточно денег (нужно ~${est_cost_per_batch:.0f})"})

    return {
        "can_brew": can_brew,
        "earliest_start_day": earliest_start,
        "blockers": blockers,
        "resources": resources,
        "max_batch_size": effective_max,
        "estimated_cost_50l": round(est_cost_per_batch, 2),
        "ingredients_ok": ing_ok,
        "money_ok": money_ok,
        "brew_plus_boil_days": brew_plus_boil,
        "ferment_days": recipe.ferment_time_days or 5,
        "condition_days": recipe.condition_time_days or 7,
    }
