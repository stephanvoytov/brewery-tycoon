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
    experimental: 'Эксперимент',
};

const STYLE_RECS = {
    lager: { malt: 'Солод Пильзнер', hops: 'Хмель Сааз', yeast: 'Дрожжи Лагерные' },
    ale: { malt: 'Солод Карамельный', hops: 'Хмель Каскад', yeast: 'Дрожжи Элевые' },
    stout: { malt: 'Солод Тёмный', hops: 'Хмель Магнум', yeast: 'Дрожжи Элевые' },
    ipa: { malt: 'Солод Пильзнер', hops: 'Хмель Цитра', yeast: 'Дрожжи Элевые' },
    porter: { malt: 'Солод Тёмный', hops: 'Хмель Магнум', yeast: 'Дрожжи Элевые' },
    wheat: { malt: 'Солод Пшеничный', hops: 'Хмель Сааз', yeast: 'Дрожжи Пшеничные' },
    pilsner: { malt: 'Солод Пильзнер', hops: 'Хмель Сааз', yeast: 'Дрожжи Лагерные' },
    sour: { malt: 'Солод Пильзнер', hops: 'Хмель Каскад', yeast: 'Дрожжи Штамм Бельгийский' },
    bock: { malt: 'Солод Карамельный', hops: 'Хмель Магнум', yeast: 'Дрожжи Лагерные' },
    pale_ale: { malt: 'Солод Пильзнер', hops: 'Хмель Каскад', yeast: 'Дрожжи Элевые' },
    amber_ale: { malt: 'Солод Карамельный', hops: 'Хмель Каскад', yeast: 'Дрожжи Элевые' },
    belgian_tripel: { malt: 'Солод Пильзнер', hops: 'Хмель Сааз', yeast: 'Дрожжи Штамм Бельгийский' },
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
    experimental: 'Экспериментальное пиво. Создано из нестандартной комбинации ингредиентов.',
};

const SRM_COLORS = {
    lager: '#f0d78c', ale: '#e0a030', stout: '#1a0a00', ipa: '#d4a030',
    porter: '#2a1005', wheat: '#f2dba0', pilsner: '#f5e0a0', sour: '#e8c090',
    bock: '#3a1500', pale_ale: '#d4a040', amber_ale: '#b87020', belgian_tripel: '#e8c860',
    experimental: '#c8b090',
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

const ACHIEVEMENTS = {
    first_batch: { name: 'Первая партия', desc: 'Сварите первую партию', icon: '🍺' },
    first_staff: { name: 'Кадровое пополнение', desc: 'Наймите первого сотрудника', icon: '👤' },
    first_contract: { name: 'Первая сделка', desc: 'Выполните первый контракт', icon: '📋' },
    first_upgrade: { name: 'Модернизация', desc: 'Купите первое улучшение', icon: '🔧' },
    revenue_10k: { name: 'Первая выручка', desc: 'Общая выручка $10,000', icon: '💰' },
    revenue_50k: { name: 'Серьёзный пивовар', desc: 'Общая выручка $50,000', icon: '💵' },
    revenue_100k: { name: 'Пивной магнат', desc: 'Общая выручка $100,000', icon: '🏆' },
    staff_3: { name: 'Дружная команда', desc: 'Наймите 3 сотрудников', icon: '👥' },
    reputation_90: { name: 'Народная любовь', desc: 'Достигните 90% репутации', icon: '⭐' },
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
    setTimeout(() => div.remove(), 6000);
}

function showSuccess(msg) {
    const existing = document.querySelector('.toast-success');
    if (existing) existing.remove();
    const div = document.createElement('div');
    div.className = 'toast-success';
    div.textContent = msg;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 4000);
}

function showNotification(msg, type = 'info') {
    const colors = {
        info: '#3498db',
        success: '#4caf50',
        warning: '#f39c12',
        danger: '#e74c3c',
        achievement: '#d4a017',
    };
    const div = document.createElement('div');
    div.className = 'toast-notification';
    div.style.borderLeft = `4px solid ${colors[type] || colors.info}`;
    div.textContent = msg;
    document.body.appendChild(div);
    setTimeout(() => {
        div.style.opacity = '0';
        div.style.transform = 'translateX(100px)';
        setTimeout(() => div.remove(), 300);
    }, 5000);
}

