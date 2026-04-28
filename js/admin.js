//  AUTH MANAGER 
const AuthManager = {
    token: null,
    user: null,

    init() {
        this.checkExistingAuth();
        this.bindEvents();
    },

    checkExistingAuth() {
        const savedToken = localStorage.getItem('admin_token');
        const savedUser = localStorage.getItem('admin_user');

        if (savedToken && savedUser) {
            this.token = savedToken;
            this.user = JSON.parse(savedUser);
            this.hideModal();
            this.updateUserInfo();
        } else {
            this.showModal();
        }
    },

    showModal() {
        const modal = document.getElementById('auth-modal');
        if (modal) {
            modal.classList.remove('is-hidden');
            document.body.style.overflow = 'hidden';
        }
    },

    hideModal() {
        const modal = document.getElementById('auth-modal');
        if (modal) {
            modal.classList.add('is-hidden');
            document.body.style.overflow = '';
        }
    },

    bindEvents() {
        const form = document.getElementById('auth-form');
        form?.addEventListener('submit', (e) => this.handleLogin(e));
    },

    async handleLogin(e) {
        e.preventDefault();

        const emailInput = document.getElementById('admin-email');
        const passwordInput = document.getElementById('admin-password');
        const errorDiv = document.getElementById('auth-error');
        const submitBtn = document.querySelector('.auth-modal__btn');
        const btnText = submitBtn?.querySelector('.auth-modal__btn-text');
        const btnLoader = submitBtn?.querySelector('.auth-modal__btn-loader');

        const email = emailInput?.value.trim();
        const password = passwordInput?.value;

        errorDiv.style.display = 'none';
        errorDiv.textContent = '';
        emailInput?.classList.remove('is-error');
        passwordInput?.classList.remove('is-error');

        if (!email) {
            emailInput?.classList.add('is-error');
            this.showError('Введите email', errorDiv);
            return;
        }
        if (!password) {
            passwordInput?.classList.add('is-error');
            this.showError('Введите пароль', errorDiv);
            return;
        }

        if (submitBtn) {
            submitBtn.classList.add('is-loading');
            submitBtn.disabled = true;
        }
        if (btnText) btnText.style.display = 'none';
        if (btnLoader) btnLoader.style.display = 'inline-flex';

        try {
            await this.login(email, password);
            localStorage.setItem('admin_token', this.token);
            localStorage.setItem('admin_user', JSON.stringify(this.user));
            this.updateUserInfo();
            this.hideModal();
        } catch (error) {
            this.showError(error.message, errorDiv);
        } finally {
            if (submitBtn) {
                submitBtn.classList.remove('is-loading');
                submitBtn.disabled = false;
            }
            if (btnText) btnText.style.display = 'inline';
            if (btnLoader) btnLoader.style.display = 'none';
        }
    },

    async login(email, password) {
        const response = await fetch('http://localhost:3000/api/auth/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Ошибка авторизации');
        }

        const data = await response.json();
        this.token = data.token;
        this.user = data.user;
        return this.user;
    },

    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        this.showModal();
        document.getElementById('auth-form')?.reset();
        document.getElementById('auth-error').style.display = 'none';
    },

    showError(message, element) {
        if (element) {
            element.textContent = message;
            element.style.display = 'block';
        }
    },

    updateUserInfo() {
        const userNameEl = document.querySelector('.admin-topbar__user-name');
        if (userNameEl && this.user) {
            userNameEl.textContent = this.user.name || this.user.email;
        }
    },

    getToken() { return this.token; },
    getUser() { return this.user; }
};

//  DATA MANAGER 
const DataManager = {
    cache: new Map(),
    DEFAULT_TTL: 5 * 60 * 1000,
    API_BASE: 'http://localhost:3000/api/admin',

    async get(key, endpoint, ttl = this.DEFAULT_TTL) {
        const now = Date.now();
        const cached = this.cache.get(key);

        if (cached && (now - cached.timestamp < ttl)) {
            console.log(`Cache HIT: ${key}`);
            return cached.data;
        }

        console.log(`Fetching API: ${endpoint}`);

        try {
            const token = AuthManager.getToken();
            const response = await fetch(`${this.API_BASE}${endpoint}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    AuthManager.logout();
                    throw new Error('Сессия истекла');
                }
                throw new Error(`Ошибка ${response.status}`);
            }

            const data = await response.json();
            this.cache.set(key, { data, timestamp: now });
            return data;
        } catch (error) {
            console.error(`Ошибка загрузки ${key}:`, error);
            return cached ? cached.data : [];
        }
    },

    async post(endpoint, body) {
        const token = AuthManager.getToken();
        const response = await fetch(`${this.API_BASE}${endpoint}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || `Ошибка ${response.status}`);
        }
        return response.json();
    },

    async put(endpoint, body) {
        const token = AuthManager.getToken();
        const response = await fetch(`${this.API_BASE}${endpoint}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || `Ошибка ${response.status}`);
        }
        return response.json();
    },

    async delete(endpoint) {
        const token = AuthManager.getToken();
        const response = await fetch(`${this.API_BASE}${endpoint}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || `Ошибка ${response.status}`);
        }
        return response.json();
    },

    invalidate(key) {
        console.log(`🗑️ Cache INVALIDATED: ${key}`);
        this.cache.delete(key);
    },
    clearAll() { this.cache.clear(); },
    async upload(endpoint, formData) {
        const token = AuthManager.getToken();
        const response = await fetch(`${this.API_BASE}${endpoint}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || `Ошибка ${response.status}`);
        }

        return response.json();
    },

    async updateUpload(endpoint, formData) {
        const token = AuthManager.getToken();
        const response = await fetch(`${this.API_BASE}${endpoint}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || `Ошибка ${response.status}`);
        }

        return response.json();
    }
};

