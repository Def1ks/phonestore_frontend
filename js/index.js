// Подключить APi запросы
import { initCartButtons } from './cart-buttons.js';
import { renderProductsToGrid } from './product-render.js';

async function loadHitsProducts() {
    const grid = document.querySelector('.bestsellers__grid');
    if (!grid) return;

    try {
        const response = await fetch('http://localhost:3000/api/products/hits?limit=3');
        const { products } = await response.json();
        renderProductsToGrid(products, '.bestsellers__grid');
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