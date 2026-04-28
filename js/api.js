const API_BASE_URL = 'http://localhost:3000/api';

//  ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ 
function getToken() {
    return localStorage.getItem('authToken');
}

export async function apiRequest(url, options = {}) {
    const token = getToken();
    
    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    };
    
    if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await fetch(url, config);
    
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
}

//  ТОВАРЫ 
export async function getProducts(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/products${queryParams ? `?${queryParams}` : ''}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
}

export async function getProductById(id) {
    const response = await fetch(`${API_BASE_URL}/products/${id}`);
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
}

export async function getProductByVariantId(variantId) {
    const response = await fetch(`${API_BASE_URL}/products/variant/${variantId}`);
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
}

export async function getHitsProducts(limit = 3) {
    const response = await fetch(`${API_BASE_URL}/products/hits?limit=${limit}`);
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.products || [];
}

//  КОРЗИНА 
export async function addToCartAPI(variantId, options = {}) {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
        throw new Error('AUTH_REQUIRED');
    }
    
    const response = await fetch(`${API_BASE_URL}/cart`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            variantId,  
            quantity: options.quantity || 1
        })
    });
    
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Не удалось добавить в корзину');
    }
    
    return await response.json();
}

export async function getCart() {
    return await apiRequest(`${API_BASE_URL}/cart`);
}

//  ОТЗЫВЫ О МАГАЗИНЕ 
export async function getAllShopReviews() {
    const response = await fetch(`${API_BASE_URL}/shop-reviews`);
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
}

//  ФИЛЬТРЫ 
export async function getFilterOptions() {
    const response = await fetch(`${API_BASE_URL}/products/filters`);
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
}

//  АВТОРИЗАЦИЯ 
export async function registerUser(data) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка регистрации');
    }
    
    const result = await response.json();
    
    if (result.token) {
        localStorage.setItem('authToken', result.token);
        localStorage.setItem('currentUser', JSON.stringify(result.user));
    }
    
    return result;
}

export async function loginUser(data) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка входа');
    }
    
    const result = await response.json();
    
    if (result.token) {
        localStorage.setItem('authToken', result.token);
        localStorage.setItem('currentUser', JSON.stringify(result.user));
    }
    
    return result;
}

export function logoutUser() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
}

export async function getCurrentUser() {
    return await apiRequest(`${API_BASE_URL}/auth/me`);
}

export async function updateProfile(data) {
    const payload = {
        first_name: data.first_name,
        last_name: data.last_name
    };
    return await apiRequest(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        body: JSON.stringify(payload)
    });
}

export async function changePassword(data) {
    const payload = {
        current_password: data.currentPassword,
        new_password: data.newPassword
    };
    return await apiRequest(`${API_BASE_URL}/auth/password`, {
        method: 'PUT',
        body: JSON.stringify(payload)
    });
}

//  ЗАКАЗЫ 
export async function getUserOrders() {
    return await apiRequest(`${API_BASE_URL}/orders`);
}

export async function getOrderById(orderId) {
    return await apiRequest(`${API_BASE_URL}/orders/${orderId}`);
}

export async function clearOrdersCache() {
    return await apiRequest(`${API_BASE_URL}/orders/clear-cache`);
}

export async function getPickupPoints() {
    return await apiRequest(`${API_BASE_URL}/orders/pickup-points`);
}

export async function createOrder(orderData) {
    return await apiRequest(`${API_BASE_URL}/orders`, {
        method: 'POST',
        body: JSON.stringify(orderData)
    });
}

export async function checkShopReviewEligibility() {
    return await apiRequest(`${API_BASE_URL}/shop-reviews/eligibility`);
}

export async function createShopReview(rating, comment) {
    return await apiRequest(`${API_BASE_URL}/shop-reviews`, {
        method: 'POST',
        body: JSON.stringify({ rating, comment })
    });
}

//  ОТЗЫВЫ О ТОВАРЕ 
export async function checkProductReviewEligibility(productId) {
    return await apiRequest(`${API_BASE_URL}/products/${productId}/reviews/eligibility`);
}

export async function createProductReview(productId, rating, comment) {
    return await apiRequest(`${API_BASE_URL}/products/${productId}/reviews`, {
        method: 'POST',
        body: JSON.stringify({ rating, comment })
    });
}