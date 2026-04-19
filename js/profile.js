// js/profile.js
import { 
    registerUser, 
    loginUser, 
    logoutUser, 
    getCurrentUser, 
    updateProfile, 
    changePassword,
    apiRequest 
} from './api.js';
import { initCartButtons } from './cart-buttons.js';
import { renderProductCard, getPluralForm } from './product-render.js';

//  ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ 
let currentUser = null;

// Мок-данные заказов (пока нет реального API)
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

//  ИНИЦИАЛИЗАЦИЯ 
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();              // Проверяем авторизацию (с запросом к серверу)
    initAuthTabs();                 // Переключение вкладок входа/регистрации
    initProfileTabs();              // Переключение вкладок профиля
    initForms();                    // Обработчики форм
    renderOrdersStats();            // Статистика заказов
    renderOrdersList();             // Список заказов (мок)
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

// Проверка авторизации с запросом к серверу
async function checkAuth() {
    const token = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('currentUser');
    
    // Если есть токен, проверяем его на сервере
    if (token) {
        try {
            const response = await getCurrentUser();
            currentUser = response.user;
            // Обновляем данные в localStorage
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showProfile();
        } catch (error) {
            console.warn('Токен невалиден, выходим:', error.message);
            logout();
        }
    } 
    // Если нет токена, но есть данные в localStorage (после регистрации/входа)
    else if (storedUser) {
        currentUser = JSON.parse(storedUser);
        showProfile();
    } 
    else {
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
    }
}

// Обновление UI профиля
function updateProfileUI(user) {
    const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase();
    document.getElementById('user-avatar').textContent = initials || 'П';
    document.getElementById('user-name').textContent = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    document.getElementById('user-email').textContent = user.email || '';
    
    // Заполняем форму личных данных
    const fnameInput = document.getElementById('input-firstname');
    const lnameInput = document.getElementById('input-lastname');
    const phoneInput = document.getElementById('input-phone');
    const emailInput = document.querySelector('#personal-form input[type="email"]');
    
    if (fnameInput) fnameInput.value = user.first_name || '';
    if (lnameInput) lnameInput.value = user.last_name || '';
    if (phoneInput && user.phone) phoneInput.value = user.phone;
    if (emailInput) emailInput.value = user.email || '';
}

//  ВКЛАДКИ АВТОРИЗАЦИИ 
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

//  ВКЛАДКИ ПРОФИЛЯ 
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

//  ВХОД 
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
            
            if (typeof showNotification === 'function') {
                showNotification('Добро пожаловать!', 'success');
            }
            
            currentUser = result.user;
            showProfile();
            
        } catch (error) {
            console.error('Ошибка входа:', error);
            if (typeof showNotification === 'function') {
                showNotification(error.message || 'Неверный логин или пароль', 'error');
            }
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Войти';
        }
    });
}

//  РЕГИСТРАЦИЯ 
function initRegisterForm() {
    const form = document.getElementById('register-form');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const first_name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const submitBtn = form.querySelector('.auth__submit');
        
        // Валидация
        if (password.length < 6) {
            if (typeof showNotification === 'function') {
                showNotification('Пароль должен содержать минимум 6 символов', 'error');
            }
            return;
        }
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'Регистрация...';
        
        try {
            const result = await registerUser({ 
                email, 
                password, 
                first_name,
                last_name: '' 
            });
            
            if (typeof showNotification === 'function') {
                showNotification('Аккаунт создан! Добро пожаловать.', 'success');
            }
            
            currentUser = result.user;
            showProfile();
            
        } catch (error) {
            console.error('Ошибка регистрации:', error);
            if (typeof showNotification === 'function') {
                showNotification(error.message || 'Ошибка регистрации', 'error');
            }
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Зарегистрироваться';
        }
    });
}

//  ЛИЧНЫЕ ДАННЫЕ 
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
            
            // Обновляем данные в localStorage и UI
            currentUser = { ...currentUser, ...result.user };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            updateProfileUI(currentUser);
            
            if (typeof showNotification === 'function') {
                showNotification('Данные успешно сохранены', 'success');
            }
        } catch (error) {
            console.error('Ошибка сохранения:', error);
            if (typeof showNotification === 'function') {
                showNotification(error.message || 'Не удалось сохранить данные', 'error');
            }
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
}

//  СМЕНА ПАРОЛЯ 
function initSettingsForm() {
    const form = document.getElementById('settings-form');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = form.querySelector('.btn--primary');
        
        const currentPassword = document.getElementById('input-current-password').value;
        const newPassword = document.getElementById('input-new-password').value;
        const confirmPassword = document.getElementById('input-confirm-password').value;
        
        if (newPassword !== confirmPassword) {
            if (typeof showNotification === 'function') {
                showNotification('Пароли не совпадают', 'error');
            }
            return;
        }
        if (newPassword.length < 6) {
            if (typeof showNotification === 'function') {
                showNotification('Пароль должен содержать минимум 6 символов', 'error');
            }
            return;
        }
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'Изменение...';
        
        try {
            await changePassword({ currentPassword, newPassword });
            
            if (typeof showNotification === 'function') {
                showNotification('Пароль успешно изменён', 'success');
            }
            form.reset();
        } catch (error) {
            console.error('Ошибка смены пароля:', error);
            if (typeof showNotification === 'function') {
                showNotification(error.message || 'Ошибка при смене пароля', 'error');
            }
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Изменить пароль';
        }
    });
}

//  ВЫХОД 
function initLogout() {
    document.getElementById('logout-btn-header')?.addEventListener('click', logout);
}

function logout() {
    logoutUser();
    currentUser = null;
    
    if (typeof showNotification === 'function') {
        showNotification('Вы вышли из аккаунта', 'success');
    }
    
    showAuth();
}

//  РЕНДЕРИНГ ЗАКАЗОВ (МОК) 
function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
}

function getStatusInfo(status) {
    const statuses = {
        delivered: { text: 'Доставлен', class: 'order-card__status--delivered' },
        shipped: { text: 'Доставляется', class: 'order-card__status--shipped' },
        processing: { text: 'Обрабатывается', class: 'order-card__status--processing' }
    };
    return statuses[status] || { text: 'Неизвестно', class: '' };
}

function renderOrdersStats() {
    const totalOrders = ORDERS_DATA.length;
    const totalSum = ORDERS_DATA.reduce((sum, order) => sum + order.total, 0);
    
    document.getElementById('stat-total-orders').textContent = totalOrders;
    document.getElementById('stat-total-sum').textContent = formatPrice(totalSum);
}

function renderOrdersList() {
    const container = document.getElementById('orders-list');
    if (!container) return;
    
    const ordersHTML = ORDERS_DATA.map(order => {
        const status = getStatusInfo(order.status);
        
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
        document.querySelectorAll('.order-card__details--visible').forEach(detail => {
            detail.classList.remove('order-card__details--visible');
            detail.style.maxHeight = '0';
        });
        document.querySelectorAll('.order-card__actions .btn--secondary').forEach(b => {
            if (b !== btn) b.textContent = 'Детали';
        });
        
        details.classList.add('order-card__details--visible');
        details.style.maxHeight = details.scrollHeight + 'px';
        btn.textContent = 'Скрыть';
    }
}