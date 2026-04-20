// js/checkout.js
import { getCart, getPickupPoints, createOrder, apiRequest } from './api.js';

// ==================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ====================
let checkoutItems = [];
let pickupPoints = [];
let selectedPickupId = null;
let deliveryType = 'pickup';
let paymentType = 'online';

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Проверяем авторизацию
    await checkAuth();
    
    // 2. Загружаем корзину
    await loadCartItems();
    
    // 3. Загружаем пункты выдачи
    await loadPickupPoints();
    
    // 4. Инициализируем обработчики
    initDeliveryToggle();
    initPaymentToggle();
    initPickupSelection();
    initInputMasks();
    initFormSubmit();
    
    // 5. Обновляем итоговую сумму
    updateSummary(checkoutItems);
});

// ==================== АВТОРИЗАЦИЯ ====================
async function checkAuth() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        // Перенаправляем на вход с возвратом на чекаут
        window.location.href = 'profile.html?redirect=checkout';
        return;
    }
    
    try {
        await apiRequest('http://localhost:3000/api/auth/me');
    } catch (error) {
        console.warn('Токен невалиден:', error.message);
        logoutUser();
        window.location.href = 'profile.html';
    }
}

// ==================== ЗАГРУЗКА КОРЗИНЫ ====================
async function loadCartItems() {
    const container = document.querySelector('.cart__summary-list');
    if (container) {
        container.innerHTML = '<div class="catalog__loading"><p>Загрузка товаров...</p></div>';
    }
    
    try {
        const response = await getCart();
        
        // Проверяем структуру ответа
        checkoutItems = response.items || response.data?.items || [];
        
        if (checkoutItems.length === 0) {
            console.warn('[CHECKOUT] Корзина пуста');
            window.location.href = 'cart.html?empty=1';
            return;
        }
        
        updateSummary(checkoutItems);
        
    } catch (error) {
        showNotification('Не удалось загрузить корзину: ' + error.message, 'error');
    }
}

// ==================== ЗАГРУЗКА ПУНКТОВ ВЫДАЧИ ====================
async function loadPickupPoints() {
    const pickupList = document.getElementById('pickup-list');
    if (!pickupList) return;
    
    try {
        const response = await getPickupPoints();
        pickupPoints = response.pickupPoints || [];
        
        if (pickupPoints.length === 0) {
            pickupList.innerHTML = '<div class="pickup-item">Пункты выдачи временно недоступны</div>';
            return;
        }
        
        // Рендерим пункты выдачи
        pickupList.innerHTML = pickupPoints.map((point, index) => `
            <div class="pickup-item ${index === 0 ? 'pickup-item--active' : ''}" 
                 data-pickup 
                 data-id="${point.id}">
                <div class="pickup-item__name">${point.name}</div>
                <div class="pickup-item__info">${point.address}</div>
                <div class="pickup-item__info">${point.workHours}</div>
            </div>
        `).join('');
        
        // Обновляем обработчики кликов
        initPickupSelection();
        
    } catch (error) {
        console.error('Ошибка загрузки пунктов выдачи:', error);
        pickupList.innerHTML = '<div class="pickup-item">Ошибка загрузки пунктов выдачи</div>';
    }
}

// ==================== ПЕРЕКЛЮЧЕНИЕ ДОСТАВКИ ====================
function initDeliveryToggle() {
    const deliveryToggle = document.querySelector('[data-toggle="delivery"]');
    if (!deliveryToggle) return;
    
    const btns = deliveryToggle.querySelectorAll('.delivery-method__btn');
    const pickupEl = document.getElementById('pickup-content');
    const deliveryEl = document.getElementById('delivery-content');

    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            btns.forEach(b => b.classList.remove('delivery-method__btn--active'));
            btn.classList.add('delivery-method__btn--active');

            if (btn.dataset.target === 'pickup') {
                deliveryType = 'pickup';
                pickupEl.style.display = 'block';
                deliveryEl.style.display = 'none';
            } else {
                deliveryType = 'delivery';
                pickupEl.style.display = 'none';
                deliveryEl.style.display = 'block';
            }
            clearErrors();
            updateSummary(checkoutItems); // Пересчитать доставку
        });
    });
}

// ==================== ПЕРЕКЛЮЧЕНИЕ ОПЛАТЫ ====================
function initPaymentToggle() {
    const paymentToggle = document.querySelector('[data-toggle="payment"]');
    if (!paymentToggle) return;
    
    const btns = paymentToggle.querySelectorAll('.delivery-method__btn');
    const cardForm = document.getElementById('card-form');

    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            btns.forEach(b => b.classList.remove('delivery-method__btn--active'));
            btn.classList.add('delivery-method__btn--active');

            if (btn.dataset.target === 'online') {
                paymentType = 'online';
                cardForm.classList.add('card-form--visible');
            } else {
                paymentType = 'cod';
                cardForm.classList.remove('card-form--visible');
            }
            clearErrors();
        });
    });
}

