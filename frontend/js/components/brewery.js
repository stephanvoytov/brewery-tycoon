async function doRenameBrewery() {
    const b = GAME_STATE.brewery;
    if (!b) return;
    const newName = await showPrompt('Переименовать пивоварню', 'Введите новое название:', b.name);
    if (!newName || newName.trim() === '' || newName.trim() === b.name) return;
    try {
        const res = await API.renameBrewery(newName.trim());
        showSuccess(res.message);
        await loadGameState();
        renderBrewery();
    } catch (e) {
        showError(e.message);
    }
}

function renderBrewery() {
    const b = GAME_STATE.brewery;
    const equip = GAME_STATE.equipment || [];

    const ownedEquip = equip.filter(e => e.is_owned);
    const availableEquip = equip.filter(e => !e.is_owned);

    const svgTanks = [];
    const svgFermenters = [];
    const svgConditioning = [];

    const batches = GAME_STATE.batches || [];
    const activeBatches = batches.filter(b => !['sold', 'spoiled'].includes(b.stage));

    for (let i = 0; i < b.tank_count; i++) {
        const occupied = i < activeBatches.filter(b => ['mash', 'boil'].includes(b.stage)).length;
        svgTanks.push({ id: i + 1, occupied });
    }
    for (let i = 0; i < b.fermenter_count; i++) {
        const occupied = i < activeBatches.filter(b => b.stage === 'ferment').length;
        svgFermenters.push({ id: i + 1, occupied });
    }
    for (let i = 0; i < b.conditioning_tank_count; i++) {
        const occupied = i < activeBatches.filter(b => b.stage === 'condition' || b.stage === 'packaged').length;
        svgConditioning.push({ id: i + 1, occupied });
    }

    const el = document.getElementById('page-brewery');
    const curBld = BUILDINGS[b.building_id] || BUILDINGS[2];
    el.innerHTML = `
        <div class="brewery-header" style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
            <h2 style="margin-bottom:0">🏭 Пивоварня «${b.name}»</h2>
            <button class="btn btn-small" onclick="doRenameBrewery()" title="Переименовать">✏️</button>
        </div>
        <div style="margin-bottom:16px;font-size:0.85rem;color:var(--accent-light)">
            ${curBld.icon} ${curBld.name} &nbsp;·&nbsp; Аренда: ${formatMonthly(b.rent)}
            ${curBld.quality_bonus ? `&nbsp;·&nbsp; ⭐${curBld.quality_bonus > 0 ? '+' : ''}${curBld.quality_bonus}%` : ''}
            ${curBld.cost_reduction ? `&nbsp;·&nbsp; 🏷−${curBld.cost_reduction}%` : ''}
            ${curBld.extra_slots ? `&nbsp;·&nbsp; 📋+${curBld.extra_slots} слот` : ''}
            <button class="btn btn-small" onclick="showBuildingModal()" style="margin-left:12px;">🏢 Сменить здание</button>
        </div>

        <div class="brewery-svg-container">
            <svg viewBox="0 0 1800 600" xmlns="http://www.w3.org/2000/svg" style="width:100%">
                <defs>
                    <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#2a3a5a"/>
                        <stop offset="100%" stop-color="#1a2a4a"/>
                    </linearGradient>
                    <linearGradient id="kettle" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#d4a017"/>
                        <stop offset="100%" stop-color="#8a6a0f"/>
                    </linearGradient>
                    <linearGradient id="ferm" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#3498db"/>
                        <stop offset="100%" stop-color="#1a5276"/>
                    </linearGradient>
                    <linearGradient id="cond" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#2ecc71"/>
                        <stop offset="100%" stop-color="#1a6e3a"/>
                    </linearGradient>
                    <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#3a2a1a"/>
                        <stop offset="100%" stop-color="#2a1a0a"/>
                    </linearGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="blur"/>
                        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                </defs>

                <rect x="10" y="10" width="1780" height="580" rx="10" fill="url(#wall)" stroke="#3a4a6a" stroke-width="2"/>
                <rect x="10" y="510" width="1780" height="80" rx="0" fill="url(#floor)" opacity="0.6"/>
                <line x1="10" y1="510" x2="1790" y2="510" stroke="#4a3a2a" stroke-width="1.5"/>

                <text x="900" y="38" text-anchor="middle" fill="#e0dcd0" font-size="18" font-weight="bold">🍺 ЦЕХ ПИВОВАРНИ</text>

                <rect x="20" y="50" width="630" height="26" rx="4" fill="#1a1a2e" opacity="0.7"/>
                <text x="335" y="68" text-anchor="middle" fill="#d4a017" font-size="14" font-weight="bold">⚡ ВАРОЧНЫЙ УЧАСТОК</text>

                <rect x="670" y="50" width="810" height="26" rx="4" fill="#1a1a2e" opacity="0.7"/>
                <text x="1075" y="68" text-anchor="middle" fill="#3498db" font-size="14" font-weight="bold">🧪 БРОДИЛЬНЯ</text>

                <rect x="1500" y="50" width="280" height="26" rx="4" fill="#1a1a2e" opacity="0.7"/>
                <text x="1640" y="68" text-anchor="middle" fill="#2ecc71" font-size="14" font-weight="bold">🧊 ДОЗРЕВАНИЕ</text>

                ${svgTanks.map((t, i) => {
                    const x = 40 + i * 145;
                    const color = t.occupied ? '#e74c3c' : '#d4a017';
                    return `
                        <g>
                            <rect x="${x}" y="95" width="130" height="150" rx="8" fill="url(#kettle)" stroke="${color}" stroke-width="2.5"/>
                            <rect x="${x + 12}" y="105" width="106" height="45" rx="5" fill="#1a0a00" opacity="0.4"/>
                            <rect x="${x + 12}" y="${225 - (t.occupied ? 35 : 0)}" width="106" height="${t.occupied ? 35 : 6}" rx="3" fill="#f0c040" opacity="${t.occupied ? 0.85 : 0.2}"/>
                            <text x="${x + 65}" y="165" text-anchor="middle" fill="#fff" font-size="14" font-weight="bold">Котёл ${t.id}</text>
                            <text x="${x + 65}" y="190" text-anchor="middle" fill="${color}" font-size="12" font-weight="bold">${t.occupied ? '🔥 Варка' : '✅ Свободен'}</text>
                            ${t.occupied ? `
                                <circle cx="${x + 30}" cy="120" r="6" fill="#f0c040" opacity="0.85" filter="url(#glow)">
                                    <animate attributeName="opacity" values="0.85;0.2;0.85" dur="1s" repeatCount="indefinite"/>
                                </circle>
                                <circle cx="${x + 65}" cy="112" r="5" fill="#f0c040" opacity="0.65">
                                    <animate attributeName="opacity" values="0.65;0.1;0.65" dur="1.5s" repeatCount="indefinite"/>
                                </circle>
                                <circle cx="${x + 100}" cy="125" r="4" fill="#f0c040" opacity="0.55">
                                    <animate attributeName="opacity" values="0.55;0.1;0.55" dur="1.2s" repeatCount="indefinite"/>
                                </circle>
                            ` : ''}
                            <rect x="${x + 30}" y="245" width="70" height="10" rx="3" fill="#5a4a3a"/>
                        </g>
                    `;
                }).join('')}

                <line x1="40" y1="85" x2="${40 + Math.min(svgTanks.length, 4) * 145 + 60}" y2="85" stroke="#5a4a3a" stroke-width="2.5"/>

                ${svgFermenters.map((t, i) => {
                    const x = 690 + i * 82;
                    const color = t.occupied ? '#e74c3c' : '#3498db';
                    return `
                        <g>
                            <rect x="${x}" y="105" width="68" height="140" rx="34" fill="url(#ferm)" stroke="${color}" stroke-width="2.5"/>
                            <rect x="${x + 10}" y="118" width="48" height="65" rx="24" fill="#0a1a2e" opacity="0.3"/>
                            <text x="${x + 34}" y="172" text-anchor="middle" fill="#fff" font-size="10">Ф${t.id}</text>
                            <text x="${x + 34}" y="192" text-anchor="middle" fill="${color}" font-size="11" font-weight="bold">${t.occupied ? '⏳' : '✅'}</text>
                            ${t.occupied ? `
                                <circle cx="${x + 22}" cy="135" r="4" fill="#85c1e9" opacity="0.75">
                                    <animate attributeName="cy" values="135;122;135" dur="2s" repeatCount="indefinite"/>
                                </circle>
                                <circle cx="${x + 46}" cy="140" r="4" fill="#85c1e9" opacity="0.55">
                                    <animate attributeName="cy" values="140;125;140" dur="2.8s" repeatCount="indefinite"/>
                                </circle>
                            ` : ''}
                            <rect x="${x + 17}" y="245" width="34" height="10" rx="3" fill="#5a4a3a"/>
                        </g>
                    `;
                }).join('')}

                ${svgConditioning.map((t, i) => {
                    const x = 1520 + i * 135;
                    const color = t.occupied ? '#e74c3c' : '#2ecc71';
                    return `
                        <g>
                            <rect x="${x}" y="95" width="110" height="150" rx="10" fill="url(#cond)" stroke="${color}" stroke-width="2.5"/>
                            <ellipse cx="${x + 55}" cy="122" rx="42" ry="14" fill="#0a1a0a" opacity="0.35"/>
                            <text x="${x + 55}" y="172" text-anchor="middle" fill="#fff" font-size="13" font-weight="bold">Танк ${t.id}</text>
                            <text x="${x + 55}" y="195" text-anchor="middle" fill="${color}" font-size="12" font-weight="bold">${t.occupied ? '⏳ Созревает' : '✅ Свободен'}</text>
                            <rect x="${x + 25}" y="245" width="60" height="10" rx="3" fill="#5a4a3a"/>
                        </g>
                    `;
                }).join('')}

                <g transform="translate(40, 330)">
                    <rect x="0" y="0" width="500" height="90" rx="8" fill="#4a3a2a" stroke="#8a7a5a" stroke-width="1.5" stroke-dasharray="5,3"/>
                    <text x="250" y="28" text-anchor="middle" fill="#d4a017" font-size="14" font-weight="bold">🍾 Линия розлива</text>
                    <text x="250" y="50" text-anchor="middle" fill="#8a8a7a" font-size="12">${ownedEquip.some(e => e.type === 'bottling_line') ? '✅ Установлена' : '❌ Не куплена'}</text>
                    <circle cx="60" cy="72" r="7" fill="#3498db" opacity="0.5"><animate attributeName="opacity" values="0.5;0.1;0.5" dur="0.8s" repeatCount="indefinite"/></circle>
                    <circle cx="120" cy="72" r="7" fill="#3498db" opacity="0.4"><animate attributeName="opacity" values="0.4;0.1;0.4" dur="0.6s" repeatCount="indefinite"/></circle>
                    <circle cx="180" cy="72" r="7" fill="#3498db" opacity="0.5"><animate attributeName="opacity" values="0.5;0.1;0.5" dur="0.7s" repeatCount="indefinite"/></circle>
                </g>

                <g transform="translate(580, 330)">
                    <rect x="0" y="0" width="540" height="90" rx="8" fill="#4a3a2a" stroke="#8a7a5a" stroke-width="1.5" stroke-dasharray="5,3"/>
                    <text x="270" y="28" text-anchor="middle" fill="#d4a017" font-size="14" font-weight="bold">🛢 Линия кегов</text>
                    <text x="270" y="50" text-anchor="middle" fill="#8a8a7a" font-size="12">${ownedEquip.some(e => e.type === 'kegging_line') ? '✅ Установлена' : '❌ Не куплена'}</text>
                    <ellipse cx="270" cy="68" rx="45" ry="22" fill="#8a7a5a" opacity="0.4" stroke="#8a7a5a" stroke-width="1.5"/>
                </g>

                <g transform="translate(1160, 330)">
                    <rect x="0" y="0" width="580" height="90" rx="8" fill="#3a2a1a" stroke="${b.has_taproom ? '#2ecc71' : '#8a8a7a'}" stroke-width="1.5"/>
                    <text x="290" y="28" text-anchor="middle" fill="${b.has_taproom ? '#2ecc71' : '#8a8a7a'}" font-size="14" font-weight="bold">🍺 Тапрум</text>
                    <text x="290" y="50" text-anchor="middle" fill="#8a8a7a" font-size="12">${b.has_taproom ? `✅ Открыт (ур. ${b.taproom_level})` : '🔴 Не построен'}</text>
                    ${b.has_taproom ? `<text x="290" y="72" text-anchor="middle" fill="#2ecc71" font-size="13">${formatMoney(b.taproom_level * 30)}/день</text>` : ''}
                </g>

                <g transform="translate(40, 445)">
                    <rect x="0" y="0" width="1720" height="42" rx="6" fill="#1a1a2e" opacity="0.8"/>
                    <text x="860" y="26" text-anchor="middle" fill="#8a8a7a" font-size="14">📦 Хранилище: ${b.storage_capacity} л • Аренда: ${formatMonthly(b.rent)} • Уровень: ${b.level} • Котлы: ${b.tank_count}×${b.tank_volume}л (макс. партия ${b.tank_count * b.tank_volume}л)</text>
                </g>
            </svg>
        </div>

        <div class="grid-2" style="margin-top:16px">
            <div class="card">
                <h3>🏗 Улучшения</h3>
                <table>
                    <tr>
                        <td>Варочные котлы</td>
                        <td>${b.tank_count} шт. × ${b.tank_volume}л</td>
                        <td><button class="btn btn-sm btn-primary" onclick="doUpgrade('tanks')" ${!getUpgradeCost('tanks', b.tank_count) ? 'disabled' : ''}>+1${getUpgradeCost('tanks', b.tank_count) ? ` (${formatMoney(getUpgradeCost('tanks', b.tank_count))})` : ' MAX'}</button></td>
                    </tr>
                    <tr>
                        <td>Ферментеры</td>
                        <td>${b.fermenter_count} шт.</td>
                        <td><button class="btn btn-sm btn-primary" onclick="doUpgrade('fermenters')" ${!getUpgradeCost('fermenters', b.fermenter_count) ? 'disabled' : ''}>+2${getUpgradeCost('fermenters', b.fermenter_count) ? ` (${formatMoney(getUpgradeCost('fermenters', b.fermenter_count))})` : ' MAX'}</button></td>
                    </tr>
                    <tr>
                        <td>Хранилище</td>
                        <td>${b.storage_capacity} л</td>
                        <td><button class="btn btn-sm btn-primary" onclick="doUpgrade('storage')" ${!getUpgradeCost('storage', b.storage_capacity) ? 'disabled' : ''}>+1000л${getUpgradeCost('storage', b.storage_capacity) ? ` (${formatMoney(getUpgradeCost('storage', b.storage_capacity))})` : ' MAX'}</button></td>
                    </tr>
                    <tr>
                        <td>Тапрум (доход)</td>
                        <td>${b.has_taproom ? `${formatMoney(b.taproom_level * 30)}/день` : 'Нет'}</td>
                        <td><button class="btn btn-sm btn-primary" onclick="doUpgrade('taproom')" ${!getUpgradeCost('taproom', b.taproom_level) ? 'disabled' : ''}>${b.has_taproom ? 'Улучшить' : 'Построить'}${getUpgradeCost('taproom', b.taproom_level) ? ` (${formatMoney(getUpgradeCost('taproom', b.taproom_level))})` : ' MAX'}</button></td>
                    </tr>
                    <tr>
                        <td>Маркетинг</td>
                        <td>Ур. ${b.marketing_level}</td>
                        <td><button class="btn btn-sm btn-primary" onclick="doUpgrade('marketing')" ${!getUpgradeCost('marketing', b.marketing_level) ? 'disabled' : ''}>Улучшить${getUpgradeCost('marketing', b.marketing_level) ? ` (${formatMoney(getUpgradeCost('marketing', b.marketing_level))})` : ' MAX'}</button></td>
                    </tr>
                    <tr>
                        <td><strong>Аренда</strong></td>
                        <td colspan="2"><strong>${formatMonthly(b.rent)}</strong></td>
                    </tr>
                </table>
                <div class="mobile-card-list">
                    <div class="mobile-card">
                        <div class="mobile-card-row"><span class="label">Варочные котлы:</span><span class="value">${b.tank_count}×${b.tank_volume}л</span></div>
                        <div class="mobile-card-actions"><button class="btn btn-sm btn-primary" onclick="doUpgrade('tanks')" ${!getUpgradeCost('tanks', b.tank_count) ? 'disabled' : ''}>+1${getUpgradeCost('tanks', b.tank_count) ? ` (${formatMoney(getUpgradeCost('tanks', b.tank_count))})` : ' MAX'}</button></div>
                    </div>
                    <div class="mobile-card">
                        <div class="mobile-card-row"><span class="label">Ферментеры:</span><span class="value">${b.fermenter_count} шт.</span></div>
                        <div class="mobile-card-actions"><button class="btn btn-sm btn-primary" onclick="doUpgrade('fermenters')" ${!getUpgradeCost('fermenters', b.fermenter_count) ? 'disabled' : ''}>+2${getUpgradeCost('fermenters', b.fermenter_count) ? ` (${formatMoney(getUpgradeCost('fermenters', b.fermenter_count))})` : ' MAX'}</button></div>
                    </div>
                    <div class="mobile-card">
                        <div class="mobile-card-row"><span class="label">Хранилище:</span><span class="value">${b.storage_capacity} л</span></div>
                        <div class="mobile-card-actions"><button class="btn btn-sm btn-primary" onclick="doUpgrade('storage')" ${!getUpgradeCost('storage', b.storage_capacity) ? 'disabled' : ''}>+1000л${getUpgradeCost('storage', b.storage_capacity) ? ` (${formatMoney(getUpgradeCost('storage', b.storage_capacity))})` : ' MAX'}</button></div>
                    </div>
                    <div class="mobile-card">
                        <div class="mobile-card-row"><span class="label">Тапрум:</span><span class="value">${b.has_taproom ? `${formatMoney(b.taproom_level * 30)}/день` : 'Нет'}</span></div>
                        <div class="mobile-card-actions"><button class="btn btn-sm btn-primary" onclick="doUpgrade('taproom')" ${!getUpgradeCost('taproom', b.taproom_level) ? 'disabled' : ''}>${b.has_taproom ? 'Улучшить' : 'Построить'}${getUpgradeCost('taproom', b.taproom_level) ? ` (${formatMoney(getUpgradeCost('taproom', b.taproom_level))})` : ' MAX'}</button></div>
                    </div>
                    <div class="mobile-card">
                        <div class="mobile-card-row"><span class="label">Маркетинг:</span><span class="value">Ур. ${b.marketing_level}</span></div>
                        <div class="mobile-card-actions"><button class="btn btn-sm btn-primary" onclick="doUpgrade('marketing')" ${!getUpgradeCost('marketing', b.marketing_level) ? 'disabled' : ''}>Улучшить${getUpgradeCost('marketing', b.marketing_level) ? ` (${formatMoney(getUpgradeCost('marketing', b.marketing_level))})` : ' MAX'}</button></div>
                    </div>
                    <div class="mobile-card">
                        <div class="mobile-card-row"><span class="label"><strong>Аренда</strong></span><span class="value"><strong>${formatMonthly(b.rent)}</strong></span></div>
                    </div>
                </div>
            </div>

            <div class="card">
                <h3>🔧 Оборудование</h3>
                <h4 style="color:var(--green);font-size:0.85rem;margin-bottom:8px">Приобретено:</h4>
                ${ownedEquip.length === 0 ? '<div class="empty-state">Нет оборудования</div>' : ownedEquip.map(e => {
                    const wearColor = e.wear_tear > 80 ? 'var(--green)' : e.wear_tear > 40 ? 'var(--accent)' : 'var(--red)';
                    const broken = e.wear_tear < 20;
                    const repairCost = Math.round(e.price * 0.3);
                    return `<div class="equip-row" style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid var(--border)">
                        <span>${broken ? '❌' : '✅'} ${e.name} <span style="color:${wearColor};font-size:0.75rem">(износ: ${Math.round(e.wear_tear)}%)</span></span>
                        <span>${broken ? `<button class="btn btn-sm btn-danger" onclick="doRepairEquipment(${e.id})">Ремонт $${repairCost}</button>` : `<span style="color:var(--text-dim);font-size:0.75rem">+${Math.round(e.efficiency_bonus * 100)}%</span>`}</span>
                    </div>`;
                }).join('')}

                <h4 style="color:var(--accent);font-size:0.85rem;margin:10px 0 8px">Доступно к покупке:</h4>
                ${availableEquip.length === 0 ? '<div class="empty-state">Всё куплено</div>' : availableEquip.map(e =>
                    `<div class="equip-row" style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border)">
                        <span>${e.name}</span>
                        <span>${formatMoney(e.price)} <button class="btn btn-sm btn-success" onclick="doBuyEquipment(${e.id})">Купить</button></span>
                    </div>`
                ).join('')}

                <h4 style="color:var(--accent);font-size:0.85rem;margin:10px 0 8px">Страховка</h4>
                <div style="display:flex;justify-content:space-between;align-items:center">
                    <span>${GAME_STATE.game.has_insurance ? '✅ Страховка активна (покрывает поломку)' : '❌ Страховка не куплена'}</span>
                    ${!GAME_STATE.game.has_insurance ? `<button class="btn btn-sm btn-primary" onclick="doBuyInsurance()">Купить $500</button>` : ''}
                </div>
            </div>
        </div>
    `;
}

