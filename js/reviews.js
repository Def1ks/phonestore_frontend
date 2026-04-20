// js/reviews.js
import { getAllShopReviews, checkShopReviewEligibility, createShopReview } from './api.js';

const REVIEWS_CONFIG = {
    initialLoad: 6,
    loadMoreStep: 6,
};

let allReviews = [];
let displayedCount = 0;
let isLoading = false;
let userEligibility = null; // { allowed: boolean, reason: string }

// ================= ЗАГРУЗКА ВСЕХ ОТЗЫВОВ =================
async function loadAllReviews() {
    if (isLoading) return;
    isLoading = true;

    try {
        const data = await getAllShopReviews();
        allReviews = data.items;
        displayedCount = 0;

        const grid = document.querySelector('.reviews__grid');
        if (grid) grid.innerHTML = '';

        renderNextBatch();
        updateRatingStats(data);
        updateLoadMoreButton();

    } catch (error) {
        console.error('Ошибка загрузки отзывов:', error);
        const grid = document.querySelector('.reviews__grid');
        if (grid) {
            grid.innerHTML = '<p class="error">Не удалось загрузить отзывы</p>';
        }
    } finally {
        isLoading = false;
    }
}

// ================= ПРОВЕРКА ВОЗМОЖНОСТИ ОСТАВИТЬ ОТЗЫВ =================
async function checkEligibility() {
    const token = localStorage.getItem('authToken');
    const messageEl = document.getElementById('review-message');
    const formEl = document.getElementById('shop-review-form');
    const submitBtn = document.getElementById('submit-review-btn');
    const textarea = document.getElementById('review-comment');
    const starInputs = document.querySelectorAll('.review-form__star-input');

    if (!token) {
        // Пользователь не авторизован
        userEligibility = { allowed: false, reason: 'Войдите, чтобы оставить отзыв' };
        showMessage(messageEl, 'Войдите, чтобы оставить отзыв', 'info');
        disableForm(formEl, submitBtn, textarea, starInputs);
        return;
    }

    try {
        const response = await checkShopReviewEligibility();
        userEligibility = response;

        if (response.allowed) {
            // Можно оставить отзыв
            hideMessage(messageEl);
            enableForm(formEl, submitBtn, textarea, starInputs);
        } else {
            // Нельзя оставить отзыв
            showMessage(messageEl, response.reason, 'warning');
            disableForm(formEl, submitBtn, textarea, starInputs);
        }
    } catch (error) {
        console.error('Ошибка проверки возможности отзыва:', error);
        showMessage(messageEl, 'Не удалось проверить возможность оставить отзыв', 'warning');
        disableForm(formEl, submitBtn, textarea, starInputs);
    }
}

// ================= УПРАВЛЕНИЕ ФОРМОЙ =================
function disableForm(form, submitBtn, textarea, starInputs) {
    form.classList.add('review-form--disabled');
    submitBtn.disabled = true;
    textarea.disabled = true;
    starInputs.forEach(input => input.disabled = true);
}

function enableForm(form, submitBtn, textarea, starInputs) {
    form.classList.remove('review-form--disabled');
    submitBtn.disabled = false;
    textarea.disabled = false;
    starInputs.forEach(input => input.disabled = false);
}

function showMessage(element, text, type) {
    element.textContent = text;
    element.className = `review-form__message review-form__message--visible review-form__message--${type}`;
}

function hideMessage(element) {
    element.className = 'review-form__message';
    element.textContent = '';
}

