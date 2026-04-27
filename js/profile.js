import { 
    registerUser, 
    loginUser, 
    logoutUser, 
    getCurrentUser, 
    updateProfile, 
    changePassword,
    getUserOrders,
    apiRequest 
} from './api.js';
import { initCartButtons } from './cart-buttons.js';
import { renderProductCard, getPluralForm } from './product-render.js';

//  ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ 
let currentUser = null;

//  ИНИЦИАЛИЗАЦИЯ 
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    initAuthTabs();
    initProfileTabs();
    initForms();
    
    // Загружаем заказы только если пользователь авторизован
    if (currentUser) {
        await loadOrders();
    }
});

// Обработчик деталей заказа
document.getElementById('orders-list')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-order-btn]');
    if (btn) {
        const orderId = btn.dataset.orderBtn;
        toggleOrderDetails(orderId);
    }
});

//  АВТОРИЗАЦИЯ 
async function checkAuth() {
    const token = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('currentUser');
    
    if (token) {
        try {
            const response = await getCurrentUser();
            currentUser = response.user;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showProfile();
        } catch (error) {
            console.warn('Токен невалиден:', error.message);
            logout();
        }
    } else if (storedUser) {
        currentUser = JSON.parse(storedUser);
        showProfile();
    } else {
        showAuth();
    }
}

function showAuth() {
    document.getElementById('auth-view')?.classList.remove('auth--hidden');
    document.getElementById('profile-view')?.classList.add('profile--hidden');
}

function showProfile() {
    document.getElementById('auth-view')?.classList.add('auth--hidden');
    document.getElementById('profile-view')?.classList.remove('profile--hidden');
    if (currentUser) {
        updateProfileUI(currentUser);
        loadOrders();
    }
}

function updateProfileUI(user) {
    const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase();
    document.getElementById('user-avatar').textContent = initials || 'П';
    document.getElementById('user-name').textContent = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    document.getElementById('user-email').textContent = user.email || '';
    
    const fnameInput = document.getElementById('input-firstname');
    const lnameInput = document.getElementById('input-lastname');
    const emailInput = document.querySelector('#personal-form input[type="email"]');
    
    if (fnameInput) fnameInput.value = user.first_name || '';
    if (lnameInput) lnameInput.value = user.last_name || '';
    if (emailInput) emailInput.value = user.email || '';
}

//  ВКЛАДКИ 
function initAuthTabs() {
    const tabs = document.querySelectorAll('.auth__tab');
    const forms = document.querySelectorAll('.auth__form');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            tabs.forEach(t => t.classList.remove('auth__tab--active'));
            forms.forEach(f => f.classList.remove('auth__form--active'));
            tab.classList.add('auth__tab--active');
            document.getElementById(`${target}-form`)?.classList.add('auth__form--active');
        });
    });
    document.querySelectorAll('[data-switch]').forEach(link => {
        link.addEventListener('click', () => {
            const target = link.dataset.switch;
            tabs.forEach(t => t.classList.remove('auth__tab--active'));
            forms.forEach(f => f.classList.remove('auth__form--active'));
            document.querySelector(`[data-tab="${target}"]`)?.classList.add('auth__tab--active');
            document.getElementById(`${target}-form`)?.classList.add('auth__form--active');
        });
    });
}

function initProfileTabs() {
    const tabs = document.querySelectorAll('.profile__tab');
    const sections = document.querySelectorAll('.profile__section');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            tabs.forEach(t => t.classList.remove('profile__tab--active'));
            sections.forEach(s => s.classList.remove('profile__section--active'));
            tab.classList.add('profile__tab--active');
            document.getElementById(`${target}-section`)?.classList.add('profile__section--active');
        });
    });
}

//  ФОРМЫ 
function initForms() {
    initLoginForm();
    initRegisterForm();
    initPersonalForm();
    initSettingsForm();
    initLogout();
}

//  ВХОД / РЕГИСТРАЦИЯ 
function initLoginForm() {
    const form = document.getElementById('login-form');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const submitBtn = form.querySelector('.auth__submit');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Вход...';
        try {
            const result = await loginUser({ email, password });
            if (typeof showNotification === 'function') showNotification('Добро пожаловать!', 'success');
            currentUser = result.user;
            showProfile();
        } catch (error) {
            console.error('Ошибка входа:', error);
            if (typeof showNotification === 'function') showNotification(error.message || 'Неверный логин или пароль', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Войти';
        }
    });
}

