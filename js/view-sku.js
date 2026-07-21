// ============================================================
// WIDEN — view-sku.js · 카테고리/제품 (Page 2)
// ============================================================

const SKU_CATEGORIES = [
  { key: '전체', icon: '🧴' },
  { key: '향수', icon: '🧪' },
  { key: '립', icon: '💄' },
  { key: '베이스', icon: '🪞' },
  { key: '아이메이크업', icon: '🎨' },
  { key: '스킨케어', icon: '🧴' },
  { key: '선케어', icon: '☀️' },
  { key: '클렌징/필링', icon: '🫧' },
  { key: '바디케어', icon: '🧼' },
  { key: '헤어케어', icon: '🧖' },
  { key: '디바이스', icon: '🔋' },
  { key: '헬스/푸드', icon: '🥤' },
  { key: '쉐이빙/제모', icon: '🪒' }
];

const WEEK_OPTIONS = ['전체', '2026-W27', '2026-W28', '2026-W29'];
const DEFAULT_WEIGHTS = {
  ranking: 25,
  reactions: 15,
  sales: 20,
  offline: 10,
  margin: 20,
  competition: 10
};

function renderSkuView() {
  const container = document.getElementById('view-sku');
  if (!container) return;

  const skus = DataStore.skus || [];
  const recommendations = buildSkuRecommendations(skus);
  const selectedSku = pickInitialSku(skus, recommendations);
  const selectedRecommendation = findRecommendationForSku(selectedSku, recommendations);

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">📦 카테고리/제품</h1>
      <p class="page-subtitle">대분류별 제품, 주차별 추천 이력, 플랫폼 링크, 인기 판단 기준을 한 화면에서 관리합니다.</p>
    </div>

    ${renderCategoryRail()}
    ${renderProductControls()}
    ${renderPopularityScalePanel()}

    <div id="sku-detail-panel">
      ${selectedSku ? renderProductDetailPanel(selectedSku, selectedRecommendation) : ''}
    </div>

    <div class="grid-3" id="sku-grid">
      ${renderSkuCards(skus, recommendations)}
    </div>
  `;

  bindSkuEvents(container);
  updateSkuScores(container);
}

function detectMarketFromPlatform(platform) {
  return platform === 'Shopee TW' ? 'taiwan' : 'japan';
}

function buildSkuRecommendations(skus, market = 'japan') {
  if (typeof TrendEngine === 'undefined') return [];

  return TrendEngine.buildRecommendations({
    skus,
    ingredients: DataStore.ingredients || [],
    trendSignals: DataStore.trendSignals || [],
    trendVerifications: DataStore.trendVerifications || [],
    trendScoreRules: DataStore.trendScoreRules || [],
    market
  });
}

function pickInitialSku(skus, recommendations) {
  const topRecommendation = recommendations[0];
  return skus.find(item => item.id === topRecommendation?.skuId) || skus[0];
}

function findRecommendationForSku(sku, recommendations = buildSkuRecommendations(DataStore.skus || [])) {
  if (!sku) return null;
  return recommendations.find(item => item.skuId === sku.id) || null;
}

function getSkuPlatforms(sku) {
  const platforms = [sku.domesticSource, 'Qoo10 JP'];
  (DataStore.trendSignals || []).forEach(signal => {
    const relatedToSku = (signal.relatedSkuIds || []).includes(sku.id)
      || signal.skuName === sku.name
      || signal.brand === sku.brand
      || (sku.ingredientTags || []).includes(signal.ingredient);
    if (relatedToSku && signal.platform) platforms.push(signal.platform);
  });
  if (sku.shopeeSearchUrl) platforms.push('Shopee TW');
  return [...new Set(platforms.filter(Boolean))];
}

function renderCategoryRail() {
  return `
    <div class="category-rail" id="sku-category-rail">
      ${SKU_CATEGORIES.map((cat, index) => `
        <button class="category-pill ${index === 0 ? 'active' : ''}" data-category="${cat.key}">
          <span class="category-pill-icon">${cat.icon}</span>
          <span>${cat.key}</span>
        </button>
      `).join('')}
    </div>
  `;
}

function renderProductControls() {
  return `
    <div class="search-wrapper">
      <span class="search-icon">🔍</span>
      <input type="text" class="search-input" id="sku-search" placeholder="제품명, 브랜드, 성분, 트렌드 검색...">
    </div>

    <div class="filter-bar" id="sku-filters">
      <select class="filter-select" id="sku-filter-week">
        ${WEEK_OPTIONS.map(w => `<option value="${w}">주차: ${w}</option>`).join('')}
      </select>
      <select class="filter-select" id="sku-filter-platform">
        <option value="전체">플랫폼: 전체</option>
        <option value="올리브영">올리브영</option>
        <option value="무신사뷰티">무신사뷰티</option>
        <option value="다이소">다이소</option>
        <option value="Qoo10 JP">Qoo10 JP</option>
        <option value="Shopee TW">Shopee TW</option>
      </select>
      <select class="filter-select" id="sku-filter-status">
        <option value="전체">상태: 전체</option>
        <option value="트렌드">트렌드</option>
        <option value="스테디">스테디</option>
        <option value="시즌성">시즌성</option>
      </select>
      <select class="filter-select" id="sku-filter-score">
        <option value="0">인기점수: 전체</option>
        <option value="60">60점 이상</option>
        <option value="75">75점 이상</option>
        <option value="85">85점 이상</option>
      </select>
    </div>
  `;
}

function renderPopularityScalePanel() {
  const rows = [
    ['ranking', '플랫폼 랭킹', '올리브영/무신사/Qoo10 상위 노출'],
    ['reactions', '조회·댓글 반응', '콘텐츠 조회수, 댓글, 리뷰 언급'],
    ['sales', '예상 판매량', '리뷰 수, 판매량, 샵 운영 규모'],
    ['offline', '오프라인 신호', '명동/성수/홍대 진열, 품절, 관광객 반응'],
    ['margin', '마진 가능성', '국내 소싱가와 해외 판매가 차이'],
    ['competition', '경쟁 강도', '경쟁 판매자 수가 낮을수록 가점']
  ];

  return `
    <div class="card popularity-panel">
      <div class="flex-between mb-16">
        <div>
          <div class="card-title" style="margin-bottom:4px;">📊 인기 판단 기준</div>
          <div class="card-meta">대표님 기준에 맞게 가중치를 조정하면 제품 카드의 인기점수가 다시 계산됩니다.</div>
        </div>
        <button class="btn btn-outline" id="reset-popularity-scale">기본값</button>
      </div>
      <div class="scale-grid">
        ${rows.map(([key, label, desc]) => `
          <label class="scale-row">
            <span>
              <strong>${label}</strong>
              <em>${desc}</em>
            </span>
            <input type="range" min="0" max="40" value="${DEFAULT_WEIGHTS[key]}" data-weight="${key}">
            <b data-weight-value="${key}">${DEFAULT_WEIGHTS[key]}%</b>
          </label>
        `).join('')}
      </div>
    </div>
  `;
}

function normalizeSku(sku) {
  const category = toMajorCategory(sku.category);
  const marginText = sku.estimatedMargin || sku.margin || '';
  return {
    ...sku,
    majorCategory: category,
    image: sku.image || sku.imageUrl,
    ingredients: sku.ingredients || sku.ingredientTags || [],
    margin: marginText,
    domesticPriceText: formatPrice(sku.domesticPrice, 'KRW'),
    qoo10PriceText: formatPrice(sku.qoo10Price, sku.qoo10Currency || 'JPY'),
    links: buildSkuLinks(sku),
    weeklyHistory: sku.weeklyHistory || buildFallbackWeeklyHistory(sku),
    pros: sku.pros || buildPros(sku),
    cons: sku.cons || buildCons(sku)
  };
}

function toMajorCategory(category) {
  if (!category) return '스킨케어';
  if (['세럼', '세럼/앰플', '토너', '패드', '에센스'].includes(category)) return '스킨케어';
  if (category === '선크림') return '선케어';
  if (category === '클렌징') return '클렌징/필링';
  if (['립', '베이스', '향수', '아이메이크업', '바디케어', '헤어케어', '디바이스', '헬스/푸드', '쉐이빙/제모'].includes(category)) return category;
  return category;
}

function formatPrice(value, currency) {
  if (value === undefined || value === null || value === '') return '—';
  if (currency === 'JPY') return `¥${Number(value).toLocaleString('ja-JP')}`;
  return `₩${Number(value).toLocaleString('ko-KR')}`;
}

function buildSkuLinks(sku) {
  const links = [];
  if (sku.domesticUrl) links.push({ label: sku.domesticSource || '국내 소싱처', url: sku.domesticUrl });
  if (sku.qoo10SearchUrl) links.push({ label: 'Qoo10 검색', url: sku.qoo10SearchUrl });
  if (sku.shopeeSearchUrl) links.push({ label: 'Shopee 검색', url: sku.shopeeSearchUrl });
  if (sku.notionLink) links.push({ label: 'Notion DB', url: sku.notionLink });
  if (sku.driveLink) links.push({ label: 'Drive 자료', url: sku.driveLink });
  return links;
}

function buildFallbackWeeklyHistory(sku) {
  const base = sku.status === '트렌드' ? '급상승 신호' : sku.status === '시즌성' ? '시즌성 관찰' : '반복 노출';
  return [
    { week: '2026-W27', summary: `${base}: ${sku.domesticSource || '국내 채널'}에서 ${sku.category || '제품'} 후보로 관찰`, signal: sku.status || '관찰' },
    { week: '2026-W28', summary: `Qoo10 경쟁 페이지 ${sku.competitorCount || 0}개 확인, 가격/쿠폰 구조 비교 필요`, signal: '경쟁분석' },
    { week: '2026-W29', summary: `오프라인 마지막 확인일 ${sku.lastOfflineCheck || '미확인'}, 명동/성수/홍대 재확인 권장`, signal: '현장확인' }
  ];
}

function buildPros(sku) {
  const pros = [];
  if (sku.status === '트렌드') pros.push('최근 트렌드 신호가 강해 테스트 등록 후보로 적합');
  if (sku.status === '스테디') pros.push('반복 노출되는 스테디 후보라 누적 판매 판단에 유리');
  if ((sku.estimatedMargin || '').includes('10')) pros.push('마진 가능성이 비교적 좋아 단품/세트 테스트 여지 있음');
  if ((sku.ingredientTags || []).length) pros.push(`${sku.ingredientTags.join(', ')} 성분/키워드로 상세페이지 카피 확장 가능`);
  return pros.length ? pros : ['제품 사진과 판매 링크가 있어 비교 조사 시작이 쉬움'];
}

function buildCons(sku) {
  const cons = [];
  if ((sku.competitorCount || 0) >= 35) cons.push('경쟁 판매자가 많아 가격 경쟁과 상세페이지 차별화가 필요');
  if ((sku.estimatedMargin || '').startsWith('5')) cons.push('마진 폭이 얇아 세트 구성이나 쿠폰 전략 검토 필요');
  if (!sku.notionLink) cons.push('Notion 상세 DB 연결이 아직 없어 누적 기록 보강 필요');
  return cons.length ? cons : ['규제 표현과 해외 리뷰 반응은 추가 확인 필요'];
}

function calculatePopularityScore(sku, weights) {
  const marginNum = parseFloat(sku.margin) || 0;
  const competitorCount = Number(sku.competitorCount || 0);
  const rankingScore = sku.status === '트렌드' ? 92 : sku.status === '스테디' ? 78 : 66;
  const reactionScore = Math.min(95, 55 + (sku.ingredients.length * 8) + (sku.status === '트렌드' ? 18 : 8));
  const salesScore = Math.min(95, 50 + Math.max(0, 45 - competitorCount / 2));
  const offlineScore = sku.lastOfflineCheck ? 76 : 40;
  const marginScore = Math.min(95, marginNum * 7);
  const competitionScore = Math.max(30, 100 - competitorCount);
  const totalWeight = Object.values(weights).reduce((sum, value) => sum + Number(value), 0) || 1;

  return Math.round((
    rankingScore * weights.ranking +
    reactionScore * weights.reactions +
    salesScore * weights.sales +
    offlineScore * weights.offline +
    marginScore * weights.margin +
    competitionScore * weights.competition
  ) / totalWeight);
}

function getCurrentWeights(container) {
  const weights = { ...DEFAULT_WEIGHTS };
  container.querySelectorAll('[data-weight]').forEach(input => {
    weights[input.dataset.weight] = Number(input.value);
  });
  return weights;
}

function renderSkuCards(skus, recommendations = []) {
  if (skus.length === 0) {
    return '<p class="text-center" style="grid-column:1/-1;color:var(--text-muted);padding:40px;">제품 데이터가 없습니다.</p>';
  }

  return skus.map(original => {
    const sku = normalizeSku(original);
    const recommendation = findRecommendationForSku(sku, recommendations);
    const isFav = DataStore.isFavorite(sku.id);
    const statusClass = sku.status === '트렌드' ? 'tag-trend'
      : sku.status === '스테디' ? 'tag-steady'
      : sku.status === '시즌성' ? 'tag-season' : 'tag-hot';
    const tagsHtml = sku.ingredients.map(ing => `<span class="tag tag-ingredient">${ing}</span>`).join('');
    const linksHtml = sku.links.slice(0, 3).map(l =>
      `<a href="${l.url}" target="_blank" class="ext-link" onclick="event.stopPropagation();">🔗 ${l.label}</a>`
    ).join('');
    const img = renderSkuImage(sku, 'sku-card-image');

    return `
      <div class="card sku-card"
           data-sku-id="${sku.id}"
           data-name="${(sku.name || '').toLowerCase()}"
           data-brand="${(sku.brand || '').toLowerCase()}"
           data-category="${sku.majorCategory}"
           data-status="${sku.status || ''}"
           data-platforms="${getSkuPlatforms(sku).join('|')}"
           data-week="${sku.weeklyHistory.map(w => w.week).join('|')}"
           data-score="0">
        ${img}
        <button class="sku-card-fav ${isFav ? 'active' : ''}" data-sku-id="${sku.id}" onclick="event.stopPropagation();">
          ${isFav ? '❤️' : '🤍'}
        </button>
        <div class="sku-card-brand">${sku.brand || ''}</div>
        <div class="sku-card-name">${sku.name || '—'}</div>
        <div class="sku-card-category">${sku.majorCategory} · ${sku.category || ''}</div>
        <div>${tagsHtml}</div>
        <div class="sku-card-prices">
          <span class="sku-card-price-label">국내가</span>
          <span class="sku-card-price-value">${sku.domesticPriceText}</span>
          <span class="sku-card-price-label">Qoo10가</span>
          <span class="sku-card-price-value">${sku.qoo10PriceText}</span>
        </div>
        <div class="sku-score-row">
          <span class="sku-score-badge">인기점수 <b data-score-label="${sku.id}">${recommendation?.trendScore || 0}</b></span>
          <span class="tag ${statusClass}">${sku.status || '관찰'}</span>
        </div>
        <div class="sku-card-links">${linksHtml}</div>
        <div class="sku-card-footer">
          <span>경쟁 ${sku.competitorCount || 0}개</span>
          <span>${sku.lastOfflineCheck || '현장 미확인'}</span>
        </div>
        <button class="btn btn-primary sku-detail-button" data-sku-id="${sku.id}" onclick="event.stopPropagation();">상세 분석</button>
      </div>`;
  }).join('');
}

function renderProductDetailPanel(originalSku, recommendation = findRecommendationForSku(originalSku)) {
  const sku = normalizeSku(originalSku);
  const historyHtml = sku.weeklyHistory.map(item => `
    <div class="detail-history-item">
      <strong>${item.week}</strong>
      <span>${item.signal}</span>
      <p>${item.summary}</p>
    </div>
  `).join('');
  const prosHtml = sku.pros.map(item => `<li>${item}</li>`).join('');
  const consHtml = sku.cons.map(item => `<li>${item}</li>`).join('');
  const linksHtml = sku.links.map(l => `<a href="${l.url}" target="_blank" class="btn btn-outline">🔗 ${l.label}</a>`).join('');

  return `
    <div class="card product-detail-panel">
      <div class="product-detail-media">
        ${renderSkuImage(sku, 'product-detail-image')}
      </div>
      <div class="product-detail-body">
        <div class="product-detail-eyebrow">${sku.brand || ''} · ${sku.majorCategory}</div>
        <h2>${sku.name || '—'}</h2>
        <p class="product-detail-summary">
          ${sku.status || '관찰'} SKU입니다. ${sku.ingredients.join(', ') || '주요 성분'} 키워드와
          ${sku.domesticSource || '국내 채널'} 소싱, Qoo10 경쟁 페이지를 함께 추적합니다.
        </p>
        <div class="product-detail-links">${linksHtml}</div>
        ${renderRecommendationEvidence(recommendation)}
        <div class="detail-grid">
          <div>
            <h3>장점</h3>
            <ul>${prosHtml}</ul>
          </div>
          <div>
            <h3>단점/주의</h3>
            <ul>${consHtml}</ul>
          </div>
        </div>
        <div class="detail-history">
          <h3>주차별 추천/관찰 이력</h3>
          ${historyHtml}
        </div>
      </div>
    </div>
  `;
}

function renderRecommendationEvidence(recommendation) {
  if (!recommendation) return '';

  const breakdown = Object.entries(recommendation.scoreBreakdown || {})
    .map(([key, value]) => `<span class="tag tag-ingredient">${key}: ${value}</span>`)
    .join('');
  const missing = (recommendation.missingEvidence || [])
    .map(item => `<li>${item}</li>`)
    .join('');

  return `
    <div class="recommendation-evidence">
      <h3>추천 근거</h3>
      <div class="sku-score-row">${breakdown}</div>
      <p class="product-detail-summary">${recommendation.recommendationReason}</p>
      ${missing ? `<h3>부족한 근거</h3><ul>${missing}</ul>` : ''}
      <h3>다음 검증 액션</h3>
      <p class="product-detail-summary">${recommendation.nextAction}</p>
    </div>
  `;
}

function renderSkuImage(sku, className) {
  if (!sku.image) {
    return `<div class="${className} image-fallback">이미지 확인 필요</div>`;
  }

  return `<img class="${className}" src="${sku.image}" alt="${sku.name || ''}" onerror="this.outerHTML='<div class=&quot;${className} image-fallback&quot;>이미지 확인 필요</div>'">`;
}

function bindSkuEvents(container) {
  container.querySelectorAll('.sku-card-fav').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const skuId = btn.dataset.skuId;
      DataStore.toggleFavorite(skuId);
      const isFav = DataStore.isFavorite(skuId);
      btn.classList.toggle('active', isFav);
      btn.textContent = isFav ? '❤️' : '🤍';
    });
  });

  container.querySelectorAll('.sku-detail-button').forEach(btn => {
    btn.addEventListener('click', () => {
      const sku = (DataStore.skus || []).find(item => item.id === btn.dataset.skuId);
      const detail = container.querySelector('#sku-detail-panel');
      if (sku && detail) {
        detail.innerHTML = renderProductDetailPanel(sku);
        detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  container.querySelectorAll('.category-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.category-pill').forEach(item => item.classList.remove('active'));
      btn.classList.add('active');
      applySkuFilters(container);
    });
  });

  ['sku-search', 'sku-filter-week', 'sku-filter-platform', 'sku-filter-status', 'sku-filter-score'].forEach(id => {
    const el = container.querySelector(`#${id}`);
    if (el) el.addEventListener('input', () => applySkuFilters(container));
    if (el) el.addEventListener('change', () => applySkuFilters(container));
  });

  container.querySelectorAll('[data-weight]').forEach(input => {
    input.addEventListener('input', () => {
      const label = container.querySelector(`[data-weight-value="${input.dataset.weight}"]`);
      if (label) label.textContent = `${input.value}%`;
      updateSkuScores(container);
      applySkuFilters(container);
    });
  });

  const reset = container.querySelector('#reset-popularity-scale');
  if (reset) {
    reset.addEventListener('click', () => {
      Object.entries(DEFAULT_WEIGHTS).forEach(([key, value]) => {
        const input = container.querySelector(`[data-weight="${key}"]`);
        const label = container.querySelector(`[data-weight-value="${key}"]`);
        if (input) input.value = value;
        if (label) label.textContent = `${value}%`;
      });
      updateSkuScores(container);
      applySkuFilters(container);
    });
  }
}