//  ГЛОБАЛЬНОЕ СОСТОЯНИЕ 
let currentProductId = null;
let currentBrandId = null;
let currentColorId = null;
let currentRamId = null;
let currentMemoryId = null;
let currentOrderId = null;
let formHandlerAttached = false;

//  DOM ЭЛЕМЕНТЫ 
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

//  РОУТЕР 
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

//  РЕНДЕРИНГ СТРАНИЦ 
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

// Обновляет все существующие селекты в форме товара
function updateVariantSelects() {
    const colors = DataManager.cache.get('colors')?.data || [];
    const ram = DataManager.cache.get('ram')?.data || [];
    const storage = DataManager.cache.get('memory')?.data || [];

    // Обновляем все селекты цвета
    document.querySelectorAll('.variant-color').forEach(select => {
        const currentValue = select.value;
        select.innerHTML = `
            <option value="">Выберите цвет</option>
            ${colors.map(c => `<option value="${c.id_color}" ${c.id_color == currentValue ? 'selected' : ''}>${c.name}</option>`).join('')}
        `;
    });

    // Обновляем все селекты RAM
    document.querySelectorAll('.variant-ram').forEach(select => {
        const currentValue = select.value;
        select.innerHTML = `
            <option value="">Выберите RAM</option>
            ${ram.map(r => `<option value="${r.id_ram}" ${r.id_ram == currentValue ? 'selected' : ''}>${r.size_gb} GB</option>`).join('')}
        `;
    });

    // Обновляем все селекты памяти
    document.querySelectorAll('.variant-storage').forEach(select => {
        const currentValue = select.value;
        select.innerHTML = `
            <option value="">Выберите память</option>
            ${storage.map(s => `<option value="${s.id_storage}" ${s.id_storage == currentValue ? 'selected' : ''}>${s.size_gb} GB</option>`).join('')}
        `;
    });
}

// PRODUCTS
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
function showProductList() { if (els.productList) els.productList.style.display = 'block'; }
function hideProductList() { if (els.productList) els.productList.style.display = 'none'; }
function showProductForm() { if (els.productForm) els.productForm.style.display = 'block'; window.scrollTo(0, 0); }
function hideProductForm() { if (els.productForm) els.productForm.style.display = 'none'; }

async function loadProducts() {
    try {
        const result = await DataManager.get('products', '/products');
        const products = result.products || result;
        renderProductsTable(products);
    } catch (error) {
        showNotification('Ошибка загрузки товаров: ' + error.message, 'error');
    }
}

function renderProductsTable(products) {
    const tbody = document.querySelector('.admin-products-list tbody');
    if (!tbody) return;
    if (!products?.length) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;padding:40px;color:#999;">Товары не найдены</td></tr>';
        return;
    }
    tbody.innerHTML = products.map(product => `
        <tr class="admin-table__row" data-product-id="${product.id}">
            <td class="admin-table__td">
                <div class="admin-table__product">
                    <div class="admin-table__product-image">
                        ${product.variants?.[0]?.image_url
            ? `<img src="${product.variants[0].image_url}" alt="${product.name}" style="width:100%;height:100%;object-fit:cover;">`
            : 'IMG'}
                    </div>
                    <div>
                        <div class="admin-table__product-name">${product.name}</div>
                        <div class="admin-table__product-brand">${product.brands?.name || ''}</div>
                    </div>
                </div>
            </td>
            <td class="admin-table__td">
                <div class="admin-table__actions">
                    <button class="admin-btn admin-btn--secondary admin-btn--small" data-action="edit">ИЗМЕНИТЬ</button>
                    <button class="admin-btn admin-btn--secondary admin-btn--small" data-action="delete">УДАЛИТЬ</button>
                </div>
            </td>
        </tr>`).join('');
}

async function loadProductData(id) {
    try {
        const product = await DataManager.get(`product-${id}`, `/products/${id}`);
        if (!product) { showNotification('Товар не найден', 'error'); AdminRouter.navigate('products'); return; }
        fillProductForm(product);
    } catch (error) {
        showNotification('Ошибка загрузки товара: ' + error.message, 'error');
    }
}

function fillProductForm(product) {
    document.getElementById('product-name').value = product.name || '';
    document.getElementById('product-brand').value = product.brand?.id_brand || '';
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
            card.dataset.variantId = v.id;
            card.dataset.imageUrl = v.imageUrl || '';
            card.dataset.colorId = v.idColor;
            card.dataset.ramId = v.idRam;
            card.dataset.storageId = v.idStorage;
            card.dataset.badgeType = v.badgeType || '';

            const existingImagePreview = v.imageUrl
                ? `<div class="admin-variant-image-preview" style="margin-bottom: 12px;">
                     <img src="${v.imageUrl}" alt="Текущее фото" 
                          style="width: 120px; height: 120px; object-fit: cover; border-radius: 8px; border: 2px solid #e0e0e0;">
                     <div style="font-size: 11px; color: #999; margin-top: 6px;">
                       Текущее изображение загружено
                     </div>
                   </div>`
                : '';

            card.innerHTML = `
                <div class="admin-variant-header">
                    <h3 class="admin-variant-title">ВАРИАНТ</h3>
                    <button type="button" class="admin-btn admin-btn--text" data-admin-remove-variant>Удалить</button>
                </div>
                <div class="admin-variant-grid">
                    <div class="admin-form-group">
                        <label class="admin-label">ИЗОБРАЖЕНИЕ ВАРИАНТА</label>
                        ${existingImagePreview}
                        <input type="file" class="admin-file-input variant-image" accept="image/*">
                        <div style="font-size: 11px; color: #999; margin-top: 6px;">
                          ${v.imageUrl ? 'Выберите новый файл для замены' : 'Загрузите изображение'}
                        </div>
                    </div>
                    <div class="admin-form-group">
                        <label class="admin-label">ЦВЕТ</label>
                        <select class="admin-select variant-color" required>
                            <option value="">Выберите цвет</option>
                        </select>
                    </div>
                    <div class="admin-form-group">
                        <label class="admin-label">RAM</label>
                        <select class="admin-select variant-ram" required>
                            <option value="">Выберите RAM</option>
                        </select>
                    </div>
                    <div class="admin-form-group">
                        <label class="admin-label">ПАМЯТЬ</label>
                        <select class="admin-select variant-storage" required>
                            <option value="">Выберите память</option>
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
                        <input type="number" class="admin-input variant-price" value="${v.price || ''}" min="0" required>
                    </div>
                    <div class="admin-form-group">
                        <label class="admin-label">СТАРАЯ ЦЕНА</label>
                        <input type="number" class="admin-input variant-old-price" value="${v.oldPrice || ''}" min="0">
                    </div>
                </div>`;
            els.variantsList.appendChild(card);
        });

        updateVariantSelects();

        const variantCards = document.querySelectorAll('.admin-variant-card');
        product.variants.forEach((v, index) => {
            const card = variantCards[index];
            if (!card) return;

            const colorSelect = card.querySelector('.variant-color');
            const ramSelect = card.querySelector('.variant-ram');
            const storageSelect = card.querySelector('.variant-storage');
            const badgeSelect = card.querySelector('.variant-badge');

            if (colorSelect && v.idColor) colorSelect.value = v.idColor;
            if (ramSelect && v.idRam) ramSelect.value = v.idRam;
            if (storageSelect && v.idStorage) storageSelect.value = v.idStorage;
            if (badgeSelect && v.badgeType) badgeSelect.value = v.badgeType;
        });
    }
    showNotification(`Загружен: ${product.name}`, 'success');
}

