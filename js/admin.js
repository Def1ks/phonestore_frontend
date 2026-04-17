
// ==================== DATA MANAGER (Кэширование) ====================
const DataManager = {
    cache: new Map(),
    DEFAULT_TTL: 5 * 60 * 1000, // 5 минут

    async get(key, fetchUrl, ttl = this.DEFAULT_TTL) {
        const now = Date.now();
        const cached = this.cache.get(key);

        if (cached && (now - cached.timestamp < ttl)) {
            console.log(`📦 Cache HIT: ${key}`);
            return cached.data;
        }

        console.log(`🌐 Fetching API: ${fetchUrl}`);
        try {
            // Имитация API запроса
            const data = await this.mockFetch(key);
            this.cache.set(key, { data, timestamp: now });
            return data;
        } catch (error) {
            console.error(`Ошибка загрузки ${key}:`, error);
            return cached ? cached.data : [];
        }
    },

    invalidate(key) {
        console.log(`🗑️ Cache INVALIDATED: ${key}`);
        this.cache.delete(key);
    },

    clearAll() {
        this.cache.clear();
    },

    // Заглушка API (удалить при подключении реального бэкенда)
    mockFetch(key) {
        return new Promise(resolve => setTimeout(() => {
            const mocks = {
                products: [
                    { id: 1, name: 'iPhone 15 Pro', brand: { id: 1, name: 'Apple' }, description: 'Титановый корпус', specs: { 'Дисплей': '6.1\' XDR' }, variants: [{ id: 1, colorId: 8, ramId: 3, storageId: 3, price: 109990, oldPrice: 129990, image: 'iphone-15-pro-black.jpg', badge: 'new' }] },
                    { id: 2, name: 'iPhone 14', brand: { id: 1, name: 'Apple' }, description: 'Классика', specs: {}, variants: [{ id: 4, colorId: 3, ramId: 2, storageId: 2, price: 79990, badge: 'sale' }] },
                    { id: 3, name: 'Samsung Galaxy S24 Ultra', brand: { id: 2, name: 'Samsung' }, description: 'Флагман', specs: {}, variants: [{ id: 5, colorId: 5, ramId: 4, storageId: 4, price: 119990, badge: null }] },
                    { id: 4, name: 'Xiaomi 14 Ultra', brand: { id: 3, name: 'Xiaomi' }, description: 'Leica камера', specs: {}, variants: [{ id: 6, colorId: 1, ramId: 4, storageId: 3, price: 99990, badge: null }] },
                    { id: 5, name: 'Google Pixel 8 Pro', brand: { id: 4, name: 'Google' }, description: 'Чистый Android', specs: {}, variants: [{ id: 7, colorId: 3, ramId: 3, storageId: 3, price: 89990, badge: null }] }
                ],
                brands: [
                    { id: 1, name: 'Apple', productsCount: 8 },
                    { id: 2, name: 'Samsung', productsCount: 5 },
                    { id: 3, name: 'Xiaomi', productsCount: 4 },
                    { id: 4, name: 'Google', productsCount: 2 }
                ],
                colors: [
                    { id: 1, name: 'Черный', productsCount: 12 },
                    { id: 2, name: 'Белый', productsCount: 10 },
                    { id: 3, name: 'Синий', productsCount: 8 },
                    { id: 4, name: 'Золотой', productsCount: 6 },
                    { id: 5, name: 'Серебристый', productsCount: 5 },
                    { id: 6, name: 'Зеленый', productsCount: 4 },
                    { id: 7, name: 'Красный', productsCount: 3 },
                    { id: 8, name: 'Натуральный титан', productsCount: 2 }
                ],
                ram: [
                    { id: 1, size: 4, productsCount: 2 },
                    { id: 2, size: 6, productsCount: 5 },
                    { id: 3, size: 8, productsCount: 15 },
                    { id: 4, size: 12, productsCount: 10 },
                    { id: 5, size: 16, productsCount: 6 },
                    { id: 6, size: 24, productsCount: 1 }
                ],
                memory: [
                    { id: 1, size: 64, productsCount: 3 },
                    { id: 2, size: 128, productsCount: 12 },
                    { id: 3, size: 256, productsCount: 18 },
                    { id: 4, size: 512, productsCount: 10 },
                    { id: 5, size: 1024, productsCount: 5 },
                    { id: 6, size: 2048, productsCount: 2 }
                ],
                orders: [
                    {
                        id: '12345', user_id: 1, status: 'delivered', phone: '+7 900 123 45 67', email: 'alex@mail.ru',
                        payment_type: 'card', delivery_type: 'pickup', total_amount: 219980, created_at: '2026-04-01T10:30:00Z',
                        items: [{ variant_id: 1, quantity: 2, price_at_buy: 109990, product_name: 'iPhone 15 Pro' }],
                        delivery: { pickup_point_id: 1, city: 'Москва' }
                    },
                    {
                        id: '12346', user_id: 2, status: 'processing', phone: '+7 911 987 65 43', email: 'maria.p@mail.ru',
                        payment_type: 'online', delivery_type: 'courier', total_amount: 129990, created_at: '2026-04-05T14:15:00Z',
                        items: [{ variant_id: 5, quantity: 1, price_at_buy: 129990, product_name: 'Samsung Galaxy S24 Ultra' }],
                        delivery: { street: 'Ленина', house: '15', apartment: '42', postal_code: '101000', city: 'Москва' }
                    }
                ]
            };
            resolve(mocks[key] || []);
        }, 400));
    }
};

// ==================== ГЛОБАЛЬНОЕ СОСТОЯНИЕ ====================
let currentProductId = null;
let currentBrandId = null;
let currentColorId = null;
let currentRamId = null;
let currentMemoryId = null;
let currentOrderId = null;

const USERS_DATA = [
    { id: 1, firstName: 'Александр', lastName: 'К.', email: 'alex@mail.ru', role: 'user', ordersCount: 12, registeredAt: '2026-01-02' },
    { id: 2, firstName: 'Мария', lastName: 'Петрова', email: 'maria.p@mail.ru', role: 'user', ordersCount: 5, registeredAt: '2026-01-15' },
    { id: 3, firstName: 'Дмитрий', lastName: 'Сидоров', email: 'dmitry.s@yandex.ru', role: 'user', ordersCount: 8, registeredAt: '2026-02-01' },
    { id: 4, firstName: 'Елена', lastName: 'В.', email: 'elena.v@gmail.com', role: 'manager', ordersCount: 0, registeredAt: '2026-02-10' },
    { id: 5, firstName: 'Админ', lastName: 'Админов', email: 'admin@phonestore.ru', role: 'admin', ordersCount: 0, registeredAt: '2025-12-01' }
];

const PICKUP_POINTS_DATA = [
    { id: 1, name: 'ТЦ Метрополис', address: 'Москва, Ленинградское ш., д. 16А' },
    { id: 2, name: 'ТЦ Галерея', address: 'СПб, Лиговский пр., д. 30А' }
];

