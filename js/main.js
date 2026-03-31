// Бургер меню
const burger = document.querySelector('.header__burger');
const mobileMenu = document.querySelector('.header__mobile-menu');
const mobileLinks = document.querySelectorAll('.header__mobile-nav-link');

// Открытие/закрытие меню
burger.addEventListener('click', () => {
    burger.classList.toggle('header__burger--active');
    mobileMenu.classList.toggle('header__mobile-menu--active');
    document.body.style.overflow = mobileMenu.classList.contains('header__mobile-menu--active') ? 'hidden' : '';
});

// Закрытие меню при клике на ссылку
mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
        burger.classList.remove('header__burger--active');
        mobileMenu.classList.remove('header__mobile-menu--active');
        document.body.style.overflow = '';
    });
});

// Закрытие меню при клике вне его
document.addEventListener('click', (e) => {
    if (!burger.contains(e.target) && !mobileMenu.contains(e.target)) {
        burger.classList.remove('header__burger--active');
        mobileMenu.classList.remove('header__mobile-menu--active');
        document.body.style.overflow = '';
    }
});

// Добавление в корзину
document.querySelectorAll('.product-card__btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        btn.disabled = true;
        btn.classList.add('product-card__btn--loading');
        btn.classList.remove('product-card__btn--error');

        const card = btn.closest('.product-card');
        const productId = card.dataset.id || extractIdFromUrl(card.querySelector('.product-card__link').href);

        try {
            const response = await addToCartAPI(productId);

            if (response.success) {
                btn.classList.remove('product-card__btn--loading');
                showNotification('Товар добавлен в корзину', 'success');
            } else {
                throw new Error(response.message || 'Не удалось добавить');
            }
        } catch (error) {
            console.error('Ошибка добавления:', error);
            btn.classList.remove('product-card__btn--loading');
            btn.classList.add('product-card__btn--error');

            showNotification(error.message || 'Ошибка при добавлении товара', 'error');

            setTimeout(() => {
                btn.classList.remove('product-card__btn--error');
            }, 2000);
        } finally {
            btn.disabled = false;
        }
    });
});

// Уведомление
function showNotification(message, type = 'success') {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Вспомогательная функция для извлечения ID из URL
function extractIdFromUrl(url) {
    const params = new URLSearchParams(url.split('?')[1]);
    return params.get('id');
}

// API функция 
async function addToCartAPI(productId) {
    try {
        const response = await fetch('/api/cart/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId, quantity: 1 })
        });

        if (!response.ok) {
            throw new Error('Сервер вернул ошибку');
        }

        return await response.json();
    } catch (err) {
        throw new Error('Ошибка при добавлении товара. Попробуйте перезагрузить страницу');
    }
}

// Функция списка FAQ
document.querySelectorAll('.faq__question').forEach(button => {
    button.addEventListener('click', () => {
        const item = button.parentElement;
        const isActive = item.classList.contains('is-active');

        document.querySelectorAll('.faq__item').forEach(faqItem => {
            faqItem.classList.remove('is-active');
            faqItem.querySelector('.faq__question').setAttribute('aria-expanded', 'false');
        });

        if (!isActive) {
            item.classList.add('is-active');
            button.setAttribute('aria-expanded', 'true');
        }
    });
});


// ========================================
// ИНИЦИАЛИЗАЦИЯ ФИЛЬТРОВ
// ========================================

/**
 * Настраивает всю логику работы панели фильтров
 */
