// ==================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ====================

// Текущий авторизованный пользователь (заполняется после входа)
let currentUser = null;

// Массив заказов (МОК-данные для разработки)
// В будущем этот массив будет заменён на ответ от API: fetch('/api/orders')
const ORDERS_DATA = [
    {
        id: '12345',
        number: '12345',
        date: '5 апреля 2026',
        status: 'delivered',
        items: [
            { name: 'iPhone 15 Pro 256GB', qty: 1, price: 219980 },
            { name: 'iPhone 15 Pro 256GB', qty: 1, price: 219980 }
        ],
        total: 439960
    },
    {
        id: '12344',
        number: '12344',
        date: '3 апреля 2026',
        status: 'shipped',
        items: [
            { name: 'Samsung Galaxy S24 Ultra', qty: 1, price: 119990 }
        ],
        total: 119990
    },
    {
        id: '12342',
        number: '12342',
        date: '5 апреля 2026',
        status: 'shipped',
        items: [
            { name: 'Samsung Galaxy S24 Ultra', qty: 1, price: 119990 }
        ],
        total: 119990
    },
    {
        id: '12343',
        number: '12343',
        date: '1 апреля 2026',
        status: 'processing',
        items: [
            { name: 'AirPods Pro 2', qty: 1, price: 24990 }
        ],
        total: 24990
    }
];

// ==================== ИНИЦИАЛИЗАЦИЯ ====================

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();              // Проверяем, авторизован ли пользователь
    initAuthTabs();           // Настраиваем переключение вкладок входа/регистрации
    initProfileTabs();        // Настраиваем переключение вкладок профиля
    initForms();              // Инициализируем формы (заглушка для будущей логики)
    renderOrdersStats();      // Рендерим статистику по заказам
    renderOrdersList();       // Рендерим список заказов из массива ORDERS_DATA
});

document.getElementById('orders-list')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-order-btn]');
    if (btn) {
        const orderId = btn.dataset.orderBtn;
        toggleOrderDetails(orderId);
    }
});

// ==================== АВТОРИЗАЦИЯ ====================

// Проверяем, есть ли данные пользователя в localStorage
function checkAuth() {
    const stored = localStorage.getItem('currentUser');
    currentUser = stored ? JSON.parse(stored) : null;

    if (currentUser) {
        showProfile();        // Показываем профиль, если пользователь авторизован
    } else {
        showAuth();           // Показываем форму входа, если нет
    }
}

// Показываем форму авторизации, скрываем профиль
function showAuth() {
    document.getElementById('auth-view').classList.remove('auth--hidden');
    document.getElementById('profile-view').classList.add('profile--hidden');
}

// Показываем профиль, скрываем форму авторизации
function showProfile() {
    document.getElementById('auth-view').classList.add('auth--hidden');
    document.getElementById('profile-view').classList.remove('profile--hidden');

    // Заполняем данные пользователя в шапке профиля
    if (currentUser) {
        const initials = `${currentUser.firstName?.[0] || ''}${currentUser.lastName?.[0] || ''}`.toUpperCase();
        document.getElementById('user-avatar').textContent = initials || 'П';
        document.getElementById('user-name').textContent = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim();
        document.getElementById('user-email').textContent = currentUser.email || '';
    }
}

// ==================== ВКЛАДКИ АВТОРИЗАЦИИ ====================

// Настраиваем переключение между формами "Войти" и "Регистрация"
function initAuthTabs() {
    const tabs = document.querySelectorAll('.auth__tab');
    const forms = document.querySelectorAll('.auth__form');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;

            // Убираем активный класс со всех вкладок и форм
            tabs.forEach(t => t.classList.remove('auth__tab--active'));
            forms.forEach(f => f.classList.remove('auth__form--active'));

            // Добавляем активный класс к выбранной вкладке и форме
            tab.classList.add('auth__tab--active');
            document.getElementById(`${target}-form`).classList.add('auth__form--active');
        });
    });

    // Обработчик для ссылок "Зарегистрироваться"/"Войти" в футере форм
    document.querySelectorAll('[data-switch]').forEach(link => {
        link.addEventListener('click', () => {
            const target = link.dataset.switch;

            tabs.forEach(t => t.classList.remove('auth__tab--active'));
            forms.forEach(f => f.classList.remove('auth__form--active'));

            document.querySelector(`[data-tab="${target}"]`).classList.add('auth__tab--active');
            document.getElementById(`${target}-form`).classList.add('auth__form--active');
        });
    });
}

