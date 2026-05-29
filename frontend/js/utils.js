function getCurrency() {
    return (GAME_STATE && GAME_STATE.game && GAME_STATE.game.currency) || '$';
}

function convertMoney(n) {
    const cur = getCurrency();
    const info = CURRENCIES[cur] || CURRENCIES['$'];
    return n * info.rate;
}

function formatMoney(n) {
    const cur = getCurrency();
    const info = CURRENCIES[cur] || CURRENCIES['$'];
    const converted = n * info.rate;
    return info.symbol + Number(converted).toLocaleString(info.locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatMonthly(dailyAmount) {
    const monthly = dailyAmount * 30;
    return `${formatMoney(monthly)}/мес (${formatMoney(dailyAmount)}/день)`;
}

function formatDate(day) {
    const d = new Date(2024, 0, 1);
    d.setDate(d.getDate() + day - 1);
    return d.toLocaleDateString('ru');
}

function progressBar(value, max = 100, width = 20) {
    const filled = Math.round((value / max) * width);
    const empty = width - filled;
    return '█'.repeat(filled) + '░'.repeat(empty) + ` ${Math.round(value)}%`;
}

function esc(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
}

function wrapTables() {
    document.querySelectorAll('.card table').forEach(t => {
        if (t.closest('.table-wrap')) return;
        const wrap = document.createElement('div');
        wrap.className = 'table-wrap';
        t.parentNode.insertBefore(wrap, t);
        wrap.appendChild(t);
    });
}

function renderMobileCards(container, rows, cardFn) {
    if (rows.length === 0) {
        container.innerHTML = '<div class="mobile-card-empty">Нет данных</div>';
        return;
    }
    container.innerHTML = rows.map((r, i) => {
        const content = cardFn(r, i);
        return `<div class="mobile-card">${content}</div>`;
    }).join('');
}
