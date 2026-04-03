import { submitReviewAPI } from './api.js';

const REVIEWS_DATA = [
    { id: 1, name: 'Алексей К.', date: '2024-02-12', rating: 5, text: 'Отличный магазин! Заказал телефон, пришёл за 2 дня. Упаковка идеальная, всё оригинальное. Консультант помог выбрать нужную модель. Буду рекомендовать друзьям!' },
    { id: 2, name: 'Мария Соколова', date: '2024-02-10', rating: 5, text: 'Цены ниже, чем в официальных салонах. Телефон пришёл в полной комплектации с гарантийным талоном. Очень довольна покупкой!' },
    { id: 3, name: 'Дмитрий П.', date: '2024-02-08', rating: 4, text: 'Телефон отличный, доставка быстрая. Единственный минус — не было подарочной коробки, но это мелочи.' },
    { id: 4, name: 'Светлана В.', date: '2024-02-05', rating: 5, text: 'Покупала в подарок мужу. Всё пришло быстро и в отличном состоянии. Не пожалела, что выбрала этот магазин!' },
    { id: 5, name: 'Игорь М.', date: '2024-02-01', rating: 5, text: 'Сдал старый телефон по Trade-in — получил хорошую скидку. Новый телефон летает! Спасибо за честную оценку.' },
    { id: 6, name: 'Ольга Т.', date: '2024-01-28', rating: 4, text: 'Хороший магазин с адекватными ценами. Доставили вовремя, телефон рабочий. Рекомендую!' },
    { id: 7, name: 'Анна К.', date: '2024-01-25', rating: 5, text: 'Заказывала второй раз. Всегда всё чётко: быстрая доставка, оригинальный товар, приятные цены.' },
    { id: 8, name: 'Светлана В.', date: '2024-02-05', rating: 5, text: 'Покупала в подарок мужу. Всё пришло быстро и в отличном состоянии. Не пожалела, что выбрала этот магазин!' },
    { id: 9, name: 'Игорь М.', date: '2024-02-01', rating: 5, text: 'Сдал старый телефон по Trade-in — получил хорошую скидку. Новый телефон летает! Спасибо за честную оценку.' },
    { id: 10, name: 'Ольга Т.', date: '2024-01-28', rating: 4, text: 'Хороший магазин с адекватными ценами. Доставили вовремя, телефон рабочий. Рекомендую!' },
    { id: 11, name: 'Анна К.', date: '2024-01-25', rating: 5, text: 'Заказывала второй раз. Всегда всё чётко: быстрая доставка, оригинальный товар, приятные цены.' },
    { id: 12, name: 'Анна К.', date: '2024-01-25', rating: 5, text: 'Заказывала второй раз. Всегда всё чётко: быстрая доставка, оригинальный товар, приятные цены.' },
    { id: 13, name: 'Анна К.', date: '2024-01-25', rating: 5, text: 'Заказывала второй раз. Всегда всё чётко: быстрая доставка, оригинальный товар, приятные цены.' },
    { id: 14, name: 'Павел Р.', date: '2024-01-20', rating: 3, text: 'Телефон хороший, но доставка задержалась на день. В остальном всё ок.' }
];


const REVIEWS_CONFIG = {
    limit: 6,  // Сколько отзывов загружать за один раз
};

let allReviews = [];       
let displayedCount = 0;    
let isLoading = false;      

// ЗАГРУЗКА ОТЗЫВОВ

async function loadReviews() {
    // Защита от повторных вызовов во время загрузки
    if (isLoading) return;
    isLoading = true;

    try {
        // Загружаем все отзывы 
        allReviews = REVIEWS_DATA;
        
        // Рендерим следующую порцию отзывов
        renderNextBatch();
        
        // Обновляем блок с рейтингом
        updateRatingStats();
        
        // Показываем/скрываем кнопку загрузить ещё
        updateLoadMoreButton();
        
    } catch (error) {
        console.error('Ошибка загрузки отзывов:', error);
    } finally {
        isLoading = false;
    }
}

// РЕНДЕРИНГ СЛЕДУЮЩЕЙ ПОРЦИИ ОТЗЫВОВ

function renderNextBatch() {
    const grid = document.querySelector('.reviews__grid');
    if (!grid) return;

    // Берём порцию отзывов
    const batch = allReviews.slice(displayedCount, displayedCount + REVIEWS_CONFIG.limit);
    
    // Если отзывы кончились, выходим
    if (batch.length === 0) return;

    // Создаём и добавляем карточки отзывов
    batch.forEach(review => {
        grid.appendChild(createReviewElement(review));
    });

    // Увеличиваем счётчик показанных отзывов
    displayedCount += batch.length;
}

