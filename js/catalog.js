import { getProducts, getFilterOptions } from './api.js';
import { initCartButtons } from './cart-buttons.js';
import { renderProductCard, getPluralForm } from './product-render.js';

const state = {
    filters: {
        page: 1,
        limit: 1000,
        brand: '',
        ram: '',
        storage: '',
        color: '',
        minPrice: 0,
        maxPrice: 350000,
        sortBy: 'price',
        sortOrder: 'desc'
    },
    filterOptions: {
        brands: [],
        ram: [],
        storage: [],
        colors: []
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    await loadFilterOptions();
    initFiltersUI();
    loadProducts();
});

//  ЗАГРУЗКА ОПЦИЙ ФИЛЬТРОВ 
async function loadFilterOptions() {
    try {
        const options = await getFilterOptions();
        state.filterOptions = options;

        renderFilterTags('brand', options.brands, 'id_brand', 'name');
        renderFilterTags('ram', options.ram, 'id_ram', 'size_gb', ' ГБ');
        renderFilterTags('storage', options.storage, 'id_storage', 'size_gb', ' ГБ');
        renderFilterTags('color', options.colors, 'id_color', 'name');

        applyFiltersFromURL();
    } catch (error) {
        console.warn('Не удалось загрузить опции фильтров:', error);
    }
}

// Универсальный рендер тегов
function renderFilterTags(type, items, idField, labelField, suffix = '') {
    const container = document.querySelector(`.filters__group[data-type="${type}"] .filters__tags`);
    if (!container || !items?.length) return;

    container.innerHTML = items.map(item => `
        <button class="filters__tag" 
                type="button" 
                data-type="${type}" 
                data-id="${item[idField]}"
                data-value="${item[labelField]}">
            ${item[labelField]}${suffix}
        </button>
    `).join('');
}

//  UI: ОБРАБОТЧИКИ 
function initFiltersUI() {
    const filtersToggle = document.querySelector('.catalog__filters-toggle');
    const filtersPanel = document.querySelector('.catalog__filters');
    const filtersClose = document.querySelector('.catalog__filters-close');

    if (filtersToggle && filtersPanel) {
        const togglePanel = () => {
            const isActive = filtersPanel.classList.toggle('is-active');
            filtersToggle.setAttribute('aria-expanded', isActive);
            if (window.innerWidth <= 800) {
                document.body.style.overflow = isActive ? 'hidden' : '';
            }
        };
        filtersToggle.addEventListener('click', togglePanel);
        filtersClose?.addEventListener('click', () => {
            filtersPanel.classList.remove('is-active');
            filtersToggle.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        });
    }

    filtersPanel?.addEventListener('click', (e) => {
        const tag = e.target.closest('.filters__tag');
        if (tag) {
            tag.classList.toggle('is-active');

        }
    });

    const applyBtnFilter = document.querySelector('.filters__apply-btn');
    applyBtnFilter?.addEventListener('click', () => {
        applyFilters(); 
    });


    const [minInput, maxInput] = document.querySelectorAll('.filters__price-input');
    if (minInput && maxInput) {
        const syncPrice = () => {
            let min = parseInt(minInput.value) || 0;
            let max = parseInt(maxInput.value) || 350000;
            if (min > max) [min, max] = [max, max];
            state.filters.minPrice = min;
            state.filters.maxPrice = max;
        };
        minInput.addEventListener('change', () => { syncPrice(); applyFilters(); });
        maxInput.addEventListener('change', () => { syncPrice(); applyFilters(); });
    }

    const sortSelect = document.querySelector('.catalog__select');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            switch (e.target.value) {
                case 'price-asc':
                    state.filters.sortBy = 'price';
                    state.filters.sortOrder = 'asc';
                    break;
                case 'price-desc':
                    state.filters.sortBy = 'price';
                    state.filters.sortOrder = 'desc';
                    break;
                default:
                    state.filters.sortBy = 'price';
                    state.filters.sortOrder = 'desc';
            }
            state.filters.page = 1;
            loadProducts();
        });
    }

    const applyBtn = document.querySelector('.filters__apply-btn');
    if (applyBtn) {
        applyBtn.addEventListener('click', () => {
            state.filters.page = 1;
            applyFilters();
            if (window.innerWidth <= 800) {
                filtersPanel?.classList.remove('is-active');
            }
        });
    }

    const resetBtn = document.createElement('button');
    resetBtn.className = 'filters__reset-btn';
    resetBtn.type = 'button';
    resetBtn.textContent = 'Сбросить';
    document.querySelector('.filters__actions')?.appendChild(resetBtn);

    resetBtn.addEventListener('click', () => {
        document.querySelectorAll('.filters__tag.is-active').forEach(t => t.classList.remove('is-active'));
        if (minInput) minInput.value = 0;
        if (maxInput) maxInput.value = 350000;
        if (sortSelect) sortSelect.value = 'default';

        state.filters = {
            page: 1, limit: 20,
            brand: '', ram: '', storage: '', color: '',
            minPrice: 0, maxPrice: 350000,
            sortBy: 'price', sortOrder: 'desc'
        };
        loadProducts();
    });
}

