// checkout.js
import { updateSummary } from './cart.js';

let checkoutItems = [
    { id: 1, brand: "Apple", name: "iPhone 15 Pro", price: 219980, quantity: 2, image: "img/iphone-15-pro.png" },
    { id: 2, brand: "Apple", name: "iPhone 14", price: 79990, quantity: 1, image: "img/iphone-15-pro.png" },
    { id: 3, brand: "Samsung", name: "Samsung Galaxy S24 Ultra", price: 119990, quantity: 1, image: "img/iphone-15-pro.png" }
];

// === Переключение Самовывоз / Доставка ===
const deliveryToggle = document.querySelector('[data-toggle="delivery"]');
if (deliveryToggle) {
    const btns = deliveryToggle.querySelectorAll('.delivery-method__btn');
    const pickupEl = document.getElementById('pickup-content');
    const deliveryEl = document.getElementById('delivery-content');

    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            btns.forEach(b => b.classList.remove('delivery-method__btn--active'));
            btn.classList.add('delivery-method__btn--active');

            if (btn.dataset.target === 'pickup') {
                pickupEl.style.display = 'block';
                deliveryEl.style.display = 'none';
            } else {
                pickupEl.style.display = 'none';
                deliveryEl.style.display = 'block';
            }
            clearErrors();
        });
    });
}

// === Переключение Онлайн / При получении ===
const paymentToggle = document.querySelector('[data-toggle="payment"]');
if (paymentToggle) {
    const btns = paymentToggle.querySelectorAll('.delivery-method__btn');
    const cardForm = document.getElementById('card-form');

    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            btns.forEach(b => b.classList.remove('delivery-method__btn--active'));
            btn.classList.add('delivery-method__btn--active');

            if (btn.dataset.target === 'online') {
                cardForm.classList.add('card-form--visible');
            } else {
                cardForm.classList.remove('card-form--visible');
            }
            clearErrors();
        });
    });
}

// === Выбор пункта самовывоза ===
const pickupItems = document.querySelectorAll('[data-pickup]');
pickupItems.forEach(item => {
    item.addEventListener('click', () => {
        pickupItems.forEach(i => i.classList.remove('pickup-item--active'));
        item.classList.add('pickup-item--active');
        clearErrors();
    });
});

// === Маски ввода (телефон, карта, срок, CVC, индекс) ===
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

const cardInput = document.getElementById('input-card');
cardInput?.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '').substring(0, 16);
    let formatted = value.match(/.{1,4}/g)?.join(' ') || '';
    e.target.value = formatted;
    clearFieldError('card');
});

const expiryInput = document.getElementById('input-expiry');
expiryInput?.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (value.length >= 2) {
        value = value.substring(0, 2) + ' / ' + value.substring(2, 4);
    }
    e.target.value = value;
    clearFieldError('expiry');
});

const cvcInput = document.getElementById('input-cvc');
cvcInput?.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').substring(0, 3);
    clearFieldError('cvc');
});

const zipInput = document.getElementById('input-zip');
zipInput?.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').substring(0, 6);
    clearFieldError('zip');
});

// === Очистка ошибок при вводе ===
document.querySelectorAll('.form-group__input').forEach(input => {
    input.addEventListener('input', () => {
        clearFieldError(input.id.replace('input-', ''));
    });
});

document.getElementById('checkbox-agree')?.addEventListener('change', () => {
    clearFieldError('agree');
});

// === Управление ошибками ===
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
    document.querySelectorAll('.form-group__error-text--visible').forEach(el => el.classList.remove('form-group__error-text--visible'));
    document.querySelectorAll('.form-group__input--error').forEach(el => el.classList.remove('form-group__input--error'));
    document.querySelectorAll('.delivery-methods--error').forEach(el => el.classList.remove('delivery-methods--error'));
    document.querySelectorAll('.pickup-list--error').forEach(el => el.classList.remove('pickup-list--error'));
    document.querySelectorAll('.checkbox__error--visible').forEach(el => el.classList.remove('checkbox__error--visible'));
    document.getElementById('error-banner')?.classList.remove('checkout__error-banner--visible');
}

// === Валидация формы ===
function validateForm() {
    clearErrors();
    let isValid = true;
    let firstErrorField = null;

    const phone = document.getElementById('input-phone')?.value.replace(/\D/g, '') || '';
    if (phone.length < 11) {
        showFieldError('phone');
        isValid = false;
        if (!firstErrorField) firstErrorField = 'input-phone';
    }

    const email = document.getElementById('input-email')?.value.trim() || '';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showFieldError('email');
        isValid = false;
        if (!firstErrorField) firstErrorField = 'input-email';
    }

    const isPickup = document.querySelector('[data-toggle="delivery"] [data-target="pickup"]')?.classList.contains('delivery-method__btn--active');
    if (isPickup) {
        const activePickup = document.querySelector('.pickup-item--active');
        if (!activePickup) {
            document.getElementById('pickup-list')?.classList.add('pickup-list--error');
            isValid = false;
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

    const isOnline = document.querySelector('[data-toggle="payment"] [data-target="online"]')?.classList.contains('delivery-method__btn--active');
    if (isOnline) {
        ['card', 'expiry', 'cvc', 'cardholder'].forEach(field => {
            const val = document.getElementById(`input-${field}`)?.value.trim();
            if (!val) {
                showFieldError(field);
                isValid = false;
                if (!firstErrorField) firstErrorField = `input-${field}`;
            }
        });
    }

    if (!document.getElementById('checkbox-agree')?.checked) {
        document.getElementById('error-agree')?.classList.add('checkbox__error--visible');
        isValid = false;
    }

    if (!isValid) {
        document.getElementById('error-banner')?.classList.add('checkout__error-banner--visible');
        if (firstErrorField) {
            document.getElementById(firstErrorField)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            document.getElementById(firstErrorField)?.focus();
        }
    }

    return isValid;
}

// === Отправка заказа ===
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
        // 🔮 Здесь будет реальный API-запрос:
        // const response = await fetch('/api/orders', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ items: checkoutItems, /* ... */ })
        // });
        // if (!response.ok) throw new Error('Server error');

        // Имитация успешного ответа сервера (задержка 1.2 сек)
        await new Promise(resolve => setTimeout(resolve, 1200));

        showNotification('Заказ успешно оформлен!', 'success');

        setTimeout(() => {
            window.location.href = 'profile.html';
        }, 1500);

    } catch (error) {
        console.error('Order error:', error);
        
        showNotification('Не удалось оформить заказ. Попробуйте снова.', 'error');
        
        btn.textContent = originalText;
        btn.classList.remove('checkout__submit--disabled');
        btn.disabled = false;
    }
});

document.addEventListener('DOMContentLoaded', () => {
    updateSummary(checkoutItems);
});