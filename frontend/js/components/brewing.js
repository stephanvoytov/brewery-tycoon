function renderBrewing() {
    const el = document.getElementById('page-brewing');
    el.innerHTML = `
        <h2>🍺 Производство</h2>
        <div class="sub-tabs" data-sub="brewing">
            <div class="sub-tab-bar">
                <button class="sub-tab-btn active" data-sub-tab="brewery">🏭 Пивоварня</button>
                <button class="sub-tab-btn" data-sub-tab="recipes">📝 Рецепты</button>
                <button class="sub-tab-btn" data-sub-tab="batches">🛢 Партии</button>
                <button class="sub-tab-btn" data-sub-tab="inventory">📦 Запасы</button>
            </div>
            <div id="subBrewery" class="sub-tab-content"><div id="page-brewery"></div></div>
            <div id="subRecipes" class="sub-tab-content" style="display:none"><div id="page-recipes"></div></div>
            <div id="subBatches" class="sub-tab-content" style="display:none"><div id="page-batches"></div></div>
            <div id="subInventory" class="sub-tab-content" style="display:none"><div id="page-inventory"></div></div>
        </div>
    `;

    document.querySelectorAll('#page-brewing .sub-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchBrewingTab(btn.dataset.subTab));
    });

    switchBrewingTab('brewery');
}

function switchBrewingTab(tab) {
    document.querySelectorAll('#page-brewing .sub-tab-content').forEach(d => d.style.display = 'none');
    document.querySelectorAll('#page-brewing .sub-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.subTab === tab));

    const contentId = 'sub' + tab.charAt(0).toUpperCase() + tab.slice(1);
    const contentEl = document.getElementById(contentId);
    if (contentEl) contentEl.style.display = '';

    switch (tab) {
        case 'brewery': renderBrewery(); break;
        case 'recipes': renderRecipes(); break;
        case 'batches': renderBatches(); break;
        case 'inventory': renderInventory(); break;
    }
    wrapTables();
}