async function saveProduct(formDataObj) {
    try {
        const formData = new FormData();

        formData.append('name', formDataObj.name.trim());
        formData.append('brandId', String(formDataObj.brandId));
        formData.append('description', formDataObj.description?.trim() || '');
        formData.append('specs', JSON.stringify(formDataObj.specs || {}));

        const variantsPayload = formDataObj.variants.map(v => ({
            id: v.id,
            colorId: Number(v.colorId),
            ramId: Number(v.ramId),
            storageId: Number(v.storageId),
            price: Number(v.price),
            oldPrice: v.oldPrice ? Number(v.oldPrice) : null,
            badgeType: v.badge || null,
            ram: v.ram,
            storage: v.storage,
            color: v.color
        }));
        formData.append('variants', JSON.stringify(variantsPayload));

        formDataObj.variants.forEach((variant, index) => {
            if (variant.image instanceof File) {
                formData.append(`variant_${index}_image`, variant.image);
            }
        });

        let result;
        if (currentProductId) {
            result = await DataManager.updateUpload(`/products/${currentProductId}`, formData);
            showNotification('Товар успешно обновлён', 'success');
        } else {
            result = await DataManager.upload('/products', formData);
            showNotification('Товар успешно создан', 'success');
        }

        DataManager.invalidate('products');
        setTimeout(() => {
            AdminRouter.navigate('products');
            loadProducts();
        }, 400);

        return result;

    } catch (error) {
        console.error('Error saving product:', error);
        showNotification('Ошибка: ' + error.message, 'error');
        throw error;
    }
}

async function deleteProduct(id) {
    if (!window.confirm('Удалить товар?')) return;
    try {
        await DataManager.delete(`/products/${id}`);
        DataManager.invalidate('products');
        showNotification('Товар удалён', 'success');
        loadProducts();
    } catch (error) {
        showNotification('Ошибка: ' + error.message, 'error');
    }
}

function populateSelects() {
    if (!els.brandSelect) return;
    DataManager.get('brands', '/brands').then(brands => {
        const opts = (brands || []).map(b => `<option value="${b.id_brand}">${b.name}</option>`).join('');
        els.brandSelect.innerHTML = '<option value="">Выберите бренд</option>' + opts;
    });
}

function getColorOptions(selectedId = null) {
    const colors = DataManager.cache.get('colors')?.data || [];
    return colors.map(c => `<option value="${c.id_color}" ${c.id_color === selectedId ? 'selected' : ''}>${c.name}</option>`).join('');
}
function getRamOptions(selectedId = null) {
    const ram = DataManager.cache.get('ram')?.data || [];
    return ram.map(r => `<option value="${r.id_ram}" ${r.id_ram === selectedId ? 'selected' : ''}>${r.size_gb} GB</option>`).join('');
}
function getStorageOptions(selectedId = null) {
    const storage = DataManager.cache.get('memory')?.data || [];
    return storage.map(s => `<option value="${s.id_storage}" ${s.id_storage === selectedId ? 'selected' : ''}>${s.size_gb} GB</option>`).join('');
}

function initFormHandlers() {
    if (formHandlerAttached) return;
    formHandlerAttached = true;
    console.log('[DEBUG] Form handler attached');

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

    document.querySelector('.admin-products-list tbody')?.addEventListener('click', (e) => {
        const editBtn = e.target.closest('[data-action="edit"]');
        const deleteBtn = e.target.closest('[data-action="delete"]');

        if (editBtn) {
            const row = editBtn.closest('[data-product-id]');
            const id = row?.dataset.productId;
            if (id) AdminRouter.navigate('products', 'edit', id);
        } else if (deleteBtn) {
            const row = deleteBtn.closest('[data-product-id]');
            const id = row?.dataset.productId;
            if (id) deleteProduct(id);
        }
    });

    els.form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('[DEBUG] Form submitted!');
        if (!validateForm()) {
            return;
        }

        const btn = els.saveBtn;
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Сохранение...';
        }

        try {
            const formData = collectFormData();
            console.log('[DEBUG] Collected form data:', formData);
            await saveProduct(formData);
            console.log('[DEBUG] Product saved successfully');
        } catch (error) {
            console.error('[DEBUG] Error saving product:', error);
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'СОХРАНИТЬ ТОВАР';
            }
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
                <!-- Пустой селект -->
                <select class="admin-select variant-color" required>
                    <option value="">Выберите цвет</option>
                </select>
            </div>
            <div class="admin-form-group">
                <label class="admin-label">RAM</label>
                <!-- Пустой селект -->
                <select class="admin-select variant-ram" required>
                    <option value="">Выберите RAM</option>
                </select>
            </div>
            <div class="admin-form-group">
                <label class="admin-label">ПАМЯТЬ</label>
                <!-- Пустой селект -->
                <select class="admin-select variant-storage" required>
                    <option value="">Выберите память</option>
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

    updateVariantSelects();
}

