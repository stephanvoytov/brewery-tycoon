function renderHelp() {
    const el = document.getElementById('page-help');
    el.innerHTML = `
        <h2>❓ Помощь и обучение</h2>

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
                    </ul>
                </div>
            </div>
        </div>

        <div class="help-section">
            <h2>🍺 Как варить пиво — пошагово</h2>

            <svg class="help-brew-svg" viewBox="0 0 700 340" xmlns="http://www.w3.org/2000/svg">
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
                        <feGaussianBlur stdDeviation="1.5" result="b"/>
                        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                </defs>

                <rect x="10" y="10" width="680" height="320" rx="12" fill="url(#stepBg)" stroke="#2a3a5a" stroke-width="1.5"/>

                <text x="350" y="38" text-anchor="middle" fill="#e0dcd0" font-size="13" font-weight="bold">ПРОЦЕСС ПИВОВАРЕНИЯ</text>

                <!-- Step 1: Mash -->
                <g transform="translate(30, 60)">
                    <rect x="0" y="0" width="110" height="90" rx="6" fill="url(#stepBg)" stroke="#d4a017" stroke-width="1.5"/>
                    <rect x="15" y="10" width="80" height="40" rx="20" fill="url(#liqWort)" opacity="0.7"/>
                    <text x="55" y="65" text-anchor="middle" fill="#d4a017" font-size="9" font-weight="bold">1. ЗАТИРАНИЕ</text>
                    <text x="55" y="80" text-anchor="middle" fill="#8a8a7a" font-size="7">Солод + вода → сусло</text>
                    <circle cx="20" cy="18" r="3" fill="#f0c040" opacity="0.7" filter="url(#glowS)">
                        <animate attributeName="opacity" values="0.7;0.2;0.7" dur="1.5s" repeatCount="indefinite"/>
                    </circle>
                </g>

                <!-- Arrow -->
                <g transform="translate(145, 100)">
                    <line x1="0" y1="0" x2="30" y2="0" stroke="#4a6a8a" stroke-width="2" stroke-dasharray="4,3"/>
                    <polygon points="30,-5 40,0 30,5" fill="#4a6a8a"/>
                </g>

                <!-- Step 2: Boil -->
                <g transform="translate(190, 60)">
                    <rect x="0" y="0" width="110" height="90" rx="6" fill="url(#stepBg)" stroke="#e67e22" stroke-width="1.5"/>
                    <rect x="15" y="10" width="80" height="40" rx="20" fill="url(#liqWort)" opacity="0.8"/>
                    <text x="55" y="65" text-anchor="middle" fill="#e67e22" font-size="9" font-weight="bold">2. КИПЯЧЕНИЕ</text>
                    <text x="55" y="80" text-anchor="middle" fill="#8a8a7a" font-size="7">Хмель + варка</text>
                    <circle cx="30" cy="15" r="2" fill="#e67e22" opacity="0.8"><animate attributeName="cy" values="15;8;15" dur="0.5s" repeatCount="indefinite"/></circle>
                    <circle cx="50" cy="12" r="2" fill="#e67e22" opacity="0.6"><animate attributeName="cy" values="12;5;12" dur="0.7s" repeatCount="indefinite"/></circle>
                    <circle cx="70" cy="14" r="2" fill="#e67e22" opacity="0.7"><animate attributeName="cy" values="14;7;14" dur="0.6s" repeatCount="indefinite"/></circle>
                </g>

                <!-- Arrow -->
                <g transform="translate(305, 100)">
                    <line x1="0" y1="0" x2="30" y2="0" stroke="#4a6a8a" stroke-width="2" stroke-dasharray="4,3"/>
                    <polygon points="30,-5 40,0 30,5" fill="#4a6a8a"/>
                </g>

                <!-- Step 3: Ferment -->
                <g transform="translate(350, 60)">
                    <rect x="0" y="0" width="110" height="90" rx="6" fill="url(#stepBg)" stroke="#3498db" stroke-width="1.5"/>
                    <rect x="15" y="10" width="80" height="40" rx="20" fill="url(#liqFerment)" opacity="0.7"/>
                    <text x="55" y="65" text-anchor="middle" fill="#3498db" font-size="9" font-weight="bold">3. ФЕРМЕНТАЦИЯ</text>
                    <text x="55" y="80" text-anchor="middle" fill="#8a8a7a" font-size="7">Дрожжи + брожение</text>
                    <circle cx="35" cy="20" r="2" fill="#85c1e9"><animate attributeName="cy" values="20;10;20" dur="2s" repeatCount="indefinite"/></circle>
                    <circle cx="55" cy="18" r="2" fill="#85c1e9"><animate attributeName="cy" values="18;8;18" dur="2.5s" repeatCount="indefinite"/></circle>
                </g>

                <!-- Arrow -->
                <g transform="translate(465, 100)">
                    <line x1="0" y1="0" x2="30" y2="0" stroke="#4a6a8a" stroke-width="2" stroke-dasharray="4,3"/>
                    <polygon points="30,-5 40,0 30,5" fill="#4a6a8a"/>
                </g>

                <!-- Step 4: Condition -->
                <g transform="translate(510, 60)">
                    <rect x="0" y="0" width="110" height="90" rx="6" fill="url(#stepBg)" stroke="#2ecc71" stroke-width="1.5"/>
                    <rect x="15" y="10" width="80" height="40" rx="20" fill="url(#liqBeer)" opacity="0.5"/>
                    <text x="55" y="65" text-anchor="middle" fill="#2ecc71" font-size="9" font-weight="bold">4. ДОЗРЕВАНИЕ</text>
                    <text x="55" y="80" text-anchor="middle" fill="#8a8a7a" font-size="7">Выдержка, карбонизация</text>
                </g>

                <!-- Arrow down to step 5 -->
                <g transform="translate(565, 155)">
                    <line x1="0" y1="0" x2="0" y2="30" stroke="#4a6a8a" stroke-width="2" stroke-dasharray="4,3"/>
                    <polygon points="-5,30 0,40 5,30" fill="#4a6a8a"/>
                </g>

                <!-- Step 5: Packaged -->
                <g transform="translate(480, 190)">
                    <rect x="0" y="0" width="170" height="90" rx="6" fill="url(#stepDone)" stroke="#4caf50" stroke-width="2"/>
                    <text x="85" y="35" text-anchor="middle" fill="#fff" font-size="20">🍺✅</text>
                    <text x="85" y="60" text-anchor="middle" fill="#fff" font-size="10" font-weight="bold">5. ГОТОВО!</text>
                    <text x="85" y="78" text-anchor="middle" fill="#c8e6c9" font-size="8">Можно продавать через 🛢 Партии</text>
                </g>

                <!-- Info bubbles -->
                <g transform="translate(30, 175)">
                    <rect x="0" y="0" width="90" height="60" rx="6" fill="#2a1a1a" stroke="#d4a017" stroke-width="1" opacity="0.8"/>
                    <text x="45" y="18" text-anchor="middle" fill="#d4a017" font-size="8" font-weight="bold">Ингредиенты</text>
                    <text x="45" y="32" text-anchor="middle" fill="#8a8a7a" font-size="7">🌾 Солод</text>
                    <text x="45" y="44" text-anchor="middle" fill="#8a8a7a" font-size="7">🌿 Хмель</text>
                    <text x="45" y="56" text-anchor="middle" fill="#8a8a7a" font-size="7">🧫 Дрожжи</text>
                </g>

                <g transform="translate(160, 175)">
                    <rect x="0" y="0" width="90" height="60" rx="6" fill="#1a1a2e" stroke="#3498db" stroke-width="1" opacity="0.8"/>
                    <text x="45" y="18" text-anchor="middle" fill="#3498db" font-size="8" font-weight="bold">Оборудование</text>
                    <text x="45" y="32" text-anchor="middle" fill="#8a8a7a" font-size="7">⏱ Котёл</text>
                    <text x="45" y="44" text-anchor="middle" fill="#8a8a7a" font-size="7">🧪 Ферментер</text>
                    <text x="45" y="56" text-anchor="middle" fill="#8a8a7a" font-size="7">🧊 Танк</text>
                </g>

                <g transform="translate(290, 175)">
                    <rect x="0" y="0" width="100" height="60" rx="6" fill="#1a2e1a" stroke="#2ecc71" stroke-width="1" opacity="0.8"/>
                    <text x="50" y="18" text-anchor="middle" fill="#2ecc71" font-size="8" font-weight="bold">Время</text>
                    <text x="50" y="34" text-anchor="middle" fill="#8a8a7a" font-size="7">Варка: 1 день</text>
                    <text x="50" y="48" text-anchor="middle" fill="#8a8a7a" font-size="7">Ферментация: 4-10 дн</text>
                    <text x="50" y="60" text-anchor="middle" fill="#8a8a7a" font-size="7">Дозревание: 5-20 дн</text>
                </g>
            </svg>
        </div>

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
                    <p>Шкала цвета пива от 2 (светлый лагер) до 40+ (имперский стаут). Чем выше число, тем темнее пиво. Кружочками показан реальный цвет каждого стиля.</p>
                </div>
                <div class="help-card">
                    <h3>⭐ Репутация</h3>
                    <p>Влияет на цену продажи и доступные контракты. Растёт при продаже качественного пива и выполнении контрактов. Падает при срывах.</p>
                </div>
                <div class="help-card">
                    <h3>💪 Навык персонала</h3>
                    <p>Каждый сотрудник имеет навык 1-10. Влияет на скорость варки, качество пива и эффективность продаж. Повышается обучением.</p>
                </div>
                <div class="help-card">
                    <h3>📈 Спрос и сезон</h3>
                    <p>Рынок меняется каждый день. Летом выше спрос на пшеничное и светлое пиво, зимой — на тёмное и крепкое. Следите за рынком!</p>
                </div>
                <div class="help-card">
                    <h3>📋 Контракты</h3>
                    <p>Бары и магазины предлагают контракты на поставку пива. Штраф за срыв — неустойка. Выгодно выполнять крупные заказы.</p>
                </div>
                <div class="help-card">
                    <h3>🏦 Кредит</h3>
                    <p>При отрицательном балансе автоматически выдаётся кредит под 0.5% в день. Старайтесь не уходить в минус — проценты съедают прибыль.</p>
                </div>
            </div>
        </div>

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
