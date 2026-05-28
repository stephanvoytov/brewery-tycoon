function renderBatches() {
    const batches = GAME_STATE.batches || [];

    const el = document.getElementById('page-batches');
    el.innerHTML = `
        <h2>🛢 Партии пива</h2>

        <div class="card">
                <table>
                    <tr>
                        <th>#</th>
                        <th>Рецепт</th>
                        <th>Объём</th>
                        <th title="Стадии: затирание → кипячение → ферментация → дозревание → готова">Стадия</th>
                        <th title="Прогресс текущей стадии">Прогресс</th>
                        <th title="Качество пива зависит от рецепта, оборудования и навыков">Качество</th>
                        <th>День старта</th>
                        <th></th>
                    </tr>
                ${batches.length === 0 ? '<tr><td colspan="8" class="empty-state">Нет партий</td></tr>' :
                batches.sort((a, b) => b.id - a.id).map(b => `
                    <tr>
                        <td>${b.id}</td>
                        <td>${b.recipe_name || '—'}</td>
                        <td>${b.batch_size_liters} л</td>
                        <td><span class="badge badge-${b.stage}">${STAGE_RU[b.stage] || b.stage}</span></td>
                        <td>
                            <div class="chart-bar" style="width:100px">
                                <div class="chart-bar-fill" style="width:${b.stage_progress}%"></div>
                            </div>
                            ${b.stage_progress}%
                        </td>
                        <td>${b.stage === 'ferment' || b.stage === 'condition' || b.stage === 'packaged' ? Math.round(b.quality) + '%' : '—'}</td>
                        <td>${b.started_day}</td>
                        <td>
                            ${b.stage === 'packaged' ? `<button class="btn btn-sm btn-success" onclick="doSellBatch(${b.id})">Продать</button>` : ''}
                            ${b.stage === 'packaged' ? `<span style="color:var(--green);font-size:0.75rem">Готова!</span>` : `<span style="color:var(--text-dim);font-size:0.75rem">${b.stage_progress}%</span>`}
                        </td>
                    </tr>
                `).join('')}
            </table>
        </div>

        <div class="card">
            <h3>📊 Сводка по партиям</h3>
            <div class="grid-4">
                <div class="stat">
                    <div class="stat-value">${batches.filter(b => b.stage === 'mash' || b.stage === 'boil').length}</div>
                    <div class="stat-label">Варятся</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${batches.filter(b => b.stage === 'ferment').length}</div>
                    <div class="stat-label">Ферментируются</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${batches.filter(b => b.stage === 'condition').length}</div>
                    <div class="stat-label">Дозревают</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${batches.filter(b => b.stage === 'packaged').length}</div>
                    <div class="stat-label">Готовы к продаже</div>
                </div>
            </div>
        </div>
    `;
}

async function doSellBatch(id) {
    try {
        const res = await API.sellBatch(id);
        showSuccess(res.message);
        await loadGameState();
        renderBatches();
    } catch (e) {
        showError(e.message);
    }
}