const STATS_DATA = {
    products: { total: 24, change: '+3 за месяц' },
    users: { total: 186, change: '+28 за неделю' },
    orders: { total: 342, change: '+12%' },
    rating: { total: 4.2, change: 'из 5.0' }
};

// ==================== DOM ЭЛЕМЕНТЫ ====================
const els = {
    productList: document.querySelector('.admin-products-list'),
    productForm: document.querySelector('.admin-product-form'),
    stubPage: document.getElementById('admin-stub'),
    form: document.getElementById('admin-product-form'),
    brandSelect: document.getElementById('product-brand'),
    characteristicsList: document.getElementById('characteristics-list'),
    variantsList: document.getElementById('variants-list'),
    addCharacteristicBtn: document.querySelector('[data-admin-add-characteristic]'),
    addVariantBtn: document.querySelector('[data-admin-add-variant]'),
    saveBtn: document.querySelector('[data-admin-save]'),
    cancelBtn: document.querySelector('[data-admin-cancel]'),
    backBtn: document.querySelector('[data-admin-back]'),
    addProductBtn: document.querySelector('[data-admin-add-product]'),
    pageTitle: document.querySelector('.admin-page-title'),
    pageSubtitle: document.querySelector('.admin-page-subtitle'),
    stubTitle: document.getElementById('stub-title'),
    stubSubtitle: document.getElementById('stub-subtitle')
};

// ==================== РОУТЕР ====================
const AdminRouter = {
    routes: {
        products: { title: 'ТОВАРЫ', subtitle: 'УПРАВЛЕНИЕ КАТАЛОГОМ', render: renderProductsPage },
        brands: { title: 'БРЕНДЫ', subtitle: 'УПРАВЛЕНИЕ ПРОИЗВОДИТЕЛЯМИ', render: renderBrandsPage },
        colors: { title: 'ЦВЕТА', subtitle: 'УПРАВЛЕНИЕ ЦВЕТАМИ', render: renderColorsPage },
        ram: { title: 'RAM', subtitle: 'УПРАВЛЕНИЕ ОПЕРАТИВНОЙ ПАМЯТЬЮ', render: renderRamPage },
        memory: { title: 'ПАМЯТЬ', subtitle: 'УПРАВЛЕНИЕ НАКОПИТЕЛЯМИ', render: renderMemoryPage },
        orders: { title: 'ЗАКАЗЫ', subtitle: 'УПРАВЛЕНИЕ ЗАКАЗАМИ КЛИЕНТОВ', render: renderOrdersPage },
        statistics: { title: 'СТАТИСТИКА', subtitle: 'ОБЗОР ОСНОВНЫХ ПОКАЗАТЕЛЕЙ', render: renderStatisticsPage },
        users: { title: 'ПОЛЬЗОВАТЕЛИ', subtitle: 'ЗАРЕГИСТРИРОВАННЫЕ АККАУНТЫ', render: renderUsersPage }
    },

    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute();
    },

    handleRoute() {
        const hash = window.location.hash.replace('#', '');
        const parts = hash.split('/').filter(Boolean);
        if (parts[0] !== 'admin') return;

        const section = parts[1] || 'products';
        const action = parts[2];
        const id = parts[3];

        this.updateActiveNav(section);

        const route = this.routes[section];
        if (route) {
            route.render(action, id);
            this.updateHeader(route.title, route.subtitle);
        } else {
            this.routes.products.render();
            this.updateHeader('ТОВАРЫ', 'УПРАВЛЕНИЕ КАТАЛОГОМ');
        }
    },

    updateActiveNav(section) {
        document.querySelectorAll('.admin-sidebar__link').forEach(link => {
            link.classList.toggle('is-active', link.dataset.adminTab === section);
        });
    },

    updateHeader(title, subtitle) {
        if (els.pageTitle) els.pageTitle.textContent = title;
        if (els.pageSubtitle) els.pageSubtitle.textContent = subtitle;
        if (els.stubTitle) els.stubTitle.textContent = title;
        if (els.stubSubtitle) els.stubSubtitle.textContent = subtitle;
    },

    navigate(section, action = null, id = null) {
        let hash = `#admin/${section}`;
        if (action) hash += `/${action}`;
        if (id) hash += `/${id}`;
        window.location.hash = hash;
    }
};

// ==================== РЕНДЕРИНГ СТРАНИЦ ====================
function hideAllPages() {
    hideProductList(); hideProductForm();
    hideBrandsList(); hideBrandForm();
    hideColorsList(); hideColorForm();
    hideRamList(); hideRamForm();
    hideMemoryList(); hideMemoryForm();
    hideOrdersList(); hideOrderDetails();
    const statsPage = document.getElementById('statistics-page');
    if (statsPage) statsPage.style.display = 'none';
    const usersList = document.getElementById('users-list');
    if (usersList) usersList.style.display = 'none';
    if (els.stubPage) els.stubPage.style.display = 'none';
}

function renderProductsPage(action, id) {
    hideAllPages();
    if (action === 'add' || (action === 'edit' && id)) {
        showProductForm();
        if (action === 'edit' && id) {
            currentProductId = id;
            loadProductData(id);
        } else {
            currentProductId = null;
            resetForm();
        }
    } else {
        showProductList();
        loadProducts();
    }
}

function renderBrandsPage(action, id) {
    hideAllPages();
    if (action === 'add' || (action === 'edit' && id)) {
        showBrandForm();
        if (action === 'edit' && id) {
            currentBrandId = id;
            loadBrandData(id);
        } else {
            currentBrandId = null;
            resetBrandForm();
        }
    } else {
        showBrandsList();
        loadBrands();
    }
}

function renderColorsPage(action, id) {
    hideAllPages();
    if (action === 'add' || (action === 'edit' && id)) {
        showColorForm();
        if (action === 'edit' && id) {
            currentColorId = id;
            loadColorData(id);
        } else {
            currentColorId = null;
            resetColorForm();
        }
    } else {
        showColorsList();
        loadColors();
    }
}

function renderRamPage(action, id) {
    hideAllPages();
    if (action === 'add' || (action === 'edit' && id)) {
        showRamForm();
        if (action === 'edit' && id) {
            currentRamId = id;
            loadRamData(id);
        } else {
            currentRamId = null;
            resetRamForm();
        }
    } else {
        showRamList();
        loadRam();
    }
}

function renderMemoryPage(action, id) {
    hideAllPages();
    if (action === 'add' || (action === 'edit' && id)) {
        showMemoryForm();
        if (action === 'edit' && id) {
            currentMemoryId = id;
            loadMemoryData(id);
        } else {
            currentMemoryId = null;
            resetMemoryForm();
        }
    } else {
        showMemoryList();
        loadMemory();
    }
}

function renderOrdersPage(action, id) {
    hideAllPages();
    if (action === 'view' && id) {
        showOrderDetails(id);
    } else {
        showOrdersList();
        loadOrders();
    }
}