//  ПРИМЕНЕНИЕ ФИЛЬТРОВ 
function applyFilters() {
    state.filters.page = 1;
    loadProducts();
}

function getSelectedFilterIds(type) {
    const activeTags = document.querySelectorAll(`.filters__tag[data-type="${type}"].is-active`);
    return Array.from(activeTags).map(tag => tag.dataset.id);
}
//  ЗАГРУЗКА ТОВАРОВ 
async function loadProducts() {
    const grid = document.querySelector('.catalog__grid');
    if (grid) {
        grid.innerHTML = '<div class="catalog__loading"><div class="spinner"></div><p>Загрузка...</p></div>';
    }

    const params = {
        page: state.filters.page,
        limit: state.filters.limit,
        minPrice: state.filters.minPrice,
        maxPrice: state.filters.maxPrice,
        sortBy: state.filters.sortBy,
        sortOrder: state.filters.sortOrder
    };

    const brands = getSelectedFilterIds('brand');
    const ram = getSelectedFilterIds('ram');
    const storage = getSelectedFilterIds('storage');
    const colors = getSelectedFilterIds('color');

    if (brands.length > 0) params.brand = brands;
    if (ram.length > 0) params.ram = ram;
    if (storage.length > 0) params.storage = storage;
    if (colors.length > 0) params.color = colors;

    try {
        const data = await getProducts(params);
        renderProducts(data.products);
        updateProductsCount(data.total);
    } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
        if (grid) {
            grid.innerHTML = `<div class="catalog__error"><p>Ошибка: ${error.message}</p></div>`;
        }
    }
}

function renderProducts(products) {
    const grid = document.querySelector('.catalog__grid');
    if (!grid) return;

    if (!products?.length) {
        grid.innerHTML = '<div class="catalog__empty"><p>Товары не найдены</p></div>';
        return;
    }

    grid.innerHTML = products.map(renderProductCard).join('');
    initCartButtons();
}

function updateProductsCount(count) {
    const counter = document.querySelector('.catalog__count');
    if (counter) {
        const word = getPluralForm(count, ['товар', 'товара', 'товаров']);
        counter.textContent = `${count} ${word}`;
    }
}

function applyFiltersFromURL() {
    const params = new URLSearchParams(window.location.search);

    const filterTypes = ['brand', 'ram', 'storage', 'color'];
    let hasFilters = false;

    filterTypes.forEach(type => {
        const id = params.get(type);
        if (id) {
            const tag = document.querySelector(`.filters__tag[data-type="${type}"][data-id="${id}"]`);
            if (tag) {
                tag.classList.add('is-active');
                hasFilters = true;
            }
        }
    });

    if (hasFilters) {
        loadProducts();
    }
}