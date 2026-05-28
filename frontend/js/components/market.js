function renderMarket() {
    const market = GAME_STATE.market || [];
    const contracts = GAME_STATE.contracts || [];

    const el = document.getElementById('page-market');
    el.innerHTML = `
        <h2>💰 Рынок</h2>

        <div class="grid-2">
            <div class="card">
                <h3>📈 Условия рынка</h3>
                    <table>
                        <tr>
                            <th>Стиль</th>
                            <th title="Базовый спрос на этот стиль пива (0-100%)">Спрос</th>
                            <th title="Насколько выше/ниже базовой цены можно продать">Множитель цены</th>
                            <th title="Сезонный коэффициент. Летом выше спрос на светлое, зимой — на тёмное">Сезон</th>
                        </tr>
                    ${market.map(m => `
                        <tr>
                            <td>${STYLE_RU[m.beer_style] || m.beer_style}</td>
                            <td>${progressBar(m.base_demand, 100, 10)}</td>
                            <td>${(m.price_modifier * 100).toFixed(0)}%</td>
                            <td>${(m.season_factor * 100).toFixed(0)}%</td>
                        </tr>
                    `).join('')}
                </table>
            </div>

            <div class="card">
                <h3>📋 Контракты</h3>
                <table>
                    <tr>
                        <th>Покупатель</th>
                        <th>Сорт</th>
                        <th>Объём (л)</th>
                        <th>Цена/л</th>
                        <th>Срок (дн)</th>
                        <th></th>
                    </tr>
                    ${contracts.filter(c => !c.is_active).map(c => `
                        <tr>
                            <td>${c.buyer_name}</td>
                            <td>${STYLE_RU[c.beer_style] || c.beer_style}</td>
                            <td>${c.quantity_liters}</td>
                            <td>${formatMoney(c.price_per_liter)}</td>
                            <td>${c.duration_days}</td>
                            <td><button class="btn btn-sm btn-success" onclick="doSignContract(${c.id})">Подписать</button></td>
                        </tr>
                    `).join('')}
                    ${contracts.filter(c => !c.is_active).length === 0 ? '<tr><td colspan="6" class="empty-state">Нет доступных контрактов. Нажмите "Новый день"</td></tr>' : ''}
                </table>
            </div>
        </div>

        <div class="card">
            <h3>✅ Активные контракты</h3>
            <table>
                <tr>
                    <th>Покупатель</th>
                    <th>Сорт</th>
                    <th>Всего л</th>
                    <th>Доставлено л</th>
                    <th>Выручка</th>
                    <th>Осталось дней</th>
                </tr>
                ${contracts.filter(c => c.is_active).length === 0 ? '<tr><td colspan="6" class="empty-state">Нет активных контрактов</td></tr>' :
                contracts.filter(c => c.is_active).map(c => `
                    <tr>
                        <td>${c.buyer_name}</td>
                        <td>${STYLE_RU[c.beer_style] || c.beer_style}</td>
                        <td>${c.quantity_liters}</td>
                        <td>${c.delivered_liters}</td>
                        <td>${formatMoney(c.total_revenue)}</td>
                        <td>${c.days_left} / ${c.duration_days}</td>
                    </tr>
                `).join('')}
            </table>
        </div>
    `;
}

async function doSignContract(id) {
    try {
        const res = await API.signContract(id);
        showSuccess(res.message);
        await loadGameState();
        renderMarket();
    } catch (e) {
        showError(e.message);
    }
}