function getUpgradeCost(type, current) {
    const costs = {
        tanks: { 2: 3000, 3: 6000, 4: 10000 },
        fermenters: { 4: 2000, 6: 5000, 8: 9000 },
        storage: { 1000: 2000, 2000: 4000, 4000: 8000 },
        taproom: { 1: 5000, 2: 10000 },
        marketing: { 2: 2000, 3: 4000, 4: 7000 },
    };
    const m = costs[type];
    if (!m) return null;
    const key = type === 'tanks' ? current + 1 : type === 'taproom' || type === 'marketing' ? current + 1 : current;
    return m[key] || m[Object.keys(m).find(k => Number(k) > current)] || null;
}

async function doUpgrade(type) {
    try {
        const res = await API.upgradeBrewery(type);
        showSuccess(res.message);
        await loadGameState();
        renderBrewery();
    } catch (e) {
        showError(e.message);
    }
}

async function doBuyEquipment(id) {
    try {
        const res = await API.buyEquipment(id);
        showSuccess(res.message);
        await loadGameState();
        renderBrewery();
    } catch (e) {
        showError(e.message);
    }
}

async function doBuyInsurance() {
    try {
        const res = await API.buyInsurance();
        showSuccess(res.message);
        await loadGameState();
        renderBrewery();
    } catch (e) {
        showError(e.message);
    }
}