function esc(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
}

const BUILDINGS = {
    1: { id: 1, name: "Подвал", icon: "🕳", desc: "Сырой подвал, дёшево и сердито. Порча −50%.", min_level: 1, rent: 40, storage: 500, tanks: 1, fermenters: 2, cond_tanks: 1, quality_bonus: -5, taproom: false, kettle_vol: 50 },
    2: { id: 2, name: "Небольшой цех", icon: "🏗", desc: "Стандартное помещение для старта.", min_level: 1, rent: 100, storage: 1000, tanks: 2, fermenters: 4, cond_tanks: 2, quality_bonus: 0, taproom: false, kettle_vol: 100 },
    3: { id: 3, name: "Промышленное здание", icon: "🏭", desc: "Большой цех. Спрос +5%.", min_level: 4, rent: 200, storage: 2000, tanks: 3, fermenters: 6, cond_tanks: 3, quality_bonus: -5, taproom: false, kettle_vol: 100, demand_bonus: 5 },
    4: { id: 4, name: "Крафт-лофт", icon: "🎨", desc: "Престижный лофт. Тапрум встроен, качество +10%.", min_level: 7, rent: 300, storage: 1500, tanks: 2, fermenters: 4, cond_tanks: 2, quality_bonus: 10, taproom: true, kettle_vol: 100 },
    5: { id: 5, name: "Пивоваренный завод", icon: "🏭", desc: "Промышленные масштабы! Себест. −15%, +1 слот.", min_level: 12, rent: 500, storage: 5000, tanks: 4, fermenters: 8, cond_tanks: 4, quality_bonus: -10, taproom: false, kettle_vol: 200, cost_reduction: 15, extra_slots: 1 },
    6: { id: 6, name: "Лаборатория", icon: "🔬", desc: "+20% quality, quality может >100%, легендарные рецепты.", min_level: 15, rent: 800, storage: 3000, tanks: 2, fermenters: 6, cond_tanks: 3, quality_bonus: 20, taproom: false, kettle_vol: 100 },
    7: { id: 7, name: "Холдинг", icon: "🌐", desc: "−30% себест., +2 слота, +10% спрос.", min_level: 18, rent: 1200, storage: 8000, tanks: 6, fermenters: 12, cond_tanks: 6, quality_bonus: -5, taproom: false, kettle_vol: 200, cost_reduction: 30, extra_slots: 2, demand_bonus: 10 },
};

const TUTORIAL_STEPS = [
    {
        icon: '🍺',
        title: 'Добро пожаловать в Пивоваренный Тайкун!',
        desc: 'Это экономическая стратегия, где ты управляешь своей пивоварней. Твоя цель — заработать $100,000 выручки.',
        tip: 'Следи за балансом на дашборде — не уходи в минус надолго!',
    },
    {
        icon: '📝',
        title: 'Свари своё первое пиво',
        desc: 'Открой раздел "Рецепты". Выбери стиль, ингредиенты и создай рецепт. Затем нажми "Варить" — партия пойдёт по стадиям: затирание → кипячение → ферментация → дозревание.',
        tip: 'Используй рекомендованные ингредиенты для выбранного стиля — качество будет выше!',
    },
    {
        icon: '💰',
        title: 'Продавай готовое пиво',
        desc: 'Когда партия созреет, она появится в "Партиях" как готовая. Открой "Рынок" → подпиши контракт на нужный стиль пива. Каждый день невыполненные партии автоматически продаются по контрактам.',
        tip: 'Качество пива влияет на цену: quality ×2 = цена ×2!',
    },
    {
        icon: '👥',
        title: 'Найми команду',
        desc: 'В разделе "Персонал" найми сотрудников: 🍺 Пивовары ускоряют варку, 🤝 Продавцы повышают цены контрактов, 📋 Админы снижают расходы.',
        tip: 'Не забывай тренировать сотрудников и следи за их моралью — низкая мораль снижает эффективность!',
    },
    {
        icon: '📈',
        title: 'Управляй финансами',
        desc: 'В "Финансах" ты видишь доходы, расходы, налоги и кредиты. Инфляция каждые 30 дней поднимает цены. Улучшай пивоварню и исследуй новые технологии!',
        tip: 'Бери кредиты осторожно — ставка до 1%/день. Долг более $5,000 на 30 дней = банкротство!',
    },
];