function initFilters() {
    // Находим элементы ВНУТРИ функции (гарантированно есть в DOM)
    const filtersToggle = document.querySelector('.catalog__filters-toggle');
    const filtersPanel = document.querySelector('.catalog__filters');
    const filtersClose = document.querySelector('.catalog__filters-close');
    
    // Если элементов нет — выходим
    if (!filtersToggle || !filtersPanel) return;
    
    // Вспомогательная функция закрытия панели
    function closeFiltersPanel() {
        filtersPanel.classList.remove('is-active');
        filtersToggle.setAttribute('aria-expanded', 'false');
        if (window.innerWidth <= 800) {
            document.body.style.overflow = '';
        }
    }
    
    // 1. Открытие/закрытие по кнопке "Фильтры"
    filtersToggle.addEventListener('click', () => {
        const isActive = filtersPanel.classList.toggle('is-active');
        filtersToggle.setAttribute('aria-expanded', isActive);
        if (window.innerWidth <= 800) {
            document.body.style.overflow = isActive ? 'hidden' : '';
        }
    });
    
    // 2. Закрытие по крестику
    if (filtersClose) {
        filtersClose.addEventListener('click', closeFiltersPanel);
    }
    
    // 3. Закрытие по клику на фон (только мобильные)
    filtersPanel.addEventListener('click', (e) => {
        if (e.target === filtersPanel && window.innerWidth <= 800) {
            closeFiltersPanel();
        }
    });
    
    // 4. Переключение тегов (бренды, категории)
    document.querySelectorAll('.filters__tag').forEach(tag => {
        tag.addEventListener('click', () => {
            tag.classList.toggle('is-active');
        });
    });
    
    // 5. Валидация полей цены
    const priceInputs = document.querySelectorAll('.filters__price-input');
    const MAX_PRICE = 100_000_000;
    
    priceInputs.forEach(input => {
        // Ввод: авто-коррекция значений
        input.addEventListener('input', () => {
            let min = parseInt(priceInputs[0].value) || 0;
            let max = parseInt(priceInputs[1].value) || 150000;
            if (min > MAX_PRICE) min = MAX_PRICE;
            if (max > MAX_PRICE) max = MAX_PRICE;
            if (min > max) priceInputs[1].value = min;
            priceInputs[0].value = min;
            priceInputs[1].value = max;
        });
        
        // Блокировка нечисловых символов
        input.addEventListener('keypress', (e) => {
            const char = String.fromCharCode(e.which || e.keyCode);
            if (!/[0-9]/.test(char)) e.preventDefault();
        });
        
        // Финальная валидация при потере фокуса
        input.addEventListener('blur', () => {
            let value = parseInt(input.value) || 0;
            if (value > MAX_PRICE) value = MAX_PRICE;
            input.value = value;
        });
    });
}



// ПЕРЕДЕЛАТЬ КОД ПОСЛЕ ПОДКЛЮЧЕНИЯ БЕКА 
// ========================================
// НАЧАЛЬНАЯ ЗАГРУЗКА ТОВАРОВ
// ========================================
/**
 * Загружает и отображает все товары при первом входе
 */
async function loadInitialProducts() {
    const grid = document.querySelector('.catalog__grid');
    
    // Показываем загрузку
    if (grid) {
        grid.innerHTML = `
            <div class="catalog__loading" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <div class="spinner"></div>
                <p style="font-family: var(--font-ui); color: #666; margin-top: 16px;">
                    Загрузка товаров...
                </p>
            </div>
        `;
    }
    
    try {
        // === ЗАГЛУШКА: ТЕСТОВЫЕ ДАННЫЕ ===
        // УДАЛИТЬ ПОСЛЕ НАПИСАНИЯ БЕКА
        await new Promise(resolve => setTimeout(resolve, 500));
        const data = {
            products: [
                {
                    id: 1,
                    name: 'iPhone 15 Pro',
                    brand: 'Apple · 256GB',
                    price: 109990,
                    image: 'img/iphone-15-pro.png',
                    rating: 4.9,
                    reviews: 214,
                    badge: 'new',
                    badgeText: 'НОВИНКА'
                },
                {
                    id: 2,
                    name: 'iPhone 14',
                    brand: 'Apple · 128GB',
                    price: 79990,
                    oldPrice: 89990,
                    image: 'img/iphone-15-pro.png',
                    rating: 4.7,
                    reviews: 389,
                    badge: 'sale',
                    badgeText: 'СКИДКА'
                },
                {
                    id: 3,
                    name: 'Samsung Galaxy S24 Ultra',
                    brand: 'Samsung · 512GB',
                    price: 119990,
                    image: 'img/iphone-15-pro.png',
                    rating: 4.8,
                    reviews: 176,
                    badge: 'new',
                    badgeText: 'НОВИНКА'
                }
            ],
            total: 3
        };
        // === КОНЕЦ ЗАГЛУШКИ ===
        
        /* 
        // === РЕАЛЬНЫЙ ЗАПРОС ОТКРЫТЬ ПОСЛЕ НАПИСАНИЯ БЕКА ===
        const response = await fetch('/api/catalog', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        
        if (!response.ok) {
            throw new Error('Ошибка загрузки товаров');
        }
        
        const data = await response.json();
        // ======================================================================
        */
        
        // Рендерим товары
        updateProductGrid(data.products);
        
        // Обновляем счётчик
        updateProductsCount(data.total);
        
    } catch (error) {
        console.error('Ошибка начальной загрузки:', error);
        
        if (grid) {
            grid.innerHTML = `
                <div class="catalog__error" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                    <p style="font-family: var(--font-ui); color: #e74c3c;">
                        Не удалось загрузить товары. Попробуйте обновить страницу.
                    </p>
                    <button class="catalog__retry-btn" style="margin-top: 16px; padding: 10px 20px; background: #07100B; color: #fff; border: none; border-radius: 4px; cursor: pointer;">
                        Попробовать снова
                    </button>
                </div>
            `;
            
            grid.querySelector('.catalog__retry-btn')?.addEventListener('click', () => {
                loadInitialProducts();
            });
        }
    }
}

