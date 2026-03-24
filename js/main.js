// Бургер меню
const burger = document.querySelector('.header__burger');
const mobileMenu = document.querySelector('.header__mobile-menu');
const mobileLinks = document.querySelectorAll('.header__mobile-nav-link');

// Открытие/закрытие меню
burger.addEventListener('click', () => {
    burger.classList.toggle('header__burger--active');
    mobileMenu.classList.toggle('header__mobile-menu--active');
    document.body.style.overflow = mobileMenu.classList.contains('header__mobile-menu--active') ? 'hidden' : '';
});

// Закрытие меню при клике на ссылку
mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
        burger.classList.remove('header__burger--active');
        mobileMenu.classList.remove('header__mobile-menu--active');
        document.body.style.overflow = '';
    });
});

// Закрытие меню при клике вне его
document.addEventListener('click', (e) => {
    if (!burger.contains(e.target) && !mobileMenu.contains(e.target)) {
        burger.classList.remove('header__burger--active');
        mobileMenu.classList.remove('header__mobile-menu--active');
        document.body.style.overflow = '';
    }
});

// Добавление в корзину
document.querySelectorAll('.product-card__btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        btn.disabled = true;
        btn.classList.add('product-card__btn--loading');
        btn.classList.remove('product-card__btn--error');
        
        const card = btn.closest('.product-card');
        const productId = card.dataset.id || extractIdFromUrl(card.querySelector('.product-card__link').href);
        
        try {
            const response = await addToCartAPI(productId);
            
            if (response.success) {
                btn.classList.remove('product-card__btn--loading');
                showNotification('Товар добавлен в корзину', 'success');
            } else {
                throw new Error(response.message || 'Не удалось добавить');
            }
        } catch (error) {
            console.error('Ошибка добавления:', error);
            btn.classList.remove('product-card__btn--loading');
            btn.classList.add('product-card__btn--error');
            
            showNotification(error.message || 'Ошибка при добавлении товара', 'error');
            
            setTimeout(() => {
                btn.classList.remove('product-card__btn--error');
            }, 2000);
        } finally {
            btn.disabled = false;
        }
    });
});

// Уведомление
function showNotification(message, type = 'success') {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Вспомогательная функция для извлечения ID из URL
function extractIdFromUrl(url) {
    const params = new URLSearchParams(url.split('?')[1]);
    return params.get('id');
}

// API функция 
async function addToCartAPI(productId) {
    try {
        const response = await fetch('/api/cart/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId, quantity: 1 })
        });
        
        if (!response.ok) {
            throw new Error('Сервер вернул ошибку');
        }
        
        return await response.json();
    } catch (err) {
        throw new Error('Ошибка при добавлении товара. Попробуйте перезагрузить страницу');
    }
}