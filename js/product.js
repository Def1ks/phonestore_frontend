import { initCartButtons } from './cart-buttons.js';
import { getBadgeHTML, getPriceHTML, getPluralForm } from './product-render.js';
import { getProductByVariantId, checkProductReviewEligibility, createProductReview } from './api.js';

let loadedReviewsCount = 3;
let allReviewsData = [];
let isLoadingReviews = false;
let currentVariantId = null;  
let currentProductId = null;  
let userEligibility = null; 

//  РЕНДЕРИНГ СЕКЦИЙ 
function renderImageBlock(product, variant) {
  const badgeHTML = getBadgeHTML({ badge: variant.badge_type, oldPrice: variant.old_price });
  return `${badgeHTML}<img src="${variant.image_url}" alt="${product.name}" class="product-info__image" loading="lazy">`;
}

function renderInfoBlock(product, variant) {
  const stars = '★'.repeat(Math.round(product.reviews.average)) + '☆'.repeat(5 - Math.round(product.reviews.average));
  const reviewWord = getPluralForm(product.reviews.total, ['отзыв', 'отзыва', 'отзывов']);
  const priceHTML = getPriceHTML({ price: variant.price, oldPrice: variant.old_price });

  return `
    <div class="product-info__brand">${product.brand.name}</div>
    <h1 class="product-info__title">${product.name}</h1>
    <div class="product-info__rating">
      <div class="product-info__stars">${stars}</div>
      <span class="product-info__rating-value">${product.reviews.average}</span>
      <span class="product-info__rating-count">(${product.reviews.total} ${reviewWord})</span>
    </div>
    <div class="product-info__tags">
      <span class="product-info__tag">${variant.storage.size_gb}GB</span>
      <span class="product-info__tag">${variant.color.name}</span>
    </div>
    ${priceHTML}
    <ul class="product-info__features">
      <li class="product-info__feature">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="6" /></svg>
        Официальная гарантия 1 год
      </li>
      <li class="product-info__feature">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="6" width="12" height="8" rx="1" /><path d="M4 6V4a4 4 0 0 1 8 0v2" /></svg>
        Доставка 1-2 дня по всей России
      </li>
      <li class="product-info__feature">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 8a5 5 0 1 0 10 0A5 5 0 0 0 3 8z" /><path d="M8 3v5l3 3" /></svg>
        Возврат в течение 14 дней
      </li>
    </ul>
    <div class="product-info__actions">
      <button class="product-info__btn product-info__btn--cart" 
              data-id="${product.id}" 
              data-variant="${variant.id}" 
              data-product-name="${product.name}">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect height="9.5" width="10.5" y="4.75" x="2.75" />
          <path d="m5.75 7.75c0 1.5 1 2.5 2.25 2.5s2.25-1 2.25-2.5m-7.5-3 1.5-3h7.5l1.5 3" />
        </svg>
        В корзину
      </button>
    </div>
  `;
}

function renderDescription(text) {
  return `<p class="product-specs__description">${text}</p>`;
}

function renderSpecsTable(specs) {
  const labels = {
    display: 'Дисплей', processor: 'Процессор', camera: 'Камера',
    battery: 'Аккумулятор', memory: 'Память', os: 'ОС', protection: 'Защита', color: 'Цвет'
  };
  const rows = Object.entries(specs).map(([key, value]) => `
    <tr class="product-specs__row">
      <td class="product-specs__label">${labels[key] || key}</td>
      <td class="product-specs__value">${value}</td>
    </tr>
  `).join('');
  return `<table class="product-specs__table">${rows}</table>`;
}

function generateReviewHTML(review) {
    const firstName = review.user?.first_name || 'Аноним';
    const lastName = review.user?.last_name || '';
    
    const initials = lastName 
        ? `${firstName[0]}${lastName[0]}`.toUpperCase()
        : firstName[0].toUpperCase();
    
    const displayName = lastName 
        ? `${firstName} ${lastName}`
        : firstName;
    
    const rStars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
    const date = new Date(review.created_at).toLocaleDateString('ru-RU', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
    });

    return `
        <article class="review-card">
            <div class="review-card__header">
                <div class="review-card__user">
                    <div class="review-card__avatar">${initials}</div>
                    <div class="review-card__user-info">
                        <div class="review-card__name">${displayName}</div>
                        <div class="review-card__date">${date}</div>
                    </div>
                </div>
                <div class="review-card__rating">${rStars}</div>
            </div>
            <p class="review-card__text">${review.comment}</p>
        </article>
    `;
}

function renderReviewsDistribution(distribution, total) {
  return distribution.map(item => {
    const percent = total > 0 ? (item.count / total * 100) : 0;
    return `
        <div class="product-reviews__bar">
          <span>${item.stars} ★</span>
          <div class="product-reviews__progress">
            <div class="product-reviews__progress-fill" style="width: ${percent}%"></div>
          </div>
          <span>${item.count}</span>
        </div>`;
  }).join('');
}