function validateForm() {
    let valid = true;

    els.form?.querySelectorAll('[required]').forEach(input => {
        if (!input.value.trim()) {
            input.classList.add('admin-input--error');
            valid = false;
        } else {
            input.classList.remove('admin-input--error');
        }
    });

    document.querySelectorAll('.admin-variant-card').forEach(card => {
        const colorSelect = card.querySelector('.variant-color');
        const ramSelect = card.querySelector('.variant-ram');
        const storageSelect = card.querySelector('.variant-storage');
        const priceInput = card.querySelector('.variant-price');

        if (!colorSelect?.value) {
            colorSelect?.classList.add('admin-input--error');
            valid = false;
        } else {
            colorSelect?.classList.remove('admin-input--error');
        }

        if (!ramSelect?.value) {
            ramSelect?.classList.add('admin-input--error');
            valid = false;
        } else {
            ramSelect?.classList.remove('admin-input--error');
        }

        if (!storageSelect?.value) {
            storageSelect?.classList.add('admin-input--error');
            valid = false;
        } else {
            storageSelect?.classList.remove('admin-input--error');
        }

        // Проверка цены
        const price = parseFloat(priceInput?.value);
        if (isNaN(price) || price <= 0) {
            priceInput?.classList.add('admin-input--error');
            valid = false;
        } else {
            priceInput?.classList.remove('admin-input--error');
        }
    });

    if (!valid) {
        showNotification('Заполните все обязательные поля и выберите характеристики', 'error');
        els.form?.querySelector('.admin-input--error')?.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
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
    const variantCards = document.querySelectorAll('.admin-variant-card');

    console.log('[COLLECT] Total variant cards:', variantCards.length);

    variantCards.forEach((card, index) => {
        const colorSelect = card.querySelector('.variant-color');
        const ramSelect = card.querySelector('.variant-ram');
        const storageSelect = card.querySelector('.variant-storage');
        const colorId = Number(colorSelect?.value);
        const ramId = Number(ramSelect?.value);
        const storageId = Number(storageSelect?.value);

        if (!colorId || !ramId || !storageId) {
            console.warn(`[WARN] Variant ${index} skipped - missing IDs`);
            return;
        }

        const variantId = card.dataset.variantId ? Number(card.dataset.variantId) : null;
        const existingImageUrl = card.dataset.imageUrl || '';

        console.log(`[COLLECT] Variant ${index}:`, {
            datasetVariantId: card.dataset.variantId,
            datasetImageUrl: card.dataset.imageUrl,
            parsedId: variantId,
            parsedImageUrl: existingImageUrl,
            allDataset: card.dataset
        });

        variants.push({
            id: variantId,
            imageUrl: existingImageUrl,
            colorId: colorId,
            ramId: ramId,
            storageId: storageId,
            color: colorSelect?.options[colorSelect.selectedIndex]?.text || '',
            ram: ramSelect?.options[ramSelect.selectedIndex]?.text.replace(' GB', '') || '',
            storage: storageSelect?.options[storageSelect.selectedIndex]?.text.replace(' GB', '') || '',
            badge: card.querySelector('.variant-badge')?.value || null,
            price: card.querySelector('.variant-price')?.value,
            oldPrice: card.querySelector('.variant-old-price')?.value || null,
            image: card.querySelector('.variant-image')?.files[0] || null // Новый файл (если есть)
        });
    });

    console.log('[COLLECT] Final variants:', variants);

    return {
        name: document.getElementById('product-name')?.value.trim(),
        brandId: Number(document.getElementById('product-brand')?.value) || null,
        description: document.getElementById('product-description')?.value.trim(),
        specs,
        variants
    };
}

function resetForm() {
    els.form?.reset();
    if (els.characteristicsList) els.characteristicsList.innerHTML = '';
    if (els.variantsList) els.variantsList.innerHTML = '';
    document.querySelectorAll('.admin-input--error').forEach(el => el.classList.remove('admin-input--error'));

    addCharacteristicRow();
    addVariantCard();
    updateVariantSelects();
}

// BRANDS 
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
function showBrandsList() { const el = document.getElementById('brands-list'); if (el) el.style.display = 'block'; }
function hideBrandsList() { const el = document.getElementById('brands-list'); if (el) el.style.display = 'none'; }
function showBrandForm() { const el = document.getElementById('brand-form'); if (el) { el.style.display = 'block'; window.scrollTo(0, 0); } }
function hideBrandForm() { const el = document.getElementById('brand-form'); if (el) el.style.display = 'none'; }

async function loadBrands() {
    try {
        const brands = await DataManager.get('brands', '/brands');
        renderBrandsTable(brands);
    } catch (error) {
        showNotification('Ошибка загрузки брендов: ' + error.message, 'error');
    }
}

function renderBrandsTable(brands) {
    const tbody = document.querySelector('#brands-list tbody');
    if (!tbody) return;
    if (!brands?.length) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;padding:40px;color:#999;">Бренды не найдены</td></tr>';
        return;
    }
    tbody.innerHTML = brands.map(brand => `
        <tr class="admin-table__row" data-brand-id="${brand.id_brand}">
            <td class="admin-table__td">
                <div class="admin-table__product">
                    <div class="admin-table__product-image">${brand.name.substring(0, 2).toUpperCase()}</div>
                    <div><div class="admin-table__product-name">${brand.name}</div></div>
                </div>
            </td>
            <td class="admin-table__td">
                <div class="admin-table__actions">
                    <button class="admin-btn admin-btn--secondary admin-btn--small" data-action="edit-brand">ИЗМЕНИТЬ</button>
                    <button class="admin-btn admin-btn--secondary admin-btn--small" data-action="delete-brand">УДАЛИТЬ</button>
                </div>
            </td>
        </tr>`).join('');
}

