function renderDashboard() {
    const s = GAME_STATE.game;
    const b = GAME_STATE.brewery;
    const batches = GAME_STATE.batches || [];
    const contracts = GAME_STATE.contracts || [];
    const activeBatches = batches.filter(b => !['sold', 'spoiled'].includes(b.stage));
    const activeContracts = contracts.filter(c => c.is_active);

    const el = document.getElementById('page-dashboard');
    el.innerHTML = `
        <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
            <h2>📊 Дашборд</h2>
            <button class="btn btn-primary" onclick="doTick()">⏩ День ${s.day + 1}</button>
        </div>

        <div class="grid-4">
            <div class="card stat">
                <div class="stat-value">${formatMoney(s.money)}</div>
                <div class="stat-label">Баланс</div>
            </div>
            <div class="card stat">
                <div class="stat-value">${s.day}</div>
                <div class="stat-label">День / ${formatDate(s.day)}</div>
            </div>
            <div class="card stat">
                <div class="stat-value ${s.reputation > 60 ? 'green' : s.reputation > 30 ? '' : 'red'}">${Math.round(s.reputation)}%</div>
                <div class="stat-label" title="Высокая репутация = выше цены продажи и больше контрактов">Репутация</div>
            </div>
            <div class="card stat">
                <div class="stat-value">${b.level}</div>
                <div class="stat-label">Уровень пивоварни</div>
            </div>
        </div>

        <div class="grid-2">
            <div class="card">
                <h3>⏳ Активные партии (${activeBatches.length})</h3>
                ${activeBatches.length === 0 ? '<div class="empty-state">Нет активных партий. Сварите пиво!</div>' : `
                <table>
                    <tr><th>#</th><th>Сорт</th><th>Стадия</th><th>Прогресс</th></tr>
                    ${activeBatches.map(b => `
                        <tr>
                            <td>${b.id}</td>
                            <td>${b.recipe_name || '—'}</td>
                            <td><span class="badge badge-${b.stage}">${STAGE_RU[b.stage] || b.stage}</span></td>
                            <td>${progressBar(b.stage_progress)}</td>
                        </tr>
                    `).join('')}
                </table>
                `}
            </div>

            <div class="card">
                <h3>📋 Активные контракты (${activeContracts.length})</h3>
                ${activeContracts.length === 0 ? '<div class="empty-state">Нет активных контрактов</div>' : `
                <table>
                    <tr><th>Покупатель</th><th>Сорт</th><th>Осталось дней</th></tr>
                    ${activeContracts.map(c => `
                        <tr>
                            <td>${c.buyer_name}</td>
                            <td>${STYLE_RU[c.beer_style] || c.beer_style}</td>
                            <td>${c.days_left} / ${c.duration_days}</td>
                        </tr>
                    `).join('')}
                </table>
                `}
            </div>
        </div>

        <div class="card">
            <h3>📰 События</h3>
            <div class="events-panel" id="eventsList">
                <p class="empty-state">Нажмите "Новый день"</p>
            </div>
        </div>
    `;
}

async function doTick() {
    try {
        const result = await API.tick(1);
        await loadGameState();

        const eventsList = document.getElementById('eventsList');
        if (eventsList && result.events.length > 0) {
            eventsList.innerHTML = result.events.slice(-10).map(e =>
                `<p>📌 День ${result.day}: ${e}</p>`
            ).join('');
        }
        if (result.events.length === 0 && eventsList) {
            eventsList.innerHTML = '<p class="empty-state">Ничего особенного не произошло</p>';
        }

        showSuccess(`День ${result.day}`);
    } catch (e) {
        showError(e.message);
    }
}
