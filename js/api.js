const API_BASE_URL = 'http://localhost:3000/api';

// ТОВАРЫ
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

// КОРЗИНА
export async function addToCartAPI(productId, data = {}) {
    const response = await fetch(`${API_BASE_URL}/cart`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            productId,
            ...data
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Не удалось добавить в корзину');
    }
    
    return await response.json();
}

export async function getCart() {
    const response = await fetch(`${API_BASE_URL}/cart`);
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
}

// ОТЗЫВЫ О МАГАЗИНЕ
export async function getAllShopReviews() {
    const response = await fetch(`${API_BASE_URL}/shop-reviews`);
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
}

// === ФИЛЬТРЫ ===
export async function getFilterOptions() {
    const response = await fetch(`${API_BASE_URL}/products/filters`);
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
}