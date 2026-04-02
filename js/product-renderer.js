//Если формат данных поменяется, код нужно править
// Рендерит одну карточку товара
export function renderProductCard(product) {
    return `
        <article class="product-card ${getCardModifiers(product)}" data-id="${product.id}">
            <a href="product.html?id=${product.id}" class="product-card__link"></a>
            ${getBadgeHTML(product)}
            <div class="product-card__image-wrapper">
                <img src="${product.image}" 
                     alt="${product.name}" 
                     class="product-card__image"
                     loading="lazy">
            </div>
            <div class="product-card__info">
                <span class="product-card__brand">${product.brand}</span>
                <h3 class="product-card__title">${product.name}</h3>
                ${getRatingHTML(product)}
                ${getPriceHTML(product)}
            </div>
            <button class="product-card__btn" aria-label="Добавить в корзину">
                <svg class="product-card__icon product-card__icon--plus" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M8 3v10M3 8h10"/>
                </svg>
                <svg class="product-card__icon product-card__icon--check" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M2 8l5 5 7-7"/>
                </svg>
            </button>
        </article>
    `;
}

// Доработать логику в будущем
export function getBadgeHTML(product) {
    if (product.badge) {
        const type = product.badge;
        const text = product.badgeText || (type === 'new' ? 'НОВИНКА' : 'СКИДКА');
        return `<div class="product-card__badge product-card__badge--${type}">${text}</div>`;
    }
    if (product.type === 'new') return `<div class="product-card__badge product-card__badge--new">НОВИНКА</div>`;
    if (product.type === 'sale' || product.oldPrice) return `<div class="product-card__badge product-card__badge--sale">СКИДКА</div>`;
    return '';
}

// Доработать логику в будущем
export function getCardModifiers(product) {
    const modifiers = [];
    if (product.type === 'new' || product.badge === 'new') modifiers.push('product-card--new');
    if (product.type === 'sale' || product.badge === 'sale' || product.oldPrice) modifiers.push('product-card--sale');
    return modifiers.join(' ');
}

export function getRatingHTML(product) {
    if (!product.rating) return '';
    return `
        <div class="product-card__rating">
            <svg class="product-card__star" width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <path d="M7 0L9.17 5.17L14.5 5.83L10.5 9.5L11.67 14.83L7 12L2.33 14.83L3.5 9.5L-0.5 5.83L4.83 5.17L7 0Z"/>
            </svg>
            <span class="product-card__rating-value">${product.rating}</span>
            <span class="product-card__rating-count">(${product.reviews || 0})</span>
        </div>
    `;
}

export function getPriceHTML(product) {
    const currentPrice = formatPrice(product.price);
    if (product.oldPrice) {
        const oldPrice = formatPrice(product.oldPrice);
        return `
            <div class="product-card__price">
                <span class="product-card__price-current">${currentPrice}</span>
                <del class="product-card__price-old" aria-label="Старая цена: ${oldPrice}">${oldPrice}</del>
            </div>
        `;
    }
    return `<div class="product-card__price"><span class="product-card__price-current">${currentPrice}</span></div>`;
}

export function getPluralForm(number, titles) {
    const cases = [2, 0, 1, 1, 1, 2];
    return titles[(number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5]];
}

// Рендерит массив товаров в указанный контейнер
export function renderProductsToGrid(products, gridSelector, initCart = true) {
    const grid = document.querySelector(gridSelector);
    if (!grid) return;
    
    grid.innerHTML = products.map(renderProductCard).join('');
    
    if (initCart && typeof window.initCartButtons === 'function') {
        window.initCartButtons();
    }
}