// ==================== ВЫБОР ПУНКТА ВЫДАЧИ ====================
function initPickupSelection() {
    const pickupItems = document.querySelectorAll('[data-pickup]');
    pickupItems.forEach(item => {
        item.addEventListener('click', () => {
            pickupItems.forEach(i => i.classList.remove('pickup-item--active'));
            item.classList.add('pickup-item--active');
            selectedPickupId = item.dataset.id;
            clearErrors();
        });
    });
    
    // Устанавливаем первый пункт как выбранный по умолчанию
    if (pickupItems.length > 0 && !selectedPickupId) {
        pickupItems[0].click();
    }
}

// ==================== МАСКИ ВВОДА ====================
function initInputMasks() {
    // Телефон
    const phoneInput = document.getElementById('input-phone');
    phoneInput?.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        let formatted = '';
        if (value.length > 0) {
            if (value[0] === '7' || value[0] === '8') {
                formatted = '+7';
                if (value.length > 1) formatted += ' (' + value.substring(1, 4);
                if (value.length > 4) formatted += ') ' + value.substring(4, 7);
                if (value.length > 7) formatted += '-' + value.substring(7, 9);
                if (value.length > 9) formatted += '-' + value.substring(9, 11);
            } else {
                formatted = '+7 (' + value.substring(0, 3);
                if (value.length > 3) formatted += ') ' + value.substring(3, 6);
                if (value.length > 6) formatted += '-' + value.substring(6, 8);
                if (value.length > 8) formatted += '-' + value.substring(8, 10);
            }
        }
        e.target.value = formatted;
        clearFieldError('phone');
    });

    // Карта
    const cardInput = document.getElementById('input-card');
    cardInput?.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '').substring(0, 16);
        let formatted = value.match(/.{1,4}/g)?.join(' ') || '';
        e.target.value = formatted;
        clearFieldError('card');
    });

    // Срок
    const expiryInput = document.getElementById('input-expiry');
    expiryInput?.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '').substring(0, 4);
        if (value.length >= 2) {
            value = value.substring(0, 2) + ' / ' + value.substring(2, 4);
        }
        e.target.value = value;
        clearFieldError('expiry');
    });

    // CVC
    const cvcInput = document.getElementById('input-cvc');
    cvcInput?.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '').substring(0, 3);
        clearFieldError('cvc');
    });

    // Индекс
    const zipInput = document.getElementById('input-zip');
    zipInput?.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '').substring(0, 6);
        clearFieldError('zip');
    });

    // Очистка ошибок при вводе
    document.querySelectorAll('.form-group__input').forEach(input => {
        input.addEventListener('input', () => {
            clearFieldError(input.id.replace('input-', ''));
        });
    });

    document.getElementById('checkbox-agree')?.addEventListener('change', () => {
        clearFieldError('agree');
    });
}

// ==================== УПРАВЛЕНИЕ ОШИБКАМИ ====================
function showFieldError(fieldId) {
    const errorEl = document.getElementById('error-' + fieldId);
    const inputEl = document.getElementById('input-' + fieldId);
    if (errorEl) errorEl.classList.add('form-group__error-text--visible');
    if (inputEl) inputEl.classList.add('form-group__input--error');
}

function clearFieldError(fieldId) {
    const errorEl = document.getElementById('error-' + fieldId);
    const inputEl = document.getElementById('input-' + fieldId);
    if (errorEl) errorEl.classList.remove('form-group__error-text--visible');
    if (inputEl) inputEl.classList.remove('form-group__input--error');
}

function clearErrors() {
    document.querySelectorAll('.form-group__error-text--visible').forEach(el => 
        el.classList.remove('form-group__error-text--visible'));
    document.querySelectorAll('.form-group__input--error').forEach(el => 
        el.classList.remove('form-group__input--error'));
    document.querySelectorAll('.delivery-methods--error').forEach(el => 
        el.classList.remove('delivery-methods--error'));
    document.querySelectorAll('.pickup-list--error').forEach(el => 
        el.classList.remove('pickup-list--error'));
    document.querySelectorAll('.checkbox__error--visible').forEach(el => 
        el.classList.remove('checkbox__error--visible'));
    document.getElementById('error-banner')?.classList.remove('checkout__error-banner--visible');
}

