import { addToCartAPI } from "./api.js"

export function initCartButtons() {
    document.querySelectorAll('.product-card__btn').forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const card = newBtn.closest('.product-card');
            const productId = card?.dataset.id;
            const productName = card?.querySelector('.product-card__title')?.textContent?.trim();
            
            if (!productId) {
                showNotification('Ошибка: товар не идентифицирован', 'error');
                return;
            }
            
            try {
                // Состояние загрузки
                newBtn.classList.add('product-card__btn--loading');
                newBtn.disabled = true;
                
                // Вызов API
                await addToCartAPI(productId);
                
                showNotification(`${productName} добавлен в корзину`, 'success');
                
            } catch (error) {
                console.error('Ошибка добавления в корзину:', error);
                
                newBtn.classList.add('product-card__btn--error');
                
                setTimeout(() => {
                    newBtn.classList.remove('product-card__btn--error');
                }, 1000);
                
                showNotification(error.message || 'Не удалось добавить товар', 'error');
            } finally {
                newBtn.classList.remove('product-card__btn--loading');
                newBtn.disabled = false;
            }
        });
    });
}