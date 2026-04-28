//  ОСНОВНОЙ РЕНДЕР 
export function renderProductCard(product) {
    const data = normalizeProductData(product);
    
    return `
        <article class="product-card ${getCardModifiers(data)}" 
                 data-id="${data.id}" 
                 data-product="${data.productId}">
            <a href="product.html?id=${data.id}" class="product-card__link" aria-label="${data.name}"></a>
            ${getBadgeHTML(data)}
            <div class="product-card__image-wrapper">
                <img src="${data.image}" 
                     alt="${data.name}" 
                     class="product-card__image"
                     loading="lazy"
                     onerror="this.src='img/placeholder-product.png'">
            </div>
            <div class="product-card__info">
                <span class="product-card__brand">${data.brand}</span>
                <h3 class="product-card__title">${data.name}</h3>
                ${getRatingHTML(data)}
                ${getPriceHTML(data)}
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

//  НОРМАЛИЗАЦИЯ ДАННЫХ 
function normalizeProductData(product) {
    if (!product) return {};
    const brandValue = product.brandName || product.brand;
    const brand = typeof brandValue === 'object' ? brandValue.name : brandValue || 'Бренд';
    const image = product.image || product.image_url || product.variants?.[0]?.image || 'img/placeholder-product.png';
    const price = product.price ?? product.variants?.[0]?.price ?? 0;
    const oldPrice = product.oldPrice ?? product.variants?.[0]?.oldPrice ?? null;
    const badge = product.badge || product.badge_type || product.variants?.[0]?.badge || null;
    const badgeText = product.badgeText || getBadgeText(badge);

    
    return {
        id: product.id, 
        productId: product.productId || product.id_product, 
        name: product.name || 'Товар',
        brand, 
        color: product.color, 
        price: product.price ?? 0,
        oldPrice: product.oldPrice > 0 ? product.oldPrice : null,
        image: product.image || product.image_url || 'img/placeholder-product.png',
        badge: product.badge,
        badgeText: product.badgeText || getBadgeText(product.badge),
        rating: product.rating,
        reviews: product.reviews,
        // Для модалки
        ram: product.ram || product.ramSize,
        storage: product.storage || product.storageSize
    };
}

//  ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ 
export function getBadgeHTML(product) {
    const badge = product.badge || product.badge_type;
    if (!badge) return '';
    
    const text = product.badgeText || getBadgeText(badge);
    return `<div class="product-card__badge product-card__badge--${badge}">${text}</div>`;
}

function getBadgeText(badgeType) {
    const badges = {
        new: 'НОВИНКА',
        sale: 'СКИДКА',
        hit: 'ХИТ'
    };
    return badges[badgeType] || null;
}

export function getCardModifiers(product) {
    const modifiers = [];
    const badge = product.badge || product.badge_type;
    
    if (badge === 'new') modifiers.push('product-card--new');
    if (badge === 'sale' || product.oldPrice) modifiers.push('product-card--sale');
    if (badge === 'hit') modifiers.push('product-card--hit');
    
    return modifiers.join(' ');
}

export function getRatingHTML(product) {
    if (!product.rating || product.rating <= 0) return '';
    
    const reviews = product.reviews ?? 0;
    return `
        <div class="product-card__rating">
            <svg class="product-card__star" width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <path d="M7 0L9.17 5.17L14.5 5.83L10.5 9.5L11.67 14.83L7 12L2.33 14.83L3.5 9.5L-0.5 5.83L4.83 5.17L7 0Z"/>
            </svg>
            <span class="product-card__rating-value">${product.rating}</span>
            <span class="product-card__rating-count">(${reviews})</span>
        </div>
    `;
}

export function getPriceHTML(product) {
    if (!product.price || product.price <= 0) {
        return `<div class="product-card__price"><span class="product-card__price-current">—</span></div>`;
    }
    
    const currentPrice = formatPrice(product.price);
    
    if (product.oldPrice && product.oldPrice > product.price) {
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

// Форматирование цены
function formatPrice(price) {
    if (typeof price !== 'number' || isNaN(price)) return '—';
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
}

export function getPluralForm(number, titles) {
    const cases = [2, 0, 1, 1, 1, 2];
    return titles[(number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5]];
}

//  МАССОВЫЙ РЕНДЕР 
export function renderProductsToGrid(products, gridSelector, initCart = true) {
    const grid = document.querySelector(gridSelector);
    if (!grid) {
        console.warn(`[RENDER] Grid "${gridSelector}" не найден`);
        return;
    }
    
    if (!Array.isArray(products) || products.length === 0) {
        grid.innerHTML = `
            <div class="catalog__empty">
                <p>По вашему запросу ничего не найдено</p>
            </div>
        `;
        return;
    }
    
    try {
        grid.innerHTML = products.map(renderProductCard).join('');
        
        if (initCart && typeof window.initCartButtons === 'function') {
            window.initCartButtons();
        }
    } catch (error) {
        console.error('[RENDER] Ошибка при отрисовке товаров:', error);
        grid.innerHTML = `<p class="catalog__error">Ошибка загрузки товаров</p>`;
    }
}