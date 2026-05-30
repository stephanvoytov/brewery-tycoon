const BUILDING_LAYOUTS = {
    0: { w: 400, h: 280 },
    1: { w: 520, h: 380 },
    2: { w: 820, h: 500 },
    3: { w: 1020, h: 550 },
    4: { w: 920, h: 550 },
    5: { w: 1220, h: 600 },
    6: { w: 1120, h: 550 },
    7: { w: 1620, h: 700 },
};

let brewPanX = 0, brewPanY = 0, brewZoom = 1, brewDragging = false;
let brewDragStartX = 0, brewDragStartY = 0, brewStartPanX = 0, brewStartPanY = 0;
let brewLastTouchDist = 0;

function brewUpdateTransform() {
    const g = document.getElementById('brewery-map');
    if (g) g.setAttribute('transform', `translate(${brewPanX},${brewPanY}) scale(${brewZoom})`);
}

function brewSetupEvents(svg) {
    svg.addEventListener('wheel', e => {
        e.preventDefault();
        const rect = svg.getBoundingClientRect();
        const mx = e.clientX - rect.left, my = e.clientY - rect.top;
        const oldZ = brewZoom;
        brewZoom = Math.max(0.3, Math.min(3, brewZoom - e.deltaY * 0.001));
        brewPanX = mx - (mx - brewPanX) * (brewZoom / oldZ);
        brewPanY = my - (my - brewPanY) * (brewZoom / oldZ);
        brewUpdateTransform();
    });
    svg.addEventListener('mousedown', e => {
        brewDragging = true;
        brewDragStartX = e.clientX;
        brewDragStartY = e.clientY;
        brewStartPanX = brewPanX;
        brewStartPanY = brewPanY;
        svg.style.cursor = 'grabbing';
    });
    window.addEventListener('mousemove', e => {
        if (!brewDragging) return;
        brewPanX = brewStartPanX + (e.clientX - brewDragStartX);
        brewPanY = brewStartPanY + (e.clientY - brewDragStartY);
        brewUpdateTransform();
    });
    window.addEventListener('mouseup', () => {
        brewDragging = false;
        const svgEl = document.querySelector('.brewery-svg-container svg');
        if (svgEl) svgEl.style.cursor = 'grab';
    });
    svg.addEventListener('touchstart', e => {
        if (e.touches.length === 1) {
            brewDragging = true;
            brewDragStartX = e.touches[0].clientX;
            brewDragStartY = e.touches[0].clientY;
            brewStartPanX = brewPanX;
            brewStartPanY = brewPanY;
        } else if (e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            brewLastTouchDist = Math.sqrt(dx * dx + dy * dy);
        }
    }, { passive: true });
    svg.addEventListener('touchmove', e => {
        if (e.touches.length === 1 && brewDragging) {
            brewPanX = brewStartPanX + (e.touches[0].clientX - brewDragStartX);
            brewPanY = brewStartPanY + (e.touches[0].clientY - brewDragStartY);
            brewUpdateTransform();
        } else if (e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (brewLastTouchDist > 0) {
                const oldZ = brewZoom;
                brewZoom = Math.max(0.3, Math.min(3, brewZoom * (dist / brewLastTouchDist)));
                const rect = svg.getBoundingClientRect();
                const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
                const my = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
                brewPanX = mx - (mx - brewPanX) * (brewZoom / oldZ);
                brewPanY = my - (my - brewPanY) * (brewZoom / oldZ);
                brewUpdateTransform();
            }
            brewLastTouchDist = dist;
        }
    }, { passive: true });
    svg.addEventListener('touchend', () => {
        brewDragging = false;
        brewLastTouchDist = 0;
    }, { passive: true });
}

function tankRadius(vol, base) {
    if (vol <= 50) return base;
    if (vol <= 100) return base * 1.25;
    if (vol <= 200) return base * 1.55;
    if (vol <= 500) return base * 2.0;
    return base * 2.5;
}

