function renderMarketPage() {
    const el = document.getElementById('page-market');
    el.innerHTML = `
        <h2>💰 Рынок</h2>
        <div class="sub-tabs" data-sub="market">
            <div class="sub-tab-bar">
                <button class="sub-tab-btn active" data-sub-tab="conditions">📊 Условия</button>
                <button class="sub-tab-btn" data-sub-tab="contracts">📋 Контракты</button>
                <button class="sub-tab-btn" data-sub-tab="competitors">🏢 Конкуренты</button>
                <button class="sub-tab-btn" data-sub-tab="marketing">📣 Маркетинг</button>
            </div>
            <div id="subConditions" class="sub-tab-content"><div id="page-market-conditions"></div></div>
            <div id="subContracts" class="sub-tab-content" style="display:none"><div id="page-market-contracts"></div></div>
            <div id="subCompetitors" class="sub-tab-content" style="display:none"><div id="page-market-competitors"></div></div>
            <div id="subMarketing" class="sub-tab-content" style="display:none"><div id="page-market-marketing"></div></div>
        </div>
    `;

    document.querySelectorAll('#page-market .sub-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchMarketTab(btn.dataset.subTab));
    });

    switchMarketTab('conditions');
}

function switchMarketTab(tab) {
    document.querySelectorAll('#page-market .sub-tab-content').forEach(d => d.style.display = 'none');
    document.querySelectorAll('#page-market .sub-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.subTab === tab));

    const contentId = 'sub' + tab.charAt(0).toUpperCase() + tab.slice(1);
    const contentEl = document.getElementById(contentId);
    if (contentEl) contentEl.style.display = '';

    switch (tab) {
        case 'conditions': renderMarketConditions(); break;
        case 'contracts': renderMarketContracts(); break;
        case 'competitors': renderMarketCompetitors(); break;
        case 'marketing': renderMarketMarketing(); break;
    }
}

function renderMarketConditions() {
    const market = GAME_STATE.market || [];
    const el = document.getElementById('page-market-conditions');
    el.innerHTML = `
        <div class="card">
            <h3>📈 Условия рынка</h3>
            <table>
                <tr>
                    <th>Стиль</th>
                    <th title="Базовый спрос на этот стиль пива (0-100%)">Спрос</th>
                    <th title="Насколько выше/ниже базовой цены можно продать">Множитель цены</th>
                    <th title="Сезонный коэффициент. Летом выше спрос на светлое, зимой — на тёмное">Сезон</th>
                </tr>
            ${market.map(m => `
                <tr>
                    <td>${STYLE_RU[m.beer_style] || m.beer_style}</td>
                    <td>${progressBar(m.base_demand, 100, 10)}</td>
                    <td>${(m.price_modifier * 100).toFixed(0)}%</td>
                    <td>${(m.season_factor * 100).toFixed(0)}%</td>
                </tr>
            `).join('')}
            </table>
            <div class="mobile-card-list">
                ${market.length === 0 ? '<div class="mobile-card-empty">Нет данных</div>' :
                market.map(m => `
                    <div class="mobile-card">
                        <div class="mobile-card-row">
                            <span class="label">${STYLE_RU[m.beer_style] || m.beer_style}</span>
                            <span class="value"></span>
                        </div>
                        <div class="mobile-card-row">
                            <span class="label">Спрос:</span><span class="value">${progressBar(m.base_demand, 100, 10)}</span>
                        </div>
                        <div class="mobile-card-row">
                            <span class="label">Множитель:</span><span class="value">${(m.price_modifier * 100).toFixed(0)}%</span>
                        </div>
                        <div class="mobile-card-row">
                            <span class="label">Сезон:</span><span class="value">${(m.season_factor * 100).toFixed(0)}%</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderMarketContracts() {
    const contracts = GAME_STATE.contracts || [];
    const el = document.getElementById('page-market-contracts');
    el.innerHTML = `
        <div class="grid-2">
            <div class="card">
                <h3>📋 Контракты <a class="help-link" onclick="scrollToHelp('help-guide-contracts'); return false;" title="Подробнее о контрактах">❓</a></h3>
                <table>
                    <tr>
                        <th>Покупатель</th>
                        <th>Сорт</th>
                        <th>Объём (л)</th>
                        <th>Цена/л</th>
                        <th>Срок (дн)</th>
                        <th></th>
                    </tr>
                    ${contracts.filter(c => !c.is_active).map(c => `
                        <tr>
                            <td>${c.buyer_name}</td>
                            <td>${STYLE_RU[c.beer_style] || c.beer_style}</td>
                            <td>${c.quantity_liters}</td>
                            <td>${formatMoney(c.price_per_liter)}</td>
                            <td>${c.duration_days}</td>
                            <td><button class="btn btn-sm btn-success" onclick="doSignContract(${c.id})">Подписать</button></td>
                        </tr>
                    `).join('')}
                    ${contracts.filter(c => !c.is_active).length === 0 ? '<tr><td colspan="6" class="empty-state">Нет доступных контрактов. Нажмите "Новый день"</td></tr>' : ''}
                </table>
                <div class="mobile-card-list">
                    ${contracts.filter(c => !c.is_active).length === 0 ? '<div class="mobile-card-empty">Нет доступных контрактов</div>' :
                    contracts.filter(c => !c.is_active).map(c => `
                        <div class="mobile-card">
                            <div class="mobile-card-row">
                                <span class="label">${c.buyer_name}</span>
                                <span class="value">${STYLE_RU[c.beer_style] || c.beer_style}</span>
                            </div>
                            <div class="mobile-card-row">
                                <span class="label">Объём:</span><span class="value">${c.quantity_liters} л</span>
                            </div>
                            <div class="mobile-card-row">
                                <span class="label">Цена:</span><span class="value">${formatMoney(c.price_per_liter)}/л</span>
                            </div>
                            <div class="mobile-card-row">
                                <span class="label">Срок:</span><span class="value">${c.duration_days} дн</span>
                            </div>
                            <div class="mobile-card-actions">
                                <button class="btn btn-sm btn-success" onclick="doSignContract(${c.id})">📝 Подписать</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="card">
                <h3>✅ Активные контракты</h3>
                <table>
                    <tr>
                        <th>Покупатель</th>
                        <th>Сорт</th>
                        <th>Всего л</th>
                        <th>Доставлено л</th>
                        <th>Выручка</th>
                        <th>Осталось дней</th>
                    </tr>
                    ${contracts.filter(c => c.is_active).length === 0 ? '<tr><td colspan="6" class="empty-state">Нет активных контрактов</td></tr>' :
                    contracts.filter(c => c.is_active).map(c => `
                        <tr>
                            <td>${c.buyer_name}</td>
                            <td>${STYLE_RU[c.beer_style] || c.beer_style}</td>
                            <td>${c.quantity_liters}</td>
                            <td>${c.delivered_liters}</td>
                            <td>${formatMoney(c.total_revenue)}</td>
                            <td>${c.days_left} / ${c.duration_days}</td>
                        </tr>
                    `).join('')}
                </table>
                <div class="mobile-card-list">
                    ${contracts.filter(c => c.is_active).length === 0 ? '<div class="mobile-card-empty">Нет активных контрактов</div>' :
                    contracts.filter(c => c.is_active).map(c => `
                        <div class="mobile-card">
                            <div class="mobile-card-row">
                                <span class="label">${c.buyer_name}</span>
                                <span class="value">${STYLE_RU[c.beer_style] || c.beer_style}</span>
                            </div>
                            <div class="mobile-card-row">
                                <span class="label">Объём:</span><span class="value">${c.delivered_liters} / ${c.quantity_liters} л</span>
                            </div>
                            <div class="mobile-card-row">
                                <span class="label">Выручка:</span><span class="value">${formatMoney(c.total_revenue)}</span>
                            </div>
                            <div class="mobile-card-row">
                                <span class="label">Осталось:</span><span class="value">${c.days_left} / ${c.duration_days} дн</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function renderMarketCompetitors() {
    const el = document.getElementById('page-market-competitors');
    el.innerHTML = `
        <div class="card">
            <h3>🏢 Конкуренты <a class="help-link" onclick="scrollToHelp('help-guide-competitors'); return false;" title="Подробнее о конкурентах">❓</a></h3>
            <table>
                <tr><th>Пивоварня</th><th>Продажи/день</th><th>Репутация</th></tr>
                <tr><td>🏠 Вы</td><td>${Math.round((GAME_STATE.game.player_total_liters || 0) / Math.max(1, GAME_STATE.game.day))}л</td><td>${Math.round(GAME_STATE.game.reputation)}%</td></tr>
                ${(GAME_STATE.competitors || []).map(c => `
                    <tr><td>${c.name}</td><td>${Math.round(c.daily_sales_liters)}л</td><td>${Math.round(c.reputation)}%</td></tr>
                `).join('')}
            </table>
        </div>
    `;
}

function renderMarketMarketing() {
    const b = GAME_STATE.brewery;
    const el = document.getElementById('page-market-marketing');
    if (!b) { el.innerHTML = '<div class="empty-state">Нет данных</div>'; return; }
    const cost = getUpgradeCost('marketing', b.marketing_level);
    el.innerHTML = `
        <div class="card">
            <h3>📣 Маркетинг <a class="help-link" onclick="scrollToHelp('help-guide-marketing'); return false;" title="Подробнее о маркетинге">❓</a></h3>
            <p>Уровень маркетинга: <strong>${b.marketing_level}</strong></p>
            <p style="font-size:0.85rem;color:var(--text-dim);margin-bottom:12px">Повышает спрос на ваше пиво и цену контрактов</p>
            ${cost ? `<button class="btn btn-primary" onclick="doMarketingUpgrade()">Улучшить до ${b.marketing_level + 1} (${formatMoney(cost)})</button>` : '<span class="badge">MAX</span>'}
        </div>
    `;
}

async function doSignContract(id) {
    const ok = await showConfirm('Подписать контракт?', 'Штраф за срыв — до $1,000.');
    if (!ok) return;
    try {
        const res = await API.signContract(id);
        showSuccess(res.message);
        await loadGameState();
        renderMarketPage();
    } catch (e) {
        showError(e.message);
    }
}

async function doMarketingUpgrade() {
    try {
        const res = await API.upgradeBrewery('marketing');
        showSuccess(res.message);
        await loadGameState();
        renderMarketPage();
    } catch (e) {
        showError(e.message);
    }
}
