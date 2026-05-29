const TUTORIAL_STEPS = [
    {
        icon: '🍺',
        title: 'Добро пожаловать в Пивоваренный Тайкун!',
        desc: 'Это экономическая стратегия, где ты управляешь своей пивоварней. Твоя цель — заработать $100,000 выручки.',
        tip: 'Следи за балансом на дашборде — не уходи в минус надолго!',
    },
    {
        icon: '📝',
        title: 'Свари своё первое пиво',
        desc: 'Открой раздел "Рецепты". Выбери стиль, ингредиенты и создай рецепт. Затем нажми "Варить" — партия пойдёт по стадиям: затирание → кипячение → ферментация → дозревание.',
        tip: 'Используй рекомендованные ингредиенты для выбранного стиля — качество будет выше!',
    },
    {
        icon: '💰',
        title: 'Продавай готовое пиво',
        desc: 'Когда партия созреет, она появится в "Партиях" как готовая. Открой "Рынок" → подпиши контракт на нужный стиль пива. Каждый день невыполненные партии автоматически продаются по контрактам.',
        tip: 'Качество пива влияет на цену: quality ×2 = цена ×2!',
    },
    {
        icon: '👥',
        title: 'Найми команду',
        desc: 'В разделе "Персонал" найми сотрудников: 🍺 Пивовары ускоряют варку, 🤝 Продавцы повышают цены контрактов, 📋 Админы снижают расходы.',
        tip: 'Не забывай тренировать сотрудников и следи за их моралью — низкая мораль снижает эффективность!',
    },
    {
        icon: '📈',
        title: 'Управляй финансами',
        desc: 'В "Финансах" ты видишь доходы, расходы, налоги и кредиты. Инфляция каждые 30 дней поднимает цены. Улучшай пивоварню и исследуй новые технологии!',
        tip: 'Бери кредиты осторожно — ставка до 1%/день. Долг более $5,000 на 30 дней = банкротство!',
    },
];

function showTutorial() {
    const overlay = document.getElementById('tutorialOverlay');
    if (!overlay) return;

    const stored = localStorage.getItem('tutorialDone');
    if (stored === '1') return;

    let currentStep = 0;

    function renderStep(index) {
        const step = TUTORIAL_STEPS[index];
        document.getElementById('tutorialStep').innerHTML = `
            <div class="tutorial-icon">${step.icon}</div>
            <div class="tutorial-title">${step.title}</div>
            <div class="tutorial-desc">${step.desc}</div>
            <div class="tutorial-tip">💡 ${step.tip}</div>
        `;

        const nextBtn = document.getElementById('tutorialNext');
        if (index === TUTORIAL_STEPS.length - 1) {
            nextBtn.textContent = 'Готово! 🎉';
        } else {
            nextBtn.textContent = 'Далее →';
        }

        const dots = document.getElementById('tutorialDots');
        dots.innerHTML = TUTORIAL_STEPS.map((_, i) =>
            `<span class="dot ${i === index ? 'active' : ''}" data-idx="${i}"></span>`
        ).join('');

        dots.querySelectorAll('.dot').forEach(d => {
            d.addEventListener('click', () => {
                currentStep = parseInt(d.dataset.idx);
                renderStep(currentStep);
            });
        });
    }

    document.getElementById('tutorialNext').onclick = () => {
        if (currentStep === TUTORIAL_STEPS.length - 1) {
            localStorage.setItem('tutorialDone', '1');
            overlay.style.display = 'none';
            return;
        }
        currentStep++;
        renderStep(currentStep);
    };

    document.getElementById('tutorialSkip').onclick = () => {
        localStorage.setItem('tutorialDone', '1');
        overlay.style.display = 'none';
    };

    overlay.style.display = 'flex';
    renderStep(0);
}