//  ЛОГИКА ОТЗЫВОВ С ЗАГРУЗКОЙ 
async function fetchMoreReviews(productId, offset, limit) {
  const allItems = allReviewsData.items;
  const newItems = allItems.slice(offset, offset + limit);

  return {
    items: newItems,
    hasMore: offset + limit < allItems.length
  };
}

function renderReviewsPage(reviews, isLoading = false) {
  const totalItems = reviews.items.length;
  const visibleReviews = reviews.items.slice(0, loadedReviewsCount);
  const reviewsHTML = visibleReviews.map(generateReviewHTML).join('');

  let loadMoreButtonHTML = '';
  if (loadedReviewsCount < totalItems) {
    const loadingText = isLoading ? 'Загрузка...' : 'Загрузить ещё отзывы';
    const disabledAttr = isLoading ? 'disabled' : '';
    const loadingClass = isLoading ? 'product-reviews__load-more--loading' : '';

    loadMoreButtonHTML = `
      <button class="product-reviews__load-more ${loadingClass}" 
              id="loadMoreReviewsBtn" 
              ${disabledAttr}>
        ${loadingText}
      </button>`;
  }

  const listContainer = document.querySelector('.product-reviews__list');
  if (listContainer) listContainer.innerHTML = reviewsHTML;

  const loadMoreBtn = document.getElementById('loadMoreReviewsBtn');
  if (loadMoreBtn) loadMoreBtn.remove();

  const reviewsSection = document.querySelector('.product-reviews');
  if (reviewsSection && loadMoreButtonHTML) {
    reviewsSection.insertAdjacentHTML('beforeend', loadMoreButtonHTML);

    document.getElementById('loadMoreReviewsBtn')?.addEventListener('click', async () => {
      if (isLoadingReviews) return;

      isLoadingReviews = true;
      renderReviewsPage(reviews, true);

      try {
        const response = await fetchMoreReviews(
          currentProductId,
          loadedReviewsCount,
          3
        );

        if (response.items?.length) {
        }

        loadedReviewsCount += 3;
        renderReviewsPage(reviews, false);

      } catch (error) {
        console.error('Ошибка загрузки отзывов:', error);
        showNotification('Не удалось загрузить отзывы', 'error');
        renderReviewsPage(reviews, false);
      } finally {
        isLoadingReviews = false;
      }
    });
  } else if (reviewsSection && !loadMoreButtonHTML) {
    const oldBtn = document.getElementById('loadMoreReviewsBtn');
    if (oldBtn) oldBtn.remove();
  }
}

//  ПРОВЕРКА ВОЗМОЖНОСТИ ОСТАВИТЬ ОТЗЫВ 
async function checkEligibility() {
    const token = localStorage.getItem('authToken');
    const messageEl = document.getElementById('review-message');
    const formEl = document.getElementById('product-review-form');
    const submitBtn = document.getElementById('submit-product-review');
    const textarea = document.getElementById('product-review-comment');
    const starInputs = document.querySelectorAll('.product-review-form__star-input');

    if (!token) {
        userEligibility = { allowed: false, reason: 'Войдите, чтобы оставить отзыв' };
        showMessage(messageEl, 'Войдите, чтобы оставить отзыв', 'info');
        disableForm(formEl, submitBtn, textarea, starInputs);
        return;
    }

    try {
        const response = await checkProductReviewEligibility(currentProductId);
        userEligibility = response;

        if (response.allowed) {
            hideMessage(messageEl);
            enableForm(formEl, submitBtn, textarea, starInputs);
        } else {
            showMessage(messageEl, response.reason, 'warning');
            disableForm(formEl, submitBtn, textarea, starInputs);
        }
    } catch (error) {
        console.error('Ошибка проверки возможности отзыва:', error);
        showMessage(messageEl, 'Не удалось проверить возможность оставить отзыв', 'warning');
        disableForm(formEl, submitBtn, textarea, starInputs);
    }
}

//  УПРАВЛЕНИЕ ФОРМОЙ 
function disableForm(form, submitBtn, textarea, starInputs) {
    form.classList.add('product-review-form--disabled');
    submitBtn.disabled = true;
    textarea.disabled = true;
    starInputs.forEach(input => input.disabled = true);
}

function enableForm(form, submitBtn, textarea, starInputs) {
    form.classList.remove('product-review-form--disabled');
    submitBtn.disabled = false;
    textarea.disabled = false;
    starInputs.forEach(input => input.disabled = false);
}

function showMessage(element, text, type) {
    element.textContent = text;
    element.className = `product-review-form__message product-review-form__message--visible product-review-form__message--${type}`;
}

function hideMessage(element) {
    element.className = 'product-review-form__message';
    element.textContent = '';
}

