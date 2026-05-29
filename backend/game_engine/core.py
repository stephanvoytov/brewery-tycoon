import random
from sqlalchemy.orm import Session
from backend.models import (
    GameState, Brewery, BeerRecipe, BeerBatch, BatchStage,
    Ingredient, Equipment, EquipmentType, Staff, StaffRole,
    Contract, Research, ResearchCategory, Competitor, ActiveEvent
)
from backend.config import (
    Rent, Taproom, Marketing, StaffSkill, Loan, Reputation,
    StartingBalance, Salaries, DAYS_PER_MONTH, EquipmentWear,
    BANKRUPTCY_THRESHOLD, BANKRUPTCY_DAYS, EVENT_CHANCE_PER_TICK,
    Inflation, Tax, BulkSpoilage, EquipmentBonuses, TankVolume, LevelFormula,
    Buildings, KettleTypes, FermenterTypes, CondTankTypes, SELL_REFUND_RATIO,
)
from .utils import get_kettle_count, get_fermenter_count, get_cond_tank_count, get_bld
from .events import try_generate_random_event, process_active_events
from .economy import generate_contracts
from .achievements import check_achievements


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

    recipe_ids = list(set(b.recipe_id for b in batches if b.recipe_id))
    recipes_map = {}
    if recipe_ids:
        for r in db.query(BeerRecipe).filter(BeerRecipe.id.in_(recipe_ids)).all():
            recipes_map[r.id] = r

    has_filtration_flag = db.query(Equipment).filter(
        Equipment.game_state_id == game.id,
        Equipment.is_owned == True,
        Equipment.name == "🔬 Фильтрация"
    ).first() is not None
    has_cooling_flag = db.query(Equipment).filter(
        Equipment.game_state_id == game.id,
        Equipment.is_owned == True,
        Equipment.type == EquipmentType.cooling_system
    ).first() is not None
    has_cond_tank_equip_flag = db.query(Equipment).filter(
        Equipment.game_state_id == game.id,
        Equipment.is_owned == True,
        Equipment.type == EquipmentType.conditioning_tank
    ).first() is not None

    batches_updated = 0
    for batch in batches:
        batches_updated += 1
        batch.days_in_stage += 1
        recipe = recipes_map.get(batch.recipe_id)
        if not recipe:
            continue

        stage_duration = 0
        if batch.stage == BatchStage.mash:
            brew_days = recipe.brew_time_days
            if has_filtration_flag:
                brew_days = max(1, brew_days + EquipmentBonuses.FILTRATION_BREW_DAYS)
            stage_duration = max(1, int(brew_days / total_efficiency))
        elif batch.stage == BatchStage.boil:
            stage_duration = max(1, int(1 / total_efficiency))
        elif batch.stage == BatchStage.ferment:
            ferment_days = recipe.ferment_time_days
            if has_cooling_flag:
                ferment_days = max(1, ferment_days + EquipmentBonuses.COOLING_SYSTEM_FERMENT_DAYS)
            stage_duration = max(1, int(ferment_days / total_efficiency))
        elif batch.stage == BatchStage.condition:
            condition_days = recipe.condition_time_days
            if has_cond_tank_equip_flag:
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
                active_ferm_now = db.query(BeerBatch).filter(
                    BeerBatch.game_state_id == game.id,
                    BeerBatch.stage == BatchStage.ferment
                ).count()
                if active_ferm_now >= get_fermenter_count(brewery):
                    events.append(f"Партия #{batch.id} ожидает свободный ферментер")
                    continue

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
                active_cond = db.query(BeerBatch).filter(
                    BeerBatch.game_state_id == game.id,
                    BeerBatch.stage == BatchStage.condition
                ).count()
                cond_available = get_cond_tank_count(brewery) - active_cond

                if batch.skip_condition or get_cond_tank_count(brewery) == 0:
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
                        events.append(f"⚠️ Партия #{batch.id} без дозревания, качество {batch.quality:.0f}! Репутация -10")
                        if batch.quality < 20:
                            events.append(f"🚫 Партия #{batch.id} ужасного качества! Придётся вылить")
                    else:
                        rep_change = (batch.quality - 50) * 0.2 if batch.quality else 0
                        game.reputation = min(100, max(0, game.reputation + rep_change))
                    events.append(f"🍺 Партия #{batch.id} готова к продаже (без дозревания)!")
                elif cond_available > 0:
                    batch.stage = BatchStage.condition
                    batch.stage_progress = 0
                    batch.days_in_stage = 0
                    events.append(f"Партия #{batch.id} на дозревании")
                else:
                    events.append(f"Партия #{batch.id} ожидает свободный танк дозревания")
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

    unsigned_count = db.query(Contract).filter(
        Contract.game_state_id == game.id,
        Contract.is_active == False
    ).count()
    if unsigned_count < 3:
        new_contracts = generate_contracts(game, db, 5)
        for c in new_contracts:
            db.add(Contract(game_state_id=game.id, **c))

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

    inflation_mult = game.inflation_multiplier or 1.0
    if game.day % Inflation.INTERVAL_DAYS == 0:
        inflation_mult *= (1 + random.uniform(Inflation.MIN_RATE, Inflation.MAX_RATE))
        game.inflation_multiplier = round(inflation_mult, 4)
        events.append(f"📈 Инфляция! Цены выросли на {(inflation_mult - 1)*100:.1f}%")

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

    new_level = LevelFormula.level_from_revenue(game.total_revenue or 0)
    if new_level > brewery.level:
        brewery.level = new_level
        events.append(f"🏭 Пивоварня повысила уровень до {new_level}! +5% к цене продажи, +1 слот контрактов")

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

    if not game.game_over and random.random() < EVENT_CHANCE_PER_TICK:
        event_events = try_generate_random_event(game, db)
        events.extend(event_events)

    if not game.game_over:
        processed = process_active_events(game, db)
        events.extend(processed)

    ach_events = check_achievements(game, db)
    events.extend(ach_events)

    db.commit()
    return {"events": events, "game_over": game_over}
