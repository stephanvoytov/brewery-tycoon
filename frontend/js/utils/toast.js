function showError(msg) {
    const existing = document.querySelector('.toast-error');
    if (existing) existing.remove();
    const div = document.createElement('div');
    div.className = 'toast-error';
    div.textContent = msg;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 6000);
}

function showSuccess(msg) {
    const existing = document.querySelector('.toast-success');
    if (existing) existing.remove();
    const div = document.createElement('div');
    div.className = 'toast-success';
    div.textContent = msg;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 4000);
}

function showNotification(msg, type = 'info') {
    const colors = {
        info: '#3498db',
        success: '#4caf50',
        warning: '#f39c12',
        danger: '#e74c3c',
        achievement: '#d4a017',
    };
    const div = document.createElement('div');
    div.className = 'toast-notification';
    div.style.borderLeft = `4px solid ${colors[type] || colors.info}`;
    div.innerHTML = msg;
    document.body.appendChild(div);
    setTimeout(() => {
        div.style.opacity = '0';
        div.style.transform = 'translateX(100px)';
        setTimeout(() => div.remove(), 300);
    }, 5000);
}
