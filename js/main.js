// Бургер меню
const burger = document.querySelector('.header__burger');
const mobileMenu = document.querySelector('.header__mobile-menu');
const mobileLinks = document.querySelectorAll('.header__mobile-nav-link');

if (burger && mobileMenu) {

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

} 

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

// Форматирование цены
function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
}
