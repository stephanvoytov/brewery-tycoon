function renderDashboard() {
    const s = GAME_STATE.game;
    const b = GAME_STATE.brewery;
    const batches = GAME_STATE.batches || [];
    const contracts = GAME_STATE.contracts || [];
    const activeBatches = batches.filter(b => !['sold', 'spoiled'].includes(b.stage));
    const activeContracts = contracts.filter(c => c.is_active);
    const achievements = s.achievements || [];

    const bankruptcyWarning = s.days_bankrupt > 0 && s.money < -5000
        ? `<div class="alert alert-danger" style="margin-bottom:16px">⚠️ КРИТИЧЕСКИЙ ДОЛГ! Дней до банкротства: ${30 - s.days_bankrupt}</div>`
        : '';

    const goalProgress = Math.min(100, Math.round((s.total_revenue / 100000) * 100));

    const achList = achievements.length > 0
        ? achievements.map(id => ACHIEVEMENTS[id] ? `<span class="ach-badge" title="${ACHIEVEMENTS[id].desc}">${ACHIEVEMENTS[id].icon} ${ACHIEVEMENTS[id].name}</span>` : '').join(' ')
        : '<span class="text-muted">Пока нет достижений</span>';

    const el = document.getElementById('page-dashboard');
    el.innerHTML = `
        <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
            <h2>📊 Дашборд</h2>
            <button class="btn btn-primary" onclick="doTick()">⏩ День ${s.day + 1}</button>
        </div>

        ${bankruptcyWarning}

        <div class="grid-4">
            <div class="card stat">
                <div class="stat-value ${s.money < 0 ? 'red' : ''}">${formatMoney(s.money)}</div>
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

        <div class="card">
            <h3>🏆 Цель: заработать $100,000</h3>
            <div class="chart-bar"><div class="chart-bar-fill" style="width:${goalProgress}%"></div></div>
            <div style="font-size:0.8rem;color:var(--text-dim);margin-top:4px">Выручено: ${formatMoney(s.total_revenue)} из $100,000</div>
        </div>

        <div class="card">
            <h3>⭐ Достижения</h3>
            <div style="display:flex;flex-wrap:wrap;gap:6px">${achList}</div>
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

        <div id="gameOverModal" style="display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.85);z-index:10000;align-items:center;justify-content:center">
            <div style="background:var(--bg-card);border:2px solid var(--red);border-radius:16px;padding:40px;max-width:450px;text-align:center">
                <div style="font-size:64px;margin-bottom:16px">💀</div>
                <h2 style="color:var(--red);margin-bottom:12px">БАНКРОТСТВО!</h2>
                <p style="margin-bottom:20px;color:var(--text-dim);line-height:1.6">
                    Ваша пивоварня обанкротилась. Долг превысил $5,000 и держался больше месяца.<br>
                    Кредиторы забрали имущество.
                </p>
                <p style="margin-bottom:24px;color:var(--text)">Можете начать заново с половиной оставшегося капитала.</p>
                <button class="btn btn-primary" onclick="restartAfterGameOver()" style="font-size:1rem;padding:12px 32px">🔄 Начать заново</button>
                <button class="btn btn-secondary" onclick="startNewGame()" style="margin-top:12px">🆕 Совсем новая игра</button>
            </div>
        </div>
    `;

    if (s.game_over) {
        document.getElementById('gameOverModal').style.display = 'flex';
    }
}

function classifyEvent(e) {
    if (e.includes('🎉')) return 'achievement';
    if (e.includes('💀') || e.includes('БАНКРОТСТВО')) return 'danger';
    if (e.includes('готова к продаже')) return 'success';
    if (e.includes('завершено')) return 'info';
    if (e.includes('просрочен') || e.includes('Штраф')) return 'warning';
    if (e.includes('КРИТИЧЕСКИЙ')) return 'danger';
    return null;
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

            result.events.forEach(e => {
                const type = classifyEvent(e);
                if (type) {
                    showNotification(e, type);
                }
            });
        }
        if (result.events.length === 0 && eventsList) {
            eventsList.innerHTML = '<p class="empty-state">Ничего особенного не произошло</p>';
        }

        if (result.game_over) {
            const modal = document.getElementById('gameOverModal');
            if (modal) modal.style.display = 'flex';
            showNotification('💀 БАНКРОТСТВО! Игра окончена.', 'danger');
        } else {
            showSuccess(`День ${result.day}`);
        }
    } catch (e) {
        showError(e.message);
    }
}

async function restartAfterGameOver() {
    try {
        const res = await API.restartAfterGameOver();
        await loadGameState();
        document.getElementById('gameOverModal').style.display = 'none';
        showSuccess(`Новый старт с ${formatMoney(res.money)}`);
    } catch (e) {
        showError(e.message);
    }
}
