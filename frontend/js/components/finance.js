function renderFinance() {
    const s = GAME_STATE.game;
    const contracts = GAME_STATE.contracts || [];
    const staff = GAME_STATE.staff || [];
    const b = GAME_STATE.brewery;

    const revenueHistory = s.revenue_history || [];
    const expenseHistory = s.expense_history || [];

    const maxVal = Math.max(...revenueHistory, ...expenseHistory, 1);

    const el = document.getElementById('page-finance');
    el.innerHTML = `
        <h2>📈 Финансы</h2>

        <div class="grid-4">
            <div class="card stat">
                <div class="stat-value green">${formatMoney(s.total_revenue)}</div>
                <div class="stat-label">Общая выручка</div>
            </div>
            <div class="card stat">
                <div class="stat-value red">${formatMoney(s.total_expenses)}</div>
                <div class="stat-label">Общие расходы</div>
            </div>
            <div class="card stat">
                <div class="stat-value ${s.total_revenue - s.total_expenses >= 0 ? 'green' : 'red'}">
                    ${formatMoney(s.total_revenue - s.total_expenses)}
                </div>
                <div class="stat-label">Чистая прибыль</div>
            </div>
            <div class="card stat">
                <div class="stat-value blue">${formatMoney(s.bank_loan)}</div>
                <div class="stat-label">Кредит</div>
            </div>
        </div>

        <div class="grid-2">
            <div class="card">
                <h3>📊 Доходы за последние 30 дней</h3>
                <div style="display:flex;align-items:flex-end;gap:2px;height:120px;padding:10px 0">
                    ${revenueHistory.length === 0 ? '<div class="empty-state" style="width:100%">Нет данных</div>' :
                    revenueHistory.map(v => {
                        const h = (v / maxVal) * 100;
                        return `<div style="flex:1;background:var(--green);height:${Math.max(h, 2)}%;min-width:6px;border-radius:2px 2px 0 0" title="${formatMoney(v)}"></div>`;
                    }).join('')}
                </div>
            </div>

            <div class="card">
                <h3>📊 Расходы за последние 30 дней</h3>
                <div style="display:flex;align-items:flex-end;gap:2px;height:120px;padding:10px 0">
                    ${expenseHistory.length === 0 ? '<div class="empty-state" style="width:100%">Нет данных</div>' :
                    expenseHistory.map(v => {
                        const h = (v / maxVal) * 100;
                        return `<div style="flex:1;background:var(--red);height:${Math.max(h, 2)}%;min-width:6px;border-radius:2px 2px 0 0" title="${formatMoney(v)}"></div>`;
                    }).join('')}
                </div>
            </div>
        </div>

        <div class="grid-3">
            <div class="card">
                <h3>🏢 Постоянные расходы</h3>
                <table>
                    <tr><td>Аренда</td><td>${formatMonthly(b.rent)}</td></tr>
                    <tr><td>Зарплаты (${staff.length} чел.)</td><td>${formatMonthly(staff.reduce((sum, s) => sum + s.salary, 0))}</td></tr>
                    ${s.bank_loan > 0 ? `<tr><td>Проценты по кредиту</td><td>${formatMoney(s.bank_loan * 0.005)}/день</td></tr>` : ''}
                    <tr><td><strong>Итого в день</strong></td><td><strong>${formatMoney(b.rent + staff.reduce((sum, s) => sum + s.salary, 0) + (s.bank_loan > 0 ? s.bank_loan * 0.005 : 0))}/день</strong></td></tr>
                </table>
            </div>

            <div class="card">
                <h3>💰 Контракты</h3>
                <table>
                    ${contracts.filter(c => c.is_active).length === 0 ? '<tr><td class="empty-state">Нет активных контрактов</td></tr>' :
                    contracts.filter(c => c.is_active).map(c => `
                        <tr><td>${c.buyer_name}</td><td>${formatMoney(c.total_revenue)}</td></tr>
                    `).join('')}
                </table>
            </div>

            <div class="card">
                <h3>📦 Активы</h3>
                <div>Баланс: ${formatMoney(s.money)}</div>
                <div>Валюта: ${getCurrency()}</div>
                <div>Репутация: ${Math.round(s.reputation)}%</div>
                <div>День: ${s.day}</div>
            </div>
        </div>
    `;
}
