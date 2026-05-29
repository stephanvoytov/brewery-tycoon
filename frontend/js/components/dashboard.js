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
                <div class="stat-value">${s.brewing_level || 1}</div>
                <div class="stat-label" title="Растёт с каждой сваренной партией">Уровень пивовара</div>
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

        <div class="card">
            <h3>🏭 Доля рынка</h3>
            <div class="stat-value" style="font-size:1.4rem;margin-bottom:6px">${GAME_STATE.market_share || 0}%</div>
            <div class="chart-bar"><div class="chart-bar-fill" style="width:${Math.min(100, GAME_STATE.market_share || 0)}%"></div></div>
            <table style="margin-top:10px">
                <tr><th>Пивоварня</th><th>Продажи/день</th><th>Репутация</th></tr>
                <tr><td>🏠 Вы</td><td>${Math.round((s.player_total_liters || 0) / Math.max(1, s.day))}л</td><td>${Math.round(s.reputation)}%</td></tr>
                ${(GAME_STATE.competitors || []).map(c => `
                    <tr><td>${c.name}</td><td>${Math.round(c.daily_sales_liters)}л</td><td>${Math.round(c.reputation)}%</td></tr>
                `).join('')}
            </table>
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
            <h3>📌 Активные события (${(GAME_STATE.active_events || []).filter(e => e.is_choice_event && !e.choice_made).length + '/' + (GAME_STATE.active_events || []).length})</h3>
            ${(!GAME_STATE.active_events || GAME_STATE.active_events.length === 0) ? '<div class="empty-state">Нет активных событий</div>' : GAME_STATE.active_events.filter(e => !e.resolved).map(e => `
                <div class="event-item event-${e.event_type}" style="padding:8px;margin-bottom:6px;background:rgba(255,255,255,0.03);border-radius:6px;border-left:3px solid ${e.is_choice_event && !e.choice_made ? 'var(--accent)' : 'var(--text-dim)'}">
                    <strong>${e.title}</strong>
                    <div style="font-size:0.8rem;color:var(--text-dim)">${e.description}</div>
                    ${e.duration_days > 0 ? `<div style="font-size:0.75rem;color:var(--text-dim)">Осталось: ${e.days_left} дн.</div>` : ''}
                    ${e.is_choice_event && !e.choice_made ? `<button class="btn btn-sm btn-primary" style="margin-top:4px" onclick="showEventChoice(${e.id})">⚖️ Сделать выбор</button>` : ''}
                </div>
            `).join('')}
        </div>

        <div class="card">
            <h3>📰 События</h3>
            <div class="events-panel" id="eventsList">
                <p class="empty-state">Нажмите "Новый день"</p>
            </div>
        </div>

        <div id="eventChoiceModal" style="display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.85);z-index:10000;align-items:center;justify-content:center">
            <div style="background:var(--bg-card);border:2px solid var(--accent);border-radius:16px;padding:32px;max-width:500px;text-align:center">
                <div style="font-size:48px;margin-bottom:12px">⚖️</div>
                <h2 id="choiceTitle" style="color:var(--accent);margin-bottom:8px"></h2>
                <p id="choiceDesc" style="margin-bottom:20px;color:var(--text-dim);line-height:1.6"></p>
                <div id="choiceButtons" style="display:flex;flex-direction:column;gap:10px"></div>
                <button class="btn btn-secondary" style="margin-top:12px" onclick="closeEventChoice()">Закрыть</button>
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

function showEventChoice(eventId) {
    const event = (GAME_STATE.active_events || []).find(e => e.id === eventId);
    if (!event) return;

    document.getElementById('choiceTitle').textContent = event.title;
    document.getElementById('choiceDesc').textContent = event.description;

    const container = document.getElementById('choiceButtons');
    container.innerHTML = (event.choices || []).map(c =>
        `<button class="btn btn-primary" onclick="resolveEventChoice(${eventId}, '${c.key}')" style="padding:12px">${c.label}</button>`
    ).join('');

    document.getElementById('eventChoiceModal').style.display = 'flex';
}

function closeEventChoice() {
    document.getElementById('eventChoiceModal').style.display = 'none';
}

async function resolveEventChoice(eventId, choice) {
    try {
        const res = await API.resolveEvent(eventId, choice);
        showSuccess(res.message);
        closeEventChoice();
        await loadGameState();
    } catch (e) {
        showError(e.message);
    }
}