async function loadBrandData(id) {
    try {
        const brands = await DataManager.get('brands', '/brands');
        const brand = brands.find(b => b.id_brand == id);
        if (!brand) { showNotification('Бренд не найден', 'error'); AdminRouter.navigate('brands'); return; }
        fillBrandForm(brand);
    } catch (error) {
        showNotification('Ошибка: ' + error.message, 'error');
    }
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
    if (currentBrandId) {
        await DataManager.put(`/brands/${currentBrandId}`, { name });
    } else {
        await DataManager.post('/brands', { name });
    }
    DataManager.invalidate('brands');
    showNotification(currentBrandId ? 'Бренд обновлён' : 'Бренд создан', 'success');
    AdminRouter.navigate('brands');
    loadBrands();
}

async function deleteBrand(id) {
    if (!window.confirm('Удалить бренд?')) return;
    await DataManager.delete(`/brands/${id}`);
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

// COLORS 
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
function showColorsList() { const el = document.getElementById('colors-list'); if (el) el.style.display = 'block'; }
function hideColorsList() { const el = document.getElementById('colors-list'); if (el) el.style.display = 'none'; }
function showColorForm() { const el = document.getElementById('color-form'); if (el) { el.style.display = 'block'; window.scrollTo(0, 0); } }
function hideColorForm() { const el = document.getElementById('color-form'); if (el) el.style.display = 'none'; }

async function loadColors() {
    try {
        const colors = await DataManager.get('colors', '/colors');
        renderColorsTable(colors);
    } catch (error) {
        showNotification('Ошибка загрузки цветов: ' + error.message, 'error');
    }
}

function renderColorsTable(colors) {
    const tbody = document.querySelector('#colors-list tbody');
    if (!tbody) return;
    if (!colors?.length) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;padding:40px;color:#999;">Цвета не найдены</td></tr>';
        return;
    }
    tbody.innerHTML = colors.map(color => `
        <tr class="admin-table__row" data-color-id="${color.id_color}">
            <td class="admin-table__td">
                <div class="admin-table__product">
                    <div class="admin-table__product-image" style="background:${getColorHex(color.name)}">${color.name.substring(0, 2).toUpperCase()}</div>
                    <div><div class="admin-table__product-name">${color.name}</div></div>
                </div>
            </td>
            <td class="admin-table__td">
                <div class="admin-table__actions">
                    <button class="admin-btn admin-btn--secondary admin-btn--small" data-action="edit-color">ИЗМЕНИТЬ</button>
                    <button class="admin-btn admin-btn--secondary admin-btn--small" data-action="delete-color">УДАЛИТЬ</button>
                </div>
            </td>
        </tr>`).join('');
}

function getColorHex(name) {
    const map = {
        'Black': '#000000',
        'White': '#ffffff',
        'Gray': '#6b7280',
        'Grey': '#6b7280',
        'Silver': '#c0c0c0',
        'Blue': '#3b82f6',
        'Navy': '#1e3a8a',
        'Midnight Blue': '#1e1b4b',
        'Sky Blue': '#0ea5e9',
        'Light Blue': '#60a5fa',
        'Dark Blue': '#1e40af',
        'Royal Blue': '#2563eb',
        'Green': '#22c55e',
        'Dark Green': '#15803d',
        'Light Green': '#84cc16',
        'Olive': '#65a30d',
        'Mint': '#6ee7b7',
        'Emerald': '#10b981',
        'Red': '#ef4444',
        'Dark Red': '#b91c1c',
        'Pink': '#ec4899',
        'Rose': '#f43f5e',
        'Coral': '#f87171',
        'Yellow': '#eab308',
        'Gold': '#fbbf24',
        'Orange': '#f97316',
        'Amber': '#f59e0b',
        'Purple': '#a855f7',
        'Violet': '#8b5cf6',
        'Lavender': '#c084fc',
        'Magenta': '#d946ef',
        'Brown': '#78350f',
        'Beige': '#f5f5dc',
        'Tan': '#d4a373',
        'Graphite': '#374151',
        'Space Gray': '#4b5563',
        'Starlight': '#fef3c7',
        'Midnight': '#0f172a',
        'Titanium': '#94a3b8',
        'Natural Titanium': '#64748b',
        'Alpine Green': '#3f6212',
        'Sierra Blue': '#93c5fd',
        'Product Red': '#dc2626',
        'Pacific Blue': '#0284c7',
        'Graphite': '#2d3748',
        'Cyan': '#06b6d4',
        'Teal': '#14b8a6',
        'Indigo': '#6366f1',
        'Cream': '#fef9c3'
    };
    return map[name] || '#e2e8f0';
}

async function loadColorData(id) {
    try {
        const colors = await DataManager.get('colors', '/colors');
        const color = colors.find(c => c.id_color == id);
        if (!color) { showNotification('Цвет не найден', 'error'); AdminRouter.navigate('colors'); return; }
        fillColorForm(color);
    } catch (error) {
        showNotification('Ошибка: ' + error.message, 'error');
    }
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
    if (currentColorId) {
        await DataManager.put(`/colors/${currentColorId}`, { name });
    } else {
        await DataManager.post('/colors', { name });
    }
    DataManager.invalidate('colors');
    showNotification(currentColorId ? 'Цвет обновлён' : 'Цвет создан', 'success');
    AdminRouter.navigate('colors');
    loadColors();
}

