function renderManagement() {
    const el = document.getElementById('page-management');
    el.innerHTML = `
        <h2>🏢 Управление</h2>
        <div class="sub-tabs" data-sub="management">
            <div class="sub-tab-bar">
                <button class="sub-tab-btn active" data-sub-tab="finance">📈 Финансы</button>
                <button class="sub-tab-btn" data-sub-tab="staff">👥 Персонал</button>
                <button class="sub-tab-btn" data-sub-tab="research">🔬 Исследования</button>
            </div>
            <div id="subFinance" class="sub-tab-content"><div id="page-finance"></div></div>
            <div id="subStaff" class="sub-tab-content" style="display:none"><div id="page-staff"></div></div>
            <div id="subResearch" class="sub-tab-content" style="display:none"><div id="page-research"></div></div>
        </div>
    `;

    document.querySelectorAll('#page-management .sub-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchManagementTab(btn.dataset.subTab));
    });

    switchManagementTab('finance');
}

function switchManagementTab(tab) {
    document.querySelectorAll('#page-management .sub-tab-content').forEach(d => d.style.display = 'none');
    document.querySelectorAll('#page-management .sub-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.subTab === tab));

    const contentId = 'sub' + tab.charAt(0).toUpperCase() + tab.slice(1);
    const contentEl = document.getElementById(contentId);
    if (contentEl) contentEl.style.display = '';

    switch (tab) {
        case 'finance': renderFinance().then(() => wrapTables()); break;
        case 'staff': renderStaff(); break;
        case 'research': renderResearch(); break;
    }
}
