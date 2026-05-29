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
    const v = BUILDING_VISUALS[b.building_id] || BUILDING_VISUALS[2];
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
    const curBld = BUILDINGS[b.building_id] || BUILDINGS[0];
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
                    <linearGradient id="wall_${b.building_id}" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="${v.wall[0]}"/>
                        <stop offset="100%" stop-color="${v.wall[1]}"/>
                    </linearGradient>
                    <linearGradient id="kettle_${b.building_id}" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="${v.kettle[0]}"/>
                        <stop offset="100%" stop-color="${v.kettle[1]}"/>
                    </linearGradient>
                    <linearGradient id="ferm_${b.building_id}" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="${v.ferm[0]}"/>
                        <stop offset="100%" stop-color="${v.ferm[1]}"/>
                    </linearGradient>
                    <linearGradient id="cond_${b.building_id}" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="${v.cond[0]}"/>
                        <stop offset="100%" stop-color="${v.cond[1]}"/>
                    </linearGradient>
                    <linearGradient id="floor_${b.building_id}" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="${v.floor[0]}"/>
                        <stop offset="100%" stop-color="${v.floor[1]}"/>
                    </linearGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="blur"/>
                        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                </defs>

                <rect x="10" y="10" width="1780" height="580" rx="10" fill="url(#wall_${b.building_id})" stroke="${v.wallStroke}" stroke-width="2"/>
                <rect x="10" y="510" width="1780" height="80" rx="0" fill="url(#floor_${b.building_id})" opacity="0.6"/>
                <line x1="10" y1="510" x2="1790" y2="510" stroke="${v.floorLine}" stroke-width="1.5"/>

                <text x="900" y="38" text-anchor="middle" fill="${v.titleColor}" font-size="18" font-weight="bold">${v.title}</text>

                <rect x="20" y="50" width="630" height="26" rx="4" fill="${v.sectionBg}" opacity="0.7"/>
                <text x="335" y="68" text-anchor="middle" fill="${v.boilLabel}" font-size="14" font-weight="bold">⚡ ВАРОЧНЫЙ УЧАСТОК</text>

                <rect x="670" y="50" width="810" height="26" rx="4" fill="${v.sectionBg}" opacity="0.7"/>
                <text x="1075" y="68" text-anchor="middle" fill="${v.fermLabel}" font-size="14" font-weight="bold">🧪 БРОДИЛЬНЯ</text>

                <rect x="1500" y="50" width="280" height="26" rx="4" fill="${v.sectionBg}" opacity="0.7"/>
                <text x="1640" y="68" text-anchor="middle" fill="${v.condLabel}" font-size="14" font-weight="bold">🧊 ДОЗРЕВАНИЕ</text>

                ${svgTanks.map((t, i) => {
                    const x = 40 + i * 145;
                    const color = t.occupied ? v.occupiedColor : v.freeColor;
                    return `
                        <g>
                            <rect x="${x}" y="95" width="130" height="150" rx="8" fill="url(#kettle_${b.building_id})" stroke="${color}" stroke-width="2.5"/>
                            <rect x="${x + 12}" y="105" width="106" height="45" rx="5" fill="#1a0a00" opacity="0.4"/>
                            <rect x="${x + 12}" y="${225 - (t.occupied ? 35 : 0)}" width="106" height="${t.occupied ? 35 : 6}" rx="3" fill="${v.glowColor}" opacity="${t.occupied ? 0.85 : 0.2}"/>
                            <text x="${x + 65}" y="165" text-anchor="middle" fill="${v.kettleTitle}" font-size="14" font-weight="bold">Котёл ${t.id}</text>
                            <text x="${x + 65}" y="190" text-anchor="middle" fill="${color}" font-size="12" font-weight="bold">${t.occupied ? '🔥 Варка' : '✅ Свободен'}</text>
                            ${t.occupied ? `
                                <circle cx="${x + 30}" cy="120" r="6" fill="${v.glowColor}" opacity="0.85" filter="url(#glow)">
                                    <animate attributeName="opacity" values="0.85;0.2;0.85" dur="1s" repeatCount="indefinite"/>
                                </circle>
                                <circle cx="${x + 65}" cy="112" r="5" fill="${v.glowColor}" opacity="0.65">
                                    <animate attributeName="opacity" values="0.65;0.1;0.65" dur="1.5s" repeatCount="indefinite"/>
                                </circle>
                                <circle cx="${x + 100}" cy="125" r="4" fill="${v.glowColor}" opacity="0.55">
                                    <animate attributeName="opacity" values="0.55;0.1;0.55" dur="1.2s" repeatCount="indefinite"/>
                                </circle>
                            ` : ''}
                            <rect x="${x + 30}" y="245" width="70" height="10" rx="3" fill="${v.floorLine}"/>
                        </g>
                    `;
                }).join('')}

                <line x1="40" y1="85" x2="${40 + Math.min(svgTanks.length, 4) * 145 + 60}" y2="85" stroke="${v.floorLine}" stroke-width="2.5"/>

                ${svgFermenters.map((t, i) => {
                    const x = 690 + i * 82;
                    const color = t.occupied ? v.occupiedColor : v.fermLabel;
                    return `
                        <g>
                            <rect x="${x}" y="105" width="68" height="140" rx="34" fill="url(#ferm_${b.building_id})" stroke="${color}" stroke-width="2.5"/>
                            <rect x="${x + 10}" y="118" width="48" height="65" rx="24" fill="#0a1a2e" opacity="0.3"/>
                            <text x="${x + 34}" y="172" text-anchor="middle" fill="${v.fermTitle}" font-size="10">Ф${t.id}</text>
                            <text x="${x + 34}" y="192" text-anchor="middle" fill="${color}" font-size="11" font-weight="bold">${t.occupied ? '⏳' : '✅'}</text>
                            ${t.occupied ? `
                                <circle cx="${x + 22}" cy="135" r="4" fill="${v.fermBubble}" opacity="0.75">
                                    <animate attributeName="cy" values="135;122;135" dur="2s" repeatCount="indefinite"/>
                                </circle>
                                <circle cx="${x + 46}" cy="140" r="4" fill="${v.fermBubble}" opacity="0.55">
                                    <animate attributeName="cy" values="140;125;140" dur="2.8s" repeatCount="indefinite"/>
                                </circle>
                            ` : ''}
                            <rect x="${x + 17}" y="245" width="34" height="10" rx="3" fill="${v.floorLine}"/>
                        </g>
                    `;
                }).join('')}

                ${svgConditioning.map((t, i) => {
                    const x = 1520 + i * 135;
                    const color = t.occupied ? v.occupiedColor : v.condLabel;
                    return `
                        <g>
                            <rect x="${x}" y="95" width="110" height="150" rx="10" fill="url(#cond_${b.building_id})" stroke="${color}" stroke-width="2.5"/>
                            <ellipse cx="${x + 55}" cy="122" rx="42" ry="14" fill="#0a1a0a" opacity="0.35"/>
                            <text x="${x + 55}" y="172" text-anchor="middle" fill="${v.condTitle}" font-size="13" font-weight="bold">Танк ${t.id}</text>
                            <text x="${x + 55}" y="195" text-anchor="middle" fill="${color}" font-size="12" font-weight="bold">${t.occupied ? '⏳ Созревает' : '✅ Свободен'}</text>
                            <rect x="${x + 25}" y="245" width="60" height="10" rx="3" fill="${v.floorLine}"/>
                        </g>
                    `;
                }).join('')}

                ${v.isLoft ? `
                <g transform="translate(40, 290)">
                    <text x="0" y="10" fill="#d4a017" font-size="10" opacity="0.5">✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦</text>
                </g>` : ''}
                ${v.isLab ? `
                <g transform="translate(40, 290)">
                    <circle cx="30" cy="10" r="6" fill="none" stroke="#5a8aaa" stroke-width="1.5" opacity="0.4"/>
                    <circle cx="50" cy="10" r="4" fill="none" stroke="#5a8aaa" stroke-width="1" opacity="0.4"/>
                    <line x1="20" y1="14" x2="40" y2="14" stroke="#5a8aaa" stroke-width="1" opacity="0.3"/>
                </g>` : ''}
                ${v.isFactory ? `
                <g transform="translate(40, 290)">
                    <rect x="0" y="2" width="30" height="8" rx="2" fill="#6a7a8a" opacity="0.3"/>
                    <rect x="35" y="4" width="20" height="6" rx="2" fill="#6a7a8a" opacity="0.2"/>
                </g>` : ''}
                ${v.isHolding ? `
                <g transform="translate(40, 290)">
                    <rect x="0" y="2" width="12" height="10" rx="1" fill="#d4a017" opacity="0.3"/>
                    <rect x="16" y="2" width="12" height="10" rx="1" fill="#d4a017" opacity="0.2"/>
                    <rect x="32" y="2" width="12" height="10" rx="1" fill="#d4a017" opacity="0.15"/>
                </g>` : ''}

                <g transform="translate(40, 330)">
                    <rect x="0" y="0" width="500" height="90" rx="8" fill="${v.sectionBg}" stroke="${v.freeColor}" stroke-width="1.5" stroke-dasharray="5,3"/>
                    <text x="250" y="28" text-anchor="middle" fill="${v.boilLabel}" font-size="14" font-weight="bold">🍾 Линия розлива</text>
                    <text x="250" y="50" text-anchor="middle" fill="${v.bottomText}" font-size="12">${ownedEquip.some(e => e.type === 'bottling_line') ? '✅ Установлена' : '❌ Не куплена'}</text>
                    <circle cx="60" cy="72" r="7" fill="${v.fermBubble}" opacity="0.5"><animate attributeName="opacity" values="0.5;0.1;0.5" dur="0.8s" repeatCount="indefinite"/></circle>
                    <circle cx="120" cy="72" r="7" fill="${v.fermBubble}" opacity="0.4"><animate attributeName="opacity" values="0.4;0.1;0.4" dur="0.6s" repeatCount="indefinite"/></circle>
                    <circle cx="180" cy="72" r="7" fill="${v.fermBubble}" opacity="0.5"><animate attributeName="opacity" values="0.5;0.1;0.5" dur="0.7s" repeatCount="indefinite"/></circle>
                </g>

                <g transform="translate(580, 330)">
                    <rect x="0" y="0" width="540" height="90" rx="8" fill="${v.sectionBg}" stroke="${v.freeColor}" stroke-width="1.5" stroke-dasharray="5,3"/>
                    <text x="270" y="28" text-anchor="middle" fill="${v.boilLabel}" font-size="14" font-weight="bold">🛢 Линия кегов</text>
                    <text x="270" y="50" text-anchor="middle" fill="${v.bottomText}" font-size="12">${ownedEquip.some(e => e.type === 'kegging_line') ? '✅ Установлена' : '❌ Не куплена'}</text>
                    <ellipse cx="270" cy="68" rx="45" ry="22" fill="${v.floorLine}" opacity="0.4" stroke="${v.freeColor}" stroke-width="1.5"/>
                </g>

                <g transform="translate(1160, 330)">
                    <rect x="0" y="0" width="580" height="90" rx="8" fill="${v.sectionBg}" stroke="${b.has_taproom ? v.condLabel : v.bottomText}" stroke-width="1.5"/>
                    <text x="290" y="28" text-anchor="middle" fill="${b.has_taproom ? v.condLabel : v.bottomText}" font-size="14" font-weight="bold">🍺 Тапрум</text>
                    <text x="290" y="50" text-anchor="middle" fill="${v.bottomText}" font-size="12">${b.has_taproom ? `✅ Открыт (ур. ${b.taproom_level})` : '🔴 Не построен'}</text>
                    ${b.has_taproom ? `<text x="290" y="72" text-anchor="middle" fill="${v.condLabel}" font-size="13">${formatMoney(b.taproom_level * 30)}/день</text>` : ''}
                </g>

                <g transform="translate(40, 445)">
                    <rect x="0" y="0" width="1720" height="42" rx="6" fill="${v.bottomBar}" opacity="0.8"/>
                    <text x="860" y="26" text-anchor="middle" fill="${v.bottomText}" font-size="14">📦 Хранилище: ${b.storage_capacity} л • Аренда: ${formatMonthly(b.rent)} • Уровень: ${b.level} • Котлы: ${b.tank_count}×${b.tank_volume}л (макс. партия ${b.tank_count * b.tank_volume}л)</text>
                </g>
            </svg>
        </div>

        <div class="grid-2" style="margin-top:16px">
            <div class="card">
                <h3>🏗 Улучшения <span class="help-link" onclick="scrollToHelp('help-guide-taproom'); return false;" title="Подробнее о тапруме и маркетинге">❓</span></h3>
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
                        <div class="mobile-card-row"><span class="label"><strong>Аренда</strong></span><span class="value"><strong>${formatMonthly(b.rent)}</strong></span></div>
                    </div>
                </div>
            </div>

            <div class="card">
                <h3>🔧 Оборудование <span class="help-link" onclick="scrollToHelp('help-guide-equipment'); return false;" title="Подробнее об оборудовании">❓</span> <span style="font-size:0.75rem;color:var(--text-dim);font-weight:400">(уникальные бонусы)</span></h3>
                <h4 style="color:var(--green);font-size:0.85rem;margin-bottom:8px">Приобретено:</h4>
                ${ownedEquip.length === 0 ? '<div class="empty-state">Нет оборудования</div>' : ownedEquip.map(e => {
                    const wearColor = e.wear_tear > 80 ? 'var(--green)' : e.wear_tear > 40 ? 'var(--accent)' : 'var(--red)';
                    const broken = e.wear_tear < 20;
                    const repairCost = Math.round(e.price * 0.3);
                    return `<div class="equip-row" style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid var(--border)">
                        <span>${broken ? '❌' : '✅'} ${e.name} <span style="color:${wearColor};font-size:0.75rem">(износ: ${Math.round(e.wear_tear)}%)</span></span>
                        <span>${broken ? `<button class="btn btn-sm btn-danger" onclick="doRepairEquipment(${e.id})">Ремонт $${repairCost}</button>` : `<span style="color:var(--text-dim);font-size:0.75rem">${EQUIP_DESC[e.name] || ''}</span>`}</span>
                    </div>`;
                }).join('')}

                <h4 style="color:var(--accent);font-size:0.85rem;margin:10px 0 8px">Доступно к покупке:</h4>
                ${availableEquip.length === 0 ? '<div class="empty-state">Всё куплено</div>' : availableEquip.map(e =>
                    `<div class="equip-row" style="display:flex;flex-direction:column;padding:4px 0;border-bottom:1px solid var(--border)">
                        <div style="display:flex;justify-content:space-between;align-items:center;width:100%">
                            <span><strong>${e.name}</strong></span>
                            <span>${formatMoney(e.price)} <button class="btn btn-sm btn-success" onclick="doBuyEquipment(${e.id})">Купить</button></span>
                        </div>
                        <div style="font-size:0.75rem;color:var(--text-dim);margin-top:2px">${EQUIP_DESC[e.name] || ''}</div>
                    </div>`
                ).join('')}

            </div>
        </div>

        <div class="card">
            <h3>🏭 Прогрессия пивоварни <span class="help-link" onclick="scrollToHelp('help-guide-level'); return false;" title="Подробнее об уровне пивоварни">❓</span></h3>
            ${(() => {
                const totalRevenue = GAME_STATE.game.total_revenue || 0;
                const nextLevelRevenue = (Math.floor(totalRevenue / 20000) + 1) * 20000;
                const levelProgress = Math.min(100, (totalRevenue % 20000) / 20000 * 100);
                return `
                    <p>Уровень: <strong>${b.level}</strong></p>
                    <div class="chart-bar" style="margin:4px 0">
                        <div class="chart-bar-fill" style="width:${levelProgress}%"></div>
                    </div>
                    <p style="font-size:0.85rem;color:var(--text-dim)">Следующий уровень: ${formatMoney(nextLevelRevenue)} выручки</p>
                    <p style="font-size:0.8rem;color:var(--text-dim)">
                        🏅 +5% к цене продажи · +1 слот контракта
                    </p>
                `;
            })()}
        </div>
    `;
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
            <h3>🏢 Сменить здание <span class="help-link" onclick="scrollToHelp('help-guide-buildings'); return false;" title="Подробнее о зданиях">❓</span></h3>
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
