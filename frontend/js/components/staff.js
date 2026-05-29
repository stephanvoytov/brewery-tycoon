function renderStaff() {
    const staff = GAME_STATE.staff || [];

    const el = document.getElementById('page-staff');
    el.innerHTML = `
        <h2>👥 Персонал <span class="help-link" onclick="scrollToHelp('help-guide-staff'); return false;" title="Подробнее о персонале">❓</span></h2>

        <div class="card">
            <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:14px;font-size:0.85rem">
                <div style="background:var(--bg-main);padding:8px 12px;border-radius:6px;flex:1;min-width:180px">
                    <strong style="color:#d4a017">🍺 Пивовар</strong><br>
                    <span style="color:var(--text-dim)">+3% к скорости варки за ед. навыка</span>
                </div>
                <div style="background:var(--bg-main);padding:8px 12px;border-radius:6px;flex:1;min-width:180px">
                    <strong style="color:#3498db">🤝 Продавец</strong><br>
                    <span style="color:var(--text-dim)">+2% к цене контрактов за ед. навыка</span>
                </div>
                <div style="background:var(--bg-main);padding:8px 12px;border-radius:6px;flex:1;min-width:180px">
                    <strong style="color:#2ecc71">📋 Администратор</strong><br>
                    <span style="color:var(--text-dim)">-2% к расходам за ед. навыка</span>
                </div>
            </div>
            <h3>Сотрудники</h3>
            <table>
                    <tr>
                        <th>Имя</th>
                        <th title="🍺 Пивовар: ускоряет варку | 🤝 Продавец: повышает цену | 📋 Админ: снижает расходы">Роль</th>
                        <th title="Навык 1-10. Влияет на силу бонуса роли">Навык</th>
                        <th>Зарплата/день</th>
                        <th title="Мораль падает без премий. Низкая мораль снижает эффективность">Мораль</th>
                        <th>Нанят (день)</th>
                        <th></th>
                    </tr>
                ${staff.length === 0 ? '<tr><td colspan="7" class="empty-state">Нет сотрудников. Наймите!</td></tr>' :
                staff.map(s => {
                    const bonusDesc = s.role === 'brewer' ? `+${s.skill_level * 3}% скорость варки` : s.role === 'sales' ? `+${s.skill_level * 2}% цена контрактов` : s.role === 'admin' ? `-${s.skill_level * 2}% расходы` : '';
                    return `
                    <tr>
                        <td>${s.name}</td>
                        <td title="${bonusDesc}">${ROLE_RU[s.role] || s.role} ⓘ</td>
                        <td>
                            <div class="chart-bar" style="width:80px">
                                <div class="chart-bar-fill" style="width:${s.skill_level * 10}%"></div>
                            </div>
                            ${s.skill_level}/10
                        </td>
                        <td>${formatMonthly(s.salary)}</td>
                        <td>
                            <span style="color:${s.morale > 60 ? 'var(--green)' : s.morale > 30 ? 'var(--accent)' : 'var(--red)'}">
                                ${Math.round(s.morale)}%
                            </span>
                        </td>
                        <td>${s.hired_day}</td>
                        <td>
                            <button class="btn btn-sm btn-primary" onclick="doTrainStaff(${s.id})">🎓 Тренировка (${formatMoney(s.skill_level * 200)})</button>
                            <button class="btn btn-sm btn-danger" onclick="doFireStaff(${s.id})">🔴 Уволить</button>
                        </td>
                    </tr>`;
                }).join('')}
            </table>
            <div class="mobile-card-list">
                ${staff.length === 0 ? '<div class="mobile-card-empty">Нет сотрудников. Наймите!</div>' :
                staff.map(s => {
                    const bonusDesc = s.role === 'brewer' ? `+${s.skill_level * 3}% скорость варки` : s.role === 'sales' ? `+${s.skill_level * 2}% цена контрактов` : s.role === 'admin' ? `-${s.skill_level * 2}% расходы` : '';
                    return `
                    <div class="mobile-card">
                        <div class="mobile-card-row">
                            <span class="label">${s.name}</span>
                            <span class="value">${ROLE_RU[s.role] || s.role} ⓘ</span>
                        </div>
                        <div class="mobile-card-row">
                            <span class="label">Навык:</span><span class="value">${s.skill_level}/10</span>
                        </div>
                        <div class="mobile-card-row">
                            <span class="label">Зарплата:</span><span class="value">${formatMonthly(s.salary)}</span>
                        </div>
                        <div class="mobile-card-row">
                            <span class="label">Мораль:</span><span class="value" style="color:${s.morale > 60 ? 'var(--green)' : s.morale > 30 ? 'var(--accent)' : 'var(--red)'}">${Math.round(s.morale)}%</span>
                        </div>
                        <div class="mobile-card-actions">
                            <button class="btn btn-sm btn-primary" onclick="doTrainStaff(${s.id})">🎓 Тренировка</button>
                            <button class="btn btn-sm btn-danger" onclick="doFireStaff(${s.id})">🔴 Уволить</button>
                        </div>
                    </div>`;
                }).join('')}
            </div>
        </div>

        <div class="card">
            <h3>📋 Найм персонала</h3>
            <div class="form-row">
                <button class="btn btn-success" onclick="doHireStaff('brewer')">🍺 Пивовар (${formatMonthly(25)})</button>
                <button class="btn btn-success" onclick="doHireStaff('sales')">🤝 Продавец (${formatMonthly(20)})</button>
                <button class="btn btn-success" onclick="doHireStaff('admin')">📋 Админ (${formatMonthly(15)})</button>
            </div>
        </div>
    `;
}

async function doHireStaff(role) {
    try {
        const res = await API.hireStaff(role);
        showSuccess(res.message);
        await loadGameState();
        renderStaff();
    } catch (e) {
        showError(e.message);
    }
}

async function doFireStaff(id) {
    const ok = await showConfirm('Уволить сотрудника?', 'Это действие нельзя отменить.');
    if (!ok) return;
    try {
        const res = await API.fireStaff(id);
        showSuccess(res.message);
        await loadGameState();
        renderStaff();
    } catch (e) {
        showError(e.message);
    }
}

async function doTrainStaff(id) {
    try {
        const res = await API.trainStaff(id);
        showSuccess(res.message);
        await loadGameState();
        renderStaff();
    } catch (e) {
        showError(e.message);
    }
}