//  ОТПРАВКА ОТЗЫВА 
async function submitReview(e) {
    e.preventDefault();

    const ratingInput = document.querySelector('input[name="rating"]:checked');
    const commentInput = document.getElementById('product-review-comment');
    const messageEl = document.getElementById('review-message');
    const submitBtn = document.getElementById('submit-product-review');

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

    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Отправка...';
    submitBtn.disabled = true;

    try {
        await createProductReview(currentProductId, rating, comment);

        showMessage(messageEl, 'Спасибо за ваш отзыв!', 'info');
        
        document.getElementById('product-review-form').reset();
        document.getElementById('product-char-counter').textContent = '0 / 500';
        document.querySelectorAll('.product-review-form__star-input').forEach(i => i.checked = false);
        
        await loadReviews(currentVariantId);
        
        await checkEligibility();

    } catch (error) {
        console.error('Ошибка отправки отзыва:', error);
        showMessage(messageEl, error.message || 'Не удалось отправить отзыв', 'warning');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

//  ЗАГРУЗКА ОТЗЫВОВ 
async function loadReviews(variantId) {  
    try {
        const data = await getProductByVariantId(variantId);  
        allReviewsData = data.reviews;
        loadedReviewsCount = 3;
        renderReviewsPage(allReviewsData);
        updateReviewSummary(data.reviews);
    } catch (error) {
        console.error('Ошибка загрузки отзывов:', error);
    }
}

function updateReviewSummary(reviews) {
    const summaryEl = document.querySelector('.product-reviews__summary');
    if (!summaryEl) return;

    const plural = getPluralForm(reviews.total, ['отзыв', 'отзыва', 'отзывов']);
    const avgStars = '★'.repeat(Math.round(reviews.average)) + '☆'.repeat(5 - Math.round(reviews.average));
    const distributionHTML = renderReviewsDistribution(reviews.distribution, reviews.total);

    summaryEl.innerHTML = `
        <div class="product-reviews__average">
            <div class="product-reviews__score">${reviews.average}</div>
            <div class="product-reviews__stars">${avgStars}</div>
            <div class="product-reviews__total">${reviews.total} ${plural}</div>
        </div>
        <div class="product-reviews__distribution">${distributionHTML}</div>
    `;
}

//  СЧЁТЧИК СИМВОЛОВ 
function initCharCounter() {
    const textarea = document.getElementById('product-review-comment');
    const counter = document.getElementById('product-char-counter');

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

async function initProductPage() {
  const params = new URLSearchParams(window.location.search);
  currentVariantId = params.get('id') || '1';

  try {
    const data = await getProductByVariantId(currentVariantId);
    currentProductId = data.productId;
    const { id, brand, name, description, specs, variant, reviews } = data;

    allReviewsData = reviews;

    const imgWrapper = document.querySelector('.product-info__image-wrapper');
    if (imgWrapper) imgWrapper.innerHTML = renderImageBlock({ id, brand, name }, variant);

    const infoContent = document.querySelector('.product-info__content');
    if (infoContent) infoContent.innerHTML = renderInfoBlock({ id, brand, name, reviews }, variant);

    const specsBlocks = document.querySelectorAll('.product-specs');
    if (specsBlocks[0]) specsBlocks[0].innerHTML = `<h2 class="product-specs__title">Описание</h2>${renderDescription(description)}`;
    if (specsBlocks[1]) {
      const specsTableHTML = renderSpecsTable(specs);
      specsBlocks[1].innerHTML = `
    <h2 class="product-specs__title">Характеристики</h2>
    ${specsTableHTML}
  `;
    }

    const reviewsSection = document.querySelector('.product-reviews');
    if (reviewsSection) {
      if (reviews.total === 0) {
        reviewsSection.innerHTML = `
      <h2 class="product-reviews__title">Отзывы покупателей</h2>
      <div class="product-reviews__empty">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        <p>Отзывов пока нет</p>
      </div>
    `;
      } else {
        const plural = getPluralForm(reviews.total, ['отзыв', 'отзыва', 'отзывов']);
        const avgStars = '★'.repeat(Math.round(reviews.average)) + '☆'.repeat(5 - Math.round(reviews.average));
        const distributionHTML = renderReviewsDistribution(reviews.distribution, reviews.total);

        reviewsSection.innerHTML = `
    <h2 class="product-reviews__title">Отзывы покупателей</h2>
    <div class="product-reviews__summary">
      <div class="product-reviews__average">
        <div class="product-reviews__score">${reviews.average}</div>
        <div class="product-reviews__stars">${avgStars}</div>
        <div class="product-reviews__total">${reviews.total} ${plural}</div>
      </div>
      <div class="product-reviews__distribution">${distributionHTML}</div>
    </div>
    <div class="product-reviews__list"></div>
  `;
        renderReviewsPage(reviews);
      }
    }

    initCharCounter();
    checkEligibility(); 

    const form = document.getElementById('product-review-form');
    if (form) {
        form.addEventListener('submit', submitReview);
    }

    initCartButtons();

  } catch (error) {
    console.error('Ошибка рендеринга страницы товара:', error);
    const container = document.querySelector('.container');
    if (container) container.innerHTML = '<p style="text-align:center;padding:40px;color:#d32f2f;">Ошибка загрузки данных товара.</p>';
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProductPage);
} else {
  initProductPage();
}