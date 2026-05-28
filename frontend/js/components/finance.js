function renderFinance() {
    const s = GAME_STATE.game;
    const contracts = GAME_STATE.contracts || [];
    const staff = GAME_STATE.staff || [];
    const b = GAME_STATE.brewery;

    const revenueHistory = s.revenue_history || [];
    const expenseHistory = s.expense_history || [];
    const hasData = revenueHistory.length > 0 || expenseHistory.length > 0;

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
                <div style="position:relative;display:flex;align-items:flex-end;gap:2px;height:160px;padding:20px 0 10px">
                    ${!hasData ? '<div class="empty-state" style="width:100%">Нажмите «Новый день» на дашборде</div>' :
                    !revenueHistory.length ? '<div class="empty-state" style="width:100%">Нет данных о доходах</div>' :
                    revenueHistory.map(v => {
                        const h = (v / maxVal) * 100;
                        return `<div style="flex:1;background:var(--green);height:${Math.max(h, 2)}%;min-width:10px;border-radius:2px 2px 0 0" title="День ${revenueHistory.indexOf(v) + 1}: ${formatMoney(v)}"></div>`;
                    }).join('')}
                    ${hasData ? `<div style="position:absolute;top:2px;right:4px;font-size:0.7rem;color:var(--text-dim)">max ${formatMoney(maxVal)}</div>` : ''}
                    ${hasData ? `<div style="position:absolute;bottom:0;left:0;right:0;display:flex;justify-content:space-between;font-size:0.65rem;color:var(--text-dim);padding:0 2px"><span>1</span><span>${Math.min(revenueHistory.length || expenseHistory.length, 30)}</span></div>` : ''}
                </div>
            </div>

            <div class="card">
                <h3>📊 Расходы за последние 30 дней</h3>
                <div style="position:relative;display:flex;align-items:flex-end;gap:2px;height:160px;padding:20px 0 10px">
                    ${!hasData ? '<div class="empty-state" style="width:100%">Нажмите «Новый день» на дашборде</div>' :
                    !expenseHistory.length ? '<div class="empty-state" style="width:100%">Нет данных о расходах</div>' :
                    expenseHistory.map(v => {
                        const h = (v / maxVal) * 100;
                        return `<div style="flex:1;background:var(--red);height:${Math.max(h, 2)}%;min-width:10px;border-radius:2px 2px 0 0" title="День ${expenseHistory.indexOf(v) + 1}: ${formatMoney(v)}"></div>`;
                    }).join('')}
                    ${hasData ? `<div style="position:absolute;top:2px;right:4px;font-size:0.7rem;color:var(--text-dim)">max ${formatMoney(maxVal)}</div>` : ''}
                    ${hasData ? `<div style="position:absolute;bottom:0;left:0;right:0;display:flex;justify-content:space-between;font-size:0.65rem;color:var(--text-dim);padding:0 2px"><span>1</span><span>${Math.min(expenseHistory.length || revenueHistory.length, 30)}</span></div>` : ''}
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
