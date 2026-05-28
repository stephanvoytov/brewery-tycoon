async function renderLeaderboard(metric) {
    const el = document.getElementById('page-leaderboard');
    if (!el) return;

    el.innerHTML = `
        <div class="card">
            <h2>🏆 Лидерборд</h2>
            <div class="lb-tabs">
                <button class="lb-tab ${metric === 'money' ? 'active' : ''}" data-metric="money">💰 Деньги</button>
                <button class="lb-tab ${metric === 'total_revenue' ? 'active' : ''}" data-metric="total_revenue">📈 Выручка</button>
                <button class="lb-tab ${metric === 'reputation' ? 'active' : ''}" data-metric="reputation">⭐ Репутация</button>
                <button class="lb-tab ${metric === 'day' ? 'active' : ''}" data-metric="day">📅 Дни</button>
            </div>
            <div id="lbContent" class="lb-content">
                <div class="page-loading">Загрузка...</div>
            </div>
        </div>
    `;

    // Re-attach tab click handlers
    document.querySelectorAll('.lb-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.lb-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderLeaderboard(tab.dataset.metric);
        });
    });

    try {
        const data = await API.getLeaderboard(metric, 20);
        const lbContent = document.getElementById('lbContent');
        if (!data.entries || data.entries.length === 0) {
            lbContent.innerHTML = '<p class="text-muted">Пока нет участников. Зарегистрируйтесь и играйте!</p>';
            return;
        }

        lbContent.innerHTML = `
            <table class="lb-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Игрок</th>
                        <th>${metric === 'money' ? 'Деньги' : metric === 'total_revenue' ? 'Выручка' : metric === 'reputation' ? 'Репутация' : 'День'}</th>
                        <th>День</th>
                        <th>Репутация</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.entries.map(e => `
                        <tr>
                            <td class="lb-rank">${e.rank <= 3 ? ['🥇','🥈','🥉'][e.rank-1] : e.rank}</td>
                            <td>${esc(e.username)}</td>
                            <td class="lb-value">${formatMoney(e.money)}</td>
                            <td>${e.day}</td>
                            <td>${Math.round(e.reputation)}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (e) {
        const lbContent = document.getElementById('lbContent');
        if (lbContent) lbContent.innerHTML = '<p class="text-muted">Не удалось загрузить лидерборд</p>';
    }
}

function esc(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
}