/*Собирает все активные параметры фильтров в объект*/
function collectFilterParams() {
    const priceInputs = document.querySelectorAll('.filters__price-input');
    const activeTags = document.querySelectorAll('.filters__tag.is-active');

    // Группируем теги по категориям (по данным в data-атрибутах)
    const filters = {
        price: {
            min: parseInt(priceInputs[0].value) || 0,
            max: parseInt(priceInputs[1].value) || 100_000_000
        },
        categories: [],
        brands: [],
        memory: []
    };

    // Собираем активные теги
    activeTags.forEach(tag => {
        const group = tag.closest('.filters__group');
        const type = group?.dataset.type; // Например: data-type="brands"
        if (type && filters[type]) {
            filters[type].push(tag.textContent.trim());
        }
    });

    // Добавляем текущую сортировку
    const sortSelect = document.querySelector('.catalog__select');
    if (sortSelect) {
        filters.sort = sortSelect.value;
    }

    return filters;
}

/*Обновляет сетку товаров новыми данными*/
function updateProductGrid(products) {
    const grid = document.querySelector('.catalog__grid');
    if (!grid) return;

    if (!products || products.length === 0) {
        grid.innerHTML = `
            <div class="catalog__empty" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <p style="font-family: var(--font-ui); color: #666;">
                    По вашему запросу ничего не найдено
                </p>
            </div>
        `;
        return;
    }

    grid.innerHTML = products.map(renderProductCard).join('');

    initCartButtons();
}