function renderStatisticsPage() {
    hideAllPages();
    const statsPage = document.getElementById('statistics-page');
    if (statsPage) {
        statsPage.style.display = 'block';
        loadStatistics();
    }
}

function renderUsersPage() {
    hideAllPages();
    const usersList = document.getElementById('users-list');
    if (usersList) {
        usersList.style.display = 'block';
        loadUsers();
    }
}

// ==================== ТОВАРЫ ====================
function showProductList() { if (els.productList) els.productList.style.display = 'block'; }
function hideProductList() { if (els.productList) els.productList.style.display = 'none'; }
function showProductForm() { if (els.productForm) els.productForm.style.display = 'block'; window.scrollTo(0, 0); }
function hideProductForm() { if (els.productForm) els.productForm.style.display = 'none'; }

async function loadProducts() {
    const products = await DataManager.get('products', '/api/products');
    renderProductsTable(products);
}

function renderProductsTable(products) {
    const tbody = document.querySelector('.admin-products-list tbody');
    if (!tbody) return;
    if (!products.length) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:40px;color:#999;">Товары не найдены</td></tr>';
        return;
    }
    tbody.innerHTML = products.map(product => `
                <tr class="admin-table__row" data-product-id="${product.id}">
                    <td class="admin-table__td">#${product.id}</td>
                    <td class="admin-table__td">
                        <div class="admin-table__product">
                            <div class="admin-table__product-image">IMG</div>
                            <div>
                                <div class="admin-table__product-name">${product.name}</div>
                                <div class="admin-table__product-brand">${product.brand?.name || ''}</div>
                            </div>
                        </div>
                    </td>
                    <td class="admin-table__td">${product.variants?.length || 0}</td>
                    <td class="admin-table__td">
                        <div class="admin-table__actions">
                            <button class="admin-btn admin-btn--secondary admin-btn--small" data-action="edit">ИЗМЕНИТЬ</button>
                            <button class="admin-btn admin-btn--secondary admin-btn--small" data-action="delete">УДАЛИТЬ</button>
                        </div>
                    </td>
                </tr>`).join('');
}

function populateSelects() {
    if (!els.brandSelect) return;
    DataManager.get('brands', '/api/brands').then(brands => {
        const opts = brands.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
        els.brandSelect.innerHTML = '<option value="">Выберите бренд</option>' + opts;
    });
}

function getColorOptions() { return DataManager.cache.get('colors')?.data.map(c => `<option value="${c.id}">${c.name}</option>`).join('') || ''; }
function getRamOptions() { return DataManager.cache.get('ram')?.data.map(r => `<option value="${r.id}">${r.size} GB</option>`).join('') || ''; }
function getStorageOptions() { return DataManager.cache.get('memory')?.data.map(s => `<option value="${s.id}">${s.size} GB</option>`).join('') || ''; }

function initFormHandlers() {
    els.addCharacteristicBtn?.addEventListener('click', () => addCharacteristicRow());
    els.addVariantBtn?.addEventListener('click', () => addVariantCard());

    els.characteristicsList?.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-admin-remove-characteristic]');
        btn?.closest('.admin-characteristic-row')?.remove();
    });

    els.variantsList?.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-admin-remove-variant]');
        if (btn && window.confirm('Удалить этот вариант?')) {
            btn.closest('.admin-variant-card')?.remove();
            showNotification('Вариант удалён', 'success');
        }
    });

    els.form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        const btn = els.saveBtn;
        if (btn) { btn.disabled = true; btn.textContent = 'Сохранение...'; }

        try {
            await saveProduct(collectFormData());
        } finally {
            if (btn) { btn.disabled = false; btn.textContent = 'СОХРАНИТЬ ТОВАР'; }
        }
    });
}

function addCharacteristicRow() {
    if (!els.characteristicsList) return;
    const row = document.createElement('div');
    row.className = 'admin-characteristic-row';
    row.innerHTML = `
                <input type="text" class="admin-input" placeholder="Название" required>
                <input type="text" class="admin-input" placeholder="Значение" required>
                <button type="button" class="admin-characteristic-remove" data-admin-remove-characteristic>×</button>`;
    els.characteristicsList.appendChild(row);
}

function addVariantCard() {
    if (!els.variantsList) return;
    const card = document.createElement('div');
    card.className = 'admin-variant-card';
    // КАРТИНКА ТЕПЕРЬ ВНУТРИ ВАРИАНТА (согласно ERD)
    // ДОБАВЛЕНО ПОЛЕ БЕЙДЖА
    card.innerHTML = `
                <div class="admin-variant-header">
                    <h3 class="admin-variant-title">НОВЫЙ ВАРИАНТ</h3>
                    <button type="button" class="admin-btn admin-btn--text" data-admin-remove-variant>Удалить</button>
                </div>
                <div class="admin-variant-grid">
                    <div class="admin-form-group">
                        <label class="admin-label">ИЗОБРАЖЕНИЕ ВАРИАНТА</label>
                        <input type="file" class="admin-file-input variant-image" accept="image/*">
                    </div>
                    <div class="admin-form-group">
                        <label class="admin-label">ЦВЕТ</label>
                        <select class="admin-select variant-color" required>
                            <option value="">Выберите цвет</option>${getColorOptions()}
                        </select>
                    </div>
                    <div class="admin-form-group">
                        <label class="admin-label">RAM</label>
                        <select class="admin-select variant-ram" required>
                            <option value="">Выберите RAM</option>${getRamOptions()}
                        </select>
                    </div>
                    <div class="admin-form-group">
                        <label class="admin-label">ПАМЯТЬ</label>
                        <select class="admin-select variant-storage" required>
                            <option value="">Выберите память</option>${getStorageOptions()}
                        </select>
                    </div>
                    <div class="admin-form-group">
                        <label class="admin-label">БЕЙДЖ</label>
                        <select class="admin-select variant-badge">
                            <option value="">Без бейджа</option>
                            <option value="new">НОВИНКА</option>
                            <option value="sale">СКИДКА</option>
                        </select>
                    </div>
                    <div class="admin-form-group">
                        <label class="admin-label">ЦЕНА</label>
                        <input type="number" class="admin-input variant-price" min="0" required>
                    </div>
                    <div class="admin-form-group">
                        <label class="admin-label">СТАРАЯ ЦЕНА</label>
                        <input type="number" class="admin-input variant-old-price" min="0">
                    </div>
                </div>`;
    els.variantsList.appendChild(card);
}

