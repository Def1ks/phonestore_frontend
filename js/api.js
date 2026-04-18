const API_BASE_URL = 'http://localhost:3000/api';

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

//  ОТЗЫВЫ О МАГАЗИНЕ 
export async function getAllShopReviews() {
    const response = await fetch(`${API_BASE_URL}/shop-reviews`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
}