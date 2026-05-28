function renderRecipes() {
    const recipes = GAME_STATE.recipes || [];
    const ingredients = GAME_STATE.ingredients || [];
    const brewery = GAME_STATE.brewery;

    const el = document.getElementById('page-recipes');
    el.innerHTML = `
        <h2>📝 Рецепты и варка</h2>

        <div class="grid-2">
            <div class="card">
                <h3>🍺 Рецепты</h3>
                    <table>
                        <tr>
                            <th></th>
                            <th>Название</th>
                            <th>Стиль</th>
                            <th title="ABV (Alcohol By Volume) — крепость пива в процентах">ABV</th>
                            <th title="IBU (International Bitterness Units) — горечь пива от хмеля">IBU</th>
                            <th title="Солод на 100л">🌾 Солод</th>
                            <th title="Хмель на 100л">🌿 Хмель</th>
                            <th>Себест./100л</th>
                            <th></th>
                        </tr>
                        ${recipes.map(r => `
                            <tr>
                                <td><span class="srm-dot" style="background:${SRM_COLORS[r.style] || '#ccc'}" title="SRM ${r.srm || '?'} — цвет пива"></span></td>
                                <td>${r.name}</td>
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
                    <select id="newRecipeStyle" onchange="updateIngredientRecs()">
                        ${Object.entries(STYLE_RU).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}
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
        document.getElementById('brewInfo').innerHTML =
            `<b>${recipe.name}</b> (${STYLE_RU[recipe.style]})<br>` +
            `Себестоимость: ${formatMoney(recipe.cost_per_liter * 100)}/100л<br>` +
            `Варка: ${recipe.brew_time_days}д → Ферментация: ${recipe.ferment_time_days}д → Дозревание: ${recipe.condition_time_days}д<br>` +
            `Потребуется на ${size}л:<br>` +
            `🌾 ${recipe.malt_ingredient_name || 'Солод'}: ${needMalt} кг ${hasMalt ? '✅' : '❌'}<br>` +
            `🌿 ${recipe.hops_ingredient_name || 'Хмель'}: ${needHops} кг ${hasHops ? '✅' : '❌'}<br>` +
            `🧫 ${recipe.yeast_ingredient_name || 'Дрожжи'}: ${needYeast} кг ${hasYeast ? '✅' : '❌'}<br>` +
            `<span style="color:${totalOk ? 'var(--green)' : 'var(--red)'};font-weight:bold">${totalOk ? '✅ Ингредиентов достаточно' : '❌ Пополните запасы'}</span>`;
    }

    updateBrewInfo();
    document.getElementById('brewSize').oninput = updateBrewInfo;

    document.getElementById('brewConfirmBtn').onclick = async () => {
        const size = parseFloat(document.getElementById('brewSize').value) || 50;
        try {
            const res = await API.startBrew(recipeId, size);
            showSuccess(res.message);
            await loadGameState();
            modal.style.display = 'none';
            renderRecipes();
        } catch (e) {
            showError(e.message);
        }
    };
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
    const recipe = {
        name,
        style: document.getElementById('newRecipeStyle').value,
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
    };
    try {
        const res = await API.createRecipe(recipe);
        showSuccess(`Рецепт "${res.name}" создан!`);
        await loadGameState();
        renderRecipes();
    } catch (e) {
        showError(e.message);
    }
}
