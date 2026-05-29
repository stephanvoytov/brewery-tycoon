function renderRecipes() {
    const recipes = GAME_STATE.recipes || [];
    const ingredients = GAME_STATE.ingredients || [];
    const brewery = GAME_STATE.brewery;
    const unlockedRecipes = recipes.filter(r => r.is_unlocked !== false);
    const unlockedStyles = [...new Set(unlockedRecipes.map(r => r.style))].filter(Boolean);

    const el = document.getElementById('page-recipes');
    el.innerHTML = `
        <h2>📝 Рецепты и варка</h2>

        <div class="grid-2">
            <div class="card">
                <h3>🍺 Рецепты (${unlockedRecipes.length} открыто) <span class="help-link" onclick="scrollToHelp('help-guide-discovery'); return false;" title="Подробнее об открытии стилей">❓</span></h3>
                    <table>
                        <tr>
                            <th></th>
                            <th>Название</th>
                            <th>Стиль</th>
                            <th title="ABV — крепость">ABV</th>
                            <th title="IBU — горечь">IBU</th>
                            <th>🌾 Солод</th>
                            <th>🌿 Хмель</th>
                            <th>Себест./100л</th>
                            <th></th>
                        </tr>
                        ${unlockedRecipes.map(r => `
                            <tr>
                                <td><span class="srm-dot" style="background:${SRM_COLORS[r.style] || '#ccc'}" title="SRM ${r.srm || '?'}"></span></td>
                                <td><span class="recipe-name" onclick="showRecipeDetail(${r.id})" style="cursor:pointer;text-decoration:underline;text-decoration-style:dotted">${r.name}</span>${r.mastery_count > 0 ? `<span class="badge badge-mastery" title="Мастерство: +${Math.min(5, r.mastery_count * 0.5).toFixed(1)} к качеству">⭐${r.mastery_count}</span>` : ''}</td>
                                <td title="${STYLE_INFO[r.style] || ''}">${STYLE_RU[r.style] || r.style}</td>
                                <td>${r.abv}%</td>
                                <td>${r.ibu}</td>
                                <td title="${r.malt_ingredient_name || ''}">${r.malt_ingredient_name ? r.malt_ingredient_name.substring(6) + ' ' + ((r.malt_amount || 0) * 10).toFixed(1) + 'кг' : ((r.malt_amount || 0) * 10).toFixed(1) + ' кг'}</td>
                                <td title="${r.hops_ingredient_name || ''}">${r.hops_ingredient_name ? r.hops_ingredient_name.substring(6) + ' ' + ((r.hops_amount || 0) * 10).toFixed(1) + 'кг' : ((r.hops_amount || 0) * 10).toFixed(1) + ' кг'}</td>
                                <td>${formatMoney(r.cost_per_liter * 100)}</td>
                                <td><button class="btn btn-sm btn-primary" onclick="showBrewModal(${r.id})">Варить</button></td>
                            </tr>
                        `).join('')}
                </table>
                <div class="mobile-card-list">
                    ${unlockedRecipes.length === 0 ? '<div class="mobile-card-empty">Нет рецептов</div>' :
                    unlockedRecipes.map(r => `
                        <div class="mobile-card">
                            <div class="mobile-card-row">
                                <span><span class="srm-dot" style="background:${SRM_COLORS[r.style] || '#ccc'}"></span><span class="recipe-name" onclick="showRecipeDetail(${r.id})" style="cursor:pointer;text-decoration:underline;text-decoration-style:dotted">${r.name}</span>${r.mastery_count > 0 ? `<span class="badge badge-mastery">⭐${r.mastery_count}</span>` : ''}</span>
                            </div>
                            <div class="mobile-card-row">
                                <span class="label">Стиль:</span><span class="value">${STYLE_RU[r.style] || r.style}</span>
                            </div>
                            <div class="mobile-card-row">
                                <span class="label">ABV / IBU:</span><span class="value">${r.abv}% / ${r.ibu}</span>
                            </div>
                            <div class="mobile-card-row">
                                <span class="label">Себест.:</span><span class="value">${formatMoney(r.cost_per_liter * 100)}/100л</span>
                            </div>
                            <div class="mobile-card-actions">
                                <button class="btn btn-sm btn-primary" onclick="showBrewModal(${r.id})">🍺 Варить</button>
                                <button class="btn btn-sm btn-secondary" onclick="showRecipeDetail(${r.id})">📋 Детали</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>


        </div>
        <div class="card">
            <h3>➕ Создать новый рецепт <span class="help-link" onclick="scrollToHelp('help-guide-hidden-params'); return false;" title="Подробнее о скрытых параметрах">❓</span></h3>
            <div class="grid-3">
                <div class="form-group">
                    <label>Название</label>
                    <input type="text" id="newRecipeName" placeholder="Моё пиво">
                </div>
                <div class="form-group">
                    <label>Стиль</label>
                    <select id="newRecipeStyle" onchange="updateIngredientRecs(); updateRecipeCost()">
                        <option value="">🔬 Эксперимент (автоопределение)</option>
                        ${unlockedStyles.map(s => `<option value="${s}">${STYLE_RU[s] || s}</option>`).join('')}
                    </select>
                    <div id="styleRec" style="font-size:0.75rem;color:var(--text-dim);margin-top:4px"></div>
                </div>
                <div class="form-group">
                    <label>ABV (%)</label>
                    <input type="number" id="newRecipeAbv" value="5.0" step="0.1">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>🌾 Солод</label>
                    <select id="newRecipeMaltName" onchange="updateRecipeCost()">${(ingredients || []).filter(i => i.type === 'malt').map(i => `<option value="${i.name}" data-cost="${i.unit_cost}">${i.name} (${formatMoney(i.unit_cost)}/кг)</option>`).join('')}</select>
                </div>
                <div class="form-group">
                    <label>Солод (кг/100л)</label>
                    <input type="number" id="newRecipeMalt" value="50" step="1" oninput="updateRecipeCost()">
                </div>
                <div class="form-group">
                    <label>🌿 Хмель</label>
                    <select id="newRecipeHopsName" onchange="updateRecipeCost()">${(ingredients || []).filter(i => i.type === 'hops').map(i => `<option value="${i.name}" data-cost="${i.unit_cost}">${i.name} (${formatMoney(i.unit_cost)}/кг)</option>`).join('')}</select>
                </div>
                <div class="form-group">
                    <label>Хмель (кг/100л)</label>
                    <input type="number" id="newRecipeHops" value="5" step="0.5" oninput="updateRecipeCost()">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>🧫 Дрожжи</label>
                    <select id="newRecipeYeastName" onchange="updateRecipeCost()">${(ingredients || []).filter(i => i.type === 'yeast').map(i => `<option value="${i.name}" data-cost="${i.unit_cost}">${i.name} (${formatMoney(i.unit_cost)}/кг)</option>`).join('')}</select>
                </div>
                <div class="form-group">
                    <label>IBU</label>
                    <input type="number" id="newRecipeIbu" value="25">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>🌡 Температура затирания <span class="help-link" onclick="scrollToHelp('help-guide-hidden-params'); return false;" title="Подробнее">❓</span></label>
                    <select id="newRecipeMashTemp">
                        <option value="low">Низкая (62°C) — суше</option>
                        <option value="medium" selected>Средняя (67°C)</option>
                        <option value="high">Высокая (72°C) — полнее</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>💧 Тип воды</label>
                    <select id="newRecipeWaterType">
                        <option value="soft" selected>Мягкая — чистый вкус</option>
                        <option value="hard">Жёсткая — плотное тело</option>
                    </select>
                </div>
            </div>
            <div id="recipeCostPreview" style="margin:8px 0;font-size:0.85rem;color:var(--accent-light)"></div>
            <button class="btn btn-success" onclick="doCreateRecipe()">Создать рецепт</button>
        </div>
    `;
    updateIngredientRecs();
    updateRecipeCost();
}

let brewRecipeId = null;

function showBrewModal(recipeId) {
    brewRecipeId = recipeId;
    const recipe = GAME_STATE.recipes.find(r => r.id === recipeId);
    const brewery = GAME_STATE.brewery;

    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';
    overlay.innerHTML = `
        <div class="dialog-box brew-modal-dialog">
            <h3>🍺 Начать варку: ${esc(recipe?.name || '')}</h3>
            <div id="canBrewStatus" style="margin-bottom:12px">⏳ Проверка ресурсов...</div>
            <div class="form-row">
                <div class="form-group">
                    <label>Объём партии (л) <span style="font-size:0.75rem;color:var(--text-dim)">(макс. ${brewery.kettle_vol_actual || brewery.tank_count * brewery.tank_volume}л)</span></label>
                    <input type="number" id="brewSize" value="50" min="10" max="${brewery.kettle_vol_actual || brewery.tank_count * brewery.tank_volume}">
                </div>
                <button class="btn btn-success" id="brewConfirmBtn" disabled>Начать варку</button>
                <button class="btn btn-danger" id="brewCancelBtn">Отмена</button>
            </div>
            <div id="brewInfo" class="brew-info"></div>
        </div>
    `;
    document.body.appendChild(overlay);

    function closeModal() { overlay.remove(); }

    async function loadCanBrew() {
        const size = parseFloat(document.getElementById('brewSize').value) || 50;
        const statusEl = document.getElementById('canBrewStatus');
        try {
            const res = await API.request('GET', `/api/recipes/${recipeId}/can-brew`);
            let html = '';
            const r = res.resources || {};
            const b = r.kettle || {}; const f = r.fermenter || {}; const c = r.cond_tank || {};

            html += '<div style="font-size:0.85rem;background:var(--bg-card);padding:8px;border-radius:6px;margin-bottom:8px">';
            html += `<b>📊 Pipeline:</b><br>`;
            html += `${b.ok ? '🟢' : '🔴'} Котёл: ${b.occupied||0}/${b.total} занято${b.free_in_days ? `, осв. через ${b.free_in_days} дн.` : b.ok ? ', свободен' : ''}<br>`;
            html += `${f.ok ? '🟢' : (f.free_in_days <= 2 ? '🟡' : '🔴')} Ферментер: ${f.occupied||0}/${f.total} занято${f.free_in_days ? `, осв. через ${f.free_in_days} дн.` : f.ok ? ', свободен' : ''}`;
            if (f.need_by_day) html += ` (нужен через ${f.need_by_day} дн.)`;
            html += '<br>';
            const condLabel = c.total === 0 ? '(нет танка — после ферментации сразу в продажу)' : '';
            html += `${c.ok || c.total === 0 ? '🟢' : (c.free_in_days <= 3 ? '🟡' : '🔴')} Танк дозревания: ${c.total === 0 ? 'нет' : `${c.occupied||0}/${c.total} занято${c.free_in_days ? `, осв. через ${c.free_in_days} дн.` : ', свободен'}`} ${condLabel}<br>`;

            if (!res.ingredients_ok) html += `🔴 Ингредиенты: ❌ недостаточно<br>`;
            else html += `🟢 Ингредиенты: ✅<br>`;
            if (!res.money_ok) html += `🔴 Деньги: ❌ (нужно ~$${res.estimated_cost_50l})<br>`;
            else html += `🟢 Деньги: ✅<br>`;

            if (res.can_brew) {
                html += `<span style="color:var(--green);font-weight:bold;font-size:1rem">✅ Можно варить!</span>`;
            } else if (res.earliest_start_day > 0) {
                html += `<span style="color:var(--yellow);font-weight:bold">⏳ Можно будет через ${res.earliest_start_day} дн.</span>`;
            } else {
                const reasons = res.blockers?.map(x => x.message).join('; ') || 'неизвестно';
                html += `<span style="color:var(--red);font-weight:bold">❌ ${reasons}</span>`;
            }

            const confirmBtn = document.getElementById('brewConfirmBtn');
            confirmBtn.disabled = !res.can_brew || !res.ingredients_ok || !res.money_ok;
            if (res.can_brew) {
                confirmBtn.textContent = '✅ Начать варку';
            } else if (res.earliest_start_day > 0) {
                confirmBtn.textContent = `⏳ Подождать ${res.earliest_start_day} дн.`;
            } else {
                confirmBtn.textContent = '❌ Варка недоступна';
            }

            html += '</div>';
            statusEl.innerHTML = html;
        } catch (e) {
            statusEl.innerHTML = `<span style="color:var(--red)">⚠️ Ошибка проверки: ${e.message}</span>`;
        }
    }

    function updateBrewInfo() {
        if (!recipe) return;
        const size = parseFloat(document.getElementById('brewSize').value) || 50;
        const maltPerL = (recipe.malt_amount || 0) / 10;
        const hopsPerL = (recipe.hops_amount || 0) / 10;
        const yeastPerL = 0.1 / 10;
        const needMalt = (maltPerL * size).toFixed(1);
        const needHops = (hopsPerL * size).toFixed(1);
        const needYeast = (yeastPerL * size).toFixed(2);
        const ings = GAME_STATE.ingredients || [];
        const maltIng = ings.find(i => i.name === recipe.malt_ingredient_name);
        const hopsIng = ings.find(i => i.name === recipe.hops_ingredient_name);
        const yeastIng = ings.find(i => i.name === recipe.yeast_ingredient_name);
        const hasMalt = maltIng && maltIng.quantity >= needMalt;
        const hasHops = hopsIng && hopsIng.quantity >= needHops;
        const hasYeast = yeastIng && yeastIng.quantity >= needYeast;
        const totalOk = hasMalt && hasHops && hasYeast;

        const missingMalt = Math.max(0, needMalt - (maltIng ? maltIng.quantity : 0));
        const missingHops = Math.max(0, needHops - (hopsIng ? hopsIng.quantity : 0));
        const missingYeast = Math.max(0, needYeast - (yeastIng ? yeastIng.quantity : 0));
        const buyCost = missingMalt * (maltIng ? maltIng.unit_cost : 0) + missingHops * (hopsIng ? hopsIng.unit_cost : 0) + missingYeast * (yeastIng ? yeastIng.unit_cost : 0);

        const ingScore = 40 - (recipe.malt_ingredient_name && STYLE_RECS[recipe.style] && recipe.malt_ingredient_name !== STYLE_RECS[recipe.style].malt ? 10 : 0) - (recipe.hops_ingredient_name && STYLE_RECS[recipe.style] && recipe.hops_ingredient_name !== STYLE_RECS[recipe.style].hops ? 10 : 0) - (recipe.yeast_ingredient_name && STYLE_RECS[recipe.style] && recipe.yeast_ingredient_name !== STYLE_RECS[recipe.style].yeast ? 5 : 0);
        const eqScore = GAME_STATE.equipment && GAME_STATE.equipment.length ? Math.round(30 * GAME_STATE.equipment.filter(e => e.is_owned).reduce((s, e) => s + (e.wear_tear || 100), 0) / Math.max(1, GAME_STATE.equipment.filter(e => e.is_owned).length) / 100) : 30;
        const skillScore = Math.min(20, (GAME_STATE.game.brewing_level || 1) * 2);
        const mastScore = Math.min(5, Math.floor((recipe.mastery_count || 0) * 0.5));
        const estQuality = Math.min(100, Math.max(10, ingScore + eqScore + skillScore + mastScore));

        let buyBtnHtml = '';
        if (!totalOk) {
            buyBtnHtml = `<div style="margin-top:8px"><button class="btn btn-sm btn-primary" id="brewBuyIngredientsBtn">🛒 Купить недостающее (≈${formatMoney(buyCost)})</button></div>`;
        }

        document.getElementById('brewInfo').innerHTML =
            `<b>${recipe.name}</b> (${STYLE_RU[recipe.style]})<br>` +
            `Макс. партия: ${brewery.kettle_vol_actual || brewery.tank_count * brewery.tank_volume}л (${brewery.kettle_count_actual || brewery.tank_count}×<span style="font-size:0.7rem">котёл</span>)<br>` +
            `Себестоимость: ${formatMoney(recipe.cost_per_liter * 100)}/100л<br>` +
            `Варка: ${recipe.brew_time_days}д → Ферментация: ${recipe.ferment_time_days}д → Дозревание: ${recipe.condition_time_days}д<br>` +
            `Потребуется на ${size}л:<br>` +
            `🌾 ${recipe.malt_ingredient_name || 'Солод'}: ${needMalt} кг ${hasMalt ? '✅' : '❌'}<br>` +
            `🌿 ${recipe.hops_ingredient_name || 'Хмель'}: ${needHops} кг ${hasHops ? '✅' : '❌'}<br>` +
            `🧫 ${recipe.yeast_ingredient_name || 'Дрожжи'}: ${needYeast} кг ${hasYeast ? '✅' : '❌'}<br>` +
            `<span style="color:${totalOk ? 'var(--green)' : 'var(--red)'};font-weight:bold">${totalOk ? '✅ Ингредиентов достаточно' : '❌ Пополните запасы'}</span>${buyBtnHtml}<br>` +
            `<div style="margin-top:8px;font-size:0.8rem;border-top:1px solid var(--border);padding-top:6px">` +
            `<b>⭐ Прогноз качества ≈${estQuality}</b><br>` +
            `<span class="text-dim">🌾 Ингредиенты ${ingScore}/40 · ⚙️ Оборудование ${eqScore}/30 · 🧑‍🍳 Навык ${skillScore}/20 · ⭐ Мастерство ${mastScore}/5 · 🎲 ±5</span>` +
            `</div>`;

        const buyBtn = document.getElementById('brewBuyIngredientsBtn');
        if (buyBtn) {
            buyBtn.onclick = async () => {
                buyBtn.disabled = true;
                buyBtn.textContent = '⏳ Покупка...';
                try {
                    const bought = [];
                    let totalCost = 0;
                    if (missingMalt > 0.01 && maltIng) {
                        const qty = Math.ceil(missingMalt * 10) / 10;
                        const res = await API.buyIngredient(maltIng.id, qty);
                        bought.push(`🌾 ${qty}кг`);
                        totalCost += res.cost;
                    }
                    if (missingHops > 0.01 && hopsIng) {
                        const qty = Math.ceil(missingHops * 10) / 10;
                        const res = await API.buyIngredient(hopsIng.id, qty);
                        bought.push(`🌿 ${qty}кг`);
                        totalCost += res.cost;
                    }
                    if (missingYeast > 0.01 && yeastIng) {
                        const qty = Math.ceil(missingYeast * 10) / 10;
                        const res = await API.buyIngredient(yeastIng.id, qty);
                        bought.push(`🧫 ${qty}кг`);
                        totalCost += res.cost;
                    }
                    showSuccess(`Куплено: ${bought.join(', ')} за ${formatMoney(totalCost)}`);
                    GAME_STATE = await API.getState();
                    renderStatusBar();
                    updateBrewInfo();
                    loadCanBrew();
                } catch (e) {
                    showError(e.message);
                    buyBtn.disabled = false;
                    buyBtn.textContent = `🛒 Купить недостающее (≈${formatMoney(buyCost)})`;
                }
            };
        }
    }

    loadCanBrew();
    updateBrewInfo();
    document.getElementById('brewSize').oninput = () => { updateBrewInfo(); loadCanBrew(); };
    document.getElementById('brewCancelBtn').onclick = closeModal;
    overlay.onclick = e => { if (e.target === overlay) closeModal(); };

    document.getElementById('brewConfirmBtn').onclick = async () => {
        const size = parseFloat(document.getElementById('brewSize').value) || 50;
        const ok = await showConfirm('Начать варку?', `Объём: ${size}л. Будут списаны ингредиенты и ${formatMoney(recipe.cost_per_liter * size)}.`);
        if (!ok) return;
        try {
            const res = await API.startBrew(recipeId, size);
            const qb = res.quality_breakdown;
            let detail = '';
            if (qb) {
                detail = `\n⭐ Качество: ${qb.total} (🌾${qb.ingredient} ⚙️${qb.equipment} 🧑‍🍳${qb.skill} ⭐${qb.mastery} 🎲${qb.random > 0 ? '+' : ''}${qb.random})`;
            }
            showSuccess(res.message + detail);
            closeModal();
            await loadGameState();
            renderRecipes();
        } catch (e) {
            showError(e.message);
        }
    };
}

function showRecipeDetail(recipeId) {
    const recipe = GAME_STATE.recipes.find(r => r.id === recipeId);
    if (!recipe) return;
    const hp = recipe.hidden_params || {};
    const mashLabel = {low: 'Низкая (62°C) — суше', medium: 'Средняя (67°C)', high: 'Высокая (72°C) — полнее'};
    const waterLabel = {soft: 'Мягкая', hard: 'Жёсткая'};
    showNotification(`
        <b>${recipe.name}</b><br>
        Стиль: ${STYLE_RU[recipe.style] || recipe.style}<br>
        ABV: ${recipe.abv}% | IBU: ${recipe.ibu} | SRM: ${recipe.srm || '?'}<br>
        🌡 Затирание: ${mashLabel[hp.mash_temp] || 'Средняя (67°C)'}<br>
        💧 Вода: ${waterLabel[hp.water_type] || 'Мягкая'}<br>
        ⭐ Мастерство: ${recipe.mastery_count || 0} варок (+${Math.min(5, (recipe.mastery_count || 0) * 0.5).toFixed(1)} к качеству)
    `, 'info', 5000);
}

function updateIngredientRecs() {
    const style = document.getElementById('newRecipeStyle')?.value;
    const rec = STYLE_RECS && STYLE_RECS[style];
    const el = document.getElementById('styleRec');
    if (rec) {
        el.innerHTML = `⭐ Рекомендовано: 🌾${rec.malt}, 🌿${rec.hops}, 🧫${rec.yeast}`;
    } else {
        el.innerHTML = '';
    }
}

function updateRecipeCost() {
    const maltSel = document.getElementById('newRecipeMaltName');
    const hopsSel = document.getElementById('newRecipeHopsName');
    const yeastSel = document.getElementById('newRecipeYeastName');
    if (!maltSel || !hopsSel || !yeastSel) return;
    const maltCost = parseFloat(maltSel.options[maltSel.selectedIndex]?.dataset?.cost || 1);
    const hopsCost = parseFloat(hopsSel.options[hopsSel.selectedIndex]?.dataset?.cost || 1);
    const yeastCost = parseFloat(yeastSel.options[yeastSel.selectedIndex]?.dataset?.cost || 1);
    const maltAmount = (parseFloat(document.getElementById('newRecipeMalt').value) || 50) / 10;
    const hopsAmount = (parseFloat(document.getElementById('newRecipeHops').value) || 5) / 10;
    const costPerLiter = (maltCost * maltAmount + hopsCost * hopsAmount + yeastCost * 0.1) / 10;
    const pricePerLiter = costPerLiter * 4.5;
    document.getElementById('recipeCostPreview').innerHTML =
        `Расчёт: себест. ${formatMoney(costPerLiter * 100)}/100л, цена продажи ${formatMoney(pricePerLiter * 100)}/100л`;
}

async function doCreateRecipe() {
    const name = document.getElementById('newRecipeName').value.trim();
    if (!name) { showError('Введите название рецепта'); return; }
    const style = document.getElementById('newRecipeStyle').value;
    const recipe = {
        name,
        style,
        malt_ingredient_name: document.getElementById('newRecipeMaltName').value,
        hops_ingredient_name: document.getElementById('newRecipeHopsName').value,
        yeast_ingredient_name: document.getElementById('newRecipeYeastName').value,
        malt_amount: (parseFloat(document.getElementById('newRecipeMalt').value) || 50) / 10,
        hops_amount: (parseFloat(document.getElementById('newRecipeHops').value) || 5) / 10,
        abv: parseFloat(document.getElementById('newRecipeAbv').value) || 5,
        ibu: parseInt(document.getElementById('newRecipeIbu').value) || 20,
        adjuncts_amount: 0,
        srm: 5,
        complexity: 1,
        brew_time_days: 1,
        ferment_time_days: 5,
        condition_time_days: 7,
        hidden_params: {
            mash_temp: document.getElementById('newRecipeMashTemp').value,
            water_type: document.getElementById('newRecipeWaterType').value,
            boil_time: 60,
        },
    };
    try {
        const res = await API.createRecipe(recipe);
        await loadGameState();
        renderRecipes();
        if (res.is_discovery) {
            showNotification(`🔬 Открыт новый стиль! Репутация +5`, 'achievement');
        }
        showSuccess(res.message || `Рецепт "${res.recipe?.name || name}" создан!`);
    } catch (e) {
        showError(e.message);
    }
}