/*Рендерит одну карточку товара*/
function renderProductCard(product) {
    return `
        <article class="product-card ${getCardModifiers(product)}" data-id="${product.id}">
            <a href="product.html?id=${product.id}" class="product-card__link"></a>
            ${getBadgeHTML(product)}
            <div class="product-card__image-wrapper">
                <img src="${product.image || 'img/placeholder.png'}" 
                     alt="${product.name || 'Товар'}" 
                     class="product-card__image"
                     loading="lazy">
            </div>
            <div class="product-card__info">
                <span class="product-card__brand">${product.brand || ''}</span>
                <h3 class="product-card__title">${product.name || 'Без названия'}</h3>
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

function getBadgeHTML(product) {
    if (product.badge) {
        const type = product.badge;
        const text = product.badgeText || (type === 'new' ? 'НОВИНКА' : 'СКИДКА');
        return `<div class="product-card__badge product-card__badge--${type}">${text}</div>`;
    }
    if (product.type === 'new') {
        return `<div class="product-card__badge product-card__badge--new">НОВИНКА</div>`;
    }
    if (product.type === 'sale' || product.oldPrice) {
        return `<div class="product-card__badge product-card__badge--sale">СКИДКА</div>`;
    }
    return '';
}

function getCardModifiers(product) {
    const modifiers = [];
    if (product.type === 'new' || product.badge === 'new') {
        modifiers.push('product-card--new');
    }
    if (product.type === 'sale' || product.badge === 'sale' || product.oldPrice) {
        modifiers.push('product-card--sale');
    }
    return modifiers.join(' ');
}

function getRatingHTML(product) {
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

function getPriceHTML(product) {
    const currentPrice = formatPrice(product.price);
    if (product.oldPrice) {
        const oldPrice = formatPrice(product.oldPrice);
        return `
            <div class="product-card__price">
                <span class="product-card__price-current">${currentPrice}</span>
                <del class="product-card__price-old" aria-label="Старая цена: ${oldPrice}">
                    ${oldPrice}
                </del>
            </div>
        `;
    }
    return `<div class="product-card__price"><span class="product-card__price-current">${currentPrice}</span></div>`;
}

/*Обновляет счётчик товаров в заголовке*/
function updateProductsCount(count) {
    const counter = document.querySelector('.catalog__count');
    if (counter) {
        const word = getPluralForm(count, ['товар', 'товара', 'товаров']);
        counter.textContent = `${count} ${word}`;
    }
}

/*Форматирует цену: 109990 → "109 990 ₽"*/
function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
}

/*Склоняет слова: 1 товар, 2 товара, 5 товаров*/
function getPluralForm(number, titles) {
    const cases = [2, 0, 1, 1, 1, 2];
    return titles[(number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5]];
}

/**
 * Инициализирует кнопки "Добавить в корзину"
 * ПЕРЕПИСАТЬ КОД ПОСЛЕ ПОДКЛЮЧЕНИЯ БЕКА
 */
function initCartButtons() {
    document.querySelectorAll('.product-card__btn').forEach(btn => {
        // Удаляем старые обработчики
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        // Новый обработчик
        newBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const card = newBtn.closest('.product-card');
            const productId = card?.dataset.id;
            const productName = card?.querySelector('.product-card__title')?.textContent;
            
            try {
                // Анимация загрузки
                newBtn.classList.add('product-card__btn--loading');
                newBtn.disabled = true;
                
                // Имитация задержки
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                // Успех
                showNotification(`${productName} добавлен в корзину`, 'success');
                
            } catch (error) {
                console.error('Ошибка добавления в корзину:', error);
                showNotification('Не удалось добавить товар', 'error');
            } finally {
                newBtn.classList.remove('product-card__btn--loading');
                newBtn.disabled = false;
            }
        });
    });
}

// Вызываем после того, как DOM готов
document.addEventListener('DOMContentLoaded', () => {
    // Инициализируем фильтры 
    initFilters();

    // Загружаем и показываем все товары
    loadInitialProducts();

    // Инициализируем кнопки корзины
    initCartButtons();

    const applyFiltersBtn = document.querySelector('.filters__apply-btn');

    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', async () => {
            // 1. Собираем параметры фильтров
            const filters = collectFilterParams();

            // 2. Показываем состояние загрузки
            applyFiltersBtn.disabled = true;
            applyFiltersBtn.textContent = 'Загрузка...';

            try {
                // 3. Отправляем запрос на сервер
                const response = await fetch('/api/catalog', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(filters)
                });

                if (!response.ok) {
                    throw new Error('Ошибка сервера');
                }

                const data = await response.json();

                // 4. Обновляем сетку товаров
                updateProductGrid(data.products);

                // 5. Обновляем счётчик товаров
                updateProductsCount(data.total);

                // 6. Показываем уведомление об успехе
                showNotification('Фильтры применены', 'success');

                // 7. На мобильных закрываем панель
                if (window.innerWidth <= 800) {
                    closeFiltersPanel();
                }

            } catch (error) {
                console.error('Ошибка фильтрации:', error);
                showNotification('Не удалось применить фильтры', 'error');
            } finally {
                // Возвращаем кнопку в исходное состояние
                applyFiltersBtn.disabled = false;
                applyFiltersBtn.textContent = 'Применить фильтры';
            }
        });
    }
});

// ПЕРЕДЕЛАТЬ КОД ПОСЛЕ ПОДКЛЮЧЕНИЯ БЕКА 