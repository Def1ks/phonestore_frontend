// api.js
const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Получить список товаров
 * @param {Object} params - Параметры запроса (фильтры, пагинация)
 * @returns {Promise<Object>} - Объект с товарами и общей суммой
 */
export async function getProducts(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/products${queryParams ? `?${queryParams}` : ''}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
}

/**
 * Получить товар по ID
 * @param {number|string} id - ID товара
 * @returns {Promise<Object>} - Данные товара
 */
export async function getProductById(id) {
    const response = await fetch(`${API_BASE_URL}/products/${id}`);
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
}

/**
 * Добавить товар в корзину
 * @param {number|string} productId - ID товара
 * @param {Object} data - Данные для добавления (variantId, quantity)
 * @returns {Promise<Object>} - Ответ сервера
 */
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

/**
 * Получить корзину
 * @returns {Promise<Object>} - Данные корзины
 */
export async function getCart() {
    const response = await fetch(`${API_BASE_URL}/cart`);
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
}

export async function submitReviewAPI(review) {
    try {
        const response = await fetch('/api/reviews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: review.name,
                rating: review.rating,
                text: review.text
            })
        });

        if (!response.ok) {
            // Пробуем получить сообщение об ошибке от сервера
            let errorData = {};
            try {
                errorData = await response.json();
            } catch (e) {
            }
            
            // Маппинг кодов на понятные сообщения
            const errorMessages = {
                400: errorData.message || 'Некорректные данные отзыва',
                403: errorData.message || 'Отправка запрещена',
                429: 'Слишком много запросов. Попробуйте позже',
                500: 'Ошибка сервера. Попробуйте позже',
            };
            
            throw new Error(errorMessages[response.status] || `Ошибка ${response.status}`);
        }

        return await response.json();
        
    } catch (err) {
        // Обработка ошибок сети
        if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
            throw new Error('Нет соединения с сервером. Проверьте подключение к интернету');
        }
        
        // Пробрасываем остальные ошибки
        throw new Error(err.message || 'Не удалось отправить отзыв');
    }
}

