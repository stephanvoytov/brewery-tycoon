let GAME_STATE = null;
let APP_MODE = 'auth'; // auth | saves | game

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    const screen = document.getElementById(id);
    if (screen) screen.classList.add('active');
}

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
        if (sel && GAME_STATE.game && GAME_STATE.game.currency) {
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
        case 'page-leaderboard': renderLeaderboard('money'); break;
    }
}

function updateSidebarUser() {
    const guestEl = document.getElementById('guestInfo');
    const userEl = document.getElementById('userInfo');
    const savesBtn = document.getElementById('savesBtn');

    if (API.user) {
        guestEl.style.display = 'none';
        userEl.style.display = 'block';
        document.getElementById('usernameDisplay').textContent = API.user.username;
        if (savesBtn) savesBtn.style.display = 'block';
    } else {
        guestEl.style.display = 'block';
        userEl.style.display = 'none';
        if (savesBtn) savesBtn.style.display = 'none';
    }
}

function doLogout() {
    API.logout();
    showScreen('screen-auth');
    updateSidebarUser();
    showSuccess('Выход выполнен');
}

async function showSaves() {
    if (!API.user) return;
    try {
        const saves = await API.getSaves();
        renderSaves(saves);
        showScreen('screen-saves');
    } catch (e) {
        showError(e.message);
    }
}

async function startNewGame() {
    try {
        await API.newGame();
        showSuccess('Новая игра создана!');
        await enterGame();
    } catch (e) {
        showError(e.message);
    }
}

async function enterGame() {
    showScreen('screen-game');
    APP_MODE = 'game';
    await loadGameState();
    renderCurrentPage();
}

async function initGameFlow() {
    const user = await API.loadUser();
    updateSidebarUser();

    if (user && user.active_game_id) {
        try {
            await API.loadGame(user.active_game_id);
            await enterGame();
            return;
        } catch {
            // active game not found, show saves
        }
    }

    if (user) {
        try {
            const saves = await API.getSaves();
            renderSaves(saves);
            showScreen('screen-saves');
            APP_MODE = 'saves';
        } catch {
            await startNewGame();
        }
    } else {
        showScreen('screen-auth');
        APP_MODE = 'auth';
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    // Init main game pages
    const main = document.getElementById('pageContent');
    const pages = ['dashboard', 'brewery', 'recipes', 'batches', 'market', 'staff', 'research', 'finance', 'leaderboard'];
    pages.forEach(p => {
        const div = document.createElement('div');
        div.id = `page-${p}`;
        div.className = 'page' + (p === 'dashboard' ? ' active' : '');
        div.innerHTML = `<div class="page-loading">Загрузка...</div>`;
        main.appendChild(div);
    });

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (APP_MODE !== 'game') return;
            navigate(btn.dataset.page);
            if (API.gameId) renderCurrentPage();
        });
    });

    // Auth form handlers
    document.getElementById('loginBtn').addEventListener('click', async () => {
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;
        if (!username || !password) { showError('Заполните все поля'); return; }
        try {
            await API.login(username, password);
            updateSidebarUser();
            showSuccess('Вход выполнен!');
            await initGameFlow();
        } catch (e) {
            showError(e.message);
        }
    });

    document.getElementById('registerBtn').addEventListener('click', async () => {
        const username = document.getElementById('regUsername').value.trim();
        const password = document.getElementById('regPassword').value;
        const confirm = document.getElementById('regConfirm').value;
        if (!username || !password) { showError('Заполните все поля'); return; }
        if (password !== confirm) { showError('Пароли не совпадают'); return; }
        try {
            await API.register(username, password);
            updateSidebarUser();
            showSuccess('Регистрация успешна!');
            await initGameFlow();
        } catch (e) {
            showError(e.message);
        }
    });

    // Tab switching in auth
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.form).classList.add('active');
        });
    });

    // Proceed as guest
    document.getElementById('guestBtn').addEventListener('click', async () => {
        await startNewGame();
    });

    // Leaderboard tab switching
    document.querySelectorAll('.lb-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.lb-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderLeaderboard(tab.dataset.metric);
        });
    });

    await initGameFlow();
});
