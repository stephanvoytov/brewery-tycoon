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
                    <select id="newRecipeStyle">
                        ${Object.entries(STYLE_RU).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>ABV (%)</label>
                    <input type="number" id="newRecipeAbv" value="5.0" step="0.1">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Солод (кг/10л)</label>
                    <input type="number" id="newRecipeMalt" value="5.0" step="0.1">
                </div>
                <div class="form-group">
                    <label>Хмель (кг/10л)</label>
                    <input type="number" id="newRecipeHops" value="0.5" step="0.1">
                </div>
                <div class="form-group">
                    <label>IBU</label>
                    <input type="number" id="newRecipeIbu" value="25">
                </div>
                <div class="form-group">
                    <label>Себест./л</label>
                    <input type="number" id="newRecipeCost" value="0.5" step="0.1">
                </div>
                <div class="form-group">
                    <label>Цена/л</label>
                    <input type="number" id="newRecipePrice" value="2.0" step="0.1">
                </div>
            </div>
            <button class="btn btn-success" onclick="doCreateRecipe()">Создать рецепт</button>
        </div>
    `;
}

let brewRecipeId = null;

function showBrewModal(recipeId) {
    brewRecipeId = recipeId;
    const modal = document.getElementById('brewModal');
    modal.style.display = 'block';
    const recipe = GAME_STATE.recipes.find(r => r.id === recipeId);
    if (recipe) {
        document.getElementById('brewInfo').textContent =
            `Рецепт: ${recipe.name} | Стиль: ${STYLE_RU[recipe.style]} | Себестоимость: ${formatMoney(recipe.cost_per_liter * 100)}/100л | ` +
            `Варка: ${recipe.brew_time_days}д | Ферментация: ${recipe.ferment_time_days}д | Дозревание: ${recipe.condition_time_days}д`;
    }
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
    } catch (e) {
        showError(e.message);
    }
}

async function doCreateRecipe() {
    const name = document.getElementById('newRecipeName').value.trim();
    if (!name) { showError('Введите название рецепта'); return; }
    const recipe = {
        name,
        style: document.getElementById('newRecipeStyle').value,
        malt_amount: parseFloat(document.getElementById('newRecipeMalt').value) || 5,
        hops_amount: parseFloat(document.getElementById('newRecipeHops').value) || 0.5,
        abv: parseFloat(document.getElementById('newRecipeAbv').value) || 5,
        ibu: parseInt(document.getElementById('newRecipeIbu').value) || 20,
        cost_per_liter: parseFloat(document.getElementById('newRecipeCost').value) || 0.5,
        base_price_per_liter: parseFloat(document.getElementById('newRecipePrice').value) || 2.0,
        yeast_type: 'standard',
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