// ==================== ВАЛИДАЦИЯ ФОРМЫ ====================
function validateForm() {
    clearErrors();
    let isValid = true;
    let firstErrorField = null;

    // Телефон
    const phone = document.getElementById('input-phone')?.value.replace(/\D/g, '') || '';
    if (phone.length < 11) {
        showFieldError('phone');
        isValid = false;
        if (!firstErrorField) firstErrorField = 'input-phone';
    }

    // Email (опционально)
    const email = document.getElementById('input-email')?.value.trim() || '';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showFieldError('email');
        isValid = false;
        if (!firstErrorField) firstErrorField = 'input-email';
    }

    // Доставка
    if (deliveryType === 'pickup') {
        const activePickup = document.querySelector('.pickup-item--active');
        if (!activePickup || !selectedPickupId) {
            document.getElementById('pickup-list')?.classList.add('pickup-list--error');
            isValid = false;
            if (!firstErrorField) firstErrorField = 'pickup-list';
        }
    } else {
        ['city', 'street', 'house'].forEach(field => {
            const val = document.getElementById(`input-${field}`)?.value.trim();
            if (!val) {
                showFieldError(field);
                isValid = false;
                if (!firstErrorField) firstErrorField = `input-${field}`;
            }
        });
    }

    // Оплата
    if (paymentType === 'online') {
        ['card', 'expiry', 'cvc', 'cardholder'].forEach(field => {
            const val = document.getElementById(`input-${field}`)?.value.trim();
            if (!val) {
                showFieldError(field);
                isValid = false;
                if (!firstErrorField) firstErrorField = `input-${field}`;
            }
        });
    }

    // Согласие
    if (!document.getElementById('checkbox-agree')?.checked) {
        document.getElementById('error-agree')?.classList.add('checkbox__error--visible');
        isValid = false;
        if (!firstErrorField) firstErrorField = 'checkbox-agree';
    }

    if (!isValid) {
        document.getElementById('error-banner')?.classList.add('checkout__error-banner--visible');
        if (firstErrorField) {
            const el = document.getElementById(firstErrorField);
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el?.focus();
        }
    }

    return isValid;
}

// ==================== ОТПРАВКА ЗАКАЗА ====================
function initFormSubmit() {
    document.getElementById('submit-order')?.addEventListener('click', async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        const btn = document.getElementById('submit-order');
        const originalText = btn.textContent;
        
        // Блокируем кнопку
        btn.textContent = 'Оформление...';
        btn.classList.add('checkout__submit--disabled');
        btn.disabled = true;

        try {
            // Формируем данные заказа
            const orderData = {
                items: checkoutItems.map(item => ({
                    variantId: item.variantId || item.id,
                    quantity: item.quantity,
                    price: item.price
                })),
                deliveryType,
                paymentType,
                phone: document.getElementById('input-phone')?.value.trim(),
                email: document.getElementById('input-email')?.value.trim(),
                ...(deliveryType === 'pickup' && {
                    pickupPointId: selectedPickupId
                }),
                ...(deliveryType === 'delivery' && {
                    deliveryAddress: {
                        city: document.getElementById('input-city')?.value.trim(),
                        street: document.getElementById('input-street')?.value.trim(),
                        house: document.getElementById('input-house')?.value.trim(),
                        apartment: document.getElementById('input-flat')?.value.trim() || null,
                        postalCode: document.getElementById('input-zip')?.value.trim() || null
                    }
                })
            };

            // Отправляем заказ
            const response = await createOrder(orderData);

            showNotification('Заказ успешно оформлен!', 'success');

            // Перенаправление в профиль через 1.5 сек
            setTimeout(() => {
                window.location.href = 'profile.html';
            }, 1500);

        } catch (error) {
            console.error('Order error:', error);
            showNotification(error.message || 'Не удалось оформить заказ', 'error');
        } finally {
            // Разблокируем кнопку
            btn.textContent = originalText;
            btn.classList.remove('checkout__submit--disabled');
            btn.disabled = false;
        }
    });
}

// ==================== ОБНОВЛЕНИЕ ИТОГОВОЙ СУММЫ ====================
function updateSummary(items) {
    
    const summaryList = document.querySelector('.cart__summary-list');
    const totalElement = document.querySelector('.cart__summary-total-price');
    
    if (!summaryList) {
        return;
    }
    if (!totalElement) {
        return;
    }

    let totalSum = 0;
    let itemsCount = 0;

    try {
        const summaryItemsHTML = items.map(item => {
            
            const itemTotal = (item.price || 0) * (item.quantity || 1);
            totalSum += itemTotal;
            itemsCount += (item.quantity || 1);
            
            return `
                <div class="checkout__summary-row">
                    <span>${item.name || 'Товар'} <small>× ${item.quantity || 1}</small></span>
                    <span>${formatPrice(itemTotal)}</span>
                </div>
            `;
        }).join('');

        const finalTotal = totalSum;

        summaryList.innerHTML = summaryItemsHTML;
        totalElement.textContent = formatPrice(finalTotal);
        
        
    } catch (error) {
        console.error('[SUMMARY] Ошибка при обновлении:', error);
    }
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================
function formatPrice(price) {
    if (typeof price !== 'number' || isNaN(price)) return '—';
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
}

function getPluralForm(number, titles) {
    const cases = [2, 0, 1, 1, 1, 2];
    return titles[(number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5]];
}