// СОЗДАНИЕ КАРТОЧКИ ОТЗЫВА

function createReviewElement(review) {
    // Генерируем звёзды рейтинга 
    const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
    
    // Инициалы для аватара 
    const initials = review.name.split(' ').map(n => n[0]).join('').toUpperCase();
    
    // Форматируем дату 
    const date = new Date(review.date).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });

    const div = document.createElement('div');
    div.className = 'review-card';
    div.innerHTML = `
        <div class="review-card__header">
            <div class="review-card__user">
                <div class="review-card__avatar">${initials}</div>
                <div class="review-card__user-info">
                    <div class="review-card__name">${review.name}</div>
                    <div class="review-card__date">${date}</div>
                </div>
            </div>
            <div class="review-card__rating" title="${review.rating} из 5">${stars}</div>
        </div>
        <div class="review-card__text">${review.text}</div>
    `;
    
    return div;
}

// ОБНОВЛЕНИЕ СТАТИСТИКИ РЕЙТИНГА

function updateRatingStats() {
    const ratingBlock = document.querySelector('.reviews__rating');
    if (!ratingBlock || allReviews.length === 0) return;

    // Считаем общее количество отзывов
    const total = allReviews.length;
    
    // Считаем средний рейтинг
    const average = allReviews.reduce((sum, r) => sum + r.rating, 0) / total;
    const rounded = Math.round(average * 10) / 10; // Округляем до 1 знака

    // Генерируем звёзды для среднего рейтинга
    const stars = '★'.repeat(Math.round(rounded)) + '☆'.repeat(5 - Math.round(rounded));
    
    // Склоняем слово 
    const word = getPluralForm(total, ['отзыв', 'отзыва', 'отзывов']);

    // Обновляем значения в DOM
    ratingBlock.querySelector('.reviews__rating-value').textContent = rounded.toFixed(1);
    ratingBlock.querySelector('.reviews__rating-stars').textContent = stars;
    ratingBlock.querySelector('.reviews__rating-count').textContent = `${total} ${word}`;
}

// Склонение слов 
function getPluralForm(number, titles) {
    const cases = [2, 0, 1, 1, 1, 2];
    return titles[(number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5]];
}

// кнопка загрузить еще
function updateLoadMoreButton() {
    const btn = document.getElementById('loadMoreBtn');
    const container = btn?.closest('.reviews__load-more');
    
    // Проверяем, есть ли ещё отзывы для загрузки
    const hasMore = displayedCount < allReviews.length;

    // Скрываем/показываем контейнер кнопки
    if (container) {
        container.classList.toggle('reviews__load-more--hidden', !hasMore);
    }
    
    // Блокируем/разблокируем кнопку
    if (btn) {
        btn.disabled = !hasMore;
    }
}


// ОБРАБОТКА ФОРМЫ ОТЗЫВА
function initReviewForm() {
    const form = document.getElementById('reviewForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Сбор данных
        const formData = {
            name: document.getElementById('userName')?.value.trim(),
            rating: parseInt(document.querySelector('input[name="rating"]:checked')?.value),
            text: document.getElementById('userReview')?.value.trim()
        };
        
        // валидация на клиенте
        if (!formData.name || formData.name.length < 2) {
            showNotification('Введите корректное имя (минимум 2 символа)', 'error');
            return;
        }
        if (!formData.rating || formData.rating < 1) {
            showNotification('Выберите оценку', 'error');
            return;
        }
        if (!formData.text || formData.text.length < 10) {
            showNotification('Отзыв должен содержать минимум 10 символов', 'error');
            return;
        }
        
        const btn = form.querySelector('.review-form__submit');
        const originalText = btn.textContent;
        
        try {
            // Блокируем кнопку
            btn.disabled = true;
            btn.textContent = 'Отправка...';
            
            // Вызов API
            const result = await submitReviewAPI(formData);
            
            showNotification('Спасибо! Ваш отзыв оставлен', 'success');
            
            // Очищаем форму
            form.reset();
            
        } catch (error) {
            showNotification(error.message, 'error');
            console.error('Ошибка отправки отзыва:', error);
            
        } finally {
            // Возвращаем кнопку в исходное состояние
            btn.disabled = false;
            btn.textContent = originalText;
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
        loadReviews();
        initReviewForm();

        document.getElementById('loadMoreBtn')?.addEventListener('click', loadReviews);
});
