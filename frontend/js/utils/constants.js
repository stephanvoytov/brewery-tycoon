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

const EQUIP_DESC = {
    "🍾 Линия розлива": "+15% к цене продажи",
    "🧊 Система охлаждения": "−1 день ферментации",
    "🛢 Лагерный танк": "−2 дня дозревания",
    "🛞 Линия кегов": "+10% к объёму партии при варке",
    "🏺 Заторный чан": "+5% к качеству при варке",
    "🔬 Фильтрация": "−1 день варки (затирание+кипячение)",
};

const BUILDINGS = {
    0: { id: 0, name: "Комната", icon: "🚪", desc: "Тесная комната. Дёшево, без танка.", min_level: 1, rent: 3, storage: 100, tanks: 1, fermenters: 1, cond_tanks: 0, quality_bonus: -15, taproom: false, kettle_vol: 50 },
    1: { id: 1, name: "Подвал", icon: "🕳", desc: "Сырой подвал. Порча −50%, 2 котла.", min_level: 1, rent: 7, storage: 500, tanks: 2, fermenters: 2, cond_tanks: 1, quality_bonus: -5, taproom: false, kettle_vol: 50 },
    2: { id: 2, name: "Небольшой цех", icon: "🏗", desc: "Стандартное помещение.", min_level: 1, rent: 25, storage: 1000, tanks: 2, fermenters: 4, cond_tanks: 2, quality_bonus: 0, taproom: false, kettle_vol: 300 },
    3: { id: 3, name: "Промышленное здание", icon: "🏭", desc: "Большой цех. Спрос +5%.", min_level: 4, rent: 200, storage: 2000, tanks: 3, fermenters: 6, cond_tanks: 3, quality_bonus: -5, taproom: false, kettle_vol: 100, demand_bonus: 5 },
    4: { id: 4, name: "Крафт-лофт", icon: "🎨", desc: "Престижный лофт. Тапрум встроен, качество +10%.", min_level: 7, rent: 300, storage: 1500, tanks: 2, fermenters: 4, cond_tanks: 2, quality_bonus: 10, taproom: true, kettle_vol: 100 },
    5: { id: 5, name: "Пивоваренный завод", icon: "🏭", desc: "Промышленные масштабы! Себест. −15%, +1 слот.", min_level: 12, rent: 500, storage: 5000, tanks: 4, fermenters: 8, cond_tanks: 4, quality_bonus: -10, taproom: false, kettle_vol: 200, cost_reduction: 15, extra_slots: 1 },
    6: { id: 6, name: "Лаборатория", icon: "🔬", desc: "+20% quality, quality может >100%, легендарные рецепты.", min_level: 15, rent: 800, storage: 3000, tanks: 2, fermenters: 6, cond_tanks: 3, quality_bonus: 20, taproom: false, kettle_vol: 100 },
    7: { id: 7, name: "Холдинг", icon: "🌐", desc: "−30% себест., +2 слота, +10% спрос.", min_level: 18, rent: 1200, storage: 8000, tanks: 6, fermenters: 12, cond_tanks: 6, quality_bonus: -5, taproom: false, kettle_vol: 200, cost_reduction: 30, extra_slots: 2, demand_bonus: 10 },
};

