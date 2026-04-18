// js/reviews.js
import { getAllShopReviews } from './api.js';

const REVIEWS_CONFIG = {
    initialLoad: 6,
    loadMoreStep: 6,
};

let allReviews = [];
let displayedCount = 0;
let isLoading = false;

//  ЗАГРУЗКА ВСЕХ ОТЗЫВОВ 

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

//  РЕНДЕРИНГ СЛЕДУЮЩЕЙ ПОРЦИИ 

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

//  СОЗДАНИЕ КАРТОЧКИ 

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

//  ОБНОВЛЕНИЕ СТАТИСТИКИ 

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

//КНОПКА "ЗАГРУЗИТЬ ЕЩЁ" 

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

//ИНИЦИАЛИЗАЦИЯ

document.addEventListener('DOMContentLoaded', () => {
    loadAllReviews();
    
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            renderNextBatch();
            updateLoadMoreButton();
        });
    }
});