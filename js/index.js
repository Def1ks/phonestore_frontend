// Подключить APi запросы
import { initCartButtons } from './cart-buttons.js';
import { renderProductsToGrid } from './product-renderer.js';

async function loadHitsProducts() {
    const grid = document.querySelector('.bestsellers__grid');
    if (!grid) return;

    try {
        // === ЗАГЛУШКА заменить на реальный API ===
        await new Promise(resolve => setTimeout(resolve, 500));

        const hits = [
            {
                id: 1,
                name: 'iPhone 15 Pro',
                brand: 'Apple · 256GB',
                price: 109990,
                image: 'img/iphone-15-pro.png',
                rating: 4.9,
                reviews: 214,
                badge: 'new',
                badgeText: 'НОВИНКА'
            },
            {
                id: 2,
                name: 'iPhone 14',
                brand: 'Apple · 128GB',
                price: 79990,
                oldPrice: 89990,
                image: 'img/iphone-15-pro.png',
                rating: 4.7,
                reviews: 389,
                badge: 'sale',
                badgeText: 'СКИДКА'
            },
            {
                id: 3,
                name: 'Samsung Galaxy S24 Ultra',
                brand: 'Samsung · 512GB',
                price: 119990,
                image: 'img/iphone-15-pro.png',
                rating: 4.8,
                reviews: 176,
                badge: 'hit',
                badgeText: 'ХИТ'
            }
        ];
        // ===========================================

        renderProductsToGrid(hits, '.bestsellers__grid');
        initCartButtons();

    } catch (error) {
        console.error('Ошибка загрузки:', error);

        grid.innerHTML = `
        <div class="bestsellers__error">
            <p>Не удалось загрузить товары</p>
            <button class="bestsellers__retry" type="button">
                Попробовать снова
            </button>
        </div>
    `;

        grid.querySelector('.bestsellers__retry')?.addEventListener('click', loadHitsProducts);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadHitsProducts();
});