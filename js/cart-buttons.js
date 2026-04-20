// js/cart-buttons.js
import { addToCartAPI } from "./api.js";

export function initCartButtons() {
    const selectors = ['.product-card__btn', '.product-info__btn--cart'];
    
    selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                let variantId, productName;
                
                if (newBtn.classList.contains('product-info__btn--cart')) {в
                    variantId = newBtn.dataset.variant;
                    productName = newBtn.dataset.productName || 'Товар';
                } else {
                    const card = newBtn.closest('.product-card');
                    variantId = card?.dataset.id;
                    productName = card?.querySelector('.product-card__title')?.textContent?.trim();
                }
                
                if (!variantId) {
                    showNotification('Выберите вариант товара', 'warning');
                    return;
                }
                
                try {
                    newBtn.classList.add('product-card__btn--loading');
                    newBtn.disabled = true;
                    
                    await addToCartAPI(variantId, { quantity: 1 });
                    
                    showNotification(`${productName} добавлен в корзину`, 'success');
                    
                } catch (error) {
                    console.error('Ошибка добавления в корзину:', error);
                    
                    // Обработка неавторизованного доступа
                    if (error.message === 'AUTH_REQUIRED') {
                        showNotification('Войдите, чтобы добавить товар в корзину', 'warning');
                        return;
                    }
                    
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
    });
}