// ==================== ВКЛАДКИ ПРОФИЛЯ ====================

// Настраиваем переключение между разделами профиля (Заказы, Данные, Настройки)
function initProfileTabs() {
    const tabs = document.querySelectorAll('.profile__tab');
    const sections = document.querySelectorAll('.profile__section');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;

            // Убираем активный класс со всех вкладок и секций
            tabs.forEach(t => t.classList.remove('profile__tab--active'));
            sections.forEach(s => s.classList.remove('profile__section--active'));

            // Добавляем активный класс к выбранной вкладке и секции
            tab.classList.add('profile__tab--active');
            document.getElementById(`${target}-section`).classList.add('profile__section--active');
        });
    });
}

// ==================== ФОРМЫ ====================

// Заглушка для будущей логики инициализации форм
// Сюда можно добавить валидацию, маски ввода, кастомные обработчики
function initForms() {

}

// ==================== ОБРАБОТКА ВХОДА ====================

document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault(); // Предотвращаем стандартную отправку формы

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const submitBtn = e.target.querySelector('.auth__submit');

    // Блокируем кнопку на время запроса, чтобы избежать повторных кликов
    submitBtn.disabled = true;
    submitBtn.textContent = 'Вход...';

    try {
        // Имитация задержки сети (удалить при подключении реального API)
        await new Promise(r => setTimeout(r, 800));

        // Сохраняем данные пользователя (в реальности придут от сервера)
        currentUser = { firstName: 'Иван', lastName: 'Иванов', email, phone: '+7 900 123 45 67' };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        showNotification('Добро пожаловать!', 'success');
        showProfile();

    } catch (error) {
        console.error('Ошибка входа:', error);
        showNotification('Неверный логин или пароль', 'error');
    } finally {
        // Разблокируем кнопку в любом случае
        submitBtn.disabled = false;
        submitBtn.textContent = 'Войти';
    }
});

// ==================== ОБРАБОТКА РЕГИСТРАЦИИ ====================

document.getElementById('register-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const submitBtn = e.target.querySelector('.auth__submit');

    // Простая валидация пароля
    if (password.length < 6) {
        showNotification('Пароль должен содержать минимум 6 символов', 'error');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Регистрация...';

    try {
        // Имитация задержки сети
        await new Promise(r => setTimeout(r, 800));

        // Сохраняем данные нового пользователя
        currentUser = { firstName: name, lastName: '', email, phone: '' };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        showNotification('Аккаунт создан! Добро пожаловать.', 'success');
        showProfile();

    } catch (error) {
        console.error('Ошибка регистрации:', error);
        showNotification('Ошибка регистрации. Попробуйте снова.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Зарегистрироваться';
    }
});

// ==================== СОХРАНЕНИЕ ДАННЫХ ПРОФИЛЯ ====================

document.getElementById('personal-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = e.target.querySelector('.btn--primary');
    const originalText = submitBtn.textContent;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Сохранение...';

    try {
        // Обновляем данные пользователя в памяти и localStorage
        currentUser.firstName = document.getElementById('input-firstname').value;
        currentUser.lastName = document.getElementById('input-lastname').value;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        // Обновляем отображение имени в шапке профиля
        document.getElementById('user-name').textContent = `${currentUser.firstName} ${currentUser.lastName}`;

        showNotification('Данные успешно сохранены', 'success');
    } catch (error) {
        console.error('Ошибка сохранения:', error);
        showNotification('Не удалось сохранить данные', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});

// ==================== СМЕНА ПАРОЛЯ ====================

document.getElementById('settings-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const newPass = document.getElementById('input-new-password').value;
    const confirm = document.getElementById('input-confirm-password').value;

    // Валидация: пароли должны совпадать и быть не короче 6 символов
    if (newPass !== confirm) {
        showNotification('Пароли не совпадают', 'error');
        return;
    }
    if (newPass.length < 6) {
        showNotification('Пароль должен содержать минимум 6 символов', 'error');
        return;
    }

    const submitBtn = e.target.querySelector('.btn--primary');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Изменение...';

    try {
        // Имитация запроса к API
        await new Promise(r => setTimeout(r, 600));

        showNotification('Пароль успешно изменён', 'success');
        e.target.reset(); // Очищаем форму
    } catch (error) {
        console.error('Ошибка смены пароля:', error);
        showNotification('Ошибка при смене пароля', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Изменить пароль';
    }
});

// ==================== ВЫХОД ИЗ АККАУНТА ====================

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    showNotification('Вы вышли из аккаунта', 'success');
    showAuth();
}

document.getElementById('logout-btn-header')?.addEventListener('click', logout);

// ==================== РЕНДЕРИНГ ЗАКАЗОВ ====================

// Форматирует число в формат валюты (например, 439960 → "439 960 ₽")
function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
}