function validateForm() {
    let valid = true;
    els.form?.querySelectorAll('[required]').forEach(input => {
        if (!input.value.trim()) { input.classList.add('admin-input--error'); valid = false; }
        else input.classList.remove('admin-input--error');
    });
    els.form?.querySelectorAll('.variant-price').forEach(input => {
        const val = parseFloat(input.value);
        if (isNaN(val) || val <= 0) { input.classList.add('admin-input--error'); valid = false; }
    });
    if (!valid) {
        showNotification('Заполните обязательные поля', 'error');
        els.form?.querySelector('.admin-input--error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return valid;
}

function collectFormData() {
    const specs = {};
    document.querySelectorAll('.admin-characteristic-row').forEach(row => {
        const [name, value] = row.querySelectorAll('input');
        if (name.value && value.value) specs[name.value.trim()] = value.value.trim();
    });
    const variants = [];
    document.querySelectorAll('.admin-variant-card').forEach(card => {
        variants.push({
            // Картинка теперь внутри варианта
            image: card.querySelector('.variant-image')?.files?.[0] || null,
            colorId: +card.querySelector('.variant-color')?.value,
            ramId: +card.querySelector('.variant-ram')?.value,
            storageId: +card.querySelector('.variant-storage')?.value,
            badge: card.querySelector('.variant-badge')?.value || null,
            price: +card.querySelector('.variant-price')?.value,
            oldPrice: +card.querySelector('.variant-old-price')?.value || null
        });
    });
    return {
        name: document.getElementById('product-name')?.value.trim(),
        brandId: +document.getElementById('product-brand')?.value,
        description: document.getElementById('product-description')?.value.trim(),
        specs, variants
    };
}

function resetForm() {
    els.form?.reset();
    if (els.characteristicsList) els.characteristicsList.innerHTML = '';
    if (els.variantsList) els.variantsList.innerHTML = '';
    document.querySelectorAll('.admin-input--error').forEach(el => el.classList.remove('admin-input--error'));
    addCharacteristicRow(); addVariantCard();
}

async function loadProductData(id) {
    const products = await DataManager.get('products', '/api/products');
    const product = products.find(p => p.id == id);
    if (!product) { showNotification('Товар не найден', 'error'); AdminRouter.navigate('products'); return; }
    fillProductForm(product);
}

function fillProductForm(product) {
    document.getElementById('product-name').value = product.name || '';
    document.getElementById('product-brand').value = product.brand?.id || '';
    document.getElementById('product-description').value = product.description || '';

    if (els.characteristicsList && product.specs) {
        els.characteristicsList.innerHTML = '';
        Object.entries(product.specs).forEach(([name, value]) => {
            const row = document.createElement('div');
            row.className = 'admin-characteristic-row';
            row.innerHTML = `
                        <input type="text" class="admin-input" value="${name}" required>
                        <input type="text" class="admin-input" value="${value}" required>
                        <button type="button" class="admin-characteristic-remove" data-admin-remove-characteristic>×</button>`;
            els.characteristicsList.appendChild(row);
        });
    }

    if (els.variantsList && product.variants?.length) {
        els.variantsList.innerHTML = '';
        product.variants.forEach(v => {
            const card = document.createElement('div');
            card.className = 'admin-variant-card';
            card.innerHTML = `
                        <div class="admin-variant-header">
                            <h3 class="admin-variant-title">ВАРИАНТ</h3>
                            <button type="button" class="admin-btn admin-btn--text" data-admin-remove-variant>Удалить</button>
                        </div>
                        <div class="admin-variant-grid">
                            <div class="admin-form-group">
                                <label class="admin-label">ИЗОБРАЖЕНИЕ ВАРИАНТА</label>
                                <input type="file" class="admin-file-input variant-image" accept="image/*">
                            </div>
                            <div class="admin-form-group">
                                <label class="admin-label">ЦВЕТ</label>
                                <select class="admin-select variant-color" required>
                                    <option value="">Выберите цвет</option>
                                    ${DataManager.cache.get('colors')?.data.map(c => `<option value="${c.id}" ${c.id === v.colorId ? 'selected' : ''}>${c.name}</option>`).join('')}
                                </select>
                            </div>
                            <div class="admin-form-group">
                                <label class="admin-label">RAM</label>
                                <select class="admin-select variant-ram" required>
                                    <option value="">Выберите RAM</option>
                                    ${DataManager.cache.get('ram')?.data.map(r => `<option value="${r.id}" ${r.id === v.ramId ? 'selected' : ''}>${r.size} GB</option>`).join('')}
                                </select>
                            </div>
                            <div class="admin-form-group">
                                <label class="admin-label">ПАМЯТЬ</label>
                                <select class="admin-select variant-storage" required>
                                    <option value="">Выберите память</option>
                                    ${DataManager.cache.get('memory')?.data.map(s => `<option value="${s.id}" ${s.id === v.storageId ? 'selected' : ''}>${s.size} GB</option>`).join('')}
                                </select>
                            </div>
                            <div class="admin-form-group">
                                <label class="admin-label">БЕЙДЖ</label>
                                <select class="admin-select variant-badge">
                                    <option value="">Без бейджа</option>
                                    <option value="new" ${v.badge === 'new' ? 'selected' : ''}>НОВИНКА</option>
                                    <option value="sale" ${v.badge === 'sale' ? 'selected' : ''}>СКИДКА</option>
                                </select>
                            </div>
                            <div class="admin-form-group">
                                <label class="admin-label">ЦЕНА</label>
                                <input type="number" class="admin-input variant-price" value="${v.price || ''}" min="0" required>
                            </div>
                            <div class="admin-form-group">
                                <label class="admin-label">СТАРАЯ ЦЕНА</label>
                                <input type="number" class="admin-input variant-old-price" value="${v.oldPrice || ''}" min="0">
                            </div>
                        </div>`;
            els.variantsList.appendChild(card);
        });
    }
    showNotification(`Загружен: ${product.name}`, 'success');
}

async function saveProduct(data) {
    // Имитация сохранения
    await new Promise(r => setTimeout(r, 800));
    DataManager.invalidate('products'); // Очищаем кэш после изменения
    showNotification(currentProductId ? 'Товар обновлён' : 'Товар создан', 'success');
    setTimeout(() => { AdminRouter.navigate('products'); loadProducts(); }, 400);
}

async function deleteProduct(id) {
    if (!window.confirm('Удалить товар?')) return;
    await new Promise(r => setTimeout(r, 400));
    DataManager.invalidate('products');
    showNotification('Товар удалён', 'success');
    loadProducts();
}

// ==================== БРЕНДЫ ====================
function showBrandsList() { const el = document.getElementById('brands-list'); if (el) el.style.display = 'block'; }
function hideBrandsList() { const el = document.getElementById('brands-list'); if (el) el.style.display = 'none'; }
function showBrandForm() { const el = document.getElementById('brand-form'); if (el) { el.style.display = 'block'; window.scrollTo(0, 0); } }
function hideBrandForm() { const el = document.getElementById('brand-form'); if (el) el.style.display = 'none'; }

async function loadBrands() {
    const brands = await DataManager.get('brands', '/api/brands');
    renderBrandsTable(brands);
}

function renderBrandsTable(brands) {
    const tbody = document.querySelector('#brands-list tbody');
    if (!tbody) return;
    if (!brands.length) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:40px;color:#999;">Бренды не найдены</td></tr>';
        return;
    }
    tbody.innerHTML = brands.map(brand => `
                <tr class="admin-table__row" data-brand-id="${brand.id}">
                    <td class="admin-table__td">#${brand.id}</td>
                    <td class="admin-table__td">
                        <div class="admin-table__product">
                            <div class="admin-table__product-image">${brand.name.substring(0, 2).toUpperCase()}</div>
                            <div><div class="admin-table__product-name">${brand.name}</div></div>
                        </div>
                    </td>
                    <td class="admin-table__td">${brand.productsCount || 0} товаров</td>
                    <td class="admin-table__td">
                        <div class="admin-table__actions">
                            <button class="admin-btn admin-btn--secondary admin-btn--small" data-action="edit-brand">ИЗМЕНИТЬ</button>
                            <button class="admin-btn admin-btn--secondary admin-btn--small" data-action="delete-brand">УДАЛИТЬ</button>
                        </div>
                    </td>
                </tr>`).join('');
}

async function loadBrandData(id) {
    const brands = await DataManager.get('brands', '/api/brands');
    const brand = brands.find(b => b.id == id);
    if (!brand) { showNotification('Бренд не найден', 'error'); AdminRouter.navigate('brands'); return; }
    fillBrandForm(brand);
}

function fillBrandForm(brand) {
    const nameInput = document.getElementById('brand-name');
    if (nameInput) nameInput.value = brand.name || '';
    updateBrandFormHeader('РЕДАКТИРОВАНИЕ БРЕНДА', 'ИЗМЕНИТЕ ДАННЫЕ БРЕНДА');
}

function resetBrandForm() {
    const nameInput = document.getElementById('brand-name');
    if (nameInput) nameInput.value = '';
    updateBrandFormHeader('НОВЫЙ БРЕНД', 'ДОБАВЬТЕ ПРОИЗВОДИТЕЛЯ');
}

function updateBrandFormHeader(title, subtitle) {
    const container = document.getElementById('brand-form');
    if (container) {
        container.querySelector('.admin-page-title').textContent = title;
        container.querySelector('.admin-page-subtitle').textContent = subtitle;
    }
}

async function saveBrand(name) {
    await new Promise(r => setTimeout(r, 600));
    DataManager.invalidate('brands');
    showNotification(currentBrandId ? 'Бренд обновлён' : 'Бренд создан', 'success');
    setTimeout(() => { AdminRouter.navigate('brands'); loadBrands(); }, 400);
}

async function deleteBrand(id) {
    if (!window.confirm('Удалить бренд?')) return;
    await new Promise(r => setTimeout(r, 400));
    DataManager.invalidate('brands');
    showNotification('Бренд удалён', 'success');
    loadBrands();
}

function initBrandsPage() {
    document.querySelector('[data-admin-add-brand]')?.addEventListener('click', () => AdminRouter.navigate('brands', 'add'));
    document.querySelector('[data-brand-back]')?.addEventListener('click', (e) => { e.preventDefault(); AdminRouter.navigate('brands'); });
    document.querySelector('[data-brand-cancel]')?.addEventListener('click', () => AdminRouter.navigate('brands'));

    const form = document.getElementById('brand-form-element');
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('brand-name')?.value.trim();
        if (!name) { showNotification('Введите название бренда', 'error'); return; }
        const btn = form.querySelector('[data-brand-save]');
        if (btn) { btn.disabled = true; btn.textContent = 'Сохранение...'; }
        try { await saveBrand(name); } finally { if (btn) { btn.disabled = false; btn.textContent = 'СОХРАНИТЬ'; } }
    });

    const table = document.querySelector('#brands-list table');
    table?.addEventListener('click', (e) => {
        const editBtn = e.target.closest('[data-action="edit-brand"]');
        const deleteBtn = e.target.closest('[data-action="delete-brand"]');
        if (editBtn) {
            const row = editBtn.closest('[data-brand-id]');
            const id = row?.dataset.brandId;
            if (id) AdminRouter.navigate('brands', 'edit', id);
        } else if (deleteBtn) {
            const row = deleteBtn.closest('[data-brand-id]');
            const id = row?.dataset.brandId;
            if (id) deleteBrand(id);
        }
    });
}