async function doRepairEquipment(id) {
    try {
        const res = await API.repairEquipment(id);
        showSuccess(res.message);
        await loadGameState();
        renderBrewery();
    } catch (e) {
        showError(e.message);
    }
}

function showBuildingModal() {
    const b = GAME_STATE.brewery;
    if (!b) return;
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';
    overlay.style.zIndex = '20001';
    overlay.innerHTML = `
        <div class="dialog-box" style="max-width:600px;max-height:80vh;overflow-y:auto">
            <h3>🏢 Сменить здание</h3>
            <p style="font-size:0.85rem;color:var(--text-dim);margin-bottom:12px">Текущее: ${BUILDINGS[b.building_id]?.name || 'Неизвестно'}</p>
            <div class="building-list">
                ${Object.values(BUILDINGS).map(bld => {
                    const isCurrent = b.building_id === bld.id;
                    const isLocked = b.level < bld.min_level;
                    const moveCost = isCurrent || isLocked ? 0 : (
                        bld.rent * 15
                        + b.tank_count * 500
                        + b.fermenter_count * 300
                        + b.conditioning_tank_count * 300
                        + (b.has_taproom ? 2000 : 0)
                        + (GAME_STATE.equipment || []).filter(e => e.is_owned).length * 200
                    );
                    return `
                        <div class="building-card ${isCurrent ? 'current' : ''} ${isLocked ? 'locked' : ''}">
                            <div class="building-card-header">
                                <span class="building-icon">${bld.icon}</span>
                                <span class="building-name">${bld.name}</span>
                                ${isCurrent ? '<span class="building-badge">✅ Здесь</span>' : ''}
                                ${isLocked ? '<span class="building-badge locked">🔒 Ур. ' + bld.min_level + '</span>' : ''}
                            </div>
                            <div class="building-desc">${bld.desc}</div>
                            <div class="building-stats">
                                <span>💵 ${formatMoney(bld.rent)}/день</span>
                                <span>📦 ${bld.storage}л</span>
                                <span>⚡ ${bld.tanks}×${bld.kettle_vol}л</span>
                                <span>🧪 ${bld.fermenters} ферм.</span>
                                <span>⭐ ${bld.quality_bonus > 0 ? '+' : ''}${bld.quality_bonus}%</span>
                                ${bld.cost_reduction ? `<span>🏷 −${bld.cost_reduction}%</span>` : ''}
                                ${bld.extra_slots ? `<span>📋 +${bld.extra_slots} слот</span>` : ''}
                                ${bld.demand_bonus ? `<span>📈 +${bld.demand_bonus}%</span>` : ''}
                                ${bld.taproom ? `<span>🍺 Тапрум</span>` : ''}
                            </div>
                            ${!isCurrent && !isLocked ? `
                                <div class="building-cost" style="margin-top:8px">
                                    💰 Переезд: ${formatMoney(moveCost)}
                                </div>
                                <button class="btn btn-sm btn-primary" onclick="doChangeBuilding(${bld.id})" style="margin-top:8px;width:100%">
                                    🚚 Переехать
                                </button>
                            ` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
            <div class="dialog-actions" style="margin-top:16px">
                <button class="btn btn-secondary" id="buildingModalClose">Закрыть</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('#buildingModalClose').onclick = () => overlay.remove();
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
}

async function doChangeBuilding(buildingId) {
    try {
        const res = await API.changeBuilding(buildingId);
        showSuccess(res.message);
        document.querySelectorAll('.dialog-overlay').forEach(el => el.remove());
        await loadGameState();
        renderBrewery();
    } catch (e) {
        showError(e.message);
    }
}