function initRegisterForm() {
    const form = document.getElementById('register-form');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const first_name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const submitBtn = form.querySelector('.auth__submit');
        if (password.length < 6) {
            if (typeof showNotification === 'function') showNotification('Пароль должен содержать минимум 6 символов', 'error');
            return;
        }
        submitBtn.disabled = true;
        submitBtn.textContent = 'Регистрация...';
        try {
            const result = await registerUser({ email, password, first_name, last_name: '' });
            if (typeof showNotification === 'function') showNotification('Аккаунт создан!', 'success');
            currentUser = result.user;
            showProfile();
        } catch (error) {
            console.error('Ошибка регистрации:', error);
            if (typeof showNotification === 'function') showNotification(error.message || 'Ошибка регистрации', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Зарегистрироваться';
        }
    });
}

//  ЛИЧНЫЕ ДАННЫЕ / ПАРОЛЬ 
function initPersonalForm() {
    const form = document.getElementById('personal-form');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = form.querySelector('.btn--primary');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Сохранение...';
        try {
            const data = {
                first_name: document.getElementById('input-firstname').value,
                last_name: document.getElementById('input-lastname').value
            };
            const result = await updateProfile(data);
            currentUser = { ...currentUser, ...result.user };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            updateProfileUI(currentUser);
            if (typeof showNotification === 'function') showNotification('Данные сохранены', 'success');
        } catch (error) {
            console.error('Ошибка сохранения:', error);
            if (typeof showNotification === 'function') showNotification(error.message || 'Не удалось сохранить', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
}

function initSettingsForm() {
    const form = document.getElementById('settings-form');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = form.querySelector('.btn--primary');
        const newPassword = document.getElementById('input-new-password').value;
        const confirmPassword = document.getElementById('input-confirm-password').value;
        if (newPassword !== confirmPassword) {
            if (typeof showNotification === 'function') showNotification('Пароли не совпадают', 'error');
            return;
        }
        if (newPassword.length < 6) {
            if (typeof showNotification === 'function') showNotification('Минимум 6 символов', 'error');
            return;
        }
        submitBtn.disabled = true;
        submitBtn.textContent = 'Изменение...';
        try {
            await changePassword({ 
                currentPassword: document.getElementById('input-current-password').value,
                newPassword 
            });
            if (typeof showNotification === 'function') showNotification('Пароль изменён', 'success');
            form.reset();
        } catch (error) {
            console.error('Ошибка смены пароля:', error);
            if (typeof showNotification === 'function') showNotification(error.message || 'Ошибка', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Изменить пароль';
        }
    });
}

function initLogout() {
    document.getElementById('logout-btn-header')?.addEventListener('click', logout);
}

function logout() {
    logoutUser();
    currentUser = null;
    if (typeof showNotification === 'function') showNotification('Вы вышли', 'success');
    showAuth();
}

// Загрузка заказов с сервера
async function loadOrders() {
    const container = document.getElementById('orders-list');
    const statsTotalOrders = document.getElementById('stat-total-orders');
    const statsTotalSum = document.getElementById('stat-total-sum');
    
    if (container) {
        container.innerHTML = '<div class="catalog__loading"><div class="spinner"></div><p>Загрузка заказов...</p></div>';
    }
    
    try {
        const response = await getUserOrders();
        const orders = response.orders || [];
        const stats = response.stats || { total_orders: 0, total_sum: 0 };
        
        renderOrdersStats(stats.total_orders, stats.total_sum);
        renderOrdersList(orders);
        
    } catch (error) {
        console.error('Ошибка загрузки заказов:', error);
        if (container) {
            container.innerHTML = `<div class="catalog__error"><p>Не удалось загрузить заказы</p><p style="font-size:12px;color:#999">${error.message}</p></div>`;
        }
        renderOrdersStats(0, 0);
    }
}

// Форматирование цены
function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
}

// Статус заказа → текст + класс
function getStatusInfo(status) {
    const statuses = {
        new: { text: 'Новый', class: 'order-card__status--new' },
        delivered: { text: 'Доставлен', class: 'order-card__status--delivered' },
        shipped: { text: 'Доставляется', class: 'order-card__status--shipped' },
        processing: { text: 'Обрабатывается', class: 'order-card__status--processing' },
        pending: { text: 'Ожидает', class: 'order-card__status--pending' },
        cancelled: { text: 'Отменён', class: 'order-card__status--cancelled' }
    };
    return statuses[status] || { text: status, class: '' };
}

