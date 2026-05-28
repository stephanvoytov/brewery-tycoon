const STYLE_RU = {
    lager: 'Лагер',
    ale: 'Эль',
    stout: 'Стаут',
    ipa: 'IPA',
    porter: 'Портер',
    wheat: 'Пшеничное',
    pilsner: 'Пильзнер',
    sour: 'Кислый Эль',
    bock: 'Бок',
    pale_ale: 'Пэйл Эль',
    amber_ale: 'Янтарный Эль',
    belgian_tripel: 'Бельгийский Трипель',
};

const STAGE_RU = {
    mash: 'Затирание',
    boil: 'Кипячение',
    ferment: 'Ферментация',
    condition: 'Дозревание',
    packaged: 'Готово',
    sold: 'Продано',
    spoiled: 'Испорчено',
};

const ROLE_RU = {
    brewer: 'Пивовар',
    sales: 'Продавец',
    admin: 'Администратор',
};

const CURRENCIES = {
    '$': { symbol: '$', locale: 'en-US' },
    '€': { symbol: '€', locale: 'de-DE' },
    '₽': { symbol: '₽', locale: 'ru-RU' },
    '£': { symbol: '£', locale: 'en-GB' },
    '¥': { symbol: '¥', locale: 'ja-JP' },
};

function getCurrency() {
    return (GAME_STATE && GAME_STATE.game && GAME_STATE.game.currency) || '$';
}

function formatMoney(n) {
    const cur = getCurrency();
    const info = CURRENCIES[cur] || CURRENCIES['$'];
    return info.symbol + Number(n).toLocaleString(info.locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
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

function showError(msg) {
    const existing = document.querySelector('.toast-error');
    if (existing) existing.remove();
    const div = document.createElement('div');
    div.className = 'toast-error';
    div.textContent = msg;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 4000);
}

function showSuccess(msg) {
    const existing = document.querySelector('.toast-success');
    if (existing) existing.remove();
    const div = document.createElement('div');
    div.className = 'toast-success';
    div.textContent = msg;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}
