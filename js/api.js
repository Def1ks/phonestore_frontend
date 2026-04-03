// Дописать api запрос после написания бека
export async function addToCartAPI(productId) {

    try {
        const response = await fetch('/api/cart/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId, quantity: 1 })
        });

        if (!response.ok) {
            throw new Error('Ошибка при добавление товара');
        }

        return await response.json();
    } catch (err) {
        if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
            throw new Error('Нет соединения с сервером');
        }
        throw new Error(err.message || 'Ошибка при добавлении товара');
    }
}

// Дописать API-запрос после написания бэка
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