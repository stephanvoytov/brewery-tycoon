const BUILDING_BG = (() => {
    const urls = {
        0: "https://image.pollinations.ai/prompt/Empty%20room%20interior%2C%20beige%20walls%2C%20wooden%20floor%2C%20warm%20cozy%20lighting%2C%20game%20background%2C%20flat%20style%2C%20no%20people?model=flux&seed=88&width=1400&height=700&nologo=true&private=true&safe=false",
        1: "https://image.pollinations.ai/prompt/Stone%20basement%20interior%2C%20brick%20walls%2C%20dim%20warm%20light%2C%20game%20background%2C%20flat%20vector%20style%2C%20no%20people?model=flux&seed=111&width=1400&height=700&nologo=true&private=true&safe=false",
        2: "https://image.pollinations.ai/prompt/Small%20brewery%20workshop%20interior%2C%20white%20tile%20walls%2C%20concrete%20floor%2C%20clean%20industrial%2C%20game%20background%2C%20flat%20style%2C%20no%20people?model=flux&seed=222&width=1400&height=700&nologo=true&private=true&safe=false",
        3: "https://image.pollinations.ai/prompt/Large%20industrial%20hall%20interior%2C%20steel%20beams%2C%20concrete%20floor%2C%20cool%20lighting%2C%20game%20background%2C%20flat%20style%2C%20no%20people?model=flux&seed=333&width=1400&height=700&nologo=true&private=true&safe=false",
        4: "https://image.pollinations.ai/prompt/Craft%20brewery%20loft%20interior%2C%20exposed%20brick%20walls%2C%20warm%20wood%20ceiling%2C%20trendy%20decor%2C%20game%20background%2C%20flat%20style%2C%20no%20people?model=flux&seed=444&width=1400&height=700&nologo=true&private=true&safe=false",
        5: "https://image.pollinations.ai/prompt/Large%20brewery%20factory%20interior%2C%20stainless%20steel%20tanks%20in%20background%2C%20bright%20clean%2C%20game%20background%2C%20flat%20style%2C%20no%20people?model=flux&seed=555&width=1400&height=700&nologo=true&private=true&safe=false",
        6: "https://image.pollinations.ai/prompt/Modern%20laboratory%20interior%2C%20white%20clean%20surfaces%2C%20blue%20accents%2C%20sleek%20scientific%2C%20game%20background%2C%20flat%20style%2C%20no%20people?model=flux&seed=666&width=1400&height=700&nologo=true&private=true&safe=false",
        7: "https://image.pollinations.ai/prompt/Corporate%20modern%20office%20interior%2C%20sleek%20dark%20wood%2C%20glass%20walls%2C%20premium%20atmosphere%2C%20game%20background%2C%20flat%20style%2C%20no%20people?model=flux&seed=777&width=1400&height=700&nologo=true&private=true&safe=false",
    };
    return Object.fromEntries(Object.keys(urls).map(id => [
        parseInt(id),
        `/img/buildings/${id}.png`
    ]));
})();

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

    const shopKettles = (GAME_STATE.shop && GAME_STATE.shop.owned_kettles) || [];
    const shopFerms = (GAME_STATE.shop && GAME_STATE.shop.owned_fermenters) || [];
    const shopConds = (GAME_STATE.shop && GAME_STATE.shop.owned_cond_tanks) || [];

    function scaleByVol(vol, baseW) {
        if (vol <= 50) return baseW;
        if (vol <= 100) return baseW * 1.2;
        if (vol <= 200) return baseW * 1.5;
        if (vol <= 500) return baseW * 2.0;
        return baseW * 2.5;
    }

    const svgTanks = [];
    const svgFermenters = [];
    const svgConditioning = [];

    const batches = GAME_STATE.batches || [];
    const activeBatches = batches.filter(b => !['sold', 'spoiled'].includes(b.stage));

    for (let i = 0; i < shopKettles.length; i++) {
        const occupied = i < activeBatches.filter(b => ['mash', 'boil'].includes(b.stage)).length;
        const vol = shopKettles[i].volume || 50;
        svgTanks.push({ id: i + 1, occupied, vol });
    }
    for (let i = 0; i < shopFerms.length; i++) {
        const occupied = i < activeBatches.filter(b => b.stage === 'ferment').length;
        const vol = shopFerms[i].volume || 50;
        svgFermenters.push({ id: i + 1, occupied, vol });
    }
    for (let i = 0; i < shopConds.length; i++) {
        const occupied = i < activeBatches.filter(b => b.stage === 'condition' || b.stage === 'packaged').length;
        const vol = shopConds[i].volume || 50;
        svgConditioning.push({ id: i + 1, occupied, vol });
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
            ${curBld.quality_bonus ? `&nbsp;·&nbsp; ⭐${curBld.quality_bonus > 0 ? '+' : ''}${curBld.quality_bonus * 100}%` : ''}
            ${curBld.cost_reduction ? `&nbsp;·&nbsp; 🏷−${curBld.cost_reduction * 100}%` : ''}
            ${curBld.extra_contract_slot ? `&nbsp;·&nbsp; 📋+${curBld.extra_contract_slot} слот` : ''}
            <button class="btn btn-small" onclick="showBuildingModal()" style="margin-left:12px;">🏢 Сменить здание</button>
        </div>

        <div class="brewery-svg-container">
            <svg viewBox="0 0 1800 900" xmlns="http://www.w3.org/2000/svg" style="width:100%">
                <defs>
                    <clipPath id="bgClip">
                        <rect x="10" y="10" width="1780" height="880" rx="10"/>
                    </clipPath>
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
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="blur"/>
                        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                </defs>

                ${(() => {
                    const bg = BUILDING_BG[b.building_id] || BUILDING_BG[2];
                    const isLight = b.building_id === 6;
                    return `<image href="${bg}" x="10" y="10" width="1780" height="880" preserveAspectRatio="xMidYMid slice" clip-path="url(#bgClip)"/>
                    <rect x="10" y="10" width="1780" height="880" rx="10" fill="${isLight ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.35)'}"/>
                    <rect x="10" y="10" width="1780" height="880" rx="10" fill="none" stroke="var(--border)" stroke-width="1.5"/>`;
                })()}

                <text x="900" y="38" text-anchor="middle" fill="${v.titleColor}" font-size="18" font-weight="bold">${v.title}</text>
                <g transform="translate(0, 300)">

                ${(() => {
                    const showCond = curBld.cond_tanks > 0;
                    const BASE_KETTLE_W = 130, BASE_FERM_W = 68, BASE_COND_W = 110;
                    const KETTLE_GAP = 15, FERM_GAP = 14, COND_GAP = 25;
                    const BASE_H = 150;

                    const kettleWidths = svgTanks.map(t => scaleByVol(t.vol, BASE_KETTLE_W));
                    const fermWidths = svgFermenters.map(t => scaleByVol(t.vol, BASE_FERM_W));
                    const condWidths = svgConditioning.map(t => scaleByVol(t.vol, BASE_COND_W));

                    const tankW = kettleWidths.reduce((a, b) => a + b, 0) + Math.max(0, svgTanks.length - 1) * KETTLE_GAP;
                    const fermW = fermWidths.reduce((a, b) => a + b, 0) + Math.max(0, svgFermenters.length - 1) * FERM_GAP;
                    const condW = showCond ? condWidths.reduce((a, b) => a + b, 0) + Math.max(0, svgConditioning.length - 1) * COND_GAP : 0;
                    const gap = 70;
                    const sections = showCond ? 3 : 2;
                    const contentW = tankW + fermW + condW + (sections - 1) * gap;
                    const startX = Math.max(20, (1800 - contentW) / 2);
                    const tankX = startX;
                    const fermX = tankX + tankW + gap;
                    const condX = showCond ? fermX + fermW + gap : 0;

                    let headerTankW = tankW + 40;
                    let headerFermW = fermW + 40;
                    let headerCondW = showCond ? condW + 40 : 0;
                    let headerTotal = headerTankW + headerFermW + headerCondW + (sections - 1) * 20;
                    let headerStart = Math.max(20, (1800 - headerTotal) / 2);

                    let html = '';

                    // Headers
                    html += `<rect x="${headerStart}" y="50" width="${headerTankW}" height="26" rx="4" fill="${v.sectionBg}" opacity="0.7"/>`;
                    html += `<text x="${headerStart + headerTankW / 2}" y="68" text-anchor="middle" fill="${v.boilLabel}" font-size="14" font-weight="bold">⚡ ВАРОЧНЫЙ УЧАСТОК</text>`;

                    html += `<rect x="${headerStart + headerTankW + 20}" y="50" width="${headerFermW}" height="26" rx="4" fill="${v.sectionBg}" opacity="0.7"/>`;
                    html += `<text x="${headerStart + headerTankW + 20 + headerFermW / 2}" y="68" text-anchor="middle" fill="${v.fermLabel}" font-size="14" font-weight="bold">🧪 БРОДИЛЬНЯ</text>`;

                    if (showCond) {
                        html += `<rect x="${headerStart + headerTankW + 20 + headerFermW + 20}" y="50" width="${headerCondW}" height="26" rx="4" fill="${v.sectionBg}" opacity="0.7"/>`;
                        html += `<text x="${headerStart + headerTankW + 20 + headerFermW + 20 + headerCondW / 2}" y="68" text-anchor="middle" fill="${v.condLabel}" font-size="14" font-weight="bold">🧊 ДОЗРЕВАНИЕ</text>`;
                    }

                    // Kettles
                    let kAccX = tankX;
                    svgTanks.forEach((t, i) => {
                        const w = kettleWidths[i];
                        const x = kAccX;
                        const color = t.occupied ? v.occupiedColor : v.freeColor;
                        html += `<g>
                            <rect x="${x}" y="95" width="${w}" height="150" rx="8" fill="url(#kettle_${b.building_id})" stroke="${color}" stroke-width="2.5"/>
                            <rect x="${x + 12}" y="105" width="${w - 24}" height="45" rx="5" fill="#1a0a00" opacity="0.4"/>
                            <rect x="${x + 12}" y="${225 - (t.occupied ? 35 : 0)}" width="${w - 24}" height="${t.occupied ? 35 : 6}" rx="3" fill="${v.glowColor}" opacity="${t.occupied ? 0.85 : 0.2}"/>
                            <text x="${x + w / 2}" y="165" text-anchor="middle" fill="${v.kettleTitle}" font-size="14" font-weight="bold">${t.vol}л</text>
                            <text x="${x + w / 2}" y="190" text-anchor="middle" fill="${color}" font-size="12" font-weight="bold">${t.occupied ? '🔥 Варка' : '✅ Свободен'}</text>
                            ${t.occupied ? `
                                <circle cx="${x + 30}" cy="120" r="6" fill="${v.glowColor}" opacity="0.85" filter="url(#glow)">
                                    <animate attributeName="opacity" values="0.85;0.2;0.85" dur="1s" repeatCount="indefinite"/>
                                </circle>
                                <circle cx="${x + w * 0.5}" cy="112" r="5" fill="${v.glowColor}" opacity="0.65">
                                    <animate attributeName="opacity" values="0.65;0.1;0.65" dur="1.5s" repeatCount="indefinite"/>
                                </circle>
                                <circle cx="${x + w - 30}" cy="125" r="4" fill="${v.glowColor}" opacity="0.55">
                                    <animate attributeName="opacity" values="0.55;0.1;0.55" dur="1.2s" repeatCount="indefinite"/>
                                </circle>
                            ` : ''}
                            <rect x="${x + w * 0.25}" y="245" width="${w * 0.5}" height="10" rx="3" fill="${v.floorLine}"/>
                        </g>`;
                        kAccX += w + KETTLE_GAP;
                    });

                    // Baseline under kettles
                    html += `<line x1="${tankX}" y1="255" x2="${tankX + tankW}" y2="255" stroke="${v.floorLine}" stroke-width="2.5"/>`;

                    // Fermenters
                    let fAccX = fermX;
                    svgFermenters.forEach((t, i) => {
                        const w = fermWidths[i];
                        const x = fAccX;
                        const color = t.occupied ? v.occupiedColor : v.fermLabel;
                        html += `<g>
                            <rect x="${x}" y="105" width="${w}" height="140" rx="${w * 0.5}" fill="url(#ferm_${b.building_id})" stroke="${color}" stroke-width="2.5"/>
                            <rect x="${x + w * 0.15}" y="118" width="${w * 0.7}" height="65" rx="24" fill="#0a1a2e" opacity="0.3"/>
                            <text x="${x + w / 2}" y="172" text-anchor="middle" fill="${v.fermTitle}" font-size="10">${t.vol}л</text>
                            <text x="${x + w / 2}" y="192" text-anchor="middle" fill="${color}" font-size="11" font-weight="bold">${t.occupied ? '⏳' : '✅'}</text>
                            ${t.occupied ? `
                                <circle cx="${x + w * 0.32}" cy="135" r="4" fill="${v.fermBubble}" opacity="0.75">
                                    <animate attributeName="cy" values="135;122;135" dur="2s" repeatCount="indefinite"/>
                                </circle>
                                <circle cx="${x + w * 0.68}" cy="140" r="4" fill="${v.fermBubble}" opacity="0.55">
                                    <animate attributeName="cy" values="140;125;140" dur="2.8s" repeatCount="indefinite"/>
                                </circle>
                            ` : ''}
                            <rect x="${x + w * 0.25}" y="245" width="${w * 0.5}" height="10" rx="3" fill="${v.floorLine}"/>
                        </g>`;
                        fAccX += w + FERM_GAP;
                    });

                    // Conditioning tanks
                    if (showCond) {
                        let cAccX = condX;
                        svgConditioning.forEach((t, i) => {
                            const w = condWidths[i];
                            const x = cAccX;
                            const color = t.occupied ? v.occupiedColor : v.condLabel;
                            html += `<g>
                                <rect x="${x}" y="95" width="${w}" height="150" rx="10" fill="url(#cond_${b.building_id})" stroke="${color}" stroke-width="2.5"/>
                                <ellipse cx="${x + w / 2}" cy="122" rx="${w * 0.38}" ry="14" fill="#0a1a0a" opacity="0.35"/>
                                <text x="${x + w / 2}" y="172" text-anchor="middle" fill="${v.condTitle}" font-size="13" font-weight="bold">${t.vol}л</text>
                                <text x="${x + w / 2}" y="195" text-anchor="middle" fill="${color}" font-size="12" font-weight="bold">${t.occupied ? '⏳ Созревает' : '✅ Свободен'}</text>
                                <rect x="${x + w * 0.23}" y="245" width="${w * 0.54}" height="10" rx="3" fill="${v.floorLine}"/>
                            </g>`;
                            cAccX += w + COND_GAP;
                        });
                    }

                    return html;
                })()}

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

                ${(() => {
                    const isRoom = curBld.id === 0;
                    const showSpecial = !isRoom;
                    let html = '';
                    if (showSpecial) {
                        html += `
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
                </g>`;
                    }
                    return html;
                })()}
                </g>

            </svg>
        </div>

        <div class="grid-2" style="margin-top:16px">
            <div class="card">
                <h3>🏗 Улучшения <span class="help-link" onclick="scrollToHelp('help-guide-taproom'); return false;" title="Подробнее о тапруме и маркетинге">❓</span></h3>
                <table>
                    <tr>
                        <td>Хранилище</td>
                        <td>${b.storage_capacity} л</td>
                        <td><button class="btn btn-sm btn-primary" onclick="doUpgrade('storage')" ${!getUpgradeCost('storage', b.storage_capacity) ? 'disabled' : ''}>${getUpgradeCost('storage', b.storage_capacity) ? `+1000л (${formatMoney(getUpgradeCost('storage', b.storage_capacity))})` : '🔒 MAX'}</button></td>
                    </tr>
                    <tr>
                        <td>Тапрум (доход)</td>
                        <td>${b.has_taproom ? `${formatMoney(b.taproom_level * 30)}/день` : 'Нет'}</td>
                        <td><button class="btn btn-sm btn-primary" onclick="doUpgrade('taproom')" ${!getUpgradeCost('taproom', b.taproom_level) ? 'disabled' : ''}>${getUpgradeCost('taproom', b.taproom_level) ? `${b.has_taproom ? 'Улучшить' : 'Построить'} (${formatMoney(getUpgradeCost('taproom', b.taproom_level))})` : '🔒 MAX'}</button></td>
                    </tr>
                    <tr>
                        <td><strong>Аренда</strong></td>
                        <td colspan="2"><strong>${formatMonthly(b.rent)}</strong></td>
                    </tr>
                </table>
                <div class="mobile-card-list">
                    <div class="mobile-card">
                        <div class="mobile-card-row"><span class="label">Хранилище:</span><span class="value">${b.storage_capacity} л</span></div>
                        <div class="mobile-card-actions"><button class="btn btn-sm btn-primary" onclick="doUpgrade('storage')" ${!getUpgradeCost('storage', b.storage_capacity) ? 'disabled' : ''}>${getUpgradeCost('storage', b.storage_capacity) ? `+1000л (${formatMoney(getUpgradeCost('storage', b.storage_capacity))})` : '🔒 MAX'}</button></div>
                    </div>
                    <div class="mobile-card">
                        <div class="mobile-card-row"><span class="label">Тапрум:</span><span class="value">${b.has_taproom ? `${formatMoney(b.taproom_level * 30)}/день` : 'Нет'}</span></div>
                        <div class="mobile-card-actions"><button class="btn btn-sm btn-primary" onclick="doUpgrade('taproom')" ${!getUpgradeCost('taproom', b.taproom_level) ? 'disabled' : ''}>${getUpgradeCost('taproom', b.taproom_level) ? `${b.has_taproom ? 'Улучшить' : 'Построить'} (${formatMoney(getUpgradeCost('taproom', b.taproom_level))})` : '🔒 MAX'}</button></div>
                    </div>
                    <div class="mobile-card">
                        <div class="mobile-card-row"><span class="label"><strong>Аренда</strong></span><span class="value"><strong>${formatMonthly(b.rent)}</strong></span></div>
                    </div>
                </div>
            </div>

            <div class="card">
                <h3>🔧 Оборудование пивоварни</h3>
                ${(() => {
                    const shop = GAME_STATE.shop || {};
                    const kettles = shop.owned_kettles || b.kettles || [];
                    const ferms = shop.owned_fermenters || b.fermenters || [];
                    const conds = shop.owned_cond_tanks || b.cond_tanks || [];
                    const bld = BUILDINGS[curBld.id] || BUILDINGS[0];
                    const maxTanks = bld.max_tanks || 1;
                    const maxFerms = bld.max_fermenters || 1;
                    const maxConds = bld.max_cond_tanks || 0;
                    const showCond = curBld.cond_tanks > 0;
                    let html = '';

                    // Kettles
                    html += `<h4 style="color:var(--boilLabel, #d4a017);font-size:0.85rem;margin-bottom:4px">⚡ Котлы (${kettles.length}/${maxTanks})</h4>`;
                    if (kettles.length === 0) {
                        html += '<div class="empty-state">Нет котлов</div>';
                    } else {
                        kettles.forEach(k => {
                            const kt = KETTLE_TYPES[k.type_id] || {name: 'Котёл', volume: 50, price: 0};
                            html += `<div class="equip-row" style="display:flex;justify-content:space-between;align-items:center;padding:3px 0;border-bottom:1px solid var(--border)">
                                <span>${kt.name} <span style="color:var(--text-dim);font-size:0.75rem">(${kt.volume}л)</span></span>
                                <button class="btn btn-sm btn-danger" onclick="doSellKettle(${k.id})" style="font-size:0.75rem">Продать</button>
                            </div>`;
                        });
                    }
                    html += kettles.length < maxTanks ? `<button class="btn btn-sm btn-primary" onclick="showEquipmentShop('kettle')" style="margin-top:4px;font-size:0.8rem">+ Купить котёл</button>` : `<span style="color:var(--red);font-size:0.75rem">Макс. ${maxTanks} котёл(ов)</span>`;

                    // Fermenters
                    html += `<h4 style="color:var(--fermLabel, #3498db);font-size:0.85rem;margin:8px 0 4px">🧪 Ферментеры (${ferms.length}/${maxFerms})</h4>`;
                    if (ferms.length === 0) {
                        html += '<div class="empty-state">Нет ферментеров</div>';
                    } else {
                        ferms.forEach(f => {
                            const ft = FERMENTER_TYPES[f.type_id] || {name: 'Ферментер', volume: 50, price: 0};
                            html += `<div class="equip-row" style="display:flex;justify-content:space-between;align-items:center;padding:3px 0;border-bottom:1px solid var(--border)">
                                <span>${ft.name} <span style="color:var(--text-dim);font-size:0.75rem">(${ft.volume}л)</span></span>
                                <button class="btn btn-sm btn-danger" onclick="doSellFermenter(${f.id})" style="font-size:0.75rem">Продать</button>
                            </div>`;
                        });
                    }
                    html += ferms.length < maxFerms ? `<button class="btn btn-sm btn-primary" onclick="showEquipmentShop('fermenter')" style="margin-top:4px;font-size:0.8rem">+ Купить ферментер</button>` : `<span style="color:var(--red);font-size:0.75rem">Макс. ${maxFerms} ферментер(ов)</span>`;

                    // Cond tanks
                    if (showCond) {
                        html += `<h4 style="color:var(--condLabel, #2ecc71);font-size:0.85rem;margin:8px 0 4px">🧊 Танки дозревания (${conds.length}/${maxConds})</h4>`;
                        if (conds.length === 0) {
                            html += '<div class="empty-state">Нет танков</div>';
                        } else {
                            conds.forEach(c => {
                                const ct = COND_TANK_TYPES[c.type_id] || {name: 'Танк', volume: 50, price: 0};
                                html += `<div class="equip-row" style="display:flex;justify-content:space-between;align-items:center;padding:3px 0;border-bottom:1px solid var(--border)">
                                    <span>${ct.name} <span style="color:var(--text-dim);font-size:0.75rem">(${ct.volume}л)</span></span>
                                    <button class="btn btn-sm btn-danger" onclick="doSellCondTank(${c.id})" style="font-size:0.75rem">Продать</button>
                                </div>`;
                            });
                        }
                        html += conds.length < maxConds ? `<button class="btn btn-sm btn-primary" onclick="showEquipmentShop('cond_tank')" style="margin-top:4px;font-size:0.8rem">+ Купить танк</button>` : `<span style="color:var(--red);font-size:0.75rem">Макс. ${maxConds} танк(ов)</span>`;
                    }

                    return html;
                })()}

                <hr style="margin:12px 0;border-color:var(--border)">
                <h3 style="font-size:0.95rem">🔧 Бонусное оборудование</h3>
                <h4 style="color:var(--green);font-size:0.8rem;margin-bottom:6px">✅ Приобретено:</h4>
                ${ownedEquip.length === 0 ? '<div class="empty-state">Нет оборудования</div>' : ownedEquip.map(e => {
                    const wearColor = e.wear_tear > 80 ? 'var(--green)' : e.wear_tear > 40 ? 'var(--accent)' : 'var(--red)';
                    const broken = e.wear_tear < 20;
                    const repairCost = Math.round(e.price * 0.3);
                    return `<div class="equip-row" style="display:flex;justify-content:space-between;align-items:center;padding:3px 0;border-bottom:1px solid var(--border)">
                        <span>${broken ? '❌' : '✅'} ${e.name} <span style="color:${wearColor};font-size:0.75rem">(износ: ${Math.round(e.wear_tear)}%)</span></span>
                        <span>${broken ? `<button class="btn btn-sm btn-danger" onclick="doRepairEquipment(${e.id})">Ремонт $${repairCost}</button>` : `<span style="color:var(--text-dim);font-size:0.75rem">${EQUIP_DESC[e.name] || ''}</span>`}</span>
                    </div>`;
                }).join('')}

                ${(() => {
                    const unlocked = availableEquip.filter(e => {
                        const locked = e.locked !== undefined ? e.locked : (b.level < (e.min_level || 1));
                        return !locked;
                    });
                    const locked = availableEquip.filter(e => {
                        const isLocked = e.locked !== undefined ? e.locked : (b.level < (e.min_level || 1));
                        return isLocked;
                    });
                    let html = '';
                    if (unlocked.length > 0) {
                        html += `<h4 style="color:var(--accent);font-size:0.8rem;margin:8px 0 4px">📦 Доступно к покупке:</h4>`;
                        html += unlocked.map(e => {
                            return `<div class="equip-row" style="display:flex;flex-direction:column;padding:3px 0;border-bottom:1px solid var(--border)">
                                <div style="display:flex;justify-content:space-between;align-items:center;width:100%">
                                    <span>📦 <strong>${e.name}</strong></span>
                                    <span>${formatMoney(e.price)} <button class="btn btn-sm btn-success" onclick="doBuyEquipment(${e.id})">Купить</button></span>
                                </div>
                                <div style="font-size:0.75rem;color:var(--text-dim);margin-top:2px">${EQUIP_DESC[e.name] || ''}</div>
                            </div>`;
                        }).join('');
                    }
                    if (locked.length > 0) {
                        html += `<h4 style="color:var(--red);font-size:0.8rem;margin:8px 0 4px">🔒 Заблокировано:</h4>`;
                        html += locked.map(e => {
                            const reason = e.locked && b.level < (e.min_level || 1) ? `ур. ${e.min_level}` : 'текущее здание';
                            return `<div class="equip-row" style="display:flex;flex-direction:column;padding:3px 0;border-bottom:1px solid var(--border)">
                                <div style="display:flex;justify-content:space-between;align-items:center;width:100%">
                                    <span>🔒 <strong>${e.name}</strong> <span style="color:var(--red);font-size:0.75rem">(${reason})</span></span>
                                    <span>${formatMoney(e.price)}</span>
                                </div>
                                <div style="font-size:0.75rem;color:var(--text-dim);margin-top:2px">${EQUIP_DESC[e.name] || ''}</div>
                            </div>`;
                        }).join('');
                    }
                    if (unlocked.length === 0 && locked.length === 0) {
                        html += '<div class="empty-state">Всё куплено</div>';
                    }
                    return html;
                })()}

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
                    const kettleCount = (GAME_STATE.shop?.owned_kettles || b.kettles || []).length;
                    const fermCount = (GAME_STATE.shop?.owned_fermenters || b.fermenters || []).length;
                    const condCount = (GAME_STATE.shop?.owned_cond_tanks || b.cond_tanks || []).length;
                    const moveCost = isCurrent || isLocked ? 0 : (
                        bld.rent * 15
                        + kettleCount * 500
                        + fermCount * 300
                        + condCount * 300
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
                                <span>⭐ ${bld.quality_bonus > 0 ? '+' : ''}${bld.quality_bonus * 100}%</span>
                                ${bld.cost_reduction ? `<span>🏷 −${bld.cost_reduction * 100}%</span>` : ''}
                                ${bld.extra_contract_slot ? `<span>📋 +${bld.extra_contract_slot} слот</span>` : ''}
                                ${bld.demand_bonus ? `<span>📈 +${bld.demand_bonus * 100}%</span>` : ''}
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

async function doSellKettle(kettleId) {
    if (!await showConfirm('Продажа котла', 'Продать этот котёл за 60% от цены?')) return;
    try {
        const res = await API.sellKettle(kettleId);
        showSuccess(res.message);
        await loadGameState();
        renderBrewery();
    } catch (e) {
        showError(e.message);
    }
}

async function doSellFermenter(fermenterId) {
    if (!await showConfirm('Продажа ферментера', 'Продать этот ферментер за 60% от цены?')) return;
    try {
        const res = await API.sellFermenter(fermenterId);
        showSuccess(res.message);
        await loadGameState();
        renderBrewery();
    } catch (e) {
        showError(e.message);
    }
}

async function doSellCondTank(tankId) {
    if (!await showConfirm('Продажа танка', 'Продать этот танк дозревания за 60% от цены?')) return;
    try {
        const res = await API.sellCondTank(tankId);
        showSuccess(res.message);
        await loadGameState();
        renderBrewery();
    } catch (e) {
        showError(e.message);
    }
}

async function buyShopItem(category, typeId) {
    try {
        let res;
        if (category === 'kettle') res = await API.buyKettle(typeId);
        else if (category === 'fermenter') res = await API.buyFermenter(typeId);
        else if (category === 'cond_tank') res = await API.buyCondTank(typeId);
        showSuccess(res.message);
        document.querySelectorAll('.dialog-overlay').forEach(el => { el.classList.add('anim-sell'); setTimeout(() => el.remove(), 400); });
        await loadGameState();
        renderBrewery();
    } catch (e) {
        showError(e.message);
    }
}

function showEquipmentShop(category) {
    const shop = GAME_STATE.shop || {};
    const b = GAME_STATE.brewery;
    if (!b) return;

    let items = [];
    let title = '';

    if (category === 'kettle') {
        items = shop.kettles || [];
        title = '⚡ Купить котёл';
    } else if (category === 'fermenter') {
        items = shop.fermenters || [];
        title = '🧪 Купить ферментер';
    } else if (category === 'cond_tank') {
        items = shop.cond_tanks || [];
        title = '🧊 Купить танк дозревания';
    }

    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';
    overlay.style.zIndex = '20001';
    overlay.innerHTML = `
        <div class="dialog-box" style="max-width:500px;max-height:80vh;overflow-y:auto">
            <h3>${title}</h3>
            <p style="font-size:0.85rem;color:var(--text-dim);margin-bottom:12px">Ваш уровень: ${b.level}</p>
            <div class="building-list">
                ${items.length === 0 ? '<div class="empty-state">Нет доступных позиций</div>' : items.map(item => `
                    <div class="building-card" style="padding:8px">
                        <div class="building-card-header">
                            <span class="building-name">${item.name}</span>
                            <span class="building-badge" style="background:var(--accent)">${item.volume}л</span>
                        </div>
                        <div class="building-stats" style="margin-top:4px">
                            <span>💰 ${formatMoney(item.price)}</span>
                            <span>🎚 Ур. ${item.min_level}</span>
                        </div>
                        <button class="btn btn-sm btn-success" onclick="buyShopItem('${category}', ${item.id})" style="margin-top:6px;width:100%">
                            Купить за ${formatMoney(item.price)}
                        </button>
                    </div>
                `).join('')}
            </div>
            <div class="dialog-actions" style="margin-top:16px">
                <button class="btn btn-secondary" id="shopModalClose">Закрыть</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('#shopModalClose').onclick = () => overlay.remove();
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
}
