function showConfirm(title, text) {
    return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.className = 'dialog-overlay';
        overlay.innerHTML = `
            <div class="dialog-box">
                <h3>${esc(title)}</h3>
                <p>${esc(text)}</p>
                <div class="dialog-actions">
                    <button class="btn btn-secondary" id="dialogCancel">Отмена</button>
                    <button class="btn btn-primary" id="dialogOk">Да</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        overlay.querySelector('#dialogCancel').onclick = () => { overlay.remove(); resolve(false); };
        overlay.querySelector('#dialogOk').onclick = () => { overlay.remove(); resolve(true); };
        overlay.onclick = e => { if (e.target === overlay) { overlay.remove(); resolve(false); } };
    });
}

function showPrompt(title, text, defaultValue) {
    return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.className = 'dialog-overlay';
        overlay.innerHTML = `
            <div class="dialog-box">
                <h3>${esc(title)}</h3>
                <p>${esc(text)}</p>
                <input type="text" id="dialogInput" value="${esc(defaultValue || '')}" placeholder="...">
                <div class="dialog-actions">
                    <button class="btn btn-secondary" id="dialogCancel">Отмена</button>
                    <button class="btn btn-primary" id="dialogOk">OK</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        const input = overlay.querySelector('#dialogInput');
        input.focus();
        input.select();
        overlay.querySelector('#dialogCancel').onclick = () => { overlay.remove(); resolve(null); };
        overlay.querySelector('#dialogOk').onclick = () => { overlay.remove(); resolve(input.value); };
        overlay.onclick = e => { if (e.target === overlay) { overlay.remove(); resolve(null); } };
        input.onkeydown = e => { if (e.key === 'Enter') { overlay.remove(); resolve(input.value); } };
    });
}
