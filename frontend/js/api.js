const API_BASE = '';

const STORAGE_KEYS = {
    GAME_ID: 'breweryGameId',
    AUTH_TOKEN: 'authToken',
    ACTIVE_PAGE: 'breweryActivePage',
};

const API = {
    gameId: (() => {
        const saved = localStorage.getItem(STORAGE_KEYS.GAME_ID);
        return saved ? parseInt(saved) : null;
    })(),
    authToken: localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN),
    user: null,

    _getHeaders() {
        const h = { 'Content-Type': 'application/json' };
        if (this.authToken) {
            h['Authorization'] = `Bearer ${this.authToken}`;
        }
        return h;
    },

    async request(method, path, body) {
        const opts = { method, headers: this._getHeaders() };
        if (body) opts.body = JSON.stringify(body);
        let suffix = '';
        if (this.gameId && !path.includes('game_id=')) {
            suffix = (path.includes('?') ? '&' : '?') + `game_id=${this.gameId}`;
        }
        const res = await fetch(`${API_BASE}${path}${suffix}`, opts);
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || `Ошибка ${res.status}`);
        }
        return res.json();
    },

    async newGame() {
        const data = await this.request('POST', '/api/game/new');
        this.gameId = data.game_id;
        localStorage.setItem(STORAGE_KEYS.GAME_ID, this.gameId);
        const el = document.getElementById('gameIdDisplay');
        if (el) el.textContent = this.gameId;
        return data;
    },

    async getState() {
        return this.request('GET', '/api/game/state');
    },

    async tick(days = 1) {
        return this.request('POST', `/api/game/tick?days=${days}`);
    },

    async getBrewery() {
        return this.request('GET', '/api/brewery/');
    },

    async upgradeBrewery(upgradeType) {
        return this.request('POST', '/api/brewery/upgrade', { upgrade_type: upgradeType });
    },

    async getShop() {
        return this.request('GET', '/api/brewery/shop');
    },

    async buyKettle(typeId) {
        return this.request('POST', `/api/brewery/buy-kettle?type_id=${typeId}`);
    },

    async buyFermenter(typeId) {
        return this.request('POST', `/api/brewery/buy-fermenter?type_id=${typeId}`);
    },

    async buyCondTank(typeId) {
        return this.request('POST', `/api/brewery/buy-cond-tank?type_id=${typeId}`);
    },

    async sellKettle(kettleId) {
        return this.request('POST', `/api/brewery/sell-kettle/${kettleId}`);
    },

    async sellFermenter(fermenterId) {
        return this.request('POST', `/api/brewery/sell-fermenter/${fermenterId}`);
    },

    async sellCondTank(tankId) {
        return this.request('POST', `/api/brewery/sell-cond-tank/${tankId}`);
    },

    async getEquipmentList() {
        return this.request('GET', '/api/brewery/equipment-list');
    },

    async renameBrewery(name) {
        return this.request('POST', '/api/brewery/rename', { name });
    },

    async getRecipes() {
        return this.request('GET', '/api/recipes/');
    },

    async createRecipe(recipe) {
        return this.request('POST', '/api/recipes/', recipe);
    },

    async startBrew(recipeId, batchSizeLiters) {
        return this.request('POST', `/api/recipes/${recipeId}/brew`, { recipe_id: recipeId, batch_size_liters: batchSizeLiters });
    },

    async getBatches() {
        return this.request('GET', '/api/batches/');
    },

    async sellBatch(batchId) {
        return this.request('POST', `/api/batches/${batchId}/sell`);
    },

    async getInventory() {
        return this.request('GET', '/api/inventory/');
    },

    async buyIngredient(ingredientId, quantity) {
        return this.request('POST', '/api/inventory/buy', { ingredient_id: ingredientId, quantity });
    },

    async getEquipment() {
        return this.request('GET', '/api/inventory/equipment');
    },

    async buyEquipment(equipmentId) {
        return this.request('POST', '/api/inventory/equipment/buy', { equipment_id: equipmentId });
    },

    async getStaff() {
        return this.request('GET', '/api/staff/');
    },

    async hireStaff(role) {
        return this.request('POST', `/api/staff/hire?role=${role}`);
    },

    async fireStaff(staffId) {
        return this.request('POST', `/api/staff/${staffId}/fire`);
    },

    async trainStaff(staffId) {
        return this.request('POST', `/api/staff/${staffId}/train`);
    },

    async getMarket() {
        return this.request('GET', '/api/market/');
    },

    async getContracts() {
        return this.request('GET', '/api/market/contracts');
    },

    async signContract(contractId) {
        return this.request('POST', `/api/market/contracts/${contractId}/sign`);
    },

    async getResearch() {
        return this.request('GET', '/api/research/');
    },

    async startResearch(researchId) {
        return this.request('POST', `/api/research/${researchId}/start`);
    },

    async getSaves() {
        return this.request('GET', '/api/game/saves');
    },

    async selectSave(gameId) {
        return this.request('PUT', '/api/game/select', { game_id: gameId });
    },

    async setCurrency(currency) {
        return this.request('POST', '/api/game/currency', { currency });
    },

    async loadGame(id) {
        this.gameId = id;
        localStorage.setItem(STORAGE_KEYS.GAME_ID, id);
        const el = document.getElementById('gameIdDisplay');
        if (el) el.textContent = id;
        return await this.getState();
    },

    async register(username, password) {
        const res = await fetch(`${API_BASE}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || 'Ошибка регистрации');
        }
        const data = await res.json();
        this.authToken = data.token;
        this.user = data.user;
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.token);
        return data;
    },

    async login(username, password) {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || 'Ошибка входа');
        }
        const data = await res.json();
        this.authToken = data.token;
        this.user = data.user;
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.token);
        return data;
    },

    async loadUser() {
        if (!this.authToken) return null;
        try {
            const res = await fetch(`${API_BASE}/api/auth/me`, {
                headers: { 'Authorization': `Bearer ${this.authToken}` },
            });
            if (!res.ok) {
                this.authToken = null;
                this.user = null;
                localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
                return null;
            }
            this.user = await res.json();
            return this.user;
        } catch {
            return null;
        }
    },

    logout() {
        this.authToken = null;
        this.user = null;
        this.gameId = null;
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.GAME_ID);
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_PAGE);
    },

    async restartAfterGameOver() {
        return this.request('POST', '/api/game/restart-after-game-over');
    },

    async getLeaderboard(metric = 'money', limit = 20) {
        const res = await fetch(`${API_BASE}/api/leaderboard?metric=${metric}&limit=${limit}`);
        if (!res.ok) return { entries: [] };
        return res.json();
    },

    async buyInsurance() {
        return this.request('POST', '/api/brewery/buy-insurance');
    },

    async changeBuilding(buildingId) {
        return this.request('POST', '/api/brewery/change-building', { building_id: buildingId });
    },

    async repairEquipment(equipmentId) {
        return this.request('POST', `/api/brewery/equipment/${equipmentId}/repair`);
    },

    async resolveEvent(eventId, choice) {
        return this.request('POST', `/api/game/events/${eventId}/resolve`, { choice });
    },

    async getLoanInfo() {
        return this.request('GET', '/api/finance/loan/info');
    },

    async takeLoan(amount) {
        return this.request('POST', '/api/finance/loan/take', { amount });
    },

    async repayLoan(amount) {
        return this.request('POST', '/api/finance/loan/repay', { amount });
    },
};
