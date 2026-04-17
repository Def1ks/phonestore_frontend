// Подключить API запросы
import { getProducts } from './api.js';
import { initCartButtons } from './cart-buttons.js';
import { renderProductCard, getPluralForm } from './product-render.js';

function initFilters() {
    const filtersToggle = document.querySelector('.catalog__filters-toggle');
    const filtersPanel = document.querySelector('.catalog__filters');
    const filtersClose = document.querySelector('.catalog__filters-close');

    // Ранний выход, если нет ключевых элементов
    if (!filtersToggle || !filtersPanel) return;

    // Вспомогательные функции
    const isMobile = () => window.innerWidth <= 800;

    const toggleBodyScroll = (lock) => {
        if (isMobile()) {
            document.body.style.overflow = lock ? 'hidden' : '';
        }
    };

    const closePanel = () => {
        filtersPanel.classList.remove('is-active');
        filtersToggle.setAttribute('aria-expanded', 'false');
        toggleBodyScroll(false);
    };

    const togglePanel = () => {
        const isActive = filtersPanel.classList.toggle('is-active');
        filtersToggle.setAttribute('aria-expanded', isActive);
        toggleBodyScroll(isActive);
    };

    // Открытие/закрытие по кнопке
    filtersToggle.addEventListener('click', togglePanel);

    // Закрытие по крестику
    filtersClose?.addEventListener('click', closePanel);

    // Закрытие по клику на фон 
    filtersPanel.addEventListener('click', (e) => {
        if (e.target === filtersPanel && isMobile()) {
            closePanel();
        }
    });

    // Переключение тегов 
    filtersPanel.addEventListener('click', (e) => {
        const tag = e.target.closest('.filters__tag');
        if (tag) {
            tag.classList.toggle('is-active');
        }
    });

    // Валидация цены
    initPriceValidation();
}

function initPriceValidation() {
    const [minInput, maxInput] = document.querySelectorAll('.filters__price-input');
    if (!minInput || !maxInput) return;

    const MAX_PRICE = 100_000_000;
    const DEFAULT_MAX = 150_000;

    const clamp = (val) => Math.min(Math.max(val, 0), MAX_PRICE);

    const syncPrices = () => {
        let min = clamp(parseInt(minInput.value) || 0);
        let max = clamp(parseInt(maxInput.value) || DEFAULT_MAX);

        if (min > max) [min, max] = [max, max];

        minInput.value = min;
        maxInput.value = max;
    };

    minInput.addEventListener('input', syncPrices);
    maxInput.addEventListener('input', syncPrices);

    const blockNonNumeric = (e) => {
        if (e.key && !/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
            e.preventDefault();
        }
    };

    minInput.addEventListener('keydown', blockNonNumeric);
    maxInput.addEventListener('keydown', blockNonNumeric);

    minInput.addEventListener('blur', syncPrices);
    maxInput.addEventListener('blur', syncPrices);
}

// НАЧАЛЬНАЯ ЗАГРУЗКА ТОВАРОВ
async function loadInitialProducts() {
    const grid = document.querySelector('.catalog__grid');

    if (grid) {
        grid.innerHTML = `
            <div class="catalog__loading">
                <div class="spinner"></div>
                <p>Загрузка товаров...</p>
            </div>
        `;
    }

    try {
        // === РЕАЛЬНЫЙ API ЗАПРОС ===
        const data = await getProducts();
        
        updateProductGrid(data.products);
        updateProductsCount(data.total);
        
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        
        if (grid) {
            grid.innerHTML = `
                <div class="catalog__error">
                    <p>Не удалось загрузить товары</p>
                    <p style="font-size: 12px; color: #999; margin-top: 8px;">${error.message}</p>
                    <button class="catalog__retry-btn" type="button">
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

// Сбор параметров фильтров
function collectFilterParams() {
    const priceInputs = document.querySelectorAll('.filters__price-input');
    const activeTags = document.querySelectorAll('.filters__tag.is-active');

    const filters = {
        price: {
            min: parseInt(priceInputs[0].value) || 0,
            max: parseInt(priceInputs[1].value) || 100_000_000
        },
        categories: [],
        brands: [],
        memory: []
    };

    activeTags.forEach(tag => {
        const group = tag.closest('.filters__group');
        const type = group?.dataset.type;
        if (type && filters[type]) {
            filters[type].push(tag.textContent.trim());
        }
    });

    const sortSelect = document.querySelector('.catalog__select');
    if (sortSelect) {
        filters.sort = sortSelect.value;
    }

    return filters;
}

// Обновление сетки товаров 
function updateProductGrid(products) {
    const grid = document.querySelector('.catalog__grid');
    if (!grid) return;

    if (!products || products.length === 0) {
        grid.innerHTML = `
            <div class="catalog__empty">
                <p>По вашему запросу ничего не найдено</p>
            </div>
        `;
        return;
    }

    try {
        grid.innerHTML = products.map(renderProductCard).join('');
        initCartButtons();
    } catch (error) {
        console.error('Ошибка при рендеринге:', error);
    }
}

// Обновление счётчика 
function updateProductsCount(count) {
    const counter = document.querySelector('.catalog__count');
    if (counter) {
        const word = getPluralForm(count, ['товар', 'товара', 'товаров']);
        counter.textContent = `${count} ${word}`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initFilters();
    loadInitialProducts();

    // Обработчик кнопки "Применить фильтры"
    const applyFiltersBtn = document.querySelector('.filters__apply-btn');
    
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', async () => {
            const filters = collectFilterParams();
            
            applyFiltersBtn.disabled = true;
            applyFiltersBtn.textContent = 'Загрузка...';
            
            try {
                // === РЕАЛЬНЫЙ API ЗАПРОС С ФИЛЬТРАМИ ===
                const data = await getProducts(filters);
                
                updateProductGrid(data.products);
                updateProductsCount(data.total);
                
                if (typeof showNotification === 'function') {
                    showNotification('Фильтры применены', 'success');
                }
                
                if (window.innerWidth <= 800) {
                    document.querySelector('.catalog__filters')?.classList.remove('is-active');
                }
                
            } catch (error) {
                console.error('Ошибка фильтрации:', error);
                if (typeof showNotification === 'function') {
                    showNotification('Не удалось применить фильтры', 'error');
                }
            } finally {
                applyFiltersBtn.disabled = false;
                applyFiltersBtn.textContent = 'Применить фильтры';
            }
        });
    }
});