// ==================== ЦВЕТА ====================
function showColorsList() { const el = document.getElementById('colors-list'); if (el) el.style.display = 'block'; }
function hideColorsList() { const el = document.getElementById('colors-list'); if (el) el.style.display = 'none'; }
function showColorForm() { const el = document.getElementById('color-form'); if (el) { el.style.display = 'block'; window.scrollTo(0, 0); } }
function hideColorForm() { const el = document.getElementById('color-form'); if (el) el.style.display = 'none'; }

async function loadColors() {
    const colors = await DataManager.get('colors', '/api/colors');
    renderColorsTable(colors);
}

function renderColorsTable(colors) {
    const tbody = document.querySelector('#colors-list tbody');
    if (!tbody) return;
    if (!colors.length) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:40px;color:#999;">Цвета не найдены</td></tr>';
        return;
    }
    tbody.innerHTML = colors.map(color => `
                <tr class="admin-table__row" data-color-id="${color.id}">
                    <td class="admin-table__td">#${color.id}</td>
                    <td class="admin-table__td">
                        <div class="admin-table__product">
                            <div class="admin-table__product-image">${color.name.substring(0, 2).toUpperCase()}</div>
                            <div><div class="admin-table__product-name">${color.name}</div></div>
                        </div>
                    </td>
                    <td class="admin-table__td">${color.productsCount || 0} товаров</td>
                    <td class="admin-table__td">
                        <div class="admin-table__actions">
                            <button class="admin-btn admin-btn--secondary admin-btn--small" data-action="edit-color">ИЗМЕНИТЬ</button>
                            <button class="admin-btn admin-btn--secondary admin-btn--small" data-action="delete-color">УДАЛИТЬ</button>
                        </div>
                    </td>
                </tr>`).join('');
}

async function loadColorData(id) {
    const colors = await DataManager.get('colors', '/api/colors');
    const color = colors.find(c => c.id == id);
    if (!color) { showNotification('Цвет не найден', 'error'); AdminRouter.navigate('colors'); return; }
    fillColorForm(color);
}

function fillColorForm(color) {
    const nameInput = document.getElementById('color-name');
    if (nameInput) nameInput.value = color.name || '';
    updateColorFormHeader('РЕДАКТИРОВАНИЕ ЦВЕТА', 'ИЗМЕНИТЕ ДАННЫЕ ЦВЕТА');
}

function resetColorForm() {
    const nameInput = document.getElementById('color-name');
    if (nameInput) nameInput.value = '';
    updateColorFormHeader('НОВЫЙ ЦВЕТ', 'ДОБАВЬТЕ ЦВЕТ');
}

function updateColorFormHeader(title, subtitle) {
    const container = document.getElementById('color-form');
    if (container) {
        container.querySelector('.admin-page-title').textContent = title;
        container.querySelector('.admin-page-subtitle').textContent = subtitle;
    }
}

