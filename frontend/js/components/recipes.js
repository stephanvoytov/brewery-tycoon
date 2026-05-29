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
                <h3>🍺 Рецепты (${unlockedRecipes.length} открыто)</h3>
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
            </div>

            <div class="card">
                <h3>📦 Запасы ингредиентов</h3>
                <table>
                    <tr>
                        <th>Ингредиент</th>
                        <th>Кол-во</th>
                        <th>Цена</th>
                        <th></th>
                    </tr>
                    ${ingredients.map(ing => `
                        <tr>
                            <td>${ing.name}</td>
                            <td>${ing.quantity.toFixed(1)} кг</td>
                            <td>${formatMoney(ing.unit_cost)}/кг</td>
                            <td>
                                <input type="number" id="buyQty_${ing.id}" value="10" min="1" style="width:60px;padding:4px 6px;">
                                <button class="btn btn-sm btn-success" onclick="doBuyIngredient(${ing.id})">Купить</button>
                            </td>
                        </tr>
                    `).join('')}
                </table>
            </div>
        </div>

        <div class="card" id="brewModal" style="display:none">
            <h3>🍺 Начать варку</h3>
            <div class="form-row">
                <div class="form-group">
                    <label>Объём партии (л)</label>
                    <input type="number" id="brewSize" value="50" min="10" max="${brewery.storage_capacity}">
                </div>
                <button class="btn btn-success" id="brewConfirmBtn">Начать варку</button>
                <button class="btn btn-danger" onclick="document.getElementById('brewModal').style.display='none'">Отмена</button>
            </div>
            <div id="brewInfo" style="margin-top:10px;font-size:0.85rem;color:var(--text-dim)"></div>
        </div>

        <div class="card">
            <h3>➕ Создать новый рецепт</h3>
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
                    <label>🌡 Температура затирания</label>
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
    const modal = document.getElementById('brewModal');
    modal.style.display = 'block';
    const recipe = GAME_STATE.recipes.find(r => r.id === recipeId);
    const ingredients = GAME_STATE.ingredients || [];

    function updateBrewInfo() {
        if (!recipe) return;
        const size = parseFloat(document.getElementById('brewSize').value) || 50;
        const maltPerL = (recipe.malt_amount || 0) / 10;
        const hopsPerL = (recipe.hops_amount || 0) / 10;
        const yeastPerL = 0.1 / 10;
        const needMalt = (maltPerL * size).toFixed(1);
        const needHops = (hopsPerL * size).toFixed(1);
        const needYeast = (yeastPerL * size).toFixed(2);
        const maltIng = ingredients.find(i => i.name === recipe.malt_ingredient_name);
        const hopsIng = ingredients.find(i => i.name === recipe.hops_ingredient_name);
        const yeastIng = ingredients.find(i => i.name === recipe.yeast_ingredient_name);
        const hasMalt = maltIng && maltIng.quantity >= needMalt;
        const hasHops = hopsIng && hopsIng.quantity >= needHops;
        const hasYeast = yeastIng && yeastIng.quantity >= needYeast;
        const totalOk = hasMalt && hasHops && hasYeast;

        const ingScore = 40 - (recipe.malt_ingredient_name && STYLE_RECS[recipe.style] && recipe.malt_ingredient_name !== STYLE_RECS[recipe.style].malt ? 10 : 0) - (recipe.hops_ingredient_name && STYLE_RECS[recipe.style] && recipe.hops_ingredient_name !== STYLE_RECS[recipe.style].hops ? 10 : 0) - (recipe.yeast_ingredient_name && STYLE_RECS[recipe.style] && recipe.yeast_ingredient_name !== STYLE_RECS[recipe.style].yeast ? 5 : 0);
        const eqScore = GAME_STATE.equipment && GAME_STATE.equipment.length ? Math.round(30 * GAME_STATE.equipment.filter(e => e.is_owned).reduce((s, e) => s + (e.wear_tear || 100), 0) / Math.max(1, GAME_STATE.equipment.filter(e => e.is_owned).length) / 100) : 30;
        const skillScore = Math.min(20, (GAME_STATE.game.brewing_level || 1) * 2);
        const mastScore = Math.min(5, Math.floor((recipe.mastery_count || 0) * 0.5));
        const estQuality = Math.min(100, Math.max(10, ingScore + eqScore + skillScore + mastScore));

        document.getElementById('brewInfo').innerHTML =
            `<b>${recipe.name}</b> (${STYLE_RU[recipe.style]})<br>` +
            `Себестоимость: ${formatMoney(recipe.cost_per_liter * 100)}/100л<br>` +
            `Варка: ${recipe.brew_time_days}д → Ферментация: ${recipe.ferment_time_days}д → Дозревание: ${recipe.condition_time_days}д<br>` +
            `Потребуется на ${size}л:<br>` +
            `🌾 ${recipe.malt_ingredient_name || 'Солод'}: ${needMalt} кг ${hasMalt ? '✅' : '❌'}<br>` +
            `🌿 ${recipe.hops_ingredient_name || 'Хмель'}: ${needHops} кг ${hasHops ? '✅' : '❌'}<br>` +
            `🧫 ${recipe.yeast_ingredient_name || 'Дрожжи'}: ${needYeast} кг ${hasYeast ? '✅' : '❌'}<br>` +
            `<span style="color:${totalOk ? 'var(--green)' : 'var(--red)'};font-weight:bold">${totalOk ? '✅ Ингредиентов достаточно' : '❌ Пополните запасы'}</span><br>` +
            `<div style="margin-top:8px;font-size:0.8rem;border-top:1px solid var(--border);padding-top:6px">` +
            `<b>⭐ Прогноз качества ≈${estQuality}</b><br>` +
            `<span class="text-dim">🌾 Ингредиенты ${ingScore}/40 · ⚙️ Оборудование ${eqScore}/30 · 🧑‍🍳 Навык ${skillScore}/20 · ⭐ Мастерство ${mastScore}/5 · 🎲 ±5</span>` +
            `</div>`;
    }

    updateBrewInfo();
    document.getElementById('brewSize').oninput = updateBrewInfo;

    document.getElementById('brewConfirmBtn').onclick = async () => {
        const size = parseFloat(document.getElementById('brewSize').value) || 50;
        try {
            const res = await API.startBrew(recipeId, size);
            const qb = res.quality_breakdown;
            let detail = '';
            if (qb) {
                detail = `\n⭐ Качество: ${qb.total} (🌾${qb.ingredient} ⚙️${qb.equipment} 🧑‍🍳${qb.skill} ⭐${qb.mastery} 🎲${qb.random > 0 ? '+' : ''}${qb.random})`;
            }
            showSuccess(res.message + detail);
            await loadGameState();
            modal.style.display = 'none';
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

async function doBuyIngredient(id) {
    const qtyInput = document.getElementById(`buyQty_${id}`);
    const qty = parseInt(qtyInput?.value) || 10;
    if (qty < 1) { showError('Минимум 1 кг'); return; }
    try {
        const res = await API.buyIngredient(id, qty);
        showSuccess(`Куплено ${qty} кг за ${formatMoney(res.cost)}`);
        await loadGameState();
        renderRecipes();
        if (brewRecipeId !== null) {
            showBrewModal(brewRecipeId);
        }
    } catch (e) {
        showError(e.message);
    }
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
    const pricePerLiter = costPerLiter * 3.5;
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