// Возвращает текст и класс для статуса заказа
function getStatusInfo(status) {
    const statuses = {
        delivered: { text: 'Доставлен', class: 'order-card__status--delivered' },
        shipped: { text: 'Доставляется', class: 'order-card__status--shipped' },
        processing: { text: 'Обрабатывается', class: 'order-card__status--processing' }
    };
    return statuses[status] || { text: 'Неизвестно', class: '' };
}

// Рендерит статистику по заказам (всего заказов и общая сумма)
function renderOrdersStats() {
    const totalOrders = ORDERS_DATA.length;
    const totalSum = ORDERS_DATA.reduce((sum, order) => sum + order.total, 0);

    document.getElementById('stat-total-orders').textContent = totalOrders;
    document.getElementById('stat-total-sum').textContent = formatPrice(totalSum);
}

// Рендерит список заказов из массива ORDERS_DATA
function renderOrdersList() {
    const container = document.getElementById('orders-list');
    if (!container) return;

    const ordersHTML = ORDERS_DATA.map(order => {
        const status = getStatusInfo(order.status);

        // Генерируем HTML для списка товаров
        const itemsHTML = order.items.map(item => `
            <div class="order-card__details-item">
                <span>
                    <span class="order-card__details-item-name">${item.name}</span>
                    <span class="order-card__details-item-qty">× ${item.qty}</span>
                </span>
                <span class="order-card__details-item-price">${formatPrice(item.price * item.qty)}</span>
            </div>
        `).join('');

        return `
            <div class="order-card" data-order="${order.id}">
                <div class="order-card__header">
                    <div>
                        <div class="order-card__number">Заказ №${order.number}</div>
                        <div class="order-card__date">от ${order.date}</div>
                    </div>
                    <span class="order-card__status ${status.class}">${status.text}</span>
                </div>

                <!-- Скрытые детали заказа (только состав) -->
                <div class="order-card__details">
                    <h4 style="font-size: 13px; font-weight: 600; margin-bottom: 10px; font-family: var(--font-header);">
                        Состав заказа:
                    </h4>
                    <div class="order-card__details-list">
                        ${itemsHTML}
                    </div>
                    
                    <div class="order-card__details-total">
                        <span>Итого:</span>
                        <span>${formatPrice(order.total)}</span>
                    </div>
                </div>

                <div class="order-card__actions">
                    <button class="btn btn--secondary" data-order-btn="${order.id}">Детали</button>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = ordersHTML;
}

// Переключает видимость деталей заказа (раскрывает/скрывает)
function toggleOrderDetails(orderId) {
    const card = document.querySelector(`[data-order="${orderId}"]`);
    const details = card.querySelector('.order-card__details');
    const btn = card.querySelector('.btn--secondary');

    if (details.classList.contains('order-card__details--visible')) {
        // Если детали уже открыты — закрываем
        details.classList.remove('order-card__details--visible');
        details.style.maxHeight = '0';
        btn.textContent = 'Детали';
    } else {
        // Закрываем все другие открытые заказы (опционально)
        document.querySelectorAll('.order-card__details--visible').forEach(detail => {
            detail.classList.remove('order-card__details--visible');
            detail.style.maxHeight = '0';
        });
        document.querySelectorAll('.order-card__actions .btn--secondary').forEach(b => {
            if (b !== btn) b.textContent = 'Детали';
        });

        // Открываем текущий заказ
        details.classList.add('order-card__details--visible');
        details.style.maxHeight = details.scrollHeight + 'px';
        btn.textContent = 'Скрыть';
    }
}