async function saveColor(name) {
    await new Promise(r => setTimeout(r, 600));
    DataManager.invalidate('colors');
    showNotification(currentColorId ? 'Цвет обновлён' : 'Цвет создан', 'success');
    setTimeout(() => { AdminRouter.navigate('colors'); loadColors(); }, 400);
}

async function deleteColor(id) {
    if (!window.confirm('Удалить цвет?')) return;
    await new Promise(r => setTimeout(r, 400));
    DataManager.invalidate('colors');
    showNotification('Цвет удалён', 'success');
    loadColors();
}

function initColorsPage() {
    document.querySelector('[data-admin-add-color]')?.addEventListener('click', () => AdminRouter.navigate('colors', 'add'));
    document.querySelector('[data-color-back]')?.addEventListener('click', (e) => { e.preventDefault(); AdminRouter.navigate('colors'); });
    document.querySelector('[data-color-cancel]')?.addEventListener('click', () => AdminRouter.navigate('colors'));

    const form = document.getElementById('color-form-element');
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('color-name')?.value.trim();
        if (!name) { showNotification('Введите название цвета', 'error'); return; }
        const btn = form.querySelector('[data-color-save]');
        if (btn) { btn.disabled = true; btn.textContent = 'Сохранение...'; }
        try { await saveColor(name); } finally { if (btn) { btn.disabled = false; btn.textContent = 'СОХРАНИТЬ'; } }
    });

    const table = document.querySelector('#colors-list table');
    table?.addEventListener('click', (e) => {
        const editBtn = e.target.closest('[data-action="edit-color"]');
        const deleteBtn = e.target.closest('[data-action="delete-color"]');
        if (editBtn) {
            const row = editBtn.closest('[data-color-id]');
            const id = row?.dataset.colorId;
            if (id) AdminRouter.navigate('colors', 'edit', id);
        } else if (deleteBtn) {
            const row = deleteBtn.closest('[data-color-id]');
            const id = row?.dataset.colorId;
            if (id) deleteColor(id);
        }
    });
}

// ==================== RAM ====================
function showRamList() { const el = document.getElementById('ram-list'); if (el) el.style.display = 'block'; }
function hideRamList() { const el = document.getElementById('ram-list'); if (el) el.style.display = 'none'; }
function showRamForm() { const el = document.getElementById('ram-form'); if (el) { el.style.display = 'block'; window.scrollTo(0, 0); } }
function hideRamForm() { const el = document.getElementById('ram-form'); if (el) el.style.display = 'none'; }

async function loadRam() {
    const ram = await DataManager.get('ram', '/api/ram');
    renderRamTable(ram);
}

function renderRamTable(ram) {
    const tbody = document.querySelector('#ram-list tbody');
    if (!tbody) return;
    if (!ram.length) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:40px;color:#999;">RAM не найден</td></tr>';
        return;
    }
    tbody.innerHTML = ram.map(item => `
                <tr class="admin-table__row" data-ram-id="${item.id}">
                    <td class="admin-table__td">#${item.id}</td>
                    <td class="admin-table__td">${item.size} GB</td>
                    <td class="admin-table__td">${item.productsCount || 0} товаров</td>
                    <td class="admin-table__td">
                        <div class="admin-table__actions">
                            <button class="admin-btn admin-btn--secondary admin-btn--small" data-action="edit-ram">ИЗМЕНИТЬ</button>
                            <button class="admin-btn admin-btn--secondary admin-btn--small" data-action="delete-ram">УДАЛИТЬ</button>
                        </div>
                    </td>
                </tr>`).join('');
}

async function loadRamData(id) {
    const ram = await DataManager.get('ram', '/api/ram');
    const item = ram.find(r => r.id == id);
    if (!item) { showNotification('RAM не найден', 'error'); AdminRouter.navigate('ram'); return; }
    fillRamForm(item);
}

function fillRamForm(item) {
    const sizeInput = document.getElementById('ram-size');
    if (sizeInput) sizeInput.value = item.size || '';
    updateRamFormHeader('РЕДАКТИРОВАНИЕ RAM', 'ИЗМЕНИТЕ ОБЪЁМ');
}

function resetRamForm() {
    const sizeInput = document.getElementById('ram-size');
    if (sizeInput) sizeInput.value = '';
    updateRamFormHeader('НОВЫЙ RAM', 'ДОБАВЬТЕ ОБЪЁМ ОПЕРАТИВНОЙ ПАМЯТИ');
}

function updateRamFormHeader(title, subtitle) {
    const container = document.getElementById('ram-form');
    if (container) {
        container.querySelector('.admin-page-title').textContent = title;
        container.querySelector('.admin-page-subtitle').textContent = subtitle;
    }
}

async function saveRam(size) {
    await new Promise(r => setTimeout(r, 600));
    DataManager.invalidate('ram');
    showNotification(currentRamId ? 'RAM обновлён' : 'RAM создан', 'success');
    setTimeout(() => { AdminRouter.navigate('ram'); loadRam(); }, 400);
}

async function deleteRam(id) {
    if (!window.confirm('Удалить RAM?')) return;
    await new Promise(r => setTimeout(r, 400));
    DataManager.invalidate('ram');
    showNotification('RAM удалён', 'success');
    loadRam();
}

function initRamPage() {
    document.querySelector('[data-admin-add-ram]')?.addEventListener('click', () => AdminRouter.navigate('ram', 'add'));
    document.querySelector('[data-ram-back]')?.addEventListener('click', (e) => { e.preventDefault(); AdminRouter.navigate('ram'); });
    document.querySelector('[data-ram-cancel]')?.addEventListener('click', () => AdminRouter.navigate('ram'));

    const form = document.getElementById('ram-form-element');
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const size = document.getElementById('ram-size')?.value;
        if (!size || size <= 0) { showNotification('Введите объём RAM', 'error'); return; }
        const btn = form.querySelector('[data-ram-save]');
        if (btn) { btn.disabled = true; btn.textContent = 'Сохранение...'; }
        try { await saveRam(size); } finally { if (btn) { btn.disabled = false; btn.textContent = 'СОХРАНИТЬ'; } }
    });

    const table = document.querySelector('#ram-list table');
    table?.addEventListener('click', (e) => {
        const editBtn = e.target.closest('[data-action="edit-ram"]');
        const deleteBtn = e.target.closest('[data-action="delete-ram"]');
        if (editBtn) {
            const row = editBtn.closest('[data-ram-id]');
            const id = row?.dataset.ramId;
            if (id) AdminRouter.navigate('ram', 'edit', id);
        } else if (deleteBtn) {
            const row = deleteBtn.closest('[data-ram-id]');
            const id = row?.dataset.ramId;
            if (id) deleteRam(id);
        }
    });
}

// ==================== ПАМЯТЬ ====================
function showMemoryList() { const el = document.getElementById('memory-list'); if (el) el.style.display = 'block'; }
function hideMemoryList() { const el = document.getElementById('memory-list'); if (el) el.style.display = 'none'; }
function showMemoryForm() { const el = document.getElementById('memory-form'); if (el) { el.style.display = 'block'; window.scrollTo(0, 0); } }
function hideMemoryForm() { const el = document.getElementById('memory-form'); if (el) el.style.display = 'none'; }