async function deleteColor(id) {
    if (!window.confirm('Удалить цвет?')) return;
    await DataManager.delete(`/colors/${id}`);
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

// RAM 
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
function showRamList() { const el = document.getElementById('ram-list'); if (el) el.style.display = 'block'; }
function hideRamList() { const el = document.getElementById('ram-list'); if (el) el.style.display = 'none'; }
function showRamForm() { const el = document.getElementById('ram-form'); if (el) { el.style.display = 'block'; window.scrollTo(0, 0); } }
function hideRamForm() { const el = document.getElementById('ram-form'); if (el) el.style.display = 'none'; }

async function loadRam() {
    try {
        const ram = await DataManager.get('ram', '/ram');
        renderRamTable(ram);
    } catch (error) {
        showNotification('Ошибка загрузки RAM: ' + error.message, 'error');
    }
}

function renderRamTable(ram) {
    const tbody = document.querySelector('#ram-list tbody');
    if (!tbody) return;
    if (!ram?.length) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;padding:40px;color:#999;">RAM не найден</td></tr>';
        return;
    }
    tbody.innerHTML = ram.map(item => `
        <tr class="admin-table__row" data-ram-id="${item.id_ram}">
            <td class="admin-table__td">${item.size_gb} GB</td>
            <td class="admin-table__td">
                <div class="admin-table__actions">
                    <button class="admin-btn admin-btn--secondary admin-btn--small" data-action="edit-ram">ИЗМЕНИТЬ</button>
                    <button class="admin-btn admin-btn--secondary admin-btn--small" data-action="delete-ram">УДАЛИТЬ</button>
                </div>
            </td>
        </tr>`).join('');
}

async function loadRamData(id) {
    try {
        const ram = await DataManager.get('ram', '/ram');
        const item = ram.find(r => r.id_ram == id);
        if (!item) { showNotification('RAM не найден', 'error'); AdminRouter.navigate('ram'); return; }
        fillRamForm(item);
    } catch (error) {
        showNotification('Ошибка: ' + error.message, 'error');
    }
}

function fillRamForm(item) {
    const sizeInput = document.getElementById('ram-size');
    if (sizeInput) sizeInput.value = item.size_gb || '';
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
    if (currentRamId) {
        await DataManager.put(`/ram/${currentRamId}`, { size_gb: Number(size) });
    } else {
        await DataManager.post('/ram', { size_gb: Number(size) });
    }
    DataManager.invalidate('ram');
    showNotification(currentRamId ? 'RAM обновлён' : 'RAM создан', 'success');
    AdminRouter.navigate('ram');
    loadRam();
}

async function deleteRam(id) {
    if (!window.confirm('Удалить RAM?')) return;
    await DataManager.delete(`/ram/${id}`);
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

// MEMORY
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
function showMemoryList() { const el = document.getElementById('memory-list'); if (el) el.style.display = 'block'; }
function hideMemoryList() { const el = document.getElementById('memory-list'); if (el) el.style.display = 'none'; }
function showMemoryForm() { const el = document.getElementById('memory-form'); if (el) { el.style.display = 'block'; window.scrollTo(0, 0); } }
function hideMemoryForm() { const el = document.getElementById('memory-form'); if (el) el.style.display = 'none'; }

async function loadMemory() {
    try {
        const storage = await DataManager.get('memory', '/storage');
        renderMemoryTable(storage);
    } catch (error) {
        showNotification('Ошибка загрузки памяти: ' + error.message, 'error');
    }
}

function renderMemoryTable(storage) {
    const tbody = document.querySelector('#memory-list tbody');
    if (!tbody) return;
    if (!storage?.length) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;padding:40px;color:#999;">Память не найдена</td></tr>';
        return;
    }
    tbody.innerHTML = storage.map(item => `
        <tr class="admin-table__row" data-memory-id="${item.id_storage}">
            <td class="admin-table__td">${item.size_gb} GB</td>
            <td class="admin-table__td">
                <div class="admin-table__actions">
                    <button class="admin-btn admin-btn--secondary admin-btn--small" data-action="edit-memory">ИЗМЕНИТЬ</button>
                    <button class="admin-btn admin-btn--secondary admin-btn--small" data-action="delete-memory">УДАЛИТЬ</button>
                </div>
            </td>
        </tr>`).join('');
}

async function loadMemoryData(id) {
    try {
        const storage = await DataManager.get('memory', '/storage');
        const item = storage.find(m => m.id_storage == id);
        if (!item) { showNotification('Память не найдена', 'error'); AdminRouter.navigate('memory'); return; }
        fillMemoryForm(item);
    } catch (error) {
        showNotification('Ошибка: ' + error.message, 'error');
    }
}

function fillMemoryForm(item) {
    const sizeInput = document.getElementById('memory-size');
    if (sizeInput) sizeInput.value = item.size_gb || '';
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
    if (currentMemoryId) {
        await DataManager.put(`/storage/${currentMemoryId}`, { size_gb: Number(size) });
    } else {
        await DataManager.post('/storage', { size_gb: Number(size) });
    }
    DataManager.invalidate('memory');
    showNotification(currentMemoryId ? 'Память обновлена' : 'Память создана', 'success');
    AdminRouter.navigate('memory');
    loadMemory();
}