function updateSkuScores(container) {
  const weights = getCurrentWeights(container);
  (DataStore.skus || []).forEach(original => {
    const sku = normalizeSku(original);
    const score = calculatePopularityScore(sku, weights);
    const card = container.querySelector(`.sku-card[data-sku-id="${sku.id}"]`);
    const label = container.querySelector(`[data-score-label="${sku.id}"]`);
    if (card) card.dataset.score = score;
    if (label) label.textContent = score;
  });
}

function syncSkuDetailWithFilters(container) {
  const detail = container.querySelector('#sku-detail-panel');
  if (!detail) return;

  const firstVisibleCard = container.querySelector('.sku-card:not(.hidden)');
  if (!firstVisibleCard) {
    detail.innerHTML = `
      <div class="card product-detail-panel product-detail-empty">
        <div class="product-detail-media"><div class="image-fallback">제품 없음</div></div>
        <div class="product-detail-body">
          <div class="product-detail-eyebrow">필터 결과</div>
          <h2>조건에 맞는 추천 제품이 없습니다</h2>
          <p class="product-detail-summary">이 카테고리는 아직 SKU DB에 제품이 부족합니다. 소싱 후보를 추가하면 이 영역에 바로 추천 제품이 표시됩니다.</p>
        </div>
      </div>
    `;
    return;
  }

  const platform = container.querySelector('#sku-filter-platform')?.value || '전체';
  const market = detectMarketFromPlatform(platform);
  const sku = (DataStore.skus || []).find(item => item.id === firstVisibleCard.dataset.skuId);
  if (sku) {
    const recommendations = buildSkuRecommendations(DataStore.skus || [], market);
    const recommendation = findRecommendationForSku(sku, recommendations);
    detail.innerHTML = renderProductDetailPanel(sku, recommendation);
  }
}

