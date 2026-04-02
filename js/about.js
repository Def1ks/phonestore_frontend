// Функция списка FAQ
document.querySelectorAll('.faq__question').forEach(button => {
    button.addEventListener('click', () => {
        const item = button.parentElement;
        const isActive = item.classList.contains('is-active');

        document.querySelectorAll('.faq__item').forEach(faqItem => {
            faqItem.classList.remove('is-active');
            faqItem.querySelector('.faq__question').setAttribute('aria-expanded', 'false');
        });

        if (!isActive) {
            item.classList.add('is-active');
            button.setAttribute('aria-expanded', 'true');
        }
    });
});