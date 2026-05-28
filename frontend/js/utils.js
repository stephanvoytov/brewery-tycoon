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

const STYLE_INFO = {
    lager: 'Легкое светлое пиво низового брожения. Самый популярный стиль в мире — чистый, освежающий вкус.',
    ale: 'Традиционный английский эль. Фруктовые ноты, мягкий вкус, верховое брожение.',
    stout: 'Тёмное плотное пиво с нотками кофе, шоколада и жжёного солода. Кремовая текстура.',
    ipa: 'Хмельной, горький, ароматный. Коронный стиль крафтового пивоварения с цитрусовыми нотами.',
    porter: 'Тёмное пиво с богатым вкусом: карамель, орехи, тёмный шоколад. Мягче стаута.',
    wheat: 'Пшеничное пиво — легкое, освежающее, с бананово-гвоздичным ароматом. Идеально для лета.',
    pilsner: 'Чешский стиль — прозрачное, золотистое, с благородной хмелевой горечью и плотной пеной.',
    sour: 'Кислый эль — пиво с дикими дрожжами, фруктово-кислым вкусом. Для любителей необычного.',
    bock: 'Немецкий крепкий бок. Тёмный, солодовый, с нотками карамели и сухофруктов.',
    pale_ale: 'Светлый эль — золотистый, с выраженным хмелем и карамельной основой. Баланс горечи и сладости.',
    amber_ale: 'Янтарный эль — карамельный вкус, средняя горечь, красивый медный цвет.',
    belgian_tripel: 'Бельгийский трипель — крепкое, светлое, с пряными и фруктовыми нотами, высокая карбонизация.',
};

const SRM_COLORS = {
    lager: '#f0d78c', ale: '#e0a030', stout: '#1a0a00', ipa: '#d4a030',
    porter: '#2a1005', wheat: '#f2dba0', pilsner: '#f5e0a0', sour: '#e8c090',
    bock: '#3a1500', pale_ale: '#d4a040', amber_ale: '#b87020', belgian_tripel: '#e8c860',
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
    '$': { symbol: '$', locale: 'en-US', rate: 1 },
    '€': { symbol: '€', locale: 'de-DE', rate: 0.92 },
    '₽': { symbol: '₽', locale: 'ru-RU', rate: 90 },
    '£': { symbol: '£', locale: 'en-GB', rate: 0.79 },
    '¥': { symbol: '¥', locale: 'ja-JP', rate: 150 },
};

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
