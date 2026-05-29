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
    document.querySelectorAll('.bottom-nav-btn').forEach(b => b.classList.remove('active'));

    const pageEl = document.getElementById(`page-${page}`);
    if (pageEl) pageEl.classList.add('active');

    const btn = document.querySelector(`[data-page="${page}"]`);
    if (btn) btn.classList.add('active');

    const bnBtn = document.querySelector(`.bottom-nav-btn[data-page="${page}"]`);
    if (bnBtn) bnBtn.classList.add('active');

    document.getElementById('mobileMenu').classList.remove('open');

    localStorage.setItem(STORAGE_KEYS.ACTIVE_PAGE, page);
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
        const currency = GAME_STATE.game && GAME_STATE.game.currency;
        ['currencySelect', 'currencySelectMobile'].forEach(id => {
            const sel = document.getElementById(id);
            if (sel && currency) sel.value = currency;
        });
        renderStatusBar();
        renderCurrentPage();
    } catch (e) {
        console.error('Failed to load game state:', e);
    }
}

function renderStatusBar() {
    const g = GAME_STATE?.game;
    const b = GAME_STATE?.brewery;
    const batches = GAME_STATE?.batches || [];
    const el = document.getElementById('statusBar');
    if (!el || !g || !b) { if (el) el.innerHTML = ''; return; }

    const activeCount = batches.filter(b => !['sold', 'spoiled'].includes(b.stage)).length;
    const repClass = g.reputation >= 70 ? 'high' : g.reputation >= 40 ? 'mid' : 'low';
    const curBld = BUILDINGS[b.building_id] || BUILDINGS[2];
    const items = [];

    items.push(`<span class="sb-item sb-money">💰 ${formatMoney(g.money)}</span>`);
    items.push(`<span class="sb-divider"></span>`);
    items.push(`<span class="sb-item sb-day">📅 День ${g.day}</span>`);
    items.push(`<span class="sb-divider"></span>`);
    items.push(`<span class="sb-item sb-rep ${repClass}">⭐ ${Math.round(g.reputation)}%</span>`);
    items.push(`<span class="sb-divider"></span>`);
    items.push(`<span class="sb-item sb-batches">🛢 ${activeCount}</span>`);

    if (g.bank_loan > 0) {
        items.push(`<span class="sb-divider"></span>`);
        items.push(`<span class="sb-item sb-loan">🏦 ${formatMoney(g.bank_loan)}</span>`);
    }

    items.push(`<span class="sb-divider"></span>`);
    items.push(`<span class="sb-item sb-building">${curBld.icon} ${curBld.name}</span>`);

    el.innerHTML = items.join('');
}

async function renderCurrentPage() {
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
        case 'page-finance': await renderFinance(); break;
        case 'page-leaderboard': renderLeaderboard('money'); break;
        case 'page-help': renderHelp(); break;
    }

    wrapTables();
}

function updateSidebarUser() {
    const guestEl = document.getElementById('guestInfo');
    const userEl = document.getElementById('userInfo');
    const savesBtn = document.getElementById('savesBtn');
    const mobileUserInfo = document.getElementById('mobileUserInfo');

    if (API.user) {
        guestEl.style.display = 'none';
        userEl.style.display = 'block';
        document.getElementById('usernameDisplay').textContent = API.user.username;
        if (savesBtn) savesBtn.style.display = 'block';
        if (mobileUserInfo) {
            mobileUserInfo.innerHTML = `<div style="margin-top:12px;font-size:0.85rem;color:var(--text-dim)">👤 ${esc(API.user.username)}</div>`;
        }
    } else {
        guestEl.style.display = 'block';
        userEl.style.display = 'none';
        if (savesBtn) savesBtn.style.display = 'none';
        if (mobileUserInfo) {
            mobileUserInfo.innerHTML = `<div style="margin-top:12px;font-size:0.85rem;color:var(--text-dim)">👤 Гость</div>`;
        }
    }
}

function doLogout() {
    API.logout();
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_PAGE);
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

    const savedPage = localStorage.getItem(STORAGE_KEYS.ACTIVE_PAGE);
    const validPages = ['dashboard', 'brewery', 'recipes', 'batches', 'market', 'staff', 'research', 'finance', 'leaderboard', 'help'];
    if (savedPage && validPages.includes(savedPage)) {
        navigate(savedPage);
    }

    await loadGameState();
    if (!savedPage || !validPages.includes(savedPage)) {
        renderCurrentPage();
    }
    showTutorial();
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
        return;
    }

    // Guest mode: try restoring saved game
    const savedGameId = localStorage.getItem(STORAGE_KEYS.GAME_ID);
    if (savedGameId) {
        try {
            await API.loadGame(parseInt(savedGameId));
            await enterGame();
            return;
        } catch {
            localStorage.removeItem(STORAGE_KEYS.GAME_ID);
            localStorage.removeItem(STORAGE_KEYS.ACTIVE_PAGE);
        }
    }

    showScreen('screen-auth');
    APP_MODE = 'auth';
}

document.addEventListener('DOMContentLoaded', async () => {
    // Init main game pages
    const main = document.getElementById('pageContent');
    const pages = ['dashboard', 'brewery', 'recipes', 'batches', 'market', 'staff', 'research', 'finance', 'leaderboard', 'help'];
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

    // Bottom navigation (mobile)
    document.querySelectorAll('.bottom-nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (APP_MODE !== 'game') return;
            if (btn.dataset.page === 'more') {
                document.getElementById('mobileMenu').classList.toggle('open');
                return;
            }
            navigate(btn.dataset.page);
            if (API.gameId) renderCurrentPage();
        });
    });

    // Hamburger button (mobile)
    document.getElementById('hamburgerBtn').addEventListener('click', () => {
        document.getElementById('mobileMenu').classList.toggle('open');
    });

    // Mobile menu nav buttons
    document.querySelectorAll('.mobile-menu .nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (APP_MODE !== 'game') return;
            navigate(btn.dataset.page);
            if (API.gameId) renderCurrentPage();
        });
    });

    // Sync currency selects
    document.getElementById('currencySelectMobile').addEventListener('change', function() {
        document.getElementById('currencySelect').value = this.value;
        doChangeCurrency(this.value);
    });

    await initGameFlow();
});
