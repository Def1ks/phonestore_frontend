let cartItems = [
    { id: 1, brand: "Apple", name: "iPhone 15 Pro", price: 219980, quantity: 2, image: "img/iphone-15-pro.png" },
    { id: 2, brand: "Apple", name: "iPhone 14", price: 79990, quantity: 1, image: "img/iphone-15-pro.png" },
    { id: 3, brand: "Samsung", name: "Samsung Galaxy S24 Ultra", price: 119990, quantity: 1, image: "img/iphone-15-pro.png" }
];

function toggleCartView(items) {
    const emptyEl = document.querySelector('.cart-empty');
    const cartEl = document.querySelector('.cart');
    
    if (!emptyEl || !cartEl) return;

    if (items.length === 0) {
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

    container.innerHTML = items.map(item => `
        <div class="cart__item" data-id="${item.id}">
            <div class="cart__item-image">
                <img src="${item.image}" alt="${item.name}">
            </div>
            <div class="cart__item-content">
                <div class="cart__item-info">
                    <span class="cart__item-brand">${item.brand}</span>
                    <span class="cart__item-name">${item.name}</span>
                </div>
                <div class="cart__item-controls">
                    <button class="cart__btn-minus" data-action="minus" data-id="${item.id}">−</button>
                    <span class="cart__count">${item.quantity}</span>
                    <button class="cart__btn-plus" data-action="plus" data-id="${item.id}">+</button>
                </div>
            </div>
            <div class="cart__item-price">${formatPrice(item.price)}</div>
            <button class="cart__item-remove" data-id="${item.id}">×</button>
        </div>
    `).join('');

    updateSummary(items);
    toggleCartView(items);
}

export function updateSummary(items) {
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

document.addEventListener('click', async (e) => {
    const quantityBtn = e.target.closest('.cart__btn-minus, .cart__btn-plus');
    if (quantityBtn) {
        const itemId = quantityBtn.dataset.id;
        const delta = quantityBtn.dataset.action === 'plus' ? 1 : -1;
        await handleQuantityChange(itemId, delta);
        return;
    }

    const removeBtn = e.target.closest('.cart__item-remove');
    if (removeBtn) {
        const itemId = removeBtn.dataset.id;
        await handleRemoveItem(itemId, removeBtn);
    }
});

async function handleQuantityChange(itemId, delta) {
    const currentItem = cartItems.find(i => String(i.id) === String(itemId));
    if (!currentItem) return;

    if (delta < 0 && currentItem.quantity <= 1) {
        showNotification('Минимальное количество: 1', 'warning');
        return;
    }

    const itemEl = document.querySelector(`.cart__item[data-id="${itemId}"]`);
    const minusBtn = itemEl?.querySelector('.cart__btn-minus');
    const plusBtn = itemEl?.querySelector('.cart__btn-plus');
    const countSpan = itemEl?.querySelector('.cart__count');

    if (minusBtn) minusBtn.disabled = true;
    if (plusBtn) plusBtn.disabled = true;
    if (countSpan) countSpan.style.opacity = '0.4';

    try {
        const response = await fetch(`/api/cart/quantity`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itemId, delta })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            cartItems = Array.isArray(data.items) ? data.items : cartItems;
            renderCart(cartItems);
        } else {
            showNotification(data.message || 'Не удалось изменить количество', 'error');
        }
    } catch (error) {
        console.error('Network error:', error);
        showNotification('Ошибка соединения с сервером', 'error');
    } finally {
        if (minusBtn) minusBtn.disabled = false;
        if (plusBtn) plusBtn.disabled = false;
        if (countSpan) countSpan.style.opacity = '1';
    }
}

async function handleRemoveItem(itemId, btnElement) {
    btnElement.disabled = true;

    try {
        const response = await fetch(`/api/cart/remove`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itemId })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            cartItems = Array.isArray(data.items) ? data.items : [];
            toggleCartView(cartItems);  
            renderCart(cartItems);
            showNotification(data.message || 'Товар успешно удалён', 'success');
        } else {
            showNotification(data.message || 'Не удалось удалить товар', 'error');
        }
    } catch (error) {
        console.error('Network error:', error);
        showNotification('Ошибка соединения с сервером', 'error');
    } finally {
        btnElement.disabled = false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    toggleCartView(cartItems); 
    renderCart(cartItems);
});