// js/cart.js
import { apiRequest } from './api.js';

let cartItems = [];

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===
function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
}

function toggleCartView(items) {
    const emptyEl = document.querySelector('.cart-empty');
    const cartEl = document.querySelector('.cart');
    if (!emptyEl || !cartEl) return;
    
    if (!items || items.length === 0) {
        emptyEl.style.display = 'flex';
        cartEl.style.display = 'none';
    } else {
        emptyEl.style.display = 'none';
        cartEl.style.display = 'block';
    }
}

function renderCart(items) {
    const container = document.querySelector('.cart__items');
    if (!container) return;

    if (!items.length) {
        container.innerHTML = '';
        updateSummary([]);
        toggleCartView([]);
        return;
    }

    container.innerHTML = items.map(item => `
        <div class="cart__item" data-id="${item.id}">
            <div class="cart__item-image">
                <img src="${item.image}" alt="${item.name}" onerror="this.src='img/placeholder.png'">
            </div>
            <div class="cart__item-content">
                <div class="cart__item-info">
                    <span class="cart__item-brand">${item.brand}</span>
                    <span class="cart__item-name">${item.name} ${item.color ? `· ${item.color}` : ''} ${item.storage ? `· ${item.storage}GB` : ''}</span>
                </div>
                <div class="cart__item-controls">
                    <button class="cart__btn-minus" data-action="minus" data-id="${item.id}">−</button>
                    <span class="cart__count">${item.quantity}</span>
                    <button class="cart__btn-plus" data-action="plus" data-id="${item.id}">+</button>
                </div>
            </div>
            <div class="cart__item-price">${formatPrice(item.price * item.quantity)}</div>
            <button class="cart__item-remove" data-id="${item.id}">×</button>
        </div>
    `).join('');

    updateSummary(items);
    toggleCartView(items);
}

function updateSummary(items) {
    const summaryList = document.querySelector('.cart__summary-list');
    const totalElement = document.querySelector('.cart__summary-total-price');
    let totalSum = 0;

    const summaryItemsHTML = items.map(item => {
        const itemTotal = item.price * item.quantity;
        totalSum += itemTotal;
        return `
            <div class="cart__summary-row">
                <span>${item.name} × ${item.quantity}</span>
                <span>${formatPrice(itemTotal)}</span>
            </div>
        `;
    }).join('');

    if (summaryList) summaryList.innerHTML = summaryItemsHTML;
    if (totalElement) totalElement.textContent = formatPrice(totalSum);
}

// === ЗАГРУЗКА КОРЗИНЫ ===
async function loadCart() {
    try {
        const response = await apiRequest('http://localhost:3000/api/cart');
        cartItems = response.items || [];
        renderCart(cartItems);
    } catch (error) {
        console.error('Ошибка загрузки корзины:', error);
        
        if (error.message?.includes('401') || error.message?.includes('Нет токена')) {
            renderCart([]); 
            return;         
        }
        
        showNotification?.('Не удалось загрузить корзину', 'error');
        renderCart([]);
    }
}

// === ОБРАБОТЧИКИ ДЕЙСТВИЙ ===
async function handleQuantityChange(itemId, delta) {
    const itemEl = document.querySelector(`.cart__item[data-id="${itemId}"]`);
    const minusBtn = itemEl?.querySelector('.cart__btn-minus');
    const plusBtn = itemEl?.querySelector('.cart__btn-plus');
    const countSpan = itemEl?.querySelector('.cart__count');

    if (minusBtn) minusBtn.disabled = true;
    if (plusBtn) plusBtn.disabled = true;
    if (countSpan) countSpan.style.opacity = '0.4';

    try {
        const response = await apiRequest('http://localhost:3000/api/cart/quantity', {
            method: 'POST',
            body: JSON.stringify({ itemId, delta })
        });

        cartItems = response.items || cartItems;
        renderCart(cartItems);
    } catch (error) {
        console.error('Ошибка изменения количества:', error);
        showNotification?.(error.message || 'Не удалось изменить количество', 'error');
    } finally {
        if (minusBtn) minusBtn.disabled = false;
        if (plusBtn) plusBtn.disabled = false;
        if (countSpan) countSpan.style.opacity = '1';
    }
}

async function handleRemoveItem(itemId, btnElement) {
    btnElement.disabled = true;
    try {
        await apiRequest('http://localhost:3000/api/cart/remove', {
            method: 'POST',
            body: JSON.stringify({ itemId })
        });
        cartItems = cartItems.filter(i => String(i.id) !== String(itemId));
        renderCart(cartItems);
        showNotification?.('Товар удалён из корзины', 'success');
    } catch (error) {
        console.error('Ошибка удаления:', error);
        showNotification?.(error.message || 'Не удалось удалить товар', 'error');
    } finally {
        btnElement.disabled = false;
    }
}

//  ОЧИСТКА КОРЗИНЫ 
document.getElementById('clear-cart-btn')?.addEventListener('click', async () => {
    // Подтверждение действия
    if (!confirm('Вы уверены, что хотите удалить все товары из корзины?')) return;

    const btn = document.getElementById('clear-cart-btn');
    const originalHTML = btn.innerHTML;
    
    btn.disabled = true;
    btn.innerHTML = `<svg class="spin" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 2v2m0 8v2M2 8h2m8 0h2"/></svg> Очистка...`;

    try {
        await apiRequest('http://localhost:3000/api/cart', { method: 'DELETE' });
        cartItems = [];
        renderCart(cartItems);
        showNotification('Корзина успешно очищена', 'success');
    } catch (error) {
        console.error('Ошибка очистки корзины:', error);
        showNotification(error.message || 'Не удалось очистить корзину', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalHTML;
    }
});

// === ИНИЦИАЛИЗАЦИЯ ===
document.addEventListener('click', (e) => {
    const quantityBtn = e.target.closest('.cart__btn-minus, .cart__btn-plus');
    if (quantityBtn) {
        const itemId = quantityBtn.dataset.id;
        const delta = quantityBtn.dataset.action === 'plus' ? 1 : -1;
        handleQuantityChange(itemId, delta);
        return;
    }

    const removeBtn = e.target.closest('.cart__item-remove');
    if (removeBtn) {
        handleRemoveItem(removeBtn.dataset.id, removeBtn);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    loadCart();
});