function applySkuFilters(container) {
  const query = (container.querySelector('#sku-search')?.value || '').toLowerCase().trim();
  const activeCategory = container.querySelector('.category-pill.active')?.dataset.category || '전체';
  const week = container.querySelector('#sku-filter-week')?.value || '전체';
  const platform = container.querySelector('#sku-filter-platform')?.value || '전체';
  const status = container.querySelector('#sku-filter-status')?.value || '전체';
  const minScore = Number(container.querySelector('#sku-filter-score')?.value || 0);

  container.querySelectorAll('.sku-card').forEach(card => {
    const name = card.dataset.name || '';
    const brand = card.dataset.brand || '';
    const category = card.dataset.category || '';
    const platforms = card.dataset.platforms || '';
    const weeks = card.dataset.week || '';
    const cardStatus = card.dataset.status || '';
    const score = Number(card.dataset.score || 0);
    let visible = true;

    if (query && !name.includes(query) && !brand.includes(query)) visible = false;
    if (activeCategory !== '전체' && category !== activeCategory) visible = false;
    if (week !== '전체' && !weeks.includes(week)) visible = false;
    if (platform !== '전체' && !platforms.includes(platform)) visible = false;
    if (status !== '전체' && cardStatus !== status) visible = false;
    if (score < minScore) visible = false;

    card.classList.toggle('hidden', !visible);
  });

  syncSkuDetailWithFilters(container);
}
