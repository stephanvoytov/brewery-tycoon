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
        <h2>🏭 Пивоварня «${b.name}»</h2>

        <div class="brewery-svg-container">
            <svg viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-height:350px">
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
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="blur"/>
                        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                </defs>

                <rect x="10" y="10" width="780" height="380" rx="10" fill="url(#wall)" stroke="#3a4a6a" stroke-width="2"/>

                <text x="400" y="40" text-anchor="middle" fill="#e0dcd0" font-size="14" font-weight="bold">ЦЕХ ПИВОВАРНИ</text>

                ${svgTanks.map((t, i) => {
                    const x = 40 + i * 120;
                    const color = t.occupied ? '#e74c3c' : '#d4a017';
                    return `
                        <g>
                            <rect x="${x}" y="80" width="80" height="100" rx="5" fill="url(#kettle)" stroke="${color}" stroke-width="2"/>
                            <text x="${x + 40}" y="120" text-anchor="middle" fill="#fff" font-size="11">Котёл ${t.id}</text>
                            <text x="${x + 40}" y="145" text-anchor="middle" fill="${color}" font-size="10" font-weight="bold">${t.occupied ? '🔥 Варка' : '✅ Свободен'}</text>
                            ${t.occupied ? `<circle cx="${x + 30}" cy="90" r="4" fill="#f0c040" opacity="0.8"><animate attributeName="opacity" values="0.8;0.3;0.8" dur="1s" repeatCount="indefinite"/></circle><circle cx="${x + 50}" cy="95" r="3" fill="#f0c040" opacity="0.6"><animate attributeName="opacity" values="0.6;0.2;0.6" dur="1.5s" repeatCount="indefinite"/></circle>` : ''}
                        </g>
                    `;
                }).join('')}

                <text x="20" y="205" fill="#e0dcd0" font-size="11">Ферментеры:</text>

                ${svgFermenters.map((t, i) => {
                    const x = 40 + i * 70;
                    const color = t.occupied ? '#e74c3c' : '#3498db';
                    return `
                        <g>
                            <rect x="${x}" y="220" width="55" height="80" rx="25" fill="url(#ferm)" stroke="${color}" stroke-width="2"/>
                            <text x="${x + 27}" y="260" text-anchor="middle" fill="#fff" font-size="8">Ф${t.id}</text>
                            <text x="${x + 27}" y="278" text-anchor="middle" fill="${color}" font-size="7">${t.occupied ? '⏳' : '✅'}</text>
                            ${t.occupied ? `<circle cx="${x + 27}" cy="230" r="3" fill="#85c1e9" opacity="0.7"><animate attributeName="opacity" values="0.7;0.2;0.7" dur="2s" repeatCount="indefinite"/></circle>` : ''}
                        </g>
                    `;
                }).join('')}

                <text x="400" y="205" fill="#e0dcd0" font-size="11">Дозревание:</text>

                ${svgConditioning.map((t, i) => {
                    const x = 420 + i * 90;
                    const color = t.occupied ? '#e74c3c' : '#2ecc71';
                    return `
                        <g>
                            <rect x="${x}" y="220" width="70" height="80" rx="5" fill="url(#cond)" stroke="${color}" stroke-width="2"/>
                            <text x="${x + 35}" y="260" text-anchor="middle" fill="#fff" font-size="9">Танк ${t.id}</text>
                            <text x="${x + 35}" y="278" text-anchor="middle" fill="${color}" font-size="7">${t.occupied ? '⏳' : '✅'}</text>
                        </g>
                    `;
                }).join('')}

                <text x="400" y="320" text-anchor="middle" fill="${b.has_taproom ? '#2ecc71' : '#8a8a7a'}" font-size="12">
                    ${b.has_taproom ? '🍺 Тапрум открыт (ур.' + b.taproom_level + ')' : '🔴 Тапрум не построен'}
                </text>

                <rect x="650" y="75" width="120" height="80" rx="5" fill="#4a3a2a" stroke="#8a7a5a" stroke-width="1" stroke-dasharray="4,2"/>
                <text x="710" y="110" text-anchor="middle" fill="#d4a017" font-size="10">Линия розлива</text>
                <text x="710" y="135" text-anchor="middle" fill="#8a8a7a" font-size="9">${ownedEquip.some(e => e.type === 'bottling_line') ? '✅ Есть' : '🔴 Нет'}</text>
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
                        <span>$${e.price} <button class="btn btn-sm btn-success" onclick="doBuyEquipment(${e.id})">Купить</button></span>
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