const BUILDING_VISUALS = {
    0: {
        wall: ['#2a2a1a','#1a1a0a'], floor: ['#3a2a1a','#2a1a0a'], wallStroke: '#3a3a2a',
        title: '🚪 КОМНАТА', titleColor: '#7a7a5a', sectionBg: '#1a1a0a',
        boilLabel: '#7a7a3a', fermLabel: '#2a5a6a', condLabel: '#2a3a4a',
        kettle: ['#5a4a2a','#3a2a1a'], kettleTitle: '#ddd',
        ferm: ['#2a3a5a','#1a2a4a'], fermTitle: '#ddd',
        cond: ['#2a3a3a','#1a2a2a'], condTitle: '#ddd',
        occupiedColor: '#e74c3c', freeColor: '#7a6a4a', floorLine: '#2a1a0a',
        glowColor: '#7a6a4a', fermBubble: '#4a6a8a', condBubble: '#4a6a6a',
        bottomBar: '#1a1a0a', bottomText: '#5a5a4a',
        isRoom: true,
    },
    1: {
        wall: ['#1a1a2a','#0e0e1e'], floor: ['#2a1a0a','#1a0a00'], wallStroke: '#2a2a3a',
        title: '🕳 ПОДВАЛ', titleColor: '#8a8a7a', sectionBg: '#0e0e1a',
        boilLabel: '#8a6a0f', fermLabel: '#2a5a7a', condLabel: '#2a5a3a',
        kettle: ['#6a5a3a','#4a3a2a'], kettleTitle: '#ddd',
        ferm: ['#2a4a6a','#1a3a5a'], fermTitle: '#ddd',
        cond: ['#2a5a3a','#1a4a2a'], condTitle: '#ddd',
        occupiedColor: '#e74c3c', freeColor: '#8a7a5a', floorLine: '#2a1a0a',
        glowColor: '#8a7a5a', fermBubble: '#5a8aaa', condBubble: '#5aaa7a',
        bottomBar: '#0e0e1a', bottomText: '#6a6a5a',
    },
    2: {
        wall: ['#2a3a5a','#1a2a4a'], floor: ['#3a2a1a','#2a1a0a'], wallStroke: '#3a4a6a',
        title: '🏗 ЦЕХ ПИВОВАРНИ', titleColor: '#e0dcd0', sectionBg: '#1a1a2e',
        boilLabel: '#d4a017', fermLabel: '#3498db', condLabel: '#2ecc71',
        kettle: ['#d4a017','#8a6a0f'], kettleTitle: '#fff',
        ferm: ['#3498db','#1a5276'], fermTitle: '#fff',
        cond: ['#2ecc71','#1a6e3a'], condTitle: '#fff',
        occupiedColor: '#e74c3c', freeColor: '#d4a017', floorLine: '#4a3a2a',
        glowColor: '#f0c040', fermBubble: '#85c1e9', condBubble: '#82e0aa',
        bottomBar: '#1a1a2e', bottomText: '#8a8a7a',
    },
    3: {
        wall: ['#3a4a5a','#2a3a4a'], floor: ['#4a4a4a','#3a3a3a'], wallStroke: '#5a6a7a',
        title: '🏭 ПРОМЫШЛЕННОЕ ЗДАНИЕ', titleColor: '#c0d0e0', sectionBg: '#2a3a4a',
        boilLabel: '#7a9aaa', fermLabel: '#5a8aaa', condLabel: '#5aaa7a',
        kettle: ['#7a8a9a','#5a6a7a'], kettleTitle: '#fff',
        ferm: ['#5a7a9a','#3a5a7a'], fermTitle: '#fff',
        cond: ['#5a8a6a','#3a6a4a'], condTitle: '#fff',
        occupiedColor: '#e74c3c', freeColor: '#8a9aaa', floorLine: '#5a5a5a',
        glowColor: '#9aabba', fermBubble: '#7a9aba', condBubble: '#7aba8a',
        bottomBar: '#2a3a4a', bottomText: '#8a9aaa',
    },
    4: {
        wall: ['#5a3a2a','#4a2a1a'], floor: ['#4a3020','#3a2010'], wallStroke: '#7a5a3a',
        title: '🎨 КРАФТ-ЛОФТ', titleColor: '#f0d0a0', sectionBg: '#3a2a1a',
        boilLabel: '#d4a017', fermLabel: '#c07a3a', condLabel: '#5aaa5a',
        kettle: ['#c08a30','#9a6a10'], kettleTitle: '#fff',
        ferm: ['#b07a4a','#8a5a2a'], fermTitle: '#fff',
        cond: ['#5a8a5a','#3a6a3a'], condTitle: '#fff',
        occupiedColor: '#e74c3c', freeColor: '#c0a070', floorLine: '#5a3a2a',
        glowColor: '#f0d0a0', fermBubble: '#c09a6a', condBubble: '#6aaa6a',
        bottomBar: '#3a2a1a', bottomText: '#a09070',
        isLoft: true,
    },
    5: {
        wall: ['#4a5a6a','#3a4a5a'], floor: ['#5a6a7a','#4a5a6a'], wallStroke: '#6a7a8a',
        title: '🏭 ПИВОВАРЕННЫЙ ЗАВОД', titleColor: '#d0dce0', sectionBg: '#3a4a5a',
        boilLabel: '#8abbc0', fermLabel: '#6a9abb', condLabel: '#6abb8a',
        kettle: ['#8a9aaa','#6a7a8a'], kettleTitle: '#fff',
        ferm: ['#6a8aaa','#4a6a8a'], fermTitle: '#fff',
        cond: ['#6a9a7a','#4a7a5a'], condTitle: '#fff',
        occupiedColor: '#e74c3c', freeColor: '#9abac0', floorLine: '#6a7a8a',
        glowColor: '#aaccd0', fermBubble: '#8abada', condBubble: '#8ada9a',
        bottomBar: '#3a4a5a', bottomText: '#9abac0',
        isFactory: true,
    },
    6: {
        wall: ['#d0d8e0','#b0b8c0'], floor: ['#c0c8d0','#a0a8b0'], wallStroke: '#8a9aaa',
        title: '🔬 ЛАБОРАТОРИЯ', titleColor: '#2a3a4a', sectionBg: '#b0b8c0',
        boilLabel: '#3a6a8a', fermLabel: '#5a8aaa', condLabel: '#4a9a6a',
        kettle: ['#b0c0d0','#90a0b0'], kettleTitle: '#2a3a4a',
        ferm: ['#a0b8d0','#8098b0'], fermTitle: '#2a3a4a',
        cond: ['#a0c8b0','#80a890'], condTitle: '#2a3a4a',
        occupiedColor: '#e74c3c', freeColor: '#6a8aaa', floorLine: '#8a9aaa',
        glowColor: '#80c0e0', fermBubble: '#80a8d0', condBubble: '#80c8a0',
        bottomBar: '#b0b8c0', bottomText: '#4a5a6a',
        isLab: true,
    },
    7: {
        wall: ['#1a1a2e','#0a0a1e'], floor: ['#2a1a2a','#1a0a1a'], wallStroke: '#3a3a5a',
        title: '🌐 ХОЛДИНГ', titleColor: '#d4a017', sectionBg: '#1a1a2e',
        boilLabel: '#d4a017', fermLabel: '#9a5aaa', condLabel: '#5aaa8a',
        kettle: ['#2a2a3a','#1a1a2a'], kettleTitle: '#d4a017',
        ferm: ['#3a2a4a','#2a1a3a'], fermTitle: '#c08ae0',
        cond: ['#2a3a2a','#1a2a1a'], condTitle: '#5aaa8a',
        occupiedColor: '#e74c3c', freeColor: '#5a5a7a', floorLine: '#3a3a4a',
        glowColor: '#d4a017', fermBubble: '#b08ad0', condBubble: '#6aba8a',
        bottomBar: '#1a1a2e', bottomText: '#5a5a7a',
        isHolding: true,
    },
};

function getUpgradeCost(type, current) {
    const costs = {
        tanks: { 2: 3000, 3: 6000, 4: 10000 },
        fermenters: { 2: 500, 3: 1000, 4: 1500, 5: 2500, 6: 3500, 7: 4500, 8: 5500, 9: 6500, 10: 8000 },
        storage: { 1000: 2000, 2000: 4000, 4000: 8000 },
        taproom: { 1: 5000, 2: 10000 },
        marketing: { 2: 2000, 3: 4000, 4: 7000 },
    };
    const m = costs[type];
    if (!m) return null;
    const key = type === 'tanks' ? current + 1 : type === 'taproom' || type === 'marketing' ? current + 1 : type === 'fermenters' ? current + 1 : current;
    return m[key] || m[Object.keys(m).find(k => Number(k) > current)] || null;
}