// Форматирование даты
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { 
        day: 'numeric', month: 'long', year: 'numeric' 
    });
}

// Обновление статистики
function renderOrdersStats(totalOrders, totalSum) {
    const statOrders = document.getElementById('stat-total-orders');
    const statSum = document.getElementById('stat-total-sum');
    if (statOrders) statOrders.textContent = totalOrders;
    if (statSum) statSum.textContent = formatPrice(totalSum);
}

// Рендер списка заказов
function renderOrdersList(orders) {
    const container = document.getElementById('orders-list');
    if (!container) return;
    
    if (!orders || orders.length === 0) {
        container.innerHTML = '<div class="catalog__empty"><p>У вас пока нет заказов</p></div>';
        return;
    }
    
    const ordersHTML = orders.map(order => {
        const status = getStatusInfo(order.status);
        const orderDate = formatDate(order.created_at);
        
        // Список товаров в заказе
        const itemsHTML = (order.items || []).map(item => {
            const specs = [];
            if (item.ram) specs.push(`${item.ram}GB RAM`);
            if (item.storage) specs.push(`${item.storage}GB`);
            if (item.color) specs.push(item.color);
            const specsText = specs.length > 0 ? `· ${specs.join(' · ')}` : '';
            
            return `
                <div class="order-card__details-item">
                    <span>
                        <span class="order-card__details-item-name">${item.name}</span>
                        <span class="order-card__details-item-specs">${specsText}</span>
                        <span class="order-card__details-item-qty">× ${item.quantity}</span>
                    </span>
                    <span class="order-card__details-item-price">${formatPrice(item.price * item.quantity)}</span>
                </div>
            `;
        }).join('');
        
        // Информация о доставке
        let deliveryText = '';
        if (order.delivery_type === 'delivery' && order.delivery) {
            deliveryText = `Доставка: ${order.delivery.city}, ${order.delivery.street} ${order.delivery.house}`;
        } else if (order.delivery_type === 'pickup' && order.delivery?.pickup_points) {
            deliveryText = `Самовывоз: ${order.delivery.pickup_points.name}`;
        }
        
        return `
            <div class="order-card" data-order="${order.id_order}">
                <div class="order-card__header">
                    <div>
                        <div class="order-card__number">Заказ №${order.id_order}</div>
                        <div class="order-card__date">от ${orderDate}</div>
                        ${deliveryText ? `<div class="order-card__delivery" style="font-size:12px;color:#666;margin-top:4px">${deliveryText}</div>` : ''}
                    </div>
                    <span class="order-card__status ${status.class}">${status.text}</span>
                </div>
                
                <div class="order-card__details">
                    <h4 style="font-size:13px;font-weight:600;margin-bottom:10px">Состав заказа:</h4>
                    <div class="order-card__details-list">
                        ${itemsHTML}
                    </div>
                    <div class="order-card__details-total">
                        <span>Итого:</span>
                        <span style="font-weight:600">${formatPrice(order.total_amount)}</span>
                    </div>
                    <div style="margin-top:8px;font-size:12px;color:#666">
                        Оплата: ${order.payment_type === 'online' ? 'Онлайн' : 'При получении'}
                    </div>
                </div>
                
                <div class="order-card__actions">
                    <button class="btn btn--secondary" data-order-btn="${order.id_order}">Детали</button>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = ordersHTML;
}

// Переключение деталей заказа
function toggleOrderDetails(orderId) {
    const card = document.querySelector(`[data-order="${orderId}"]`);
    const details = card?.querySelector('.order-card__details');
    const btn = card?.querySelector('.btn--secondary');
    if (!details || !btn) return;
    
    if (details.classList.contains('order-card__details--visible')) {
        details.classList.remove('order-card__details--visible');
        details.style.maxHeight = '0';
        btn.textContent = 'Детали';
    } else {
        document.querySelectorAll('.order-card__details--visible').forEach(d => {
            d.classList.remove('order-card__details--visible');
            d.style.maxHeight = '0';
        });
        document.querySelectorAll('.order-card__actions .btn--secondary').forEach(b => {
            if (b !== btn) b.textContent = 'Детали';
        });
        details.classList.add('order-card__details--visible');
        details.style.maxHeight = details.scrollHeight + 'px';
        btn.textContent = 'Скрыть';
    }
}