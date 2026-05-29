function renderResearch() {
    const research = GAME_STATE.research || [];

    const el = document.getElementById('page-research');
    el.innerHTML = `
        <h2>🔬 Исследования <span class="help-link" onclick="scrollToHelp('help-guide-research'); return false;" title="Подробнее об исследованиях">❓</span></h2>

        <div class="grid-2">
            ${research.length === 0 ? '<div class="card"><div class="empty-state">Нет доступных исследований</div></div>' :
            research.map(r => `
                <div class="card" style="opacity:${r.is_completed ? 0.6 : 1}">
                    <h3>${r.is_completed ? '✅' : r.is_started ? '⏳' : '🔬'} ${r.name}</h3>
                    <div style="font-size:0.85rem;color:var(--text-dim);margin-bottom:8px">${r.effect_description}</div>
                    <div class="grid-3" style="margin-bottom:8px">
                        <div class="stat">
                            <div class="stat-value" style="font-size:1rem">${formatMoney(r.cost)}</div>
                            <div class="stat-label">Стоимость</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value" style="font-size:1rem">${r.duration_days} дн.</div>
                            <div class="stat-label">Длительность</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value" style="font-size:1rem;color:${r.is_completed ? 'var(--green)' : r.is_started ? 'var(--accent)' : 'var(--text-dim)'}">
                                ${r.is_completed ? 'Завершено' : r.is_started ? `${r.progress_days}/${r.duration_days}` : 'Не начато'}
                            </div>
                            <div class="stat-label">Статус</div>
                        </div>
                    </div>
                    ${!r.is_completed && !r.is_started ? `
                        <button class="btn btn-primary" onclick="doStartResearch(${r.id})">Начать исследование</button>
                    ` : r.is_started && !r.is_completed ? `
                        <div class="chart-bar"><div class="chart-bar-fill" style="width:${(r.progress_days / r.duration_days) * 100}%"></div></div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
    `;
}

async function doStartResearch(id) {
    try {
        const res = await API.startResearch(id);
        showSuccess(res.message);
        await loadGameState();
        renderResearch();
    } catch (e) {
        showError(e.message);
    }
}
