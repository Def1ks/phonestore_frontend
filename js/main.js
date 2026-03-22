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