// ================= ОТПРАВКА ОТЗЫВА =================
async function submitReview(e) {
    e.preventDefault();

    const ratingInput = document.querySelector('input[name="rating"]:checked');
    const commentInput = document.getElementById('review-comment');
    const messageEl = document.getElementById('review-message');
    const submitBtn = document.getElementById('submit-review-btn');

    const rating = ratingInput ? parseInt(ratingInput.value) : 0;
    const comment = commentInput.value.trim();

    // Валидация
    if (!rating || rating < 1 || rating > 5) {
        showMessage(messageEl, 'Пожалуйста, выберите оценку', 'warning');
        return;
    }

    if (comment.length < 10) {
        showMessage(messageEl, 'Отзыв должен содержать минимум 10 символов', 'warning');
        return;
    }

    if (comment.length > 500) {
        showMessage(messageEl, 'Отзыв не должен превышать 500 символов', 'warning');
        return;
    }

    // Блокируем кнопку
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Отправка...';
    submitBtn.disabled = true;

    try {
        await createShopReview(rating, comment);

        // Успех!
        showMessage(messageEl, 'Спасибо за ваш отзыв!', 'info');
        
        // Очищаем форму
        document.getElementById('shop-review-form').reset();
        
        // Обновляем список отзывов
        await loadAllReviews();
        
        // Проверяем возможность снова (теперь будет false)
        await checkEligibility();

    } catch (error) {
        console.error('Ошибка отправки отзыва:', error);
        showMessage(messageEl, error.message || 'Не удалось отправить отзыв', 'warning');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// ================= СЧЁТЧИК СИМВОЛОВ =================
function initCharCounter() {
    const textarea = document.getElementById('review-comment');
    const counter = document.getElementById('char-counter');

    if (!textarea || !counter) return;

    textarea.addEventListener('input', () => {
        const length = textarea.value.length;
        counter.textContent = `${length} / 500`;
        
        if (length > 500) {
            counter.style.color = '#ef4444';
        } else if (length > 450) {
            counter.style.color = '#f59e0b';
        } else {
            counter.style.color = '#6b7280';
        }
    });
}

// ================= РЕНДЕРИНГ СЛЕДУЮЩЕЙ ПОРЦИИ =================
function renderNextBatch() {
    const grid = document.querySelector('.reviews__grid');
    if (!grid) return;

    const currentCount = displayedCount;
    const toShow = Math.min(REVIEWS_CONFIG.loadMoreStep, allReviews.length - currentCount);
    const batch = allReviews.slice(currentCount, currentCount + toShow);
    
    if (batch.length === 0) return;

    batch.forEach(review => {
        grid.appendChild(createReviewElement(review));
    });

    displayedCount += batch.length;
}

// ================= СОЗДАНИЕ КАРТОЧКИ =================
function createReviewElement(review) {
    const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);

    const userName = review.user
        ? `${review.user.first_name} ${review.user.last_name}`.trim()
        : 'Аноним';

    const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    const date = new Date(review.created_at).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    const div = document.createElement('div');
    div.className = 'review-card';
    div.innerHTML = `
        <div class="review-card__header">
            <div class="review-card__user">
                <div class="review-card__avatar">${initials}</div>
                <div class="review-card__user-info">
                    <div class="review-card__name">${userName}</div>
                    <div class="review-card__date">${date}</div>
                </div>
            </div>
            <div class="review-card__rating" title="${review.rating} из 5">${stars}</div>
        </div>
        <div class="review-card__text">${review.comment}</div>
    `;
    return div;
}

// ================= ОБНОВЛЕНИЕ СТАТИСТИКИ =================
function updateRatingStats(data) {
    const ratingBlock = document.querySelector('.reviews__rating');
    if (!ratingBlock) return;

    const { total, average } = data;
    const rounded = Math.round(average * 10) / 10;
    const stars = '★'.repeat(Math.round(rounded)) + '☆'.repeat(5 - Math.round(rounded));
    const word = getPluralForm(total, ['отзыв', 'отзыва', 'отзывов']);

    const valueEl = ratingBlock.querySelector('.reviews__rating-value');
    const starsEl = ratingBlock.querySelector('.reviews__rating-stars');
    const countEl = ratingBlock.querySelector('.reviews__rating-count');

    if (valueEl) valueEl.textContent = rounded.toFixed(1);
    if (starsEl) starsEl.textContent = stars;
    if (countEl) countEl.textContent = `${total} ${word}`;
}

function getPluralForm(number, titles) {
    const cases = [2, 0, 1, 1, 1, 2];
    return titles[(number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5]];
}

// ================= КНОПКА "ЗАГРУЗИТЬ ЕЩЁ" =================
function updateLoadMoreButton() {
    const btn = document.getElementById('loadMoreBtn');
    const container = btn?.closest('.reviews__load-more');

    if (!container || !btn) return;

    const hasMore = displayedCount < allReviews.length;
    
    if (hasMore) {
        container.classList.remove('reviews__load-more--hidden');
        btn.disabled = false;
        btn.classList.add('reviews__btn--active');
    } else {
        container.classList.add('reviews__load-more--hidden');
        btn.disabled = true;
        btn.classList.remove('reviews__btn--active');
    }
}

// ================= ИНИЦИАЛИЗАЦИЯ =================
document.addEventListener('DOMContentLoaded', () => {
    loadAllReviews();
    checkEligibility(); // Проверяем возможность оставить отзыв
    initCharCounter();

    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            renderNextBatch();
            updateLoadMoreButton();
        });
    }

    const form = document.getElementById('shop-review-form');
    if (form) {
        form.addEventListener('submit', submitReview);
    }
});