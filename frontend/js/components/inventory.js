function renderInventory() {
    const ingredients = GAME_STATE.ingredients || [];

    const el = document.getElementById('page-inventory');
    el.innerHTML = `
        <h2>📦 Запасы ингредиентов <span class="help-link" onclick="scrollToHelp('help-guide-ingredients'); return false;" title="Подробнее о закупке и порче">❓</span></h2>
        <div class="card">
            <h3>📦 Запасы</h3>
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
            <div class="mobile-card-list">
                ${ingredients.length === 0 ? '<div class="mobile-card-empty">Нет ингредиентов</div>' :
                ingredients.map(ing => `
                    <div class="mobile-card">
                        <div class="mobile-card-row">
                            <span class="label">${ing.name}</span>
                            <span class="value">${ing.quantity.toFixed(1)} кг</span>
                        </div>
                        <div class="mobile-card-row">
                            <span class="label">Цена:</span><span class="value">${formatMoney(ing.unit_cost)}/кг</span>
                        </div>
                        <div class="mobile-card-actions">
                            <input type="number" id="buyQtyMobile_${ing.id}" value="10" min="1" style="flex:1;min-width:60px;font-size:16px;padding:8px">
                            <button class="btn btn-sm btn-success" onclick="doBuyIngredient(${ing.id})" style="flex:0">Купить</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

async function doBuyIngredient(id) {
    const qtyInput = document.getElementById(`buyQty_${id}`);
    const qty = parseInt(qtyInput?.value) || 10;
    if (qty < 1) { showError('Минимум 1 кг'); return; }
    try {
        const res = await API.buyIngredient(id, qty);
        showSuccess(`Куплено ${qty} кг за ${formatMoney(res.cost)}`);
        await loadGameState();
    } catch (e) {
        showError(e.message);
    }
}
