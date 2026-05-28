let GAME_STATE = null;

function navigate(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

    const pageEl = document.getElementById(`page-${page}`);
    if (pageEl) pageEl.classList.add('active');

    const btn = document.querySelector(`[data-page="${page}"]`);
    if (btn) btn.classList.add('active');
}

async function doChangeCurrency(currency) {
    if (!API.gameId) return;
    try {
        await API.setCurrency(currency);
        await loadGameState();
        showSuccess(`Валюта изменена на ${currency}`);
    } catch (e) {
        showError(e.message);
    }
}

async function loadGameState() {
    if (!API.gameId) return;
    try {
        GAME_STATE = await API.getState();
        const sel = document.getElementById('currencySelect');
        if (sel && GAME_STATE.game.currency) {
            sel.value = GAME_STATE.game.currency;
        }
        renderCurrentPage();
    } catch (e) {
        console.error('Failed to load game state:', e);
    }
}

function renderCurrentPage() {
    const activePage = document.querySelector('.page.active');
    if (!activePage) return;

    switch (activePage.id) {
        case 'page-dashboard': renderDashboard(); break;
        case 'page-brewery': renderBrewery(); break;
        case 'page-recipes': renderRecipes(); break;
        case 'page-batches': renderBatches(); break;
        case 'page-market': renderMarket(); break;
        case 'page-staff': renderStaff(); break;
        case 'page-research': renderResearch(); break;
        case 'page-finance': renderFinance(); break;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const main = document.getElementById('pageContent');

    const pages = ['dashboard', 'brewery', 'recipes', 'batches', 'market', 'staff', 'research', 'finance'];
    pages.forEach(p => {
        const div = document.createElement('div');
        div.id = `page-${p}`;
        div.className = 'page' + (p === 'dashboard' ? ' active' : '');
        div.innerHTML = `<div class="page-loading">Загрузка...</div>`;
        main.appendChild(div);
    });

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            navigate(btn.dataset.page);
            if (API.gameId) renderCurrentPage();
        });
    });

    if (!API.gameId) {
        try {
            await API.newGame();
            showSuccess('Новая игра создана!');
        } catch (e) {
            showError('Не удалось создать игру. Запущен ли сервер?');
            return;
        }
    }

    await loadGameState();
    renderCurrentPage();
});
