let loanInfoCache = null;

async function renderFinance() {
    const s = GAME_STATE.game;
    const contracts = GAME_STATE.contracts || [];
    const staff = GAME_STATE.staff || [];
    const b = GAME_STATE.brewery;

    const revenueHistory = s.revenue_history || [];
    const expenseHistory = s.expense_history || [];
    const hasData = revenueHistory.length > 0 || expenseHistory.length > 0;
    const maxVal = Math.max(...revenueHistory, ...expenseHistory, 1);

    if (!loanInfoCache) {
        try { loanInfoCache = await API.getLoanInfo(); } catch (e) { loanInfoCache = null; }
    }

    const li = loanInfoCache || { max_loan: 0, current_debt: 0, interest_rate: 0.01, reputation: 50, brewery_level: 1 };
    const interestPct = (li.interest_rate * 100).toFixed(1);

    const inflationPct = ((s.inflation_multiplier || 1) - 1) * 100;
    const nextLevelRevenue = (Math.floor((s.total_revenue || 0) / 20000) + 1) * 20000;
    const levelProgress = Math.min(100, ((s.total_revenue || 0) % 20000) / 20000 * 100);
    const contractSlots = 1 + (b.level - 1);
    const activeContracts = contracts.filter(c => c.is_active).length;

    const el = document.getElementById('page-finance');
    el.innerHTML = `
        <h2>📈 Финансы</h2>

        <div class="grid-4">
            <div class="card stat">
                <div class="stat-value green">${formatMoney(s.total_revenue)}</div>
                <div class="stat-label">Общая выручка</div>
            </div>
            <div class="card stat">
                <div class="stat-value ${s.money >= 0 ? '' : 'red'}">${formatMoney(s.money)}</div>
                <div class="stat-label">Баланс</div>
            </div>
            <div class="card stat">
                <div class="stat-value ${s.total_revenue - s.total_expenses >= 0 ? 'green' : 'red'}">
                    ${formatMoney(s.total_revenue - s.total_expenses)}
                </div>
                <div class="stat-label">Чистая прибыль</div>
            </div>
            <div class="card stat">
                <div class="stat-value ${(s.bank_loan || 0) > 0 ? 'red' : 'green'}">${formatMoney(s.bank_loan || 0)}</div>
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

        <div class="card">
            <h3>🏦 Банк</h3>
            <div class="grid-2">
                <div class="help-card">
                    <h4>💳 Кредитный лимит</h4>
                    <p>Доступно: <strong>${formatMoney(li.max_loan - (s.bank_loan || 0))}</strong> из ${formatMoney(li.max_loan)}</p>
                    <p>Ставка: <strong>${interestPct}%/день</strong></p>
                    <p style="font-size:0.8rem;color:var(--text-dim)">
                        Формула: $5,000 + репутация×$200 + уровень×$1,000
                    </p>
                    <div style="margin-top:12px">
                        <label>Сумма кредита</label>
                        <input type="number" id="loanAmount" value="${Math.min(1000, Math.round(li.max_loan - (s.bank_loan || 0)))}" min="100" max="${li.max_loan - (s.bank_loan || 0)}" step="100" style="width:120px;padding:6px 8px;margin-right:8px">
                        <button class="btn btn-primary" onclick="doTakeLoan()">📥 Взять</button>
                        <button class="btn btn-secondary" onclick="doRepayLoan()">📤 Погасить</button>
                    </div>
                </div>
                <div class="help-card">
                    <h4>📋 Текущий долг</h4>
                    <p>Долг: <strong class="${(s.bank_loan || 0) > 0 ? 'red' : 'green'}">${formatMoney(s.bank_loan || 0)}</strong></p>
                    <p>Проценты: <strong>≈${formatMoney((s.bank_loan || 0) * li.interest_rate)}/день</strong></p>
                    ${(s.bank_loan || 0) > 0 ? `<p style="font-size:0.8rem;color:var(--text-dim)">Погасите долг, чтобы не платить проценты</p>` : '<p style="font-size:0.8rem;color:var(--green)">✅ Нет задолженности</p>'}
                </div>
            </div>
        </div>

        <div class="grid-3">
            <div class="card">
                <h3>🏢 Постоянные расходы</h3>
                <table>
                    <tr><td>Аренда</td><td>${formatMonthly(b.rent)}</td></tr>
                    <tr><td>Зарплаты (${staff.length} чел.)</td><td>${formatMonthly(staff.reduce((sum, s) => sum + s.salary, 0))}</td></tr>
                    ${(s.bank_loan || 0) > 0 ? `<tr><td>Проценты по кредиту</td><td>${formatMoney((s.bank_loan || 0) * li.interest_rate)}/день</td></tr>` : ''}
                    <tr><td><strong>Итого в день</strong></td><td><strong>${formatMoney(b.rent + staff.reduce((sum, s) => sum + s.salary, 0) + ((s.bank_loan || 0) * li.interest_rate))}/день</strong></td></tr>
                </table>
                <div class="mobile-card-list">
                    <div class="mobile-card">
                        <div class="mobile-card-row"><span class="label">Аренда</span><span class="value">${formatMonthly(b.rent)}</span></div>
                        <div class="mobile-card-row"><span class="label">Зарплаты (${staff.length} чел.)</span><span class="value">${formatMonthly(staff.reduce((sum, s) => sum + s.salary, 0))}</span></div>
                        ${(s.bank_loan || 0) > 0 ? `<div class="mobile-card-row"><span class="label">Проценты</span><span class="value">${formatMoney((s.bank_loan || 0) * li.interest_rate)}/день</span></div>` : ''}
                        <div class="mobile-card-row"><span class="label"><strong>Итого в день</strong></span><span class="value"><strong>${formatMoney(b.rent + staff.reduce((sum, s) => sum + s.salary, 0) + ((s.bank_loan || 0) * li.interest_rate))}/день</strong></span></div>
                    </div>
                </div>
            </div>
            <div class="card">
                <h3>💰 Контракты</h3>
                <p style="font-size:0.8rem;color:var(--text-dim);margin-bottom:8px">Слотов: ${activeContracts}/${contractSlots}</p>
                <table>
                    ${contracts.filter(c => c.is_active).length === 0 ? '<tr><td class="empty-state">Нет активных контрактов</td></tr>' :
                    contracts.filter(c => c.is_active).map(c => `
                        <tr><td>${c.buyer_name}</td><td>${formatMoney(c.total_revenue)}</td></tr>
                    `).join('')}
                </table>
                <div class="mobile-card-list">
                    ${contracts.filter(c => c.is_active).length === 0 ? '<div class="mobile-card-empty">Нет активных контрактов</div>' :
                    contracts.filter(c => c.is_active).map(c => `
                        <div class="mobile-card">
                            <div class="mobile-card-row"><span class="label">${c.buyer_name}</span><span class="value">${formatMoney(c.total_revenue)}</span></div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="card">
                <h3>📦 Активы</h3>
                <div>Баланс: ${formatMoney(s.money)}</div>
                <div>Валюта: ${getCurrency()}</div>
                <div>Репутация: ${Math.round(s.reputation)}%</div>
                <div>День: ${s.day}</div>
            </div>
        </div>

        <div class="grid-2">
            <div class="card">
                <h3>📈 Инфляция</h3>
                <p>Текущий уровень: <strong>${inflationPct > 0 ? '+' : ''}${inflationPct.toFixed(1)}%</strong></p>
                <p style="font-size:0.8rem;color:var(--text-dim)">Каждые 30 дней цены на ингредиенты растут на 1–3%</p>
                <p style="font-size:0.8rem;color:var(--text-dim)">Следующее повышение: через ${Inflation.INTERVAL_DAYS - (s.day % Inflation.INTERVAL_DAYS)} дней</p>
            </div>
            <div class="card">
                <h3>🏭 Прогрессия пивоварни</h3>
                <p>Уровень: <strong>${b.level}</strong></p>
                <div class="chart-bar" style="margin:4px 0">
                    <div class="chart-bar-fill" style="width:${levelProgress}%"></div>
                </div>
                <p style="font-size:0.85rem;color:var(--text-dim)">Следующий уровень: ${formatMoney(nextLevelRevenue)} выручки</p>
                <p style="font-size:0.8rem;color:var(--text-dim)">
                    🏅 +5% к цене продажи · +1 слот контракта
                </p>
            </div>
        </div>

        <div class="card">
            <h3>💰 Налоговый календарь</h3>
            <div class="grid-2">
                <div class="help-card">
                    <p>Налог платится <strong>каждые 7 дней</strong>:</p>
                    <ul>
                        <li>10% от прибыли за период</li>
                        <li>Минимум $200</li>
                    </ul>
                </div>
                <div class="help-card">
                    <p>Дней до налога: <strong>${Tax.INTERVAL_DAYS - (s.day % Tax.INTERVAL_DAYS)}</strong></p>
                    <p>Последняя проверка: <strong>день ${s.last_tax_day || '—'}</strong></p>
                </div>
            </div>
        </div>
    `;
}

async function doTakeLoan() {
    const amount = parseInt(document.getElementById('loanAmount')?.value);
    if (!amount || amount < 100) { showError('Минимум $100'); return; }
    try {
        const res = await API.takeLoan(amount);
        showSuccess(res.message);
        loanInfoCache = null;
        await loadGameState();
        renderFinance();
    } catch (e) { showError(e.message); }
}

async function doRepayLoan() {
    const amount = parseInt(document.getElementById('loanAmount')?.value);
    if (!amount || amount < 100) { showError('Минимум $100'); return; }
    try {
        const res = await API.repayLoan(amount);
        showSuccess(res.message);
        loanInfoCache = null;
        await loadGameState();
        renderFinance();
    } catch (e) { showError(e.message); }
}

// Constants for display (mirrors backend config)
const Inflation = { INTERVAL_DAYS: 30 };
const Tax = { INTERVAL_DAYS: 7 };