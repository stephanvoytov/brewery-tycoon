async function doRenameBrewery() {
    const b = GAME_STATE.brewery;
    if (!b) return;
    const newName = prompt('Введите новое название пивоварни:', b.name);
    if (!newName || newName.trim() === '' || newName === b.name) return;
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
    el.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
            <h2 style="margin-bottom:0">🏭 Пивоварня «${b.name}»</h2>
            <button class="btn btn-small" onclick="doRenameBrewery()" title="Переименовать">✏️</button>
        </div>

        <div class="brewery-svg-container">
            <svg viewBox="0 0 800 560" xmlns="http://www.w3.org/2000/svg" style="width:100%">
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

                <!-- Wall -->
                <rect x="10" y="10" width="780" height="540" rx="10" fill="url(#wall)" stroke="#3a4a6a" stroke-width="2"/>
                <!-- Floor -->
                <rect x="10" y="480" width="780" height="70" rx="0" fill="url(#floor)" opacity="0.6"/>
                <line x1="10" y1="480" x2="790" y2="480" stroke="#4a3a2a" stroke-width="1"/>

                <text x="400" y="38" text-anchor="middle" fill="#e0dcd0" font-size="15" font-weight="bold">🍺 ЦЕХ ПИВОВАРНИ</text>

                <!-- Department labels -->
                <rect x="20" y="50" width="250" height="22" rx="4" fill="#1a1a2e" opacity="0.7"/>
                <text x="145" y="65" text-anchor="middle" fill="#d4a017" font-size="11" font-weight="bold">⚡ ВАРОЧНЫЙ УЧАСТОК</text>

                <rect x="300" y="50" width="180" height="22" rx="4" fill="#1a1a2e" opacity="0.7"/>
                <text x="390" y="65" text-anchor="middle" fill="#3498db" font-size="11" font-weight="bold">🧪 БРОДИЛЬНЯ</text>

                <rect x="520" y="50" width="250" height="22" rx="4" fill="#1a1a2e" opacity="0.7"/>
                <text x="645" y="65" text-anchor="middle" fill="#2ecc71" font-size="11" font-weight="bold">🧊 ДОЗРЕВАНИЕ</text>

                <!-- Tanks section -->
                ${svgTanks.map((t, i) => {
                    const x = 40 + i * 130;
                    const color = t.occupied ? '#e74c3c' : '#d4a017';
                    return `
                        <g>
                            <rect x="${x}" y="90" width="100" height="140" rx="6" fill="url(#kettle)" stroke="${color}" stroke-width="2"/>
                            <rect x="${x + 10}" y="100" width="80" height="40" rx="4" fill="#1a0a00" opacity="0.4"/>
                            <rect x="${x + 10}" y="${210 - (t.occupied ? 30 : 0)}" width="80" height="${t.occupied ? 30 : 5}" rx="2" fill="#f0c040" opacity="${t.occupied ? 0.8 : 0.2}"/>
                            <text x="${x + 50}" y="153" text-anchor="middle" fill="#fff" font-size="13" font-weight="bold">Котёл ${t.id}</text>
                            <text x="${x + 50}" y="175" text-anchor="middle" fill="${color}" font-size="11" font-weight="bold">${t.occupied ? '🔥 Варка' : '✅ Свободен'}</text>
                            ${t.occupied ? `
                                <circle cx="${x + 25}" cy="115" r="5" fill="#f0c040" opacity="0.8" filter="url(#glow)">
                                    <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1s" repeatCount="indefinite"/>
                                </circle>
                                <circle cx="${x + 50}" cy="108" r="4" fill="#f0c040" opacity="0.6">
                                    <animate attributeName="opacity" values="0.6;0.1;0.6" dur="1.5s" repeatCount="indefinite"/>
                                </circle>
                                <circle cx="${x + 75}" cy="120" r="3" fill="#f0c040" opacity="0.5">
                                    <animate attributeName="opacity" values="0.5;0.1;0.5" dur="1.2s" repeatCount="indefinite"/>
                                </circle>
                            ` : ''}
                            <rect x="${x + 20}" y="230" width="60" height="8" rx="2" fill="#5a4a3a"/>
                        </g>
                    `;
                }).join('')}

                <!-- Steam pipe connector -->
                <line x1="40" y1="80" x2="${40 + Math.min(svgTanks.length, 4) * 120}" y2="80" stroke="#5a4a3a" stroke-width="2"/>

                <!-- Fermenters section -->
                ${svgFermenters.map((t, i) => {
                    const x = 320 + i * 80;
                    const color = t.occupied ? '#e74c3c' : '#3498db';
                    return `
                        <g>
                            <rect x="${x}" y="100" width="60" height="130" rx="30" fill="url(#ferm)" stroke="${color}" stroke-width="2"/>
                            <rect x="${x + 10}" y="110" width="40" height="60" rx="20" fill="#0a1a2e" opacity="0.3"/>
                            <text x="${x + 30}" y="155" text-anchor="middle" fill="#fff" font-size="9">Ф${t.id}</text>
                            <text x="${x + 30}" y="173" text-anchor="middle" fill="${color}" font-size="10" font-weight="bold">${t.occupied ? '⏳' : '✅'}</text>
                            ${t.occupied ? `
                                <circle cx="${x + 20}" cy="125" r="3" fill="#85c1e9" opacity="0.7">
                                    <animate attributeName="cy" values="125;115;125" dur="2s" repeatCount="indefinite"/>
                                </circle>
                                <circle cx="${x + 40}" cy="130" r="3" fill="#85c1e9" opacity="0.5">
                                    <animate attributeName="cy" values="130;118;130" dur="2.8s" repeatCount="indefinite"/>
                                </circle>
                            ` : ''}
                            <rect x="${x + 15}" y="230" width="30" height="8" rx="2" fill="#5a4a3a"/>
                        </g>
                    `;
                }).join('')}

                <!-- Conditioning section -->
                ${svgConditioning.map((t, i) => {
                    const x = 540 + i * 100;
                    const color = t.occupied ? '#e74c3c' : '#2ecc71';
                    return `
                        <g>
                            <rect x="${x}" y="90" width="80" height="140" rx="8" fill="url(#cond)" stroke="${color}" stroke-width="2"/>
                            <ellipse cx="${x + 40}" cy="115" rx="30" ry="10" fill="#0a1a0a" opacity="0.3"/>
                            <text x="${x + 40}" y="155" text-anchor="middle" fill="#fff" font-size="10" font-weight="bold">Танк ${t.id}</text>
                            <text x="${x + 40}" y="175" text-anchor="middle" fill="${color}" font-size="10" font-weight="bold">${t.occupied ? '⏳ Созревает' : '✅ Свободен'}</text>
                            <rect x="${x + 15}" y="230" width="50" height="8" rx="2" fill="#5a4a3a"/>
                        </g>
                    `;
                }).join('')}

                <!-- Bottling line -->
                <g transform="translate(40, 320)">
                    <rect x="0" y="0" width="200" height="80" rx="6" fill="#4a3a2a" stroke="#8a7a5a" stroke-width="1.5" stroke-dasharray="4,2"/>
                    <text x="100" y="25" text-anchor="middle" fill="#d4a017" font-size="11" font-weight="bold">🍾 Линия розлива</text>
                    <text x="100" y="45" text-anchor="middle" fill="#8a8a7a" font-size="10">${ownedEquip.some(e => e.type === 'bottling_line') ? '✅ Установлена' : '❌ Не куплена'}</text>
                    <circle cx="30" cy="65" r="6" fill="#3498db" opacity="0.5"><animate attributeName="opacity" values="0.5;0.1;0.5" dur="0.8s" repeatCount="indefinite"/></circle>
                    <circle cx="60" cy="65" r="6" fill="#3498db" opacity="0.4"><animate attributeName="opacity" values="0.4;0.1;0.4" dur="0.6s" repeatCount="indefinite"/></circle>
                    <circle cx="90" cy="65" r="6" fill="#3498db" opacity="0.5"><animate attributeName="opacity" values="0.5;0.1;0.5" dur="0.7s" repeatCount="indefinite"/></circle>
                </g>

                <!-- Kegging line -->
                <g transform="translate(280, 320)">
                    <rect x="0" y="0" width="200" height="80" rx="6" fill="#4a3a2a" stroke="#8a7a5a" stroke-width="1.5" stroke-dasharray="4,2"/>
                    <text x="100" y="25" text-anchor="middle" fill="#d4a017" font-size="11" font-weight="bold">🛢 Линия кегов</text>
                    <text x="100" y="45" text-anchor="middle" fill="#8a8a7a" font-size="10">${ownedEquip.some(e => e.type === 'kegging_line') ? '✅ Установлена' : '❌ Не куплена'}</text>
                    <ellipse cx="100" cy="65" rx="25" ry="15" fill="#8a7a5a" opacity="0.4" stroke="#8a7a5a" stroke-width="1"/>
                </g>

                <!-- Taproom -->
                <g transform="translate(520, 320)">
                    <rect x="0" y="0" width="200" height="80" rx="6" fill="#3a2a1a" stroke="${b.has_taproom ? '#2ecc71' : '#8a8a7a'}" stroke-width="1.5"/>
                    <text x="100" y="25" text-anchor="middle" fill="${b.has_taproom ? '#2ecc71' : '#8a8a7a'}" font-size="11" font-weight="bold">🍺 Тапрум</text>
                    <text x="100" y="45" text-anchor="middle" fill="#8a8a7a" font-size="10">${b.has_taproom ? `✅ Открыт (ур. ${b.taproom_level})` : '🔴 Не построен'}</text>
                    ${b.has_taproom ? `
                        <text x="100" y="65" text-anchor="middle" fill="#2ecc71" font-size="10">${formatMoney(b.taproom_level * 30)}/день</text>
                    ` : ''}
                </g>

                <!-- Storage area -->
                <g transform="translate(40, 430)">
                    <rect x="0" y="0" width="720" height="35" rx="4" fill="#1a1a2e" opacity="0.7"/>
                    <text x="360" y="23" text-anchor="middle" fill="#8a8a7a" font-size="11">📦 Хранилище: ${b.storage_capacity} л • Аренда: ${formatMonthly(b.rent)} • Уровень: ${b.level}</text>
                </g>
            </svg>
        </div>

        <div class="grid-2" style="margin-top:16px">
            <div class="card">
                <h3>🏗 Улучшения</h3>
                <table>
                    <tr>
                        <td>Варочные котлы</td>
                        <td>${b.tank_count} шт.</td>
                        <td><button class="btn btn-sm btn-primary" onclick="doUpgrade('tanks')">+1 (${formatMoney(getUpgradeCost('tanks', b.tank_count))})</button></td>
                    </tr>
                    <tr>
                        <td>Ферментеры</td>
                        <td>${b.fermenter_count} шт.</td>
                        <td><button class="btn btn-sm btn-primary" onclick="doUpgrade('fermenters')">+2</button></td>
                    </tr>
                    <tr>
                        <td>Хранилище</td>
                        <td>${b.storage_capacity} л</td>
                        <td><button class="btn btn-sm btn-primary" onclick="doUpgrade('storage')">+1000л</button></td>
                    </tr>
                    <tr>
                        <td>Тапрум (доход)</td>
                        <td>${b.has_taproom ? `${formatMoney(b.taproom_level * 30)}/день` : 'Нет'}</td>
                        <td><button class="btn btn-sm btn-primary" onclick="doUpgrade('taproom')">${b.has_taproom ? 'Улучшить' : 'Построить'}</button></td>
                    </tr>
                    <tr>
                        <td>Маркетинг</td>
                        <td>Ур. ${b.marketing_level}</td>
                        <td><button class="btn btn-sm btn-primary" onclick="doUpgrade('marketing')">Улучшить</button></td>
                    </tr>
                    <tr>
                        <td><strong>Аренда</strong></td>
                        <td colspan="2"><strong>${formatMonthly(b.rent)}</strong></td>
                    </tr>
                </table>
            </div>

            <div class="card">
                <h3>🔧 Оборудование</h3>
                <h4 style="color:var(--green);font-size:0.85rem;margin-bottom:8px">Приобретено:</h4>
                ${ownedEquip.length === 0 ? '<div class="empty-state">Нет оборудования</div>' : ownedEquip.map(e =>
                    `<div style="padding:4px 0">✅ ${e.name} (бонус: +${Math.round(e.efficiency_bonus * 100)}%)</div>`
                ).join('')}

                <h4 style="color:var(--accent);font-size:0.85rem;margin:10px 0 8px">Доступно к покупке:</h4>
                ${availableEquip.length === 0 ? '<div class="empty-state">Всё куплено</div>' : availableEquip.map(e =>
                    `<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border)">
                        <span>${e.name}</span>
                        <span>${formatMoney(e.price)} <button class="btn btn-sm btn-success" onclick="doBuyEquipment(${e.id})">Купить</button></span>
                    </div>`
                ).join('')}
            </div>
        </div>
    `;
}

function getUpgradeCost(type, current) {
    const costs = {
        tanks: { 2: 3000, 3: 6000, 4: 10000 },
        fermenters: { 4: 2000, 6: 5000, 8: 9000 },
        storage: { 1000: 2000, 2000: 4000, 4000: 8000 },
    };
    const m = costs[type];
    if (!m) return '?';
    const next = type === 'tanks' ? current + 1 : type === 'storage' ? current : current;
    return m[next] || m[Object.keys(m).find(k => Number(k) > current)] || 'Max';
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