function renderTankGrid(tanks, zoneCx, zoneCy, zoneW, zoneH, baseR, gradId, freeColor, occColor, txtColor, occupiedColor, glowColor, bubbleColor, isKettle) {
    if (tanks.length === 0) return '';
    const count = tanks.length;
    const cols = count <= 3 ? count : Math.min(3, Math.ceil(Math.sqrt(count)));
    const rows = Math.ceil(count / cols);
    const radii = tanks.map(t => tankRadius(t.vol, baseR));
    const gap = 12;
    const maxR = Math.max(...radii);
    const totalW = cols * maxR * 2 + (cols - 1) * gap;
    const totalH = rows * maxR * 2 + (rows - 1) * gap;
    const startX = zoneCx + (cols === 1 ? 0 : -totalW / 2) + (cols === 1 ? -radii[0] : 0);
    const startY = zoneCy + (rows === 1 ? 0 : -totalH / 2) + (rows === 1 ? -radii[0] : 0);
    let html = '';
    tanks.forEach((t, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const r = radii[i];
        const cx = startX + r + col * (2 * maxR + gap);
        const cy = startY + r + row * (2 * maxR + gap);
        const color = t.occupied ? occColor : freeColor;
        html += `<g filter="url(#tankShadow)">
            <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(${gradId})" stroke="${color}" stroke-width="3"/>
            <circle cx="${cx}" cy="${cy}" r="${r * 0.7}" fill="${t.occupied ? 'rgba(180,80,0,0.2)' : 'rgba(0,80,180,0.08)'}"/>
            <text x="${cx}" y="${cy + 4}" text-anchor="middle" fill="${txtColor}" font-size="${Math.max(11, r * 0.55)}" font-weight="bold">${t.vol}л</text>
            ${t.occupied ? `
                <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${glowColor}" stroke-width="2" opacity="0.6">
                    <animate attributeName="opacity" values="0.6;0.1;0.6" dur="1.2s" repeatCount="indefinite"/>
                </circle>
                <circle cx="${cx - r * 0.25}" cy="${cy - r * 0.2}" r="3" fill="${bubbleColor}" opacity="0.7">
                    <animate attributeName="cy" values="${cy - r * 0.2};${cy - r * 0.5};${cy - r * 0.2}" dur="2s" repeatCount="indefinite"/>
                </circle>
                <circle cx="${cx + r * 0.3}" cy="${cy + r * 0.15}" r="2.5" fill="${bubbleColor}" opacity="0.5">
                    <animate attributeName="cy" values="${cy + r * 0.15};${cy - r * 0.3};${cy + r * 0.15}" dur="2.5s" repeatCount="indefinite"/>
                </circle>
            ` : ''}
        </g>`;
    });
    return html;
}

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
    const layout = BUILDING_LAYOUTS[b.building_id] || BUILDING_LAYOUTS[2];
    const showCond = curBld.cond_tanks > 0;
    const isRoom = curBld.id === 0;

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
            <svg viewBox="0 0 1200 800" xmlns="http://www.w3.org/2000/svg" style="width:100%;cursor:grab">
                <defs>
                    <pattern id="floorPlanks" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                        <image href="/img/textures/planks.jpg" x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid slice"/>
                    </pattern>
                    <pattern id="floorStone" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                        <image href="/img/textures/stone.jpg" x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid slice"/>
                    </pattern>
                    <pattern id="floorTile" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                        <image href="/img/textures/tile.jpg" x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid slice"/>
                    </pattern>
                    <pattern id="floorConcrete" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                        <image href="/img/textures/concrete.jpg" x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid slice"/>
                    </pattern>
                    <pattern id="floorHerringbone" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                        <image href="/img/textures/herringbone.jpg" x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid slice"/>
                    </pattern>
                    <pattern id="floorPolished" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                        <image href="/img/textures/polished.jpg" x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid slice"/>
                    </pattern>
                    <pattern id="floorEpoxy" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                        <image href="/img/textures/epoxy.jpg" x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid slice"/>
                    </pattern>
                    <pattern id="floorMarble" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                        <image href="/img/textures/marble.jpg" x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid slice"/>
                    </pattern>
                    <linearGradient id="kettleGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="${v.kettle[0]}"/>
                        <stop offset="100%" stop-color="${v.kettle[1]}"/>
                    </linearGradient>
                    <linearGradient id="fermGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="${v.ferm[0]}"/>
                        <stop offset="100%" stop-color="${v.ferm[1]}"/>
                    </linearGradient>
                    <linearGradient id="condGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="${v.cond[0]}"/>
                        <stop offset="100%" stop-color="${v.cond[1]}"/>
                    </linearGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="blur"/>
                        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                    <filter id="tankShadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="2" dy="4" stdDeviation="4" flood-color="rgba(0,0,0,0.5)"/>
                    </filter>
                </defs>

                <rect width="1200" height="800" fill="#12121e"/>

                <g id="brewery-map" transform="translate(0,0) scale(1)">
                    ${(() => {
                        const roomW = layout.w, roomH = layout.h;
                        const roomX = Math.max(10, (1200 - roomW) / 2);
                        const roomY = Math.max(10, (800 - roomH) / 2);
                        const pad = 16;
                        const secGap = 14;
                        const zoneCount = showCond ? 3 : 2;
                        const equipH = isRoom ? 0 : 70;
                        const availW = roomW - 2 * pad;
                        const availH = roomH - 2 * pad - equipH - 10;
                        const zoneW = (availW - (zoneCount - 1) * secGap) / zoneCount;
                        const zoneH = availH;
                        const zoneY = roomY + pad;
                        const z1x = roomX + pad;
                        const z2x = z1x + zoneW + secGap;
                        const z3x = showCond ? z2x + zoneW + secGap : 0;

                        let html = '';

                        // Room floor
                        html += `<rect x="${roomX}" y="${roomY}" width="${roomW}" height="${roomH}" rx="6" fill="${v.wall[1]}" stroke="${v.wallStroke}" stroke-width="2"/>
                        <rect x="${roomX}" y="${roomY}" width="${roomW}" height="${roomH}" fill="url(#floor${v.floorType})" opacity="0.5"/>`;

                        // Room border accent
                        html += `<rect x="${roomX + 4}" y="${roomY + 4}" width="${roomW - 8}" height="${roomH - 8}" rx="4" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>`;

                        // Room label
                        html += `<text x="${roomX + roomW / 2}" y="${roomY + 18}" text-anchor="middle" fill="${v.titleColor}" font-size="12" font-weight="bold" opacity="0.6">${v.title}</text>`;

                        // Zone: Kettles
                        const z1cy = zoneY + zoneH / 2;
                        html += `<rect x="${z1x}" y="${zoneY}" width="${zoneW}" height="${zoneH}" rx="6" fill="${v.sectionBg}" opacity="0.25"/>
                        <text x="${z1x + zoneW / 2}" y="${zoneY + 16}" text-anchor="middle" fill="${v.boilLabel}" font-size="11" font-weight="bold" opacity="0.8">⚡ ВАРОЧНЫЙ УЧАСТОК</text>`;
                        html += renderTankGrid(svgTanks, z1x + zoneW / 2, z1cy, zoneW, zoneH, 32, '#kettleGrad', v.freeColor, v.occupiedColor, v.kettleTitle, v.occupiedColor, v.glowColor, v.fermBubble, true);

                        // Zone: Fermenters
                        html += `<rect x="${z2x}" y="${zoneY}" width="${zoneW}" height="${zoneH}" rx="6" fill="${v.sectionBg}" opacity="0.25"/>
                        <text x="${z2x + zoneW / 2}" y="${zoneY + 16}" text-anchor="middle" fill="${v.fermLabel}" font-size="11" font-weight="bold" opacity="0.8">🧪 БРОДИЛЬНЯ</text>`;
                        html += renderTankGrid(svgFermenters, z2x + zoneW / 2, z1cy, zoneW, zoneH, 26, '#fermGrad', v.fermLabel, v.occupiedColor, v.fermTitle, v.occupiedColor, v.glowColor, v.fermBubble, false);

                        // Zone: Conditioning
                        if (showCond) {
                            html += `<rect x="${z3x}" y="${zoneY}" width="${zoneW}" height="${zoneH}" rx="6" fill="${v.sectionBg}" opacity="0.25"/>
                            <text x="${z3x + zoneW / 2}" y="${zoneY + 16}" text-anchor="middle" fill="${v.condLabel}" font-size="11" font-weight="bold" opacity="0.8">🧊 ДОЗРЕВАНИЕ</text>`;
                            html += renderTankGrid(svgConditioning, z3x + zoneW / 2, z1cy, zoneW, zoneH, 28, '#condGrad', v.condLabel, v.occupiedColor, v.condTitle, v.occupiedColor, v.glowColor, v.condBubble, false);
                        }

                        // Equipment section (bottom)
                        if (!isRoom) {
                            const eqY = roomY + roomH - equipH - pad + 5;
                            const eqH = equipH - 5;
                            const eqW = availW;
                            const eqX = roomX + pad;
                            const thirdW = (eqW - 2 * secGap) / 3;
                            html += `<rect x="${eqX}" y="${eqY}" width="${eqW}" height="${eqH}" rx="6" fill="${v.sectionBg}" opacity="0.3"/>`;

                            // Bottling
                            html += `<g transform="translate(${eqX}, ${eqY})">
                                <rect x="0" y="0" width="${thirdW}" height="${eqH}" rx="4" fill="${v.sectionBg}" opacity="0.5"/>
                                <text x="${thirdW / 2}" y="18" text-anchor="middle" fill="${v.boilLabel}" font-size="11" font-weight="bold">🍾 Розлив</text>
                                <text x="${thirdW / 2}" y="34" text-anchor="middle" fill="${v.bottomText}" font-size="9">${ownedEquip.some(e => e.type === 'bottling_line') ? '✅ Установлена' : '❌ Не куплена'}</text>
                            </g>`;

                            // Kegging
                            html += `<g transform="translate(${eqX + thirdW + secGap}, ${eqY})">
                                <rect x="0" y="0" width="${thirdW}" height="${eqH}" rx="4" fill="${v.sectionBg}" opacity="0.5"/>
                                <text x="${thirdW / 2}" y="18" text-anchor="middle" fill="${v.boilLabel}" font-size="11" font-weight="bold">🛢 Кеги</text>
                                <text x="${thirdW / 2}" y="34" text-anchor="middle" fill="${v.bottomText}" font-size="9">${ownedEquip.some(e => e.type === 'kegging_line') ? '✅ Установлена' : '❌ Не куплена'}</text>
                            </g>`;

                            // Taproom
                            html += `<g transform="translate(${eqX + 2 * (thirdW + secGap)}, ${eqY})">
                                <rect x="0" y="0" width="${thirdW}" height="${eqH}" rx="4" fill="${v.sectionBg}" opacity="0.5"/>
                                <text x="${thirdW / 2}" y="18" text-anchor="middle" fill="${b.has_taproom ? v.condLabel : v.bottomText}" font-size="11" font-weight="bold">🍺 Тапрум</text>
                                <text x="${thirdW / 2}" y="34" text-anchor="middle" fill="${v.bottomText}" font-size="9">${b.has_taproom ? `Ур.${b.taproom_level}` : 'Не построен'}</text>
                            </g>`;
                        }

                        // Building decorations
                        const dec = v.decor || [];
                        if (dec.includes('lights')) {
                            html += `<g opacity="0.35">
                                ${[0,1,2].map(i => {
                                    const lx = roomX + 40 + i * ((roomW - 80) / 3);
                                    return `<rect x="${lx}" y="${roomY + 4}" width="20" height="4" rx="2" fill="#fff"/>
                                        <rect x="${lx + 6}" y="${roomY + 8}" width="8" height="6" rx="1" fill="rgba(255,255,200,0.5)"/>`;
                                }).join('')}
                            </g>`;
                        }
                        if (dec.includes('zoneMarkings')) {
                            html += `<rect x="${z1x}" y="${zoneY}" width="${zoneW}" height="${zoneH}" rx="6" fill="none" stroke="${v.boilLabel}" stroke-width="1.5" stroke-dasharray="6,4" opacity="0.25"/>`;
                            html += `<rect x="${z2x}" y="${zoneY}" width="${zoneW}" height="${zoneH}" rx="6" fill="none" stroke="${v.fermLabel}" stroke-width="1.5" stroke-dasharray="6,4" opacity="0.25"/>`;
                            if (showCond) {
                                html += `<rect x="${z3x}" y="${zoneY}" width="${zoneW}" height="${zoneH}" rx="6" fill="none" stroke="${v.condLabel}" stroke-width="1.5" stroke-dasharray="6,4" opacity="0.25"/>`;
                            }
                        }
                        if (dec.includes('vent')) {
                            html += `<g opacity="0.25">
                                <rect x="${roomX + 20}" y="${roomY + 15}" width="${roomW - 40}" height="6" rx="2" fill="#7a9aaa"/>
                                <line x1="${roomX + 40}" y1="${roomY + 15}" x2="${roomX + 40}" y2="${roomY + 21}" stroke="#5a7a8a" stroke-width="1.5"/>
                                <line x1="${roomX + 60}" y1="${roomY + 15}" x2="${roomX + 60}" y2="${roomY + 21}" stroke="#5a7a8a" stroke-width="1.5"/>
                                <line x1="${roomX + 80}" y1="${roomY + 15}" x2="${roomX + 80}" y2="${roomY + 21}" stroke="#5a7a8a" stroke-width="1.5"/>
                            </g>`;
                        }
                        if (dec.includes('gantry')) {
                            html += `<g opacity="0.25">
                                <line x1="${roomX + 10}" y1="${roomY + 20}" x2="${roomX + roomW - 10}" y2="${roomY + 20}" stroke="#8a9aaa" stroke-width="4"/>
                                <rect x="${roomX + 30}" y="${roomY + 14}" width="8" height="12" fill="#6a7a8a"/>
                                <rect x="${roomX + 80}" y="${roomY + 14}" width="8" height="12" fill="#6a7a8a"/>
                                <rect x="${roomX + 50}" y="${roomY + 18}" width="6" height="6" rx="1" fill="#cc6a3a"/>
                            </g>`;
                        }
                        if (dec.includes('trim')) {
                            html += `<rect x="${roomX + 4}" y="${roomY + 4}" width="${roomW - 8}" height="${roomH - 8}" rx="4" fill="none" stroke="#d4a017" stroke-width="1.5" opacity="0.3"/>`;
                            html += `<rect x="${roomX + 8}" y="${roomY + 8}" width="${roomW - 16}" height="${roomH - 16}" rx="3" fill="none" stroke="#d4a017" stroke-width="1" opacity="0.15"/>`;
                        }
                        if (dec.includes('pendant')) {
                            html += `<g opacity="0.35">
                                <line x1="${roomX + roomW / 4}" y1="${roomY}" x2="${roomX + roomW / 4}" y2="${roomY + 40}" stroke="#7a6a5a" stroke-width="1"/>
                                <circle cx="${roomX + roomW / 4}" cy="${roomY + 45}" r="6" fill="#d4a017"/>
                                <circle cx="${roomX + roomW / 4}" cy="${roomY + 45}" r="3" fill="#f0d080" opacity="0.8"/>
                                <line x1="${roomX + roomW * 3 / 4}" y1="${roomY}" x2="${roomX + roomW * 3 / 4}" y2="${roomY + 40}" stroke="#7a6a5a" stroke-width="1"/>
                                <circle cx="${roomX + roomW * 3 / 4}" cy="${roomY + 45}" r="6" fill="#d4a017"/>
                                <circle cx="${roomX + roomW * 3 / 4}" cy="${roomY + 45}" r="3" fill="#f0d080" opacity="0.8"/>
                            </g>`;
                        }
                        if (dec.includes('chandelier')) {
                            html += `<g opacity="0.35">
                                <line x1="${roomX + roomW / 2}" y1="${roomY}" x2="${roomX + roomW / 2}" y2="${roomY + 20}" stroke="#d4a017" stroke-width="1.5"/>
                                <rect x="${roomX + roomW / 2 - 20}" y="${roomY + 20}" width="40" height="4" rx="2" fill="#d4a017"/>
                                <circle cx="${roomX + roomW / 2 - 14}" cy="${roomY + 28}" r="4" fill="#f0d080" opacity="0.6"/>
                                <circle cx="${roomX + roomW / 2}" cy="${roomY + 28}" r="4" fill="#f0d080" opacity="0.6"/>
                                <circle cx="${roomX + roomW / 2 + 14}" cy="${roomY + 28}" r="4" fill="#f0d080" opacity="0.6"/>
                            </g>`;
                        }

                        return html;
                    })()}
                </g>

                <rect x="0" y="0" width="1200" height="800" fill="none" stroke="var(--border)" stroke-width="1" opacity="0.3"/>

                <g transform="translate(8, 8)">
                    <rect x="0" y="0" width="56" height="56" rx="6" fill="rgba(0,0,0,0.5)" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
                    <text x="28" y="22" text-anchor="middle" fill="#fff" font-size="16" font-weight="bold" style="cursor:pointer" onclick="brewZoom=Math.min(3,brewZoom+0.3);brewUpdateTransform()">➕</text>
                    <line x1="10" y1="28" x2="46" y2="28" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
                    <rect x="20" y="33" width="16" height="3" rx="1.5" fill="#aaa" style="cursor:pointer" onclick="brewZoom=Math.max(0.3,brewZoom-0.3);brewUpdateTransform()"/>
                    <text x="28" y="50" text-anchor="middle" fill="#fff" font-size="9" opacity="0.5">${Math.round(brewZoom * 100)}%</text>
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
    const svg = el.querySelector('.brewery-svg-container svg');
    if (svg) brewSetupEvents(svg);
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
 