async function deleteMemory(id) {
    if (!window.confirm('Удалить память?')) return;
    await DataManager.delete(`/storage/${id}`);
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

// ORDERS 
function renderOrdersPage(action, id) {
    hideAllPages();
    if (action === 'view' && id) {
        showOrderDetails(id);
        loadOrderDetails(id);
    } else {
        showOrdersList();
        loadOrders();
    }
}
function showOrdersList() { const el = document.getElementById('orders-list'); if (el) el.style.display = 'block'; }
function hideOrdersList() { const el = document.getElementById('orders-list'); if (el) el.style.display = 'none'; }
function showOrderDetails(orderId) {
    const el = document.getElementById('order-details');
    if (el) { el.style.display = 'block'; window.scrollTo(0, 0); }
}
function hideOrderDetails() { const el = document.getElementById('order-details'); if (el) el.style.display = 'none'; }

function getOrderStatusBadge(status) {
    const map = {
        new: { text: 'Новый', class: 'admin-order-badge--new' },
        pending: { text: 'В обработке', class: 'admin-order-badge--pending' },
        processing: { text: 'В процессе', class: 'admin-order-badge--processing' },
        shipped: { text: 'Отправлен', class: 'admin-order-badge--shipped' },
        delivered: { text: 'Доставлен', class: 'admin-order-badge--delivered' },
        cancelled: { text: 'Отменён', class: 'admin-order-badge--cancelled' }
    };

    const statusKey = status ? status.toLowerCase() : '';
    const s = map[statusKey] || { text: status, class: '' };

    return `<span class="admin-order-badge ${s.class}">${s.text}</span>`;
}

function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
}

