function renderHelp() {
    const el = document.getElementById('page-help');
    el.innerHTML = `
        <h2>❓ Помощь и обучение</h2>

        <div class="help-tabs" data-active-tab="guide">
            <div class="help-tab-bar">
                <button class="help-tab-btn active" data-tab="guide" onclick="switchHelpTab('guide')">📖 Гайд</button>
                <button class="help-tab-btn" data-tab="glossary" onclick="switchHelpTab('glossary')">📖 Словарь</button>
                <button class="help-tab-btn" data-tab="styles" onclick="switchHelpTab('styles')">🍺 Сорта</button>
            </div>

            <div class="help-tab-content" id="helpTabGuide">
                ${renderGuideTab()}
            </div>

            <div class="help-tab-content" id="helpTabGlossary" style="display:none">
                ${renderGlossaryTab()}
            </div>

            <div class="help-tab-content" id="helpTabStyles" style="display:none">
                ${renderStylesTab()}
            </div>
        </div>
    `;
}

function switchHelpTab(tab) {
    document.querySelectorAll('.help-tab-content').forEach(t => t.style.display = 'none');
    document.getElementById('helpTab' + tab.charAt(0).toUpperCase() + tab.slice(1)).style.display = '';
    document.querySelectorAll('.help-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
}

function renderGuideTab() {
    return `
        <div class="help-section">
            <h2>🎯 Как играть</h2>
            <div class="grid-2">
                <div class="help-card">
                    <h3>📌 Основы</h3>
                    <p>Вы — владелец крафтовой пивоварни. Ваша цель: варить пиво, зарабатывать деньги, расширять производство и стать лучшим пивоваром.</p>
                    <ul>
                        <li><strong>Зарабатывайте</strong> — продавайте готовое пиво через контракты и тапрум</li>
                        <li><strong>Улучшайте</strong> — покупайте оборудование, стройте тапрум, повышайте маркетинг</li>
                        <li><strong>Нанимайте</strong> — персонал ускоряет производство и повышает качество</li>
                        <li><strong>Исследуйте</strong> — технологии открывают новые рецепты и бонусы</li>
                    </ul>
                </div>
                <div class="help-card">
                    <h3>⏩ Управление временем</h3>
                    <p>На дашборде нажмите <strong>«Новый день»</strong> — за каждый тик происходят события:</p>
                    <ul>
                        <li>Партии продвигаются по стадиям</li>
                        <li>Списывается аренда и зарплаты</li>
                        <li>Выполняются активные контракты</li>
                        <li>Продвигаются исследования</li>
                        <li>Генерируются новые контракты</li>
                        <li><strong>⚡ Случайные события</strong> (10% шанс) — фестиваль, поломка, налоговая и др.</li>
                        <li><strong>🏭 Конкуренты</strong> продают своё пиво, меняется доля рынка</li>
                        <li><strong>⚙️ Износ</strong> оборудования — −0.1%/день</li>
                        <li>Списываются испорченные ингредиенты (−0.5%/день)</li>
                    </ul>
                </div>
            </div>
        </div>

        <div class="help-section">
            <h2>🍺 Как варить пиво — пошагово</h2>
            ${BREW_SVG}
        </div>

        <div class="help-section">
            <h2>⭐ Качество пива</h2>
            <div class="grid-2">
                <div class="help-card">
                    <h3>📊 Из чего складывается качество</h3>
                    <p>При старте варки качество рассчитывается из 4 компонентов (макс. 100):</p>
                    <ul>
                        <li><strong>🌾 Ингредиенты (40)</strong> — +40, если все 3 ингредиента рекомендованы для стиля. −10 за нерекомендованный солод, −10 за хмель, −5 за дрожжи</li>
                        <li><strong>⚙️ Оборудование (30)</strong> — зависит от среднего износа. 30 при 100%, 0 при 0% износа</li>
                        <li><strong>🧑‍🍳 Навык (20)</strong> — уровень пивовара × 2. Макс. 20 на 10 уровне</li>
                        <li><strong>⭐ Мастерство (5)</strong> — каждая варка рецепта даёт +0.5. Макс. +5 (10 варок)</li>
                        <li><strong>🎲 Случайность (±5)</strong> — каждый раз по-разному</li>
                    </ul>
                </div>
                <div class="help-card">
                    <h3>📈 Как повысить качество</h3>
                    <ul>
                        <li>Используйте <strong>рекомендованные ингредиенты</strong> для выбранного стиля</li>
                        <li>Следите за <strong>износом</strong> оборудования — чините до 100%</li>
                        <li>Повышайте <strong>уровень пивовара</strong> — варите больше партий</li>
                        <li>Варите один и тот же рецепт — растёт <strong>мастерство</strong></li>
                        <li>Исследуйте технологии — некоторые дают <strong>бонус качества</strong></li>
                    </ul>
                    <p style="margin-top:8px"><strong>Низкое качество (менее 30):</strong> репутация −10. Менее 20 — партия испорчена.</p>
                </div>
            </div>
        </div>

        <div class="help-section">
            <h2>🔬 Открытие рецептов и стилей</h2>
            <div class="grid-2">
                <div class="help-card">
                    <h3>🏁 Стартовые рецепты</h3>
                    <p>В начале игры вам доступны <strong>2 рецепта</strong>: Lager и Ale. Остальные 10 стилей нужно открыть через эксперименты.</p>
                </div>
                <div class="help-card">
                    <h3>🧪 Эксперименты и Discovery</h3>
                    <p>Выберите стиль <strong>«Эксперимент (автоопределение)»</strong> и укажите ингредиенты. Если комбинация совпадает с одним из 10 скрытых стилей — он автоматически откроется!</p>
                    <ul>
                        <li>Новый стиль +5 к репутации</li>
                        <li>Открытый стиль можно использовать в новых рецептах</li>
                        <li>Подбирайте ингредиенты по характеристикам стиля</li>
                    </ul>
                </div>
            </div>
        </div>

        <div class="help-section">
            <h2>🌡 Скрытые параметры</h2>
            <p>При создании рецепта можно настроить <strong>температуру затирания</strong> и <strong>тип воды</strong>. Эти параметры влияют на характеристики пива:</p>
            <div class="grid-2">
                <div class="help-card">
                    <h3>🌡 Температура затирания</h3>
                    <ul>
                        <li><strong>Низкая (62°C)</strong> — более сухое пиво, выше сбраживание</li>
                        <li><strong>Средняя (67°C)</strong> — сбалансированный профиль</li>
                        <li><strong>Высокая (72°C)</strong> — более полное тело, остаточный сахар</li>
                    </ul>
                </div>
                <div class="help-card">
                    <h3>💧 Тип воды</h3>
                    <ul>
                        <li><strong>Мягкая</strong> — чистый вкус, подходит для светлых стилей</li>
                        <li><strong>Жёсткая</strong> — плотное тело, лучше для тёмных и крепких сортов</li>
                    </ul>
                </div>
            </div>
        </div>

        <div class="help-section">
            <h2>⭐ Мастерство рецепта</h2>
            <p>Каждый раз, когда партия пива по рецепту доходит до готовности, <strong>мастерство</strong> рецепта увеличивается на 1. Чем выше мастерство, тем больше бонус к качеству при следующей варке.</p>
            <ul>
                <li>+0.5 к качеству за каждую варку</li>
                <li>Максимум +5 (после 10 успешных варок)</li>
                <li>Мастерство отображается значком ⭐ рядом с рецептом</li>
                <li>Уровень пивовара растёт: +1 за каждые 5 завершённых партий (макс. 10)</li>
            </ul>
        </div>

        <div class="help-section">
            <h2>⚙️ Износ, ремонт и страховка</h2>
            <div class="grid-2">
                <div class="help-card">
                    <h3>⚙️ Износ</h3>
                    <p>Всё оборудование изнашивается на <strong>−0.1%/день</strong>. При износе <strong>ниже 20%</strong> оборудование ломается и перестаёт давать бонус к эффективности. Износ влияет на качество пива.</p>
                </div>
                <div class="help-card">
                    <h3>🔧 Ремонт и страховка</h3>
                    <ul>
                        <li><strong>Ремонт:</strong> 30% от цены оборудования, раздел 🏭 Пивоварня</li>
                        <li><strong>Страховка ($500):</strong> автоматически чинит первую поломку</li>
                    </ul>
                </div>
            </div>
        </div>

        <div class="help-section">
            <h2>🏭 Конкуренты и доля рынка</h2>
            <p>В вашем регионе работают 3–5 AI-пивоварен. Каждый день они продают 50–300 литров (зависит от репутации).</p>
            <p>Ваша <strong>доля рынка</strong> отображается на дашборде — она показывает, какую часть рынка вы контролируете. Чем больше варите и продаёте, тем выше доля.</p>
        </div>

        <div class="help-section">
            <h2>⚡ Случайные события</h2>
            <p>Каждый день с <strong>10% шансом</strong> происходит одно из событий:</p>
            <div class="grid-2">
                <div class="help-card">
                    <ul>
                        <li>🔧 <strong>Поломка котла</strong> — ремонт $500 или простой 3 дня (выбор)</li>
                        <li>🎉 <strong>Пивной фестиваль</strong> — репутация +5 на 2 дня</li>
                        <li>🌡 <strong>Жара</strong> — спрос на пшеничное +50% на 3 дня</li>
                        <li>🌿 <strong>Скачок цен на хмель</strong> — ×1.3 на 7 дней</li>
                    </ul>
                </div>
                <div class="help-card">
                    <ul>
                        <li>📋 <strong>Налоговая проверка</strong> — штраф $300</li>
                        <li>🏪 <strong>Предложение от сети</strong> — $2000 или репутация +5 (выбор)</li>
                        <li>📰 <strong>Статья в газете</strong> — $500 за +10 репутации (выбор)</li>
                        <li>🐛 <strong>Вредители</strong> — дезинсекция $300 или −5 кг (выбор)</li>
                    </ul>
                </div>
            </div>
            <p>События первых 3 дней игры: только позитивные. События с выбором открывают модальное окно — внимательно читайте последствия!</p>
        </div>
    `;
}

function renderGlossaryTab() {
    return `
        <div class="help-section">
            <h2>📖 Словарь терминов</h2>
            <div class="grid-2">
                <div class="help-card">
                    <h3>🍺 ABV — крепость</h3>
                    <p><strong>Alcohol By Volume</strong> — процент содержания алкоголя в пиве. Чем выше, тем крепче пиво. Лагер ~4.5%, IPA ~6.5%, Бок ~7%+.</p>
                </div>
                <div class="help-card">
                    <h3>🌿 IBU — горечь</h3>
                    <p><strong>International Bitterness Units</strong> — показатель горечи пива, создаваемой хмелём. Лагер ~15-25 IBU, IPA ~60-80 IBU, Стаут ~30-40 IBU.</p>
                </div>
                <div class="help-card">
                    <h3>🎨 SRM — цвет пива</h3>
                    <p>Шкала цвета пива от 2 (светлый лагер) до 40+ (имперский стаут). Чем выше число, тем темнее пиво.</p>
                </div>
                <div class="help-card">
                    <h3>🍺 Batch — партия</h3>
                    <p>Одна варка пива, проходящая стадии: затирание → кипячение → ферментация → дозревание → упаковка. После упаковки партия готова к продаже.</p>
                </div>
                <div class="help-card">
                    <h3>🌡 Mash — затирание</h3>
                    <p>Первый этап варки: солод смешивается с водой и нагревается для активации ферментов. Температура влияет на тело и крепость пива.</p>
                </div>
                <div class="help-card">
                    <h3>🌿 Hops — хмель</h3>
                    <p>Добавляется при кипячении для горечи и аромата. Разные сорта хмеля дают разный профиль IBU и аромат.</p>
                </div>
                <div class="help-card">
                    <h3>⭐ Репутация</h3>
                    <p>Влияет на цену продажи и доступные контракты.</p>
                    <ul>
                        <li><strong>Продажа партии:</strong> (quality − 50) × 0.2 (quality 80 → +6, quality 30 → −4)</li>
                        <li><strong>Выполнение контракта:</strong> +1</li>
                        <li><strong>Срыв контракта:</strong> −5</li>
                        <li><strong>Партия с качеством &lt;30:</strong> −10</li>
                        <li><strong>Discovery нового стиля:</strong> +5</li>
                        <li><strong>Достижения:</strong> +5-15</li>
                    </ul>
                </div>
                <div class="help-card">
                    <h3>💪 Навык персонала</h3>
                    <p>Каждый сотрудник имеет навык 1-10. <strong>Пивовар</strong>: +3% скорости варки за единицу навыка. <strong>Продавец</strong>: +2% к цене контрактов. <strong>Администратор</strong>: -2% к расходам.</p>
                </div>
                <div class="help-card">
                    <h3>📈 Спрос и сезон</h3>
                    <p>Рынок меняется каждый день. Летом выше спрос на пшеничное и светлое пиво, зимой — на тёмное и крепкое.</p>
                </div>
                <div class="help-card">
                    <h3>📋 Контракты</h3>
                    <p>Бары, магазины и рестораны предлагают контракты на поставку пива. Штраф за срыв — неустойка 20% от суммы.</p>
                </div>
                <div class="help-card">
                    <h3>🏦 Кредит и банкротство</h3>
                    <p>При отрицательном балансе выдаётся кредит под <strong>1% в день</strong>. Если долг превысит <strong>$5,000</strong> и будет держаться больше <strong>30 дней</strong> — игра заканчивается банкротством.</p>
                </div>
                <div class="help-card">
                    <h3>🌾 Порча ингредиентов</h3>
                    <p>Каждый день <strong>0.5%</strong> всех ингредиентов списывается. Не закупайте слишком много — продукты портятся.</p>
                </div>
                <div class="help-card">
                    <h3>🏆 Цель игры</h3>
                    <p>Заработайте <strong>$100,000</strong> общей выручки. Прогресс на дашборде.</p>
                </div>
                <div class="help-card">
                    <h3>🧑‍🍳 Уровень пивовара</h3>
                    <p>Начинается с 1. Растёт на +1 за каждые 5 завершённых партий. Влияет на качество пива (уровень × 2, макс. 20 единиц качества).</p>
                </div>
                <div class="help-card">
                    <h3>⭐ Мастерство рецепта</h3>
                    <p>За каждую сваренную партию рецепт получает +1 мастерства. Каждая единица даёт +0.5 к качеству при следующей варке. Макс. +5 (после 10 варок).</p>
                </div>
                <div class="help-card">
                    <h3>🔬 Discovery</h3>
                    <p>Если при создании рецепта с пометкой «Эксперимент» комбинация ингредиентов совпадает со скрытым стилем — он открывается. Даёт +5 репутации.</p>
                </div>
                <div class="help-card">
                    <h3>⚙️ Износ оборудования</h3>
                    <p>−0.1%/день. При износе &lt;20% оборудование ломается. Средний износ влияет на качество пива (компонент оборудования — 30 баллов).</p>
                </div>
            </div>
        </div>
    `;
}

function renderStylesTab() {
    return `
        <div class="help-section">
            <h2>🍺 Сорта пива</h2>
            <div class="style-grid">
                ${Object.entries(STYLE_RU).map(([key, name]) => `
                    <div class="style-card">
                        <span class="srm-dot" style="background:${SRM_COLORS[key] || '#ccc'}"></span>
                        <div>
                            <div class="style-name">${name}</div>
                            <div class="style-desc">${STYLE_INFO[key] || ''}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

const BREW_SVG = `
    <svg class="help-brew-svg" viewBox="0 0 1200 440" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="stepBg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#1e2a45"/>
                <stop offset="100%" stop-color="#16213e"/>
            </linearGradient>
            <linearGradient id="stepDone" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#2e7d32"/>
                <stop offset="100%" stop-color="#1b5e20"/>
            </linearGradient>
            <linearGradient id="liqWort" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#d4a017"/>
                <stop offset="100%" stop-color="#8a6a0f"/>
            </linearGradient>
            <linearGradient id="liqFerment" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#3498db"/>
                <stop offset="100%" stop-color="#1a5276"/>
            </linearGradient>
            <linearGradient id="liqBeer" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#f0c040"/>
                <stop offset="100%" stop-color="#d4a017"/>
            </linearGradient>
            <filter id="glowS">
                <feGaussianBlur stdDeviation="2" result="b"/>
                <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
        </defs>

        <rect x="10" y="10" width="1180" height="420" rx="14" fill="url(#stepBg)" stroke="#2a3a5a" stroke-width="2"/>

        <text x="600" y="42" text-anchor="middle" fill="#e0dcd0" font-size="17" font-weight="bold">ПРОЦЕСС ПИВОВАРЕНИЯ</text>

        <g transform="translate(30, 70)">
            <rect x="0" y="0" width="150" height="110" rx="8" fill="url(#stepBg)" stroke="#d4a017" stroke-width="2"/>
            <rect x="25" y="12" width="100" height="50" rx="25" fill="url(#liqWort)" opacity="0.7"/>
            <text x="75" y="80" text-anchor="middle" fill="#d4a017" font-size="13" font-weight="bold">1. ЗАТИРАНИЕ</text>
            <text x="75" y="98" text-anchor="middle" fill="#8a8a7a" font-size="10">Солод + вода → сусло</text>
            <circle cx="28" cy="22" r="4" fill="#f0c040" opacity="0.7" filter="url(#glowS)">
                <animate attributeName="opacity" values="0.7;0.2;0.7" dur="1.5s" repeatCount="indefinite"/>
            </circle>
        </g>

        <g transform="translate(185, 120)">
            <line x1="0" y1="0" x2="40" y2="0" stroke="#4a6a8a" stroke-width="2.5" stroke-dasharray="5,3"/>
            <polygon points="40,-6 52,0 40,6" fill="#4a6a8a"/>
        </g>

        <g transform="translate(240, 70)">
            <rect x="0" y="0" width="150" height="110" rx="8" fill="url(#stepBg)" stroke="#e67e22" stroke-width="2"/>
            <rect x="25" y="12" width="100" height="50" rx="25" fill="url(#liqWort)" opacity="0.8"/>
            <text x="75" y="80" text-anchor="middle" fill="#e67e22" font-size="13" font-weight="bold">2. КИПЯЧЕНИЕ</text>
            <text x="75" y="98" text-anchor="middle" fill="#8a8a7a" font-size="10">Хмель + варка</text>
            <circle cx="38" cy="18" r="3" fill="#e67e22" opacity="0.8"><animate attributeName="cy" values="18;8;18" dur="0.5s" repeatCount="indefinite"/></circle>
            <circle cx="65" cy="14" r="3" fill="#e67e22" opacity="0.6"><animate attributeName="cy" values="14;5;14" dur="0.7s" repeatCount="indefinite"/></circle>
            <circle cx="92" cy="16" r="3" fill="#e67e22" opacity="0.7"><animate attributeName="cy" values="16;7;16" dur="0.6s" repeatCount="indefinite"/></circle>
        </g>

        <g transform="translate(395, 120)">
            <line x1="0" y1="0" x2="40" y2="0" stroke="#4a6a8a" stroke-width="2.5" stroke-dasharray="5,3"/>
            <polygon points="40,-6 52,0 40,6" fill="#4a6a8a"/>
        </g>

        <g transform="translate(450, 70)">
            <rect x="0" y="0" width="150" height="110" rx="8" fill="url(#stepBg)" stroke="#3498db" stroke-width="2"/>
            <rect x="25" y="12" width="100" height="50" rx="25" fill="url(#liqFerment)" opacity="0.7"/>
            <text x="75" y="80" text-anchor="middle" fill="#3498db" font-size="13" font-weight="bold">3. ФЕРМЕНТАЦИЯ</text>
            <text x="75" y="98" text-anchor="middle" fill="#8a8a7a" font-size="10">Дрожжи + брожение</text>
            <circle cx="48" cy="25" r="3" fill="#85c1e9"><animate attributeName="cy" values="25;12;25" dur="2s" repeatCount="indefinite"/></circle>
            <circle cx="75" cy="22" r="3" fill="#85c1e9"><animate attributeName="cy" values="22;10;22" dur="2.5s" repeatCount="indefinite"/></circle>
        </g>

        <g transform="translate(605, 120)">
            <line x1="0" y1="0" x2="40" y2="0" stroke="#4a6a8a" stroke-width="2.5" stroke-dasharray="5,3"/>
            <polygon points="40,-6 52,0 40,6" fill="#4a6a8a"/>
        </g>

        <g transform="translate(660, 70)">
            <rect x="0" y="0" width="150" height="110" rx="8" fill="url(#stepBg)" stroke="#2ecc71" stroke-width="2"/>
            <rect x="25" y="12" width="100" height="50" rx="25" fill="url(#liqBeer)" opacity="0.5"/>
            <text x="75" y="80" text-anchor="middle" fill="#2ecc71" font-size="13" font-weight="bold">4. ДОЗРЕВАНИЕ</text>
            <text x="75" y="98" text-anchor="middle" fill="#8a8a7a" font-size="10">Выдержка, карбонизация</text>
        </g>

        <g transform="translate(735, 185)">
            <line x1="0" y1="0" x2="0" y2="35" stroke="#4a6a8a" stroke-width="2.5" stroke-dasharray="5,3"/>
            <polygon points="-6,35 0,48 6,35" fill="#4a6a8a"/>
        </g>

        <g transform="translate(620, 230)">
            <rect x="0" y="0" width="260" height="110" rx="8" fill="url(#stepDone)" stroke="#4caf50" stroke-width="2.5"/>
            <text x="130" y="42" text-anchor="middle" fill="#fff" font-size="28">🍺✅</text>
            <text x="130" y="74" text-anchor="middle" fill="#fff" font-size="15" font-weight="bold">5. ГОТОВО!</text>
            <text x="130" y="98" text-anchor="middle" fill="#c8e6c9" font-size="12">Можно продавать через 🛢 Партии</text>
        </g>

        <g transform="translate(30, 210)">
            <rect x="0" y="0" width="130" height="80" rx="8" fill="#2a1a1a" stroke="#d4a017" stroke-width="1.5" opacity="0.9"/>
            <text x="65" y="24" text-anchor="middle" fill="#d4a017" font-size="12" font-weight="bold">Ингредиенты</text>
            <text x="65" y="44" text-anchor="middle" fill="#8a8a7a" font-size="11">🌾 Солод</text>
            <text x="65" y="58" text-anchor="middle" fill="#8a8a7a" font-size="11">🌿 Хмель</text>
            <text x="65" y="72" text-anchor="middle" fill="#8a8a7a" font-size="11">🧫 Дрожжи</text>
        </g>

        <g transform="translate(200, 210)">
            <rect x="0" y="0" width="130" height="80" rx="8" fill="#1a1a2e" stroke="#3498db" stroke-width="1.5" opacity="0.9"/>
            <text x="65" y="24" text-anchor="middle" fill="#3498db" font-size="12" font-weight="bold">Оборудование</text>
            <text x="65" y="44" text-anchor="middle" fill="#8a8a7a" font-size="11">⏱ Котёл</text>
            <text x="65" y="58" text-anchor="middle" fill="#8a8a7a" font-size="11">🧪 Ферментер</text>
            <text x="65" y="72" text-anchor="middle" fill="#8a8a7a" font-size="11">🧊 Танк</text>
        </g>

        <g transform="translate(370, 210)">
            <rect x="0" y="0" width="150" height="80" rx="8" fill="#1a2e1a" stroke="#2ecc71" stroke-width="1.5" opacity="0.9"/>
            <text x="75" y="24" text-anchor="middle" fill="#2ecc71" font-size="12" font-weight="bold">Время</text>
            <text x="75" y="44" text-anchor="middle" fill="#8a8a7a" font-size="11">Варка: 1 день</text>
            <text x="75" y="58" text-anchor="middle" fill="#8a8a7a" font-size="11">Ферментация: 4-10 дн</text>
            <text x="75" y="72" text-anchor="middle" fill="#8a8a7a" font-size="11">Дозревание: 5-20 дн</text>
        </g>
    </svg>
`;
