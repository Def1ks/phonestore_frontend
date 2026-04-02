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