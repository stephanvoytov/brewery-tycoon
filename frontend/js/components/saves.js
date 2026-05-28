function renderSaves(saves) {
    const el = document.getElementById('savesList');
    if (!el) return;

    if (!saves || saves.length === 0) {
        el.innerHTML = '<p class="text-muted">У вас пока нет сохранений</p>';
        return;
    }

    el.innerHTML = saves.map(s => `
        <div class="save-card" onclick="loadSave(${s.id})">
            <div class="save-info">
                <strong>${esc(s.name)}</strong>
                <span class="save-meta">День ${s.day} | ${formatMoney(s.money)}</span>
            </div>
            <button class="btn btn-small" onclick="event.stopPropagation(); loadSave(${s.id})">▶ Играть</button>
        </div>
    `).join('');
}

async function loadSave(gameId) {
    try {
        await API.selectSave(gameId);
        await API.loadGame(gameId);
        showSuccess('Сохранение загружено!');
        const user = await API.loadUser();
        if (user) API.user = user;
        await enterGame();
    } catch (e) {
        showError(e.message);
    }
}
