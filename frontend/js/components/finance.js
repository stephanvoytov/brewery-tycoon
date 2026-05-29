let loanInfoCache = null;
let financeChart = null;

function makeGradient(ctx, c1, c2) {
    const g = ctx.createLinearGradient(0, 0, 0, 240);
    g.addColorStop(0, c1);
    g.addColorStop(1, c2);
    return g;
}

function buildChartLabels(n) {
    const labels = [];
    for (let i = 0; i < n; i++) labels.push('День ' + (i + 1));
    return labels;
}

async function renderFinance() {
    const s = GAME_STATE.game;
    const contracts = GAME_STATE.contracts || [];
    const staff = GAME_STATE.staff || [];
    const b = GAME_STATE.brewery;

    const revenueHistory = s.revenue_history || [];
    const expenseHistory = s.expense_history || [];
    const hasData = revenueHistory.length > 0 || expenseHistory.length > 0;

    if (!loanInfoCache) {
        try { loanInfoCache = await API.getLoanInfo(); } catch (e) { loanInfoCache = null; }
    }

    const li = loanInfoCache || { max_loan: 0, current_debt: 0, interest_rate: 0.01, reputation: 50, brewery_level: 1 };
    const interestPct = (li.interest_rate * 100).toFixed(1);

    const inflationPct = ((s.inflation_multiplier || 1) - 1) * 100;

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

        <div class="card">
            <h3>📊 Доходы и расходы</h3>
            <div class="finance-chart-wrap">
                ${!hasData ? '<div class="empty-state">Нажмите «Новый день» на дашборде</div>' : '<canvas id="financeChart"></canvas>'}
            </div>
        </div>

            <div class="card">
                <h3>🏦 Банк <span class="help-link" onclick="scrollToHelp('help-guide-loans'); return false;" title="Подробнее о кредитах">❓</span></h3>
            <div class="grid-2">
                <div class="help-card">
                    <h4>💳 Кредитный лимит</h4>
                    <p>Доступно: <strong>${formatMoney(li.max_loan - (s.bank_loan || 0))}</strong> из ${formatMoney(li.max_loan)}</p>
                    <p>Ставка: <strong>${interestPct}%/день</strong></p>
                    <p style="font-size:0.8rem;color:var(--text-dim)">
                        Формула: ${formatMoney(5000)} + репутация×${formatMoney(200)} + уровень×${formatMoney(1000)}
                    </p>
                    <div class="loan-controls">
                        <label class="loan-label">Сумма кредита</label>
                        <div class="loan-input-row">
                            <input type="number" id="loanAmount" value="${Math.min(1000, Math.round(li.max_loan - (s.bank_loan || 0)))}" min="100" max="${li.max_loan - (s.bank_loan || 0)}" step="100">
                            <button class="btn btn-primary loan-btn" onclick="doTakeLoan()">📥 Взять</button>
                            <button class="btn btn-secondary loan-btn" onclick="doRepayLoan()">📤 Погасить</button>
                        </div>
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
                <h3>🛡 Страховка</h3>
                <p>${s.has_insurance ? '✅ Страховка активна (покрывает поломку)' : '❌ Страховка не куплена'}</p>
                ${!s.has_insurance ? `<div style="margin-top:10px"><button class="btn btn-primary" onclick="doBuyInsurance()">Купить ${formatMoney(500)}</button></div>` : ''}
            </div>
        </div>

        <div class="grid-2">
            <div class="card">
                <h3>📈 Инфляция <span class="help-link" onclick="scrollToHelp('help-guide-inflation'); return false;" title="Подробнее об инфляции">❓</span></h3>
                <p>Уровень: <strong>${inflationPct > 0 ? '+' : ''}${inflationPct.toFixed(1)}%</strong></p>
                <p style="font-size:0.8rem;color:var(--text-dim)">Следующее повышение: через ${30 - (s.day % 30)} дней</p>
            </div>
            <div class="card">
                <h3>💰 Налоговый календарь <span class="help-link" onclick="scrollToHelp('help-guide-tax'); return false;" title="Подробнее о налогах">❓</span></h3>
                <p>Дней до налога: <strong>${7 - (s.day % 7)}</strong></p>
                <p style="font-size:0.8rem;color:var(--text-dim)">Последняя проверка: день ${s.last_tax_day || '—'}</p>
            </div>
        </div>
    `;

    if (hasData && typeof Chart !== 'undefined') {
        try {
            console.log('📊 finance chart data:', { hasData, revenueHistory, expenseHistory, ChartExists: typeof Chart !== 'undefined', prevChart: !!financeChart });
            if (financeChart) { console.log('🧹 destroying prev chart'); financeChart.destroy(); financeChart = null; }
            const canvas = document.getElementById('financeChart');
            console.log('📊 canvas found:', !!canvas, 'canvas parent:', canvas?.parentElement?.className);
            if (!canvas) { console.warn('📊 canvas not found'); return; }
            const ctx = canvas.getContext('2d');
            const maxLen = Math.max(revenueHistory.length, expenseHistory.length);
            const labels = buildChartLabels(maxLen);
            financeChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels,
                    datasets: [
                        {
                            label: 'Доходы',
                            data: revenueHistory,
                            borderColor: '#4caf50',
                            backgroundColor: makeGradient(ctx, 'rgba(76,175,80,0.35)', 'rgba(76,175,80,0.02)'),
                            fill: true,
                            tension: 0.3,
                            pointRadius: 2,
                            pointHoverRadius: 5,
                            borderWidth: 2
                        },
                        {
                            label: 'Расходы',
                            data: expenseHistory.length >= maxLen ? expenseHistory : [...expenseHistory, ...Array(maxLen - expenseHistory.length).fill(0)],
                            borderColor: '#e74c3c',
                            backgroundColor: makeGradient(ctx, 'rgba(231,76,60,0.35)', 'rgba(231,76,60,0.02)'),
                            fill: true,
                            tension: 0.3,
                            pointRadius: 2,
                            pointHoverRadius: 5,
                            borderWidth: 2
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    plugins: {
                        legend: {
                            labels: {
                                color: '#e0dcd0',
                                font: { size: 12 },
                                usePointStyle: true,
                                padding: 16
                            }
                        },
                        tooltip: {
                            backgroundColor: '#1f2d4a',
                            titleColor: '#f0c040',
                            bodyColor: '#e0dcd0',
                            borderColor: '#3a4a6a',
                            borderWidth: 1,
                            padding: 10,
                            callbacks: {
                                label: ctx => ' ' + ctx.dataset.label + ': ' + formatMoney(ctx.parsed.y)
                            }
                        }
                    },
                    scales: {
                        x: {
                            ticks: {
                                color: '#a0a090',
                                font: { size: 10 },
                                maxTicksLimit: 10
                            },
                            grid: {
                                color: 'rgba(58,74,106,0.15)'
                            }
                        },
                        y: {
                            beginAtZero: true,
                            ticks: {
                                color: '#a0a090',
                                font: { size: 10 },
                                callback: v => formatMoney(v)
                            },
                            grid: {
                                color: 'rgba(58,74,106,0.15)'
                            }
                        }
                    }
                }
            });
        } catch (e) {
            console.error('Chart init failed:', e);
        }
    }
}

async function doTakeLoan() {
    const amount = parseInt(document.getElementById('loanAmount')?.value);
    if (!amount || amount < 100) { showError(`Минимум ${formatMoney(100)}`); return; }
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
    if (!amount || amount < 100) { showError(`Минимум ${formatMoney(100)}`); return; }
    try {
        const res = await API.repayLoan(amount);
        showSuccess(res.message);
        loanInfoCache = null;
        await loadGameState();
        renderFinance();
    } catch (e) { showError(e.message); }
}

async function doBuyInsurance() {
    try {
        const res = await API.buyInsurance();
        showSuccess(res.message);
        await loadGameState();
        renderFinance();
    } catch (e) {
        showError(e.message);
    }
}