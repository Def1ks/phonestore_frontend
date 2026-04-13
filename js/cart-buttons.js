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
                
                let productId, variantId, productName;
                
                if (newBtn.classList.contains('product-info__btn--cart')) {
                    productId = newBtn.dataset.id;
                    variantId = newBtn.dataset.variant;
                    productName = newBtn.dataset.productName || 'Товар';
                } else {
                    const card = newBtn.closest('.product-card');
                    productId = card?.dataset.id;
                    variantId = null; // На бэке возьмется дефолтный variant
                    productName = card?.querySelector('.product-card__title')?.textContent?.trim();
                }
                
                if (!productId) {
                    showNotification('Ошибка: товар не идентифицирован', 'error');
                    return;
                }
                
                try {
                    newBtn.classList.add('product-card__btn--loading');
                    newBtn.disabled = true;
                    
                    await addToCartAPI(productId, {
                        variantId: variantId,
                        quantity: 1
                    });
                    
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
    });
}