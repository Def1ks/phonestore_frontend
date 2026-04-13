// js/product.js
import { initCartButtons } from './cart-buttons.js';
import { getBadgeHTML, getPriceHTML, getPluralForm } from './product-render.js';

let loadedReviewsCount = 3;
let allReviewsData = [];
let isLoadingReviews = false; // Флаг загрузки отзывов

async function fetchProductData(productId) {


  return {
    id: productId,
    brand: { name: 'APPLE' },
    name: 'iPhone 15 Pro',
    description: 'iPhone 15 Pro — первый смартфон с титановым корпусом аэрокосмического класса. Оснащён самым мощным чипом A17 Pro, профессиональной камерой 48 МП и удобной кнопкой Action Button.',
    specs: {
      display: '6.1" Super Retina XDR, 2556×1179, 460 ppi',
      processor: 'Apple A17 Pro, 6 ядер',
      camera: '48 МП + 12 МП + 12 МП (телефото)',
      battery: '3274 мАч, до 23 ч видео',
      memory: '256 ГБ NVMe',
      os: 'iOS 17',
      protection: 'IP68 (6 м, 30 мин)',
      color: 'Натуральный титан'
    },
    variant: {
      id: 1,
      color: { name: 'Натуральный титан' },
      storage: { size_gb: 256 },
      price: 109990,
      old_price: 129999,
      image_url: 'img/iphone-15-pro.png',
      badge_type: 'sale'
    },
    reviews: {
      average: 4.2,
      total: 214,
      distribution: [
        { stars: 5, count: 182 },
        { stars: 4, count: 21 },
        { stars: 3, count: 6 },
        { stars: 2, count: 3 },
        { stars: 1, count: 2 }
      ],
      items: [
        { user: { first_name: 'Александр', last_name: 'К.' }, rating: 5, comment: 'Пользуюсь уже месяц, очень доволен. Камера просто потрясающая, особенно в ночном режиме.', created_at: '2026-03-15' },
        { user: { first_name: 'Мария', last_name: 'С.' }, rating: 5, comment: 'Перешла с iPhone 12. Разница ощутимая во всём: скорость, камера, автономность.', created_at: '2026-03-10' },
        { user: { first_name: 'Дмитрий', last_name: 'П.' }, rating: 4, comment: 'Телефон отличный, но цена кусается. За эти деньги можно было бы и зарядку в комплекте положить.', created_at: '2026-03-05' },
        { user: { first_name: 'Елена', last_name: 'В.' }, rating: 5, comment: 'Долго выбирала, не пожалела. Титан реально крутой.', created_at: '2026-03-01' },
        { user: { first_name: 'Сергей', last_name: 'Б.' }, rating: 5, comment: 'Лучший телефон на данный момент, без вопросов.', created_at: '2026-02-25' },
        { user: { first_name: 'Ольга', last_name: 'М.' }, rating: 4, comment: 'Хороший, но iOS 17 еще сыровата.', created_at: '2026-02-20' }
      ]
    }
  };
}

// ================= РЕНДЕРИНГ СЕКЦИЙ =================

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
  const initials = `${review.user.first_name[0]}${review.user.last_name[0]}`.toUpperCase();
  const rStars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
  const date = new Date(review.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

  return `
    <article class="review-card">
      <div class="review-card__header">
        <div class="review-card__user">
          <div class="review-card__avatar">${initials}</div>
          <div class="review-card__user-info">
            <div class="review-card__name">${review.user.first_name} ${review.user.last_name}</div>
            <div class="review-card__date">${date}</div>
          </div>
        </div>
        <div class="review-card__rating">${rStars}</div>
      </div>
      <h3 class="review-card__title">Отзыв о товаре</h3>
      <p class="review-card__text">${review.comment}</p>
    </article>`;
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

// ================= ЛОГИКА ОТЗЫВОВ С ЗАГРУЗКОЙ =================

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

  // Обновляем кнопку
  const loadMoreBtn = document.getElementById('loadMoreReviewsBtn');
  if (loadMoreBtn) loadMoreBtn.remove();

  const reviewsSection = document.querySelector('.product-reviews');
  if (reviewsSection && loadMoreButtonHTML) {
    reviewsSection.insertAdjacentHTML('beforeend', loadMoreButtonHTML);

    // Обработчик клика с async загрузкой
    document.getElementById('loadMoreReviewsBtn')?.addEventListener('click', async () => {
      if (isLoadingReviews) return; // Защита от повторных кликов

      isLoadingReviews = true;
      renderReviewsPage(reviews, true); // Перерисовываем с состоянием загрузки

      try {
        const response = await fetchMoreReviews(
          new URLSearchParams(window.location.search).get('id') || '1',
          loadedReviewsCount,
          3
        );

        if (response.items?.length) {
        }

        loadedReviewsCount += 3;
        renderReviewsPage(reviews, false); // Перерисовываем с новыми данными

      } catch (error) {
        console.error('Ошибка загрузки отзывов:', error);
        showNotification('Не удалось загрузить отзывы', 'error');
        renderReviewsPage(reviews, false); // Возвращаем кнопку в исходное состояние
      } finally {
        isLoadingReviews = false;
      }
    });
  } else if (reviewsSection && !loadMoreButtonHTML) {
    const oldBtn = document.getElementById('loadMoreReviewsBtn');
    if (oldBtn) oldBtn.remove();
  }
}

// ================= ИНИЦИАЛИЗАЦИЯ =================

async function initProductPage() {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id') || '1';

  try {
    const data = await fetchProductData(productId);
    const { id, brand, name, description, specs, variant, reviews } = data;

    allReviewsData = reviews;

    const imgWrapper = document.querySelector('.product-info__image-wrapper');
    if (imgWrapper) imgWrapper.innerHTML = renderImageBlock({ id, brand, name }, variant);

    const infoContent = document.querySelector('.product-info__content');
    if (infoContent) infoContent.innerHTML = renderInfoBlock({ id, brand, name, reviews }, variant);

    const specsBlocks = document.querySelectorAll('.product-specs');
    if (specsBlocks[0]) specsBlocks[0].innerHTML = `<h2 class="product-specs__title">Описание</h2>${renderDescription(description)}`;
    if (specsBlocks[1]) specsBlocks[1].innerHTML = `<h2 class="product-specs__title">Характеристики</h2>${renderSpecsTable(specs)}`;

    const reviewsSection = document.querySelector('.product-reviews');
    if (reviewsSection) {
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