async function loadMemory() {
    const memory = await DataManager.get('memory', '/api/memory');
    renderMemoryTable(memory);
}

function renderMemoryTable(memory) {
    const tbody = document.querySelector('#memory-list tbody');
    if (!tbody) return;
    if (!memory.length) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:40px;color:#999;">Память не найдена</td></tr>';
        return;
    }
    tbody.innerHTML = memory.map(item => `
                <tr class="admin-table__row" data-memory-id="${item.id}">
                    <td class="admin-table__td">#${item.id}</td>
                    <td class="admin-table__td">${item.size} GB</td>
                    <td class="admin-table__td">${item.productsCount || 0} товаров</td>
                    <td class="admin-table__td">
                        <div class="admin-table__actions">
                            <button class="admin-btn admin-btn--secondary admin-btn--small" data-action="edit-memory">ИЗМЕНИТЬ</button>
                            <button class="admin-btn admin-btn--secondary admin-btn--small" data-action="delete-memory">УДАЛИТЬ</button>
                        </div>
                    </td>
                </tr>`).join('');
}

async function loadMemoryData(id) {
    const memory = await DataManager.get('memory', '/api/memory');
    const item = memory.find(m => m.id == id);
    if (!item) { showNotification('Память не найдена', 'error'); AdminRouter.navigate('memory'); return; }
    fillMemoryForm(item);
}

function fillMemoryForm(item) {
    const sizeInput = document.getElementById('memory-size');
    if (sizeInput) sizeInput.value = item.size || '';
    updateMemoryFormHeader('РЕДАКТИРОВАНИЕ ПАМЯТИ', 'ИЗМЕНИТЕ ОБЪЁМ');
}

function resetMemoryForm() {
    const sizeInput = document.getElementById('memory-size');
    if (sizeInput) sizeInput.value = '';
    updateMemoryFormHeader('НОВАЯ ПАМЯТЬ', 'ДОБАВЬТЕ ОБЪЁМ НАКОПИТЕЛЯ');
}

function updateMemoryFormHeader(title, subtitle) {
    const container = document.getElementById('memory-form');
    if (container) {
        container.querySelector('.admin-page-title').textContent = title;
        container.querySelector('.admin-page-subtitle').textContent = subtitle;
    }
}

async function saveMemory(size) {
    await new Promise(r => setTimeout(r, 600));
    DataManager.invalidate('memory');
    showNotification(currentMemoryId ? 'Память обновлена' : 'Память создана', 'success');
    setTimeout(() => { AdminRouter.navigate('memory'); loadMemory(); }, 400);
}

async function deleteMemory(id) {
    if (!window.confirm('Удалить память?')) return;
    await new Promise(r => setTimeout(r, 400));
    DataManager.invalidate('memory');
    showNotification('Память удалена', 'success');
    loadMemory();
}

function initMemoryPage() {
    document.querySelector('[data-admin-add-memory]')?.addEventListener('click', () => AdminRouter.navigate('memory', 'add'));
    document.querySelector('[data-memory-back]')?.addEventListener('click', (e) => { e.preventDefault(); AdminRouter.navigate('memory'); });
    document.querySelector('[data-memory-cancel]')?.addEventListener('click', () => AdminRouter.navigate('memory'));

    const form = document.getElementById('memory-form-element');
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const size = document.getElementById('memory-size')?.value;
        if (!size || size <= 0) { showNotification('Введите объём памяти', 'error'); return; }
        const btn = form.querySelector('[data-memory-save]');
        if (btn) { btn.disabled = true; btn.textContent = 'Сохранение...'; }
        try { await saveMemory(size); } finally { if (btn) { btn.disabled = false; btn.textContent = 'СОХРАНИТЬ'; } }
    });

    const table = document.querySelector('#memory-list table');
    table?.addEventListener('click', (e) => {
        const editBtn = e.target.closest('[data-action="edit-memory"]');
        const deleteBtn = e.target.closest('[data-action="delete-memory"]');
        if (editBtn) {
            const row = editBtn.closest('[data-memory-id]');
            const id = row?.dataset.memoryId;
            if (id) AdminRouter.navigate('memory', 'edit', id);
        } else if (deleteBtn) {
            const row = deleteBtn.closest('[data-memory-id]');
            const id = row?.dataset.memoryId;
            if (id) deleteMemory(id);
        }
    });
}

// ==================== СТАТИСТИКА ====================
function loadStatistics() {
    setTimeout(() => {
        document.getElementById('stat-products').textContent = STATS_DATA.products.total;
        document.getElementById('stat-products-change').textContent = STATS_DATA.products.change;
        document.getElementById('stat-users').textContent = STATS_DATA.users.total;
        document.getElementById('stat-users-change').textContent = STATS_DATA.users.change;
        document.getElementById('stat-orders').textContent = STATS_DATA.orders.total;
        document.getElementById('stat-orders-change').textContent = STATS_DATA.orders.change;
        document.getElementById('stat-rating').textContent = STATS_DATA.rating.total;
        document.getElementById('stat-rating-change').textContent = STATS_DATA.rating.change;
    }, 300);
}

// ==================== ПОЛЬЗОВАТЕЛИ ====================
function loadUsers() {
    renderUsersTable();
}

function renderUsersTable() {
    const tbody = document.querySelector('#users-list tbody');
    if (!tbody) return;

    if (!USERS_DATA.length) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:#999;">Пользователи не найдены</td></tr>';
        return;
    }

    tbody.innerHTML = USERS_DATA.map(user => {
        const roleClass = `admin-user-badge--${user.role}`;
        const roleText = user.role === 'admin' ? 'Администратор' : user.role === 'manager' ? 'Менеджер' : 'Пользователь';
        const date = new Date(user.registeredAt).toLocaleDateString('ru-RU');

        return `
                    <tr class="admin-table__row" data-user-id="${user.id}">
                        <td class="admin-table__td">#${user.id}</td>
                        <td class="admin-table__td">${user.firstName} ${user.lastName}</td>
                        <td class="admin-table__td">${user.email}</td>
                        <td class="admin-table__td">
                            <span class="admin-user-badge ${roleClass}">${roleText}</span>
                        </td>
                        <td class="admin-table__td">${user.ordersCount}</td>
                        <td class="admin-table__td">${date}</td>
                    </tr>
                `;
    }).join('');
}

// ==================== ЗАКАЗЫ ====================
function showOrdersList() { const el = document.getElementById('orders-list'); if (el) el.style.display = 'block'; }
function hideOrdersList() { const el = document.getElementById('orders-list'); if (el) el.style.display = 'none'; }
function showOrderDetails(orderId) {
    const el = document.getElementById('order-details');
    if (el) { el.style.display = 'block'; window.scrollTo(0, 0); renderOrderDetailsContent(orderId); }
}
function hideOrderDetails() { const el = document.getElementById('order-details'); if (el) el.style.display = 'none'; }

