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

function scrollToHelp(sectionId) {
    try {
        if (document.getElementById('page-help')?.classList.contains('active') && document.querySelector('.help-tabs')) {
            switchHelpTab('guide');
            const el = document.getElementById(sectionId);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            navigate('help');
            renderCurrentPage().then(() => {
                const el = document.getElementById(sectionId);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }).catch(function(){});
        }
    } catch(e) {}
}

function renderGuideTab() {
    return `
        <div class="help-section" id="help-guide-basics">
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

        <div class="help-section" id="help-guide-brewing">
            <h2>🍺 Как варить пиво — пошагово</h2>
            ${BREW_SVG}
        </div>

        <div class="help-section" id="help-guide-quality">
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

        <div class="help-section" id="help-guide-discovery">
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

        <div class="help-section" id="help-guide-hidden-params">
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

        <div class="help-section" id="help-guide-mastery">
            <h2>⭐ Мастерство рецепта</h2>
            <p>Каждый раз, когда партия пива по рецепту доходит до готовности, <strong>мастерство</strong> рецепта увеличивается на 1. Чем выше мастерство, тем больше бонус к качеству при следующей варке.</p>
            <ul>
                <li>+0.5 к качеству за каждую варку</li>
                <li>Максимум +5 (после 10 успешных варок)</li>
                <li>Мастерство отображается значком ⭐ рядом с рецептом</li>
                <li>Уровень пивовара растёт: +1 за каждые 5 завершённых партий (макс. 10)</li>
            </ul>
        </div>

        <div class="help-section" id="help-guide-wear">
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
                        <li><strong>Страховка (${formatMoney(500)}):</strong> автоматически чинит первую поломку</li>
                    </ul>
                </div>
            </div>
        </div>

        <div class="help-section" id="help-guide-competitors">
            <h2>🏭 Конкуренты и доля рынка</h2>
            <p>В вашем регионе работают 3–5 AI-пивоварен. Каждый день они продают 50–300 литров (зависит от репутации).</p>
            <p>Ваша <strong>доля рынка</strong> отображается на дашборде — она показывает, какую часть рынка вы контролируете. Чем больше варите и продаёте, тем выше доля.</p>
        </div>

        <div class="help-section" id="help-guide-events">
            <h2>⚡ Случайные события</h2>
            <p>Каждый день с <strong>10% шансом</strong> происходит одно из событий:</p>
            <div class="grid-2">
                <div class="help-card">
                    <ul>
                        <li>🔧 <strong>Поломка котла</strong> — ремонт ${formatMoney(500)} или простой 3 дня (выбор)</li>
                        <li>🎉 <strong>Пивной фестиваль</strong> — репутация +5 на 2 дня</li>
                        <li>🌡 <strong>Жара</strong> — спрос на пшеничное +50% на 3 дня</li>
                        <li>🌿 <strong>Скачок цен на хмель</strong> — ×1.3 на 7 дней</li>
                    </ul>
                </div>
                <div class="help-card">
                    <ul>
                        <li>📋 <strong>Налоговая проверка</strong> — штраф ${formatMoney(300)}</li>
                        <li>🏪 <strong>Предложение от сети</strong> — ${formatMoney(2000)} или репутация +5 (выбор)</li>
                        <li>📰 <strong>Статья в газете</strong> — ${formatMoney(500)} за +10 репутации (выбор)</li>
                        <li>🐛 <strong>Вредители</strong> — дезинсекция ${formatMoney(300)} или −5 кг (выбор)</li>
                    </ul>
                </div>
            </div>
            <p>События первых 3 дней игры: только позитивные. События с выбором открывают модальное окно — внимательно читайте последствия!</p>
        </div>

        <div class="help-section" id="help-guide-inflation">
            <h2>📈 Инфляция</h2>
            <p>Каждые <strong>30 дней</strong> цены на ингредиенты растут на <strong>1–3%</strong>. Следите за уровнем инфляции в разделе Финансы — чем дольше играете, тем дороже сырьё.</p>
        </div>

        <div class="help-section" id="help-guide-tax">
            <h2>💰 Налоги</h2>
            <p>Налог платится <strong>каждые 7 дней</strong>:</p>
            <ul>
                <li><strong>10%</strong> от прибыли за период</li>
                <li>Минимум <strong>${formatMoney(200)}</strong></li>
            </ul>
            <p>Дата следующего налога отображается в разделе Финансы.</p>
        </div>

        <div class="help-section" id="help-guide-taproom">
            <h2>🏪 Тапрум</h2>
            <div class="grid-2">
                <div class="help-card">
                    <h3>🔨 Как открыть</h3>
                    <p>Тапрум строится в разделе <strong>🏭 Пивоварня → Улучшения</strong>. Стоимость: <strong>${formatMoney(5000)}</strong> (1 ур.) и <strong>${formatMoney(10000)}</strong> (2 ур.). Здание «Крафт-лофт» имеет тапрум по умолчанию.</p>
                    <ul>
                        <li><strong>Доход:</strong> ${formatMoney(30)}/день за каждый уровень</li>
                        <li><strong>Макс. уровень:</strong> 2</li>
                        <li><strong>Исследование:</strong> «Экскурсии на пивоварню» ×1.3 к доходу</li>
                    </ul>
                </div>
                <div class="help-card">
                    <h3>📊 Выгода</h3>
                    <p>Тапрум даёт стабильный пассивный доход, не требующий контрактов или партий:</p>
                    <ul>
                        <li>1 ур. = ${formatMoney(30)}/день (${formatMoney(900)}/мес)</li>
                        <li>2 ур. = ${formatMoney(60)}/день (${formatMoney(1800)}/мес)</li>
                        <li>С исследованием: 1 ур. = ${formatMoney(39)}/день</li>
                    </ul>
                </div>
            </div>
        </div>

        <div class="help-section" id="help-guide-buildings">
            <h2>🏢 Здания и переезд</h2>
            <div class="grid-2">
                <div class="help-card">
                    <h3>📋 Все здания</h3>
                    <table>
                        <tr><th>Здание</th><th>Ур.</th><th>Аренда</th><th>Чаны</th><th>Ферм.</th><th>Кач-во</th></tr>
                        <tr><td>🚪 Комната</td><td>1</td><td>${formatMoney(3)}</td><td>1×50л</td><td>1</td><td>−15%</td></tr>
                        <tr><td>🕳 Подвал</td><td>1</td><td>${formatMoney(7)}</td><td>2×50л</td><td>2</td><td>−5%</td></tr>
                        <tr><td>🏗 Цех</td><td>1</td><td>${formatMoney(25)}</td><td>2×300л</td><td>4</td><td>0%</td></tr>
                        <tr><td>🏭 Промздание</td><td>4</td><td>${formatMoney(200)}</td><td>3×100л</td><td>6</td><td>−5%</td></tr>
                        <tr><td>🎨 Крафт-лофт</td><td>7</td><td>${formatMoney(300)}</td><td>2×100л</td><td>4</td><td>+10%</td></tr>
                        <tr><td>🏭 Завод</td><td>12</td><td>${formatMoney(500)}</td><td>4×200л</td><td>8</td><td>−10%</td></tr>
                        <tr><td>🔬 Лаборатория</td><td>15</td><td>${formatMoney(800)}</td><td>2×100л</td><td>6</td><td>+20%</td></tr>
                        <tr><td>🌐 Холдинг</td><td>18</td><td>${formatMoney(1200)}</td><td>6×200л</td><td>12</td><td>−5%</td></tr>
                    </table>
                </div>
                <div class="help-card">
                    <h3>🔀 Переезд</h3>
                    <p>Переехать можно в разделе <strong>🏭 Пивоварня → Здания</strong>. Стоимость переезда зависит от текущего оснащения:</p>
                    <ul>
                        <li>Аренда × 15</li>
                        <li>+ ${formatMoney(500)} за каждый танк</li>
                        <li>+ ${formatMoney(300)} за каждый ферментер</li>
                        <li>+ ${formatMoney(300)} за каждый лагерный танк</li>
                        <li>+ ${formatMoney(2000)} если есть тапрум</li>
                        <li>+ ${formatMoney(200)} за каждое оборудование</li>
                    </ul>
                </div>
            </div>
        </div>

        <div class="help-section" id="help-guide-staff">
            <h2>🧑‍💼 Персонал</h2>
            <div class="grid-2">
                <div class="help-card">
                    <h3>🍺 Пивовар</h3>
                    <p><strong>Зарплата:</strong> ${formatMoney(25)}/день. <strong>Бонус:</strong> +2% к скорости варки за единицу навыка.</p>
                    <p>Чем выше навык, тем быстрее партии проходят все стадии. Ключевой сотрудник для производства.</p>
                </div>
                <div class="help-card">
                    <h3>🤝 Продавец</h3>
                    <p><strong>Зарплата:</strong> ${formatMoney(20)}/день. <strong>Бонус:</strong> +2% к цене контрактов за единицу навыка.</p>
                    <p>Увеличивает выручку по всем активным контрактам. Окупается при больших объёмах продаж.</p>
                </div>
                <div class="help-card">
                    <h3>📋 Администратор</h3>
                    <p><strong>Зарплата:</strong> ${formatMoney(15)}/день. <strong>Бонус:</strong> −2% к расходам (аренда) за единицу навыка.</p>
                    <p>Снижает ежемесячную аренду. Полезен в дорогих зданиях.</p>
                </div>
                <div class="help-card">
                    <h3>⚙️ Управление</h3>
                    <ul>
                        <li><strong>Найм:</strong> раздел 📊 Менеджмент → Персонал</li>
                        <li><strong>Навык:</strong> 1–10. Тренировка стоит навык × ${formatMoney(200)}</li>
                        <li><strong>Мораль:</strong> начинается с 70%, меняется ±0.5%/день. Ниже 30% — эффективность вдвое. Ниже 10% — увольняется</li>
                        <li>Максимум сотрудников — безлимит</li>
                    </ul>
                </div>
            </div>
        </div>

        <div class="help-section" id="help-guide-ingredients">
            <h2>🛒 Закупка ингредиентов</h2>
            <div class="grid-2">
                <div class="help-card">
                    <h3>🌾 Типы ингредиентов</h3>
                    <p>4 категории, по 4 вида в каждой. Для варки нужны <strong>солод, хмель и дрожжи</strong>. Адъюнкты (добавки) опциональны.</p>
                    <ul>
                        <li><strong>🌾 Солод:</strong> Пильзнер ($0.80/кг), Карамельный ($1.20), Тёмный ($1.00), Пшеничный ($0.90)</li>
                        <li><strong>🌿 Хмель:</strong> Каскад ($2.50/кг), Сааз ($2.00), Цитра ($3.00), Магнум ($2.20)</li>
                        <li><strong>🧫 Дрожжи:</strong> Лагерные ($1.50/кг), Элевые ($1.50), Пшеничные ($1.80), Бельгийский ($2.50)</li>
                        <li><strong>🧂 Адъюнкты:</strong> Кукуруза ($0.50/кг), Кориандр ($3.00), Цедра ($2.50), Копчёный солод ($1.80)</li>
                    </ul>
                </div>
                <div class="help-card">
                    <h3>📦 Закуп и порча</h3>
                    <ul>
                        <li><strong>Скидка:</strong> 50+ кг = −5%, 200+ кг = −10%</li>
                        <li><strong>Инфляция:</strong> цены растут каждые 30 дней</li>
                        <li><strong>Порча:</strong> −0.3%/день обычно. При запасе 100+ кг = −0.5%/день, 300+ кг = −0.8%/день</li>
                        <li>Здание «Подвал» уменьшает порчу вдвое</li>
                        <li>Не закупайте слишком много — продукты портятся</li>
                    </ul>
                </div>
            </div>
        </div>

        <div class="help-section" id="help-guide-marketing">
            <h2>📈 Маркетинг</h2>
            <div class="grid-2">
                <div class="help-card">
                    <h3>📊 Уровень маркетинга</h3>
                    <p>Повышается в разделе <strong>🏭 Пивоварня → Улучшения</strong>. Каждый уровень даёт <strong>+5% спроса</strong>.</p>
                    <ul>
                        <li>1 ур. — стартовый (бесплатно)</li>
                        <li>2 ур. — ${formatMoney(2000)}</li>
                        <li>3 ур. — ${formatMoney(4000)}</li>
                        <li>4 ур. — ${formatMoney(7000)}</li>
                    </ul>
                </div>
                <div class="help-card">
                    <h3>🎯 Влияние</h3>
                    <p>Высокий маркетинг увеличивает спрос на ваше пиво, что позволяет продавать больше по контрактам и в тапруме. Также влияет на репутацию и скорость генерации выгодных контрактов.</p>
                </div>
            </div>
        </div>

        <div class="help-section" id="help-guide-research">
            <h2>🔬 Исследования</h2>
            <p>В разделе <strong>📊 Менеджмент → Исследования</strong> можно открывать технологии. Каждое исследование требует времени и денег, после завершения даёт постоянный бонус.</p>
            <div class="grid-2">
                <div class="help-card">
                    <h3>⚙️ Оборудование</h3>
                    <ul>
                        <li><strong>Автоматизация варки</strong> — ${formatMoney(5000)}, 5 дн. Скорость варки +20%</li>
                        <li><strong>Крафтовая линия</strong> — ${formatMoney(8000)}, 7 дн. Качество +10%</li>
                        <li><strong>Контроль качества</strong> — ${formatMoney(6000)}, 6 дн. Порча −50%</li>
                    </ul>
                </div>
                <div class="help-card">
                    <h3>📜 Рецепты</h3>
                    <ul>
                        <li><strong>Солодовня</strong> — ${formatMoney(3000)}, 3 дн. Открывает новые рецепты</li>
                    </ul>
                    <h3 style="margin-top:12px">📢 Маркетинг</h3>
                    <ul>
                        <li><strong>Маркетинг в соцсетях</strong> — ${formatMoney(2000)}, 2 дн. Репутация +5, спрос +10%</li>
                        <li><strong>Экскурсии на пивоварню</strong> — ${formatMoney(4000)}, 4 дн. Доход тапрума ×1.3</li>
                    </ul>
                </div>
            </div>
        </div>

        <div class="help-section" id="help-guide-equipment">
            <h2>⚙️ Оборудование</h2>
            <p>Оборудование покупается в разделе <strong>🏭 Пивоварня → Оборудование</strong>. Каждый предмет даёт постоянный бонус к производству. Всего 6 видов:</p>
            <div class="grid-2">
                <div class="help-card">
                    <table>
                        <tr><th>Предмет</th><th>Цена</th><th>Эффект</th></tr>
                        <tr><td>🍾 Линия розлива</td><td>${formatMoney(4000)}</td><td>Цена продажи +15%</td></tr>
                        <tr><td>🧊 Охлаждение</td><td>${formatMoney(3000)}</td><td>Ферментация −1 день</td></tr>
                        <tr><td>🛢 Лагерный танк</td><td>${formatMoney(2500)}</td><td>Дозревание −2 дня</td></tr>
                        <tr><td>🛞 Линия кегов</td><td>${formatMoney(5000)}</td><td>Объём партии +10%</td></tr>
                        <tr><td>🏺 Заторный чан</td><td>${formatMoney(1800)}</td><td>Качество +5%</td></tr>
                        <tr><td>🔬 Фильтрация</td><td>${formatMoney(3500)}</td><td>Варка −1 день</td></tr>
                    </table>
                </div>
                <div class="help-card">
                    <h3>⚙️ Износ и ремонт</h3>
                    <p>Оборудование изнашивается на −0.1%/день. При износе ниже 20% — ломается и перестаёт работать.</p>
                    <ul>
                        <li><strong>Ремонт:</strong> 30% от цены оборудования</li>
                        <li><strong>Страховка:</strong> ${formatMoney(500)}, чинит первую поломку бесплатно</li>
                        <li>Износ влияет на качество пива (компонент 30 баллов)</li>
                    </ul>
                </div>
            </div>
        </div>

        <div class="help-section" id="help-guide-contracts">
            <h2>📋 Контракты</h2>
            <div class="grid-2">
                <div class="help-card">
                    <h3>📝 Как работают</h3>
                    <p>Бары, магазины и рестораны предлагают контракты на поставку пива определённого стиля. Контракты генерируются автоматически, если у вас меньше 3 невыбранных.</p>
                    <ul>
                        <li><strong>Цена за литр:</strong> $1.50–$3.50 (зависит от репутации)</li>
                        <li><strong>Объём:</strong> 100–1,000 литров</li>
                        <li><strong>Срок:</strong> 10–60 дней</li>
                        <li><strong>Формула выручки:</strong> литры × цена × (1 + навык продавца × 0.02) × (качество / 50)</li>
                        <li><strong>Авто-доставка:</strong> готовые партии автоматически отгружаются по контракту</li>
                    </ul>
                </div>
                <div class="help-card">
                    <h3>⚠️ Штрафы и бонусы</h3>
                    <ul>
                        <li><strong>Выполнение:</strong> репутация +1</li>
                        <li><strong>Штраф за срыв:</strong> 20% от суммы контракта, репутация −5</li>
                        <li><strong>Предупреждение:</strong> за 3 дня до истечения — уведомление в логе</li>
                        <li><strong>Слоты контрактов:</strong> 1 + уровень пивоварни + бонусы зданий</li>
                    </ul>
                </div>
            </div>
        </div>

        <div class="help-section" id="help-guide-achievements">
            <h2>🏆 Достижения</h2>
            <div class="grid-2">
                <div class="help-card">
                    <h3>📜 Список достижений</h3>
                    <table>
                        <tr><th>Достижение</th><th>Условие</th><th>Награда</th></tr>
                        <tr><td>🍺 Первая партия</td><td>Сварить первую партию</td><td>Репутация +5</td></tr>
                        <tr><td>👤 Кадровое пополнение</td><td>Нанять первого сотрудника</td><td>Репутация +5</td></tr>
                        <tr><td>📋 Первая сделка</td><td>Выполнить первый контракт</td><td>Репутация +5</td></tr>
                        <tr><td>🔧 Модернизация</td><td>Купить первое улучшение</td><td>Скидка 10% на апгрейды</td></tr>
                        <tr><td>💰 Первая выручка</td><td>Выручка ≥ ${formatMoney(10000)}</td><td>Репутация +5</td></tr>
                        <tr><td>💵 Серьёзный пивовар</td><td>Выручка ≥ ${formatMoney(50000)}</td><td>Репутация +10</td></tr>
                        <tr><td>🏆 Пивной магнат</td><td>Выручка ≥ ${formatMoney(100000)}</td><td>Репутация +15</td></tr>
                        <tr><td>👥 Дружная команда</td><td>Нанять 3 сотрудников</td><td>Репутация +5</td></tr>
                        <tr><td>⭐ Народная любовь</td><td>Репутация ≥ 90%</td><td>Спрос +10%</td></tr>
                    </table>
                </div>
                <div class="help-card">
                    <h3>🎯 Мотивация</h3>
                    <p>Достижения проверяются каждый игровой день. Некоторые дают репутацию, другие — постоянные бонусы (скидка на улучшения, повышенный спрос). Следите за прогрессом в логе событий — каждое достижение сопровождается уведомлением.</p>
                </div>
            </div>
        </div>

        <div class="help-section" id="help-guide-level">
            <h2>🏭 Уровень пивоварни</h2>
            <div class="grid-2">
                <div class="help-card">
                    <h3>📈 Как растёт</h3>
                    <p>Уровень пивоварни повышается автоматически при достижении определённой общей выручки:</p>
                    <ul>
                        <li>2 ур. — ${formatMoney(10000)} выручки</li>
                        <li>3 ур. — ${formatMoney(30000)}</li>
                        <li>4 ур. — ${formatMoney(60000)}</li>
                        <li>и так далее (формула: 5,000 × уровень × (уровень − 1))</li>
                    </ul>
                </div>
                <div class="help-card">
                    <h3>🎁 Бонусы за уровень</h3>
                    <ul>
                        <li><strong>+5%</strong> к цене продажи за каждый уровень</li>
                        <li><strong>+1 слот</strong> контрактов за каждый уровень</li>
                        <li>Уровень отображается на дашборде</li>
                        <li>Также влияет на максимальный размер кредита</li>
                    </ul>
                </div>
            </div>
        </div>

        <div class="help-section" id="help-guide-loans">
            <h2>💰 Кредиты и банкротство</h2>
            <div class="grid-2">
                <div class="help-card">
                    <h3>🏦 Кредит</h3>
                    <p>При отрицательном балансе кредит выдаётся автоматически. Вы также можете взять кредит добровольно в разделе <strong>Финансы</strong>.</p>
                    <ul>
                        <li><strong>Лимит:</strong> ${formatMoney(5000)} + репутация × ${formatMoney(200)} + уровень × ${formatMoney(1000)}</li>
                        <li><strong>Ставка:</strong> 0.3%–1%/день (зависит от репутации)</li>
                        <li><strong>Погашение:</strong> любой суммой, без штрафа</li>
                    </ul>
                </div>
                <div class="help-card">
                    <h3>💀 Банкротство</h3>
                    <p>Если долг превышает <strong>${formatMoney(5000)}</strong> и держится больше <strong>30 дней</strong> подряд — игра заканчивается.</p>
                    <ul>
                        <li>Следите за балансом в разделе Финансы</li>
                        <li>Продавайте готовое пиво, берите контракты</li>
                        <li>В крайнем случае — увольте сотрудников</li>
                    </ul>
                </div>
            </div>
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
                    <p>При отрицательном балансе выдаётся кредит под <strong>1% в день</strong>. Если долг превысит <strong>${formatMoney(5000)}</strong> и будет держаться больше <strong>30 дней</strong> — игра заканчивается банкротством.</p>
                </div>
                <div class="help-card">
                    <h3>🌾 Порча ингредиентов</h3>
                    <p>Каждый день <strong>0.5%</strong> всех ингредиентов списывается. Не закупайте слишком много — продукты портятся.</p>
                </div>
                <div class="help-card">
                    <h3>🏆 Цель игры</h3>
                    <p>Заработайте <strong>${formatMoney(100000)}</strong> общей выручки. Прогресс на дашборде.</p>
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