function formatDate(isoString) {
    return new Date(isoString).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

async function loadOrders() {
    try {
        const result = await DataManager.get('orders', '/orders');
        const orders = result.orders || result;
        renderOrdersTable(orders);
    } catch (error) {
        showNotification('Ошибка загрузки заказов: ' + error.message, 'error');
    }
}
function renderOrdersTable(orders) {
    const tbody = document.querySelector('#orders-list tbody');
    if (!tbody) return;
    if (!orders?.length) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:#999;">Заказы не найдены</td></tr>';
        return;
    }
    tbody.innerHTML = orders.map(order => {
        const date = new Date(order.created_at).toLocaleDateString('ru-RU');
        return `
            <tr class="admin-table__row" data-order-id="${order.id_order}">
                <td class="admin-table__td">#${order.id_order}</td>
                <td class="admin-table__td">
                    <div class="admin-table__product">
                        <div class="admin-table__product-image">${(order.user_email || 'G').charAt(0).toUpperCase()}</div>
                        <div>
                            <div class="admin-table__product-name">${order.user_email || 'Гость'}</div>
                            <div class="admin-table__product-brand">${order.phone || ''}</div>
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

async function loadOrderDetails(orderId) {
    try {
        const order = await DataManager.get(`order-${orderId}`, `/orders/${orderId}`);
        if (!order) return;
        renderOrderDetailsContent(order);
    } catch (error) {
        showNotification('Ошибка загрузки заказа: ' + error.message, 'error');
    }
}

function renderOrderDetailsContent(order) {
    const existingSection = document.getElementById('admin-order-status-change-section');
    if (existingSection) {
        existingSection.remove();
    }

    document.getElementById('order-details-title').textContent = `ЗАКАЗ #${order.id_order}`;
    const statusDisplay = document.getElementById('order-status-display');
    statusDisplay.innerHTML = getOrderStatusBadge(order.status);
    document.getElementById('order-created-date').textContent = formatDate(order.created_at);

    let clientHTML = '';
    if (order.user && (order.user.first_name || order.user.last_name)) {
        const fullName = `${order.user.first_name} ${order.user.last_name}`.trim();
        clientHTML = `
            <div style="margin-bottom: 8px;"><strong>${fullName}</strong></div>
            <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Телефон: ${order.phone || '—'}</div>
            <div style="font-size: 12px; color: #666;">Email: ${order.user.email || order.email || '—'}</div>
        `;
    } else {
        clientHTML = `
            <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Телефон: ${order.phone || '—'}</div>
            <div style="font-size: 12px; color: #666;">Email: ${order.email || '—'}</div>
        `;
    }
    document.getElementById('order-client-info').innerHTML = clientHTML;

    let deliveryHTML = '';
    if (order.delivery_type === 'pickup') {
        deliveryHTML = '<div style="margin-bottom: 8px;"><strong>Самовывоз</strong></div>';
        if (order.pickup_point) {
            deliveryHTML += `
                <div style="font-size: 14px; color: #333; margin-bottom: 4px;">
                    <strong>${order.pickup_point.name}</strong>
                </div>
                <div style="font-size: 12px; color: #666;">
                    ${order.pickup_point.city || ''}, ${order.pickup_point.address || ''}
                </div>
            `;
        }
    } else if (order.delivery_type === 'courier' || order.delivery_type === 'delivery') {
        deliveryHTML = '<div style="margin-bottom: 8px;"><strong>Курьером</strong></div>';
        if (order.delivery_address) {
            deliveryHTML += `<div style="font-size: 12px; color: #666;">${order.delivery_address}</div>`;
        }
    } else {
        deliveryHTML = `<div style="font-size: 14px; color: #333;">${order.delivery_type || '—'}</div>`;
    }
    document.getElementById('order-delivery-info').innerHTML = deliveryHTML;

    let itemsHTML = '';
    if (order.items && order.items.length > 0) {
        order.items.forEach(item => {
            const itemTotal = item.price * item.quantity;
            itemsHTML += `
                <div class="admin-order-item-row">
                    <div>
                        <div class="admin-order-item-name">${item.product_name || 'Товар'}</div>
                        <div class="admin-order-item-meta">Кол-во: ${item.quantity}</div>
                    </div>
                    <div style="text-align: right;">
                        <div class="admin-order-item-price">${formatPrice(item.price)}</div>
                        <div style="font-size: 11px; color: #999;">× ${item.quantity} = ${formatPrice(itemTotal)}</div>
                    </div>
                </div>
            `;
        });
    } else {
        itemsHTML = '<div style="padding: 20px; text-align: center; color: #999;">Товары не указаны</div>';
    }
    itemsHTML += `<div class="admin-order-item-row"><span>ИТОГО</span><span class="admin-order-total">${formatPrice(order.total_amount)}</span></div>`;
    document.getElementById('order-items-list').innerHTML = itemsHTML;
    document.getElementById('order-total-sum').textContent = formatPrice(order.total_amount);

    const statusSection = document.createElement('div');
    statusSection.id = 'admin-order-status-change-section'; // Уникальный ID для поиска
    statusSection.style.cssText = 'margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb;';

    const currentStatus = order.status ? order.status.toLowerCase().trim() : '';

    statusSection.innerHTML = `
        <div style="margin-bottom: 12px;">
            <label style="font-size: 12px; font-weight: 600; color: #333; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 8px;">
                Изменить статус:
            </label>
            <select id="order-status-select" class="admin-select" style="width: 100%; padding: 10px 12px; border: 2px solid #e0e0e0; font-size: 14px; outline: none;">
                <option value="new" ${currentStatus === 'new' ? 'selected' : ''}>Новый</option>
                <option value="pending" ${currentStatus === 'pending' ? 'selected' : ''}>В обработке</option>
                <option value="processing" ${currentStatus === 'processing' ? 'selected' : ''}>В процессе</option>
                <option value="shipped" ${currentStatus === 'shipped' ? 'selected' : ''}>Отправлен</option>
                <option value="delivered" ${currentStatus === 'delivered' ? 'selected' : ''}>Доставлен</option>
                <option value="cancelled" ${currentStatus === 'cancelled' ? 'selected' : ''}>Отменён</option>
            </select>
            <div style="margin-top: 8px; font-size: 11px; color: #999;">
                Текущий статус в системе: <strong>${order.status}</strong>
            </div>
        </div>
        <button id="update-status-btn" class="admin-btn admin-btn--primary" style="width: 100%; padding: 12px; font-size: 14px; font-weight: 600;">
            Сохранить статус
        </button>
    `;

    const statusCard = document.querySelector('#order-details .admin-order-card:nth-child(1)');
    if (statusCard) {
        statusCard.appendChild(statusSection);
    }

    const updateBtn = document.getElementById('update-status-btn');
    const statusSelect = document.getElementById('order-status-select');

    if (updateBtn && statusSelect) {
        updateBtn.onclick = async () => {
            const newStatus = statusSelect.value;

            if (newStatus === currentStatus) {
                showNotification('Статус не изменился', 'info');
                return;
            }

            try {
                updateBtn.disabled = true;
                updateBtn.textContent = 'Сохранение...';

                await DataManager.put(`/orders/${order.id_order}/status`, {
                    status: newStatus
                });

                showNotification('Статус заказа обновлён', 'success');

                order.status = newStatus;
                statusDisplay.innerHTML = getOrderStatusBadge(newStatus);

                DataManager.invalidate('orders');

            } catch (error) {
                showNotification('Ошибка: ' + error.message, 'error');
                console.error('Error updating status:', error);
            } finally {
                updateBtn.disabled = false;
                updateBtn.textContent = 'Сохранить статус';
            }
        };
    }
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

// STATISTICS 
function renderStatisticsPage() {
    hideAllPages();
    const statsPage = document.getElementById('statistics-page');
    if (statsPage) {
        statsPage.style.display = 'block';
        loadStatistics();
    }
}

async function loadStatistics() {
    try {
        const stats = await DataManager.get('stats', '/stats');
        document.getElementById('stat-products').textContent = stats.totalProducts || 0;
        document.getElementById('stat-users').textContent = stats.totalUsers || 0;
        document.getElementById('stat-orders').textContent = stats.totalOrders || 0;
        document.getElementById('stat-rating').textContent = stats.averageRating || 0;
    } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
    }
}

// USERS 
function renderUsersPage() {
    hideAllPages();
    const usersList = document.getElementById('users-list');
    if (usersList) {
        usersList.style.display = 'block';
        loadUsers();
    }
}

async function loadUsers() {
    try {
        const result = await DataManager.get('users', '/users');
        const users = result.users || result;
        renderUsersTable(users);
    } catch (error) {
        showNotification('Ошибка загрузки пользователей: ' + error.message, 'error');
    }
}

function renderUsersTable(users) {
    const tbody = document.querySelector('#users-list tbody');
    if (!tbody) return;
    if (!users?.length) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:#999;">Пользователи не найдены</td></tr>';
        return;
    }
    tbody.innerHTML = users.map(user => {
        const roleClass = `admin-user-badge--${user.role}`;
        const roleText = user.role === 'admin' ? 'Администратор' : user.role === 'manager' ? 'Менеджер' : 'Пользователь';
        const date = new Date(user.created_at).toLocaleDateString('ru-RU');
        return `
            <tr class="admin-table__row" data-user-id="${user.id_user}">
                <td class="admin-table__td">${user.first_name} ${user.last_name}</td>
                <td class="admin-table__td">${user.email}</td>
                <td class="admin-table__td">
                    <span class="admin-user-badge ${roleClass}">${roleText}</span>
                </td>
                <td class="admin-table__td">${date}</td>
            </tr>
        `;
    }).join('');
}

function init() {
    AuthManager.init();
    populateSelects();
    initFormHandlers();
    initBrandsPage();
    initColorsPage();
    initRamPage();
    initMemoryPage();
    initOrdersPage();
    AdminRouter.init();

    Promise.all([
        DataManager.get('colors', '/colors'),
        DataManager.get('ram', '/ram'),
        DataManager.get('memory', '/storage')
    ]).then(() => {
        if (els.variantsList?.querySelector('.variant-color')) {
            updateVariantSelects();
        }
    });
}

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

document.getElementById('logout-btn')?.addEventListener('click', () => {
    if (confirm('Выйти из панели администратора?')) {
        AuthManager.logout();
    }
});

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();