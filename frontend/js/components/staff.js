function renderStaff() {
    const staff = GAME_STATE.staff || [];

    const el = document.getElementById('page-staff');
    el.innerHTML = `
        <h2>👥 Персонал</h2>

        <div class="card">
            <h3>Сотрудники</h3>
            <table>
                    <tr>
                        <th>Имя</th>
                        <th>Роль</th>
                        <th title="Навык 1-10. Влияет на скорость варки, качество пива, эффективность продаж">Навык</th>
                        <th>Зарплата/день</th>
                        <th title="Мораль падает без премий. Низкая мораль снижает эффективность работы">Мораль</th>
                        <th>Нанят (день)</th>
                        <th></th>
                    </tr>
                ${staff.length === 0 ? '<tr><td colspan="7" class="empty-state">Нет сотрудников. Наймите!</td></tr>' :
                staff.map(s => `
                    <tr>
                        <td>${s.name}</td>
                        <td>${ROLE_RU[s.role] || s.role}</td>
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
                            <button class="btn btn-sm btn-primary" onclick="doTrainStaff(${s.id})">🎓 Тренировка</button>
                            <button class="btn btn-sm btn-danger" onclick="doFireStaff(${s.id})">🔴 Уволить</button>
                        </td>
                    </tr>
                `).join('')}
            </table>
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
