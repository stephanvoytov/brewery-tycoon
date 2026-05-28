const API_BASE = '';

const API = {
    gameId: null,

    async request(method, path, body) {
        const opts = {
            method,
            headers: { 'Content-Type': 'application/json' },
        };
        if (body) opts.body = JSON.stringify(body);
        const url = `${API_BASE}${path}${this.gameId ? (path.includes('?') ? '&' : '?') + `game_id=${this.gameId}` : ''}`;
        const res = await fetch(url, opts);
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || `Ошибка ${res.status}`);
        }
        return res.json();
    },

    async newGame() {
        const data = await this.request('POST', '/api/game/new');
        this.gameId = data.game_id;
        document.getElementById('gameIdDisplay').textContent = this.gameId;
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

    async setCurrency(currency) {
        return this.request('POST', '/api/game/currency', { currency });
    },

    async loadGame(id) {
        const resp = await fetch(`${API_BASE}/api/game/saves`);
        const saves = await resp.json();
        const found = saves.find(s => s.id === id);
        if (found) {
            this.gameId = id;
            document.getElementById('gameIdDisplay').textContent = id;
            return await this.getState();
        }
        throw new Error('Сохранение не найдено');
    }
};