function wrapTables() {
    document.querySelectorAll('.card table').forEach(t => {
        if (t.closest('.table-wrap')) return;
        const wrap = document.createElement('div');
        wrap.className = 'table-wrap';
        t.parentNode.insertBefore(wrap, t);
        wrap.appendChild(t);
    });
}

/* Mobile confirm dialog — returns Promise<boolean> */
function showConfirm(title, text) {
    return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.className = 'dialog-overlay';
        overlay.innerHTML = `
            <div class="dialog-box">
                <h3>${esc(title)}</h3>
                <p>${esc(text)}</p>
                <div class="dialog-actions">
                    <button class="btn btn-secondary" id="dialogCancel">Отмена</button>
                    <button class="btn btn-primary" id="dialogOk">Да</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        overlay.querySelector('#dialogCancel').onclick = () => { overlay.remove(); resolve(false); };
        overlay.querySelector('#dialogOk').onclick = () => { overlay.remove(); resolve(true); };
        overlay.onclick = e => { if (e.target === overlay) { overlay.remove(); resolve(false); } };
    });
}

/* Mobile prompt dialog — returns Promise<string|null> */
function showPrompt(title, text, defaultValue) {
    return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.className = 'dialog-overlay';
        overlay.innerHTML = `
            <div class="dialog-box">
                <h3>${esc(title)}</h3>
                <p>${esc(text)}</p>
                <input type="text" id="dialogInput" value="${esc(defaultValue || '')}" placeholder="...">
                <div class="dialog-actions">
                    <button class="btn btn-secondary" id="dialogCancel">Отмена</button>
                    <button class="btn btn-primary" id="dialogOk">OK</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        const input = overlay.querySelector('#dialogInput');
        input.focus();
        input.select();
        overlay.querySelector('#dialogCancel').onclick = () => { overlay.remove(); resolve(null); };
        overlay.querySelector('#dialogOk').onclick = () => { overlay.remove(); resolve(input.value); };
        overlay.onclick = e => { if (e.target === overlay) { overlay.remove(); resolve(null); } };
        input.onkeydown = e => { if (e.key === 'Enter') { overlay.remove(); resolve(input.value); } };
    });
}

/* Render mobile card list from table data */
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

function showTutorial() {
    const overlay = document.getElementById('tutorialOverlay');
    if (!overlay) return;

    const stored = localStorage.getItem('tutorialDone');
    if (stored === '1') return;

    let currentStep = 0;

    function renderStep(index) {
        const step = TUTORIAL_STEPS[index];
        document.getElementById('tutorialStep').innerHTML = `
            <div class="tutorial-icon">${step.icon}</div>
            <div class="tutorial-title">${step.title}</div>
            <div class="tutorial-desc">${step.desc}</div>
            <div class="tutorial-tip">💡 ${step.tip}</div>
        `;

        const nextBtn = document.getElementById('tutorialNext');
        if (index === TUTORIAL_STEPS.length - 1) {
            nextBtn.textContent = 'Готово! 🎉';
        } else {
            nextBtn.textContent = 'Далее →';
        }

        const dots = document.getElementById('tutorialDots');
        dots.innerHTML = TUTORIAL_STEPS.map((_, i) =>
            `<span class="dot ${i === index ? 'active' : ''}" data-idx="${i}"></span>`
        ).join('');

        dots.querySelectorAll('.dot').forEach(d => {
            d.addEventListener('click', () => {
                currentStep = parseInt(d.dataset.idx);
                renderStep(currentStep);
            });
        });
    }

    document.getElementById('tutorialNext').onclick = () => {
        if (currentStep === TUTORIAL_STEPS.length - 1) {
            localStorage.setItem('tutorialDone', '1');
            overlay.style.display = 'none';
            return;
        }
        currentStep++;
        renderStep(currentStep);
    };

    document.getElementById('tutorialSkip').onclick = () => {
        localStorage.setItem('tutorialDone', '1');
        overlay.style.display = 'none';
    };

    overlay.style.display = 'flex';
    renderStep(0);
}