function getOrderStatusBadge(status) {
    const map = {
        new: { text: 'Новый', class: 'admin-order-badge--new' },
        processing: { text: 'В обработке', class: 'admin-order-badge--processing' },
        shipped: { text: 'Отправлен', class: 'admin-order-badge--shipped' },
        delivered: { text: 'Доставлен', class: 'admin-order-badge--delivered' },
        cancelled: { text: 'Отменён', class: 'admin-order-badge--cancelled' }
    };
    const s = map[status] || { text: status, class: '' };
    return `<span class="admin-order-badge ${s.class}">${s.text}</span>`;
}

function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
}

function formatDate(isoString) {
    return new Date(isoString).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

async function loadOrders() {
    const orders = await DataManager.get('orders', '/api/orders');
    renderOrdersTable(orders);
}

function renderOrdersTable(orders) {
    const tbody = document.querySelector('#orders-list tbody');
    if (!tbody) return;

    if (!orders.length) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:#999;">Заказы не найдены</td></tr>';
        return;
    }

    tbody.innerHTML = orders.map(order => {
        const user = USERS_DATA.find(u => u.id === order.user_id);
        const userName = user ? `${user.firstName} ${user.lastName}` : 'Гость';
        const date = new Date(order.created_at).toLocaleDateString('ru-RU');

        return `
                    <tr class="admin-table__row" data-order-id="${order.id}">
                        <td class="admin-table__td">#${order.id}</td>
                        <td class="admin-table__td">
                            <div class="admin-table__product">
                                <div class="admin-table__product-image">${userName.charAt(0)}</div>
                                <div>
                                    <div class="admin-table__product-name">${userName}</div>
                                    <div class="admin-table__product-brand">${order.email}</div>
                                </div>
                            </div>
                        </td>
                        <td class="admin-table__td">${date}</td>
                        <td class="admin-table__td">${formatPrice(order.total_amount)}</td>
                        <td class="admin-table__td">${getOrderStatusBadge(order.status)}</td>
                        <td class="admin-table__td">
                            <div class="admin-table__actions">
                                <button class="admin-btn admin-btn--secondary admin-btn--small" data-action="view-order">ПРОСМОТР</button>
                            </div>
                        </td>
                    </tr>
                `;
    }).join('');
}

function renderOrderDetailsContent(orderId) {
    const order = DataManager.cache.get('orders')?.data.find(o => o.id === orderId);
    if (!order) return;

    document.getElementById('order-details-title').textContent = `ЗАКАЗ #${order.id}`;
    document.getElementById('order-status-display').innerHTML = getOrderStatusBadge(order.status);
    document.getElementById('order-created-date').textContent = formatDate(order.created_at);

    const user = USERS_DATA.find(u => u.id === order.user_id);
    document.getElementById('order-client-info').innerHTML = `
                <div style="margin-bottom: 8px;"><strong>${user ? user.firstName + ' ' + user.lastName : 'Гость'}</strong></div>
                <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Телефон: ${order.phone}</div>
                <div style="font-size: 12px; color: #666;">Email: ${order.email}</div>
            `;

    let deliveryHTML = `<div style="margin-bottom: 8px;"><strong>${order.delivery_type === 'pickup' ? 'Самовывоз' : 'Курьером'}</strong></div>`;
    if (order.delivery_type === 'pickup' && order.delivery.pickup_point_id) {
        const point = PICKUP_POINTS_DATA.find(p => p.id === order.delivery.pickup_point_id);
        deliveryHTML += `<div style="font-size: 12px; color: #666;">${point ? point.name : 'Пункт выдачи'}</div>`;
        if (point) deliveryHTML += `<div style="font-size: 11px; color: #999;">${point.address}</div>`;
    } else if (order.delivery.street) {
        deliveryHTML += `<div style="font-size: 12px; color: #666;">${order.delivery.city}, ${order.delivery.street}, д. ${order.delivery.house}</div>`;
    }
    document.getElementById('order-delivery-info').innerHTML = deliveryHTML;

    let itemsHTML = '';
    order.items.forEach(item => {
        const itemTotal = item.price_at_buy * item.quantity;
        itemsHTML += `
                    <div class="admin-order-item-row">
                        <div>
                            <div class="admin-order-item-name">${item.product_name}</div>
                            <div class="admin-order-item-meta">Кол-во: ${item.quantity}</div>
                        </div>
                        <div style="text-align: right;">
                            <div class="admin-order-item-price">${formatPrice(item.price_at_buy)}</div>
                            <div style="font-size: 11px; color: #999;">× ${item.quantity} = ${formatPrice(itemTotal)}</div>
                        </div>
                    </div>
                `;
    });
    itemsHTML += `<div class="admin-order-item-row"><span>ИТОГО</span><span class="admin-order-total">${formatPrice(order.total_amount)}</span></div>`;
    document.getElementById('order-items-list').innerHTML = itemsHTML;
    document.getElementById('order-total-sum').textContent = formatPrice(order.total_amount);
}

function initOrdersPage() {
    const table = document.querySelector('#orders-list table');
    table?.addEventListener('click', (e) => {
        const viewBtn = e.target.closest('[data-action="view-order"]');
        if (viewBtn) {
            const row = viewBtn.closest('[data-order-id]');
            const id = row?.dataset.orderId;
            if (id) AdminRouter.navigate('orders', 'view', id);
        }
    });
}

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
function init() {
    populateSelects();
    initFormHandlers();
    initBrandsPage();
    initColorsPage();
    initRamPage();
    initMemoryPage();
    initOrdersPage();
    AdminRouter.init();

    // Предзагрузка справочников в кэш
    DataManager.get('colors', '/api/colors');
    DataManager.get('ram', '/api/ram');
    DataManager.get('memory', '/api/memory');
}

// ==================== УВЕДОМЛЕНИЯ ====================
function showNotification(message, type = 'info') {
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
        return;
    }
    const toast = document.createElement('div');
    toast.style.cssText = `position:fixed;bottom:20px;right:20px;padding:12px 20px;background:${type === 'error' ? '#e53e3e' : type === 'success' ? '#38a169' : '#1a1a1a'};color:#fff;font-size:13px;z-index:1000;border-radius:4px`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ==================== НАВИГАЦИЯ ====================
document.querySelectorAll('[data-admin-tab]').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        AdminRouter.navigate(link.dataset.adminTab);
    });
});

els.addProductBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    AdminRouter.navigate('products', 'add');
});

els.backBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    AdminRouter.navigate('products');
});

els.cancelBtn?.addEventListener('click', () => {
    AdminRouter.navigate('products');
});

document.querySelector('[data-order-back]')?.addEventListener('click', (e) => {
    e.preventDefault();
    AdminRouter.navigate('orders');
});

// ==================== ЗАПУСК ====================
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();