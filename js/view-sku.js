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

const DEFAULT_WEIGHTS = {
  ranking: 25,
  reactions: 15,
  sales: 20,
  offline: 10,
  margin: 20,
  competition: 10
};

const SKU_FILTER_KEY = 'widen-sku-filters';
const DEFAULT_SKU_FILTERS = {
  query: '', category: '전체', week: '전체', platform: '전체', status: '전체', minScore: 0, favOnly: false,
  weights: DEFAULT_WEIGHTS, selectedId: null
};

// 필터 상태 — 다른 메뉴에 갔다 와도 유지 (예전엔 화면을 다시 그릴 때마다 검색어·필터·가중치가 전부 초기화됐음)
function getSkuFilterState() {
  const saved = readSession(SKU_FILTER_KEY, {});
  return { ...DEFAULT_SKU_FILTERS, ...saved, weights: { ...DEFAULT_WEIGHTS, ...(saved.weights || {}) } };
}

function saveSkuFilterState(patch) {
  writeSession(SKU_FILTER_KEY, { ...getSkuFilterState(), ...patch });
}

// 값 → 개수 (필터 옵션 옆 숫자용)
function countBy(items, fn) {
  const counts = {};
  items.forEach(item => [].concat(fn(item)).forEach(k => { if (k) counts[k] = (counts[k] || 0) + 1; }));
  return counts;
}

function renderSkuView() {
  const container = document.getElementById('view-sku');
  if (!container) return;

  const skus = (DataStore.skus || []).map(normalizeSku);
  const state = getSkuFilterState();
  const selectedSku = skus.find(s => s.id === state.selectedId) || skus[0];

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">📦 카테고리/제품</h1>
      <p class="page-subtitle">대분류별 제품, 주차별 추천 이력, 플랫폼 링크, 인기 판단 기준을 한 화면에서 관리합니다.</p>
    </div>

    ${skus.length === 0 ? emptyState('제품 데이터가 없습니다. data/sku-list.json 을 확인하세요.') : `
      ${renderCategoryRail(skus, state)}
      ${renderProductControls(skus, state)}
      ${renderPopularityScalePanel(state)}

      <div id="sku-detail-panel">
        ${selectedSku ? renderProductDetailPanel(selectedSku) : ''}
      </div>

      <div class="result-bar">
        <span class="result-count" id="sku-result-count"></span>
        <button class="btn btn-outline" id="sku-reset-filters" type="button">필터 초기화</button>
        <p class="result-empty hidden"></p>
      </div>
      <div class="grid-3" id="sku-grid">
        ${renderSkuCards(skus, selectedSku)}
      </div>
    `}
  `;

  if (skus.length === 0) return;
  bindSkuEvents(container);
  updateSkuScores(container);
  applySkuFilters(container);
}

// 카테고리 버튼에 개수 표시 + 0개인 카테고리는 흐리게
// (예전엔 '향수'처럼 제품이 0개인 카테고리를 눌러도 아무 안내 없이 빈 화면만 나왔음)
function renderCategoryRail(skus, state) {
  const counts = countBy(skus, s => s.majorCategory);
  // 데이터에 있는데 SKU_CATEGORIES 목록에 없는 카테고리도 버튼으로 추가 (안 그러면 그 제품은 '전체'에서만 보임)
  const extra = Object.keys(counts)
    .filter(k => !SKU_CATEGORIES.some(c => c.key === k))
    .map(k => ({ key: k, icon: '📦' }));
  return `
    <div class="category-rail" id="sku-category-rail">
      ${[...SKU_CATEGORIES, ...extra].map(cat => {
        const count = cat.key === '전체' ? skus.length : (counts[cat.key] || 0);
        return `
        <button type="button" class="category-pill ${state.category === cat.key ? 'active' : ''} ${count === 0 ? 'is-empty' : ''}"
                data-category="${esc(cat.key)}" title="${count === 0 ? '아직 등록된 제품 없음' : `${count}개`}">
          <span class="category-pill-icon">${cat.icon}</span>
          <span>${esc(cat.key)}</span>
          <span class="pill-count">${count}</span>
        </button>`;
      }).join('')}
    </div>
  `;
}

// 필터 옵션은 모두 "실제 데이터"에서 만들고 개수를 같이 보여줌
// (예전엔 플랫폼에 무신사뷰티/다이소/Shopee TW, 상태에 시즌성이 하드코딩돼 있어서 골라도 항상 0개)
function renderProductControls(skus, state) {
  const option = (value, label, selected) =>
    `<option value="${esc(value)}" ${String(selected) === String(value) ? 'selected' : ''}>${esc(label)}</option>`;

  const platformCounts = countBy(skus, getSkuPlatforms);
  const statusCounts = countBy(skus, s => s.status || '관찰');
  const weekCounts = countBy(skus, s => s.weeklyHistory.filter(w => !w.estimated).map(w => w.week));
  const weeks = Object.keys(weekCounts).sort();
  const favCount = DataStore.getFavorites().filter(id => skus.some(s => s.id === id)).length;

  return `
    <div class="search-wrapper">
      <span class="search-icon">🔍</span>
      <input type="search" class="search-input" id="sku-search" value="${esc(state.query)}"
             placeholder="제품명, 브랜드, 성분, 카테고리, 상태 검색 — 띄어쓰기로 여러 단어 (예: VT PDRN)">
    </div>

    <div class="filter-bar" id="sku-filters">
      <select class="filter-select" id="sku-filter-week" ${weeks.length ? '' : 'disabled title="실제 주차 기록(weeklyHistory)이 있는 제품이 없습니다"'}>
        ${weeks.length
          ? option('전체', '주차: 전체', state.week) + weeks.map(w => option(w, `${w} (${weekCounts[w]})`, state.week)).join('')
          : option('전체', '주차: 기록 없음', '전체')}
      </select>
      <select class="filter-select" id="sku-filter-platform">
        ${option('전체', '플랫폼: 전체', state.platform)}
        ${Object.keys(platformCounts).map(p => option(p, `${p} (${platformCounts[p]})`, state.platform)).join('')}
      </select>
      <select class="filter-select" id="sku-filter-status">
        ${option('전체', '상태: 전체', state.status)}
        ${Object.keys(statusCounts).map(s => option(s, `${s} (${statusCounts[s]})`, state.status)).join('')}
      </select>
      <select class="filter-select" id="sku-filter-score">
        ${option(0, '인기점수: 전체', state.minScore)}
        ${option(60, '60점 이상', state.minScore)}
        ${option(75, '75점 이상', state.minScore)}
        ${option(85, '85점 이상', state.minScore)}
      </select>
      <label class="filter-check">
        <input type="checkbox" id="sku-filter-fav" ${state.favOnly ? 'checked' : ''}>
        ❤️ 즐겨찾기만 <span id="sku-fav-count">(${favCount})</span>
      </label>
    </div>
  `;
}

const WEIGHT_ROWS = [
  ['ranking', '플랫폼 랭킹', '올리브영/무신사/Qoo10 상위 노출'],
  ['reactions', '조회·댓글 반응', '콘텐츠 조회수, 댓글, 리뷰 언급'],
  ['sales', '예상 판매량', '리뷰 수, 판매량, 샵 운영 규모'],
  ['offline', '오프라인 신호', '명동/성수/홍대 진열, 품절, 관광객 반응'],
  ['margin', '마진 가능성', '국내 소싱가와 해외 판매가 차이'],
  ['competition', '경쟁 강도', '경쟁 판매자 수가 낮을수록 가점']
];

function renderPopularityScalePanel(state) {
  return `
    <div class="card popularity-panel">
      <div class="flex-between mb-16">
        <div>
          <div class="card-title" style="margin-bottom:4px;">📊 인기 판단 기준</div>
          <div class="card-meta">대표님 기준에 맞게 가중치를 조정하면 제품 카드의 인기점수가 다시 계산됩니다.
            오른쪽 %는 <strong>전체 가중치 중 비중</strong>이라 합계가 항상 100%입니다.</div>
          <div class="card-meta" style="color:var(--accent-orange);">⚠️ 현재는 실제 랭킹·판매 데이터가 없어서, 상태(트렌드/스테디)·경쟁 판매자 수·마진·오프라인 확인 여부로 <strong>추정한 점수</strong>입니다.</div>
        </div>
        <button type="button" class="btn btn-outline" id="reset-popularity-scale">기본값</button>
      </div>
      <div class="scale-grid">
        ${WEIGHT_ROWS.map(([key, label, desc]) => `
          <label class="scale-row">
            <span>
              <strong>${label}</strong>
              <em>${desc}</em>
            </span>
            <input type="range" min="0" max="40" value="${Number(state.weights[key]) || 0}" data-weight="${key}">
            <b data-weight-value="${key}"></b>
          </label>
        `).join('')}
      </div>
      <p class="card-meta hidden" id="weight-zero-warning" style="color:var(--accent-red);">가중치가 모두 0이라 점수를 계산할 수 없습니다. '기본값'을 눌러 주세요.</p>
    </div>
  `;
}

// 슬라이더 값(0~40)은 상대값 → 표시는 "전체 중 비중 %"
// (예전엔 슬라이더 값을 그대로 %로 보여줘서, 다 올리면 합계가 240%가 되는 등 의미가 애매했음)
function updateWeightLabels(container) {
  const weights = getCurrentWeights(container);
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  Object.entries(weights).forEach(([key, value]) => {
    const label = container.querySelector(`[data-weight-value="${key}"]`);
    if (label) label.textContent = total ? `${Math.round(value / total * 100)}%` : '0%';
  });
  const warn = container.querySelector('#weight-zero-warning');
  if (warn) warn.classList.toggle('hidden', total > 0);
}

function normalizeSku(sku) {
  if (sku.__normalized) return sku;
  const category = toMajorCategory(sku.category);
  const marginText = sku.estimatedMargin || sku.margin || '';
  const ingredients = sku.ingredients || sku.ingredientTags || [];
  const weeklyHistory = sku.weeklyHistory && sku.weeklyHistory.length
    ? sku.weeklyHistory
    : buildFallbackWeeklyHistory(sku);
  const normalized = {
    ...sku,
    __normalized: true,
    majorCategory: category,
    image: safeUrl(sku.image || sku.imageUrl),
    ingredients,
    margin: marginText,
    domesticPriceText: formatPrice(sku.domesticPrice, 'KRW'),
    qoo10PriceText: formatPrice(sku.qoo10Price, sku.qoo10Currency || 'JPY'),
    links: buildSkuLinks(sku),
    weeklyHistory,
    pros: sku.pros || buildPros(sku),
    cons: sku.cons || buildCons(sku)
  };
  normalized.searchText = [
    sku.name, sku.brand, sku.category, category, sku.status, sku.trendType, sku.domesticSource, ...ingredients
  ].filter(Boolean).join(' ');
  return normalized;
}

function toMajorCategory(category) {
  if (!category) return '스킨케어';
  if (['세럼', '세럼/앰플', '토너', '패드', '에센스'].includes(category)) return '스킨케어';
  if (category === '선크림') return '선케어';
  if (category === '클렌징') return '클렌징/필링';
  return category; // 그 외(립, 베이스, 향수 …)는 이미 대분류 이름이므로 그대로
}

function formatPrice(value, currency) {
  if (value === undefined || value === null || value === '') return '—';
  if (currency === 'JPY') return `¥${Number(value).toLocaleString('ja-JP')}`;
  return `₩${Number(value).toLocaleString('ko-KR')}`;
}

// 이 SKU 를 실제로 볼 수 있는 플랫폼 목록 — 예전엔 모든 카드에 'Qoo10 JP' 를 무조건 붙이고
// Shopee 는 절대 안 붙여서, 플랫폼 필터가 의미가 없었음
function getSkuPlatforms(sku) {
  const platforms = [];
  if (sku.domesticSource) platforms.push(sku.domesticSource);
  if (sku.qoo10SearchUrl || sku.qoo10Price) platforms.push('Qoo10 JP');
  if (sku.shopeeSearchUrl || sku.shopeePrice) platforms.push('Shopee TW');
  (sku.platforms || []).forEach(p => platforms.includes(p) || platforms.push(p));
  return platforms;
}

function buildSkuLinks(sku) {
  const links = [];
  if (sku.domesticUrl) links.push({ label: sku.domesticSource || '국내 소싱처', url: sku.domesticUrl });
  if (sku.qoo10SearchUrl) links.push({ label: 'Qoo10 검색', url: sku.qoo10SearchUrl });
  if (sku.shopeeSearchUrl) links.push({ label: 'Shopee 검색', url: sku.shopeeSearchUrl });
  if (sku.notionLink) links.push({ label: 'Notion DB', url: sku.notionLink });
  if (sku.driveLink) links.push({ label: 'Drive 자료', url: sku.driveLink });
  return links.filter(l => safeUrl(l.url));
}

// 실제 주차 기록이 없을 때 보여주는 "추정" 이력.
// estimated:true 로 표시해서 ① 상세 패널에 '자동 생성' 이라고 밝히고 ② 주차 필터에서는 제외함
// (예전엔 모든 제품에 W27~W29 가짜 이력이 똑같이 붙어서, 주차 필터를 골라도 항상 전부 나왔음)
function buildFallbackWeeklyHistory(sku) {
  const base = sku.status === '트렌드' ? '급상승 신호' : sku.status === '시즌성' ? '시즌성 관찰' : '반복 노출';
  return [
    { week: '관찰', estimated: true, summary: `${base}: ${sku.domesticSource || '국내 채널'}에서 ${sku.category || '제품'} 후보로 관찰`, signal: sku.status || '관찰' },
    { week: '경쟁', estimated: true, summary: `Qoo10 경쟁 페이지 ${sku.competitorCount || 0}개 확인, 가격/쿠폰 구조 비교 필요`, signal: '경쟁분석' },
    { week: '현장', estimated: true, summary: `오프라인 마지막 확인일 ${sku.lastOfflineCheck || '미확인'}, 명동/성수/홍대 재확인 권장`, signal: '현장확인' }
  ];
}

function buildPros(sku) {
  const pros = [];
  if (sku.status === '트렌드') pros.push('최근 트렌드 신호가 강해 테스트 등록 후보로 적합');
  if (sku.status === '스테디') pros.push('반복 노출되는 스테디 후보라 누적 판매 판단에 유리');
  // 예전엔 문자열에 '10' 이 들어있는지로 판단 → "5~10%" 가 장점(마진 좋음)과 단점(마진 얇음)에 동시에 걸렸음
  const margin = parseMarginRange(sku.estimatedMargin || sku.margin);
  if (margin >= 10) pros.push('마진 가능성이 비교적 좋아 단품/세트 테스트 여지 있음');
  if ((sku.ingredientTags || []).length) pros.push(`${sku.ingredientTags.join(', ')} 성분/키워드로 상세페이지 카피 확장 가능`);
  return pros.length ? pros : ['제품 사진과 판매 링크가 있어 비교 조사 시작이 쉬움'];
}

function buildCons(sku) {
  const cons = [];
  if ((sku.competitorCount || 0) >= 35) cons.push('경쟁 판매자가 많아 가격 경쟁과 상세페이지 차별화가 필요');
  const margin = parseMarginRange(sku.estimatedMargin || sku.margin);
  if (margin > 0 && margin < 10) cons.push('마진 폭이 얇아 세트 구성이나 쿠폰 전략 검토 필요');
  if (!sku.notionLink) cons.push('Notion 상세 DB 연결이 아직 없어 누적 기록 보강 필요');
  return cons.length ? cons : ['규제 표현과 해외 리뷰 반응은 추가 확인 필요'];
}

function calculatePopularityScore(sku, weights) {
  // "5~10%" 를 parseFloat 하면 5 만 읽힘 → 범위 평균(7.5)으로
  const marginNum = parseMarginRange(sku.margin);
  const competitorCount = Number(sku.competitorCount || 0);
  const rankingScore = sku.status === '트렌드' ? 92 : sku.status === '스테디' ? 78 : 66;
  const reactionScore = Math.min(95, 55 + (sku.ingredients.length * 8) + (sku.status === '트렌드' ? 18 : 8));
  const salesScore = Math.min(95, 50 + Math.max(0, 45 - competitorCount / 2));
  const offlineScore = sku.lastOfflineCheck ? 76 : 40;
  const marginScore = Math.min(95, marginNum * 7);
  const competitionScore = Math.max(30, 100 - competitorCount);
  const totalWeight = Object.values(weights).reduce((sum, value) => sum + Number(value), 0);
  if (!totalWeight) return 0;

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

function renderSkuCards(skus, selectedSku) {
  return skus.map(sku => {
    const isFav = DataStore.isFavorite(sku.id);
    const statusClass = sku.status === '트렌드' ? 'tag-trend'
      : sku.status === '스테디' ? 'tag-steady'
      : sku.status === '시즌성' ? 'tag-season' : 'tag-hot';
    const tagsHtml = sku.ingredients.map(ing => `<span class="tag tag-ingredient">${esc(ing)}</span>`).join('');
    const linksHtml = sku.links.slice(0, 3).map(l => extLink(l.url, l.label)).join('');
    const img = sku.image
      ? `<img class="sku-card-image" src="${esc(sku.image)}" alt="${esc(sku.name)}" loading="lazy">`
      : `<div class="sku-card-image"></div>`;

    return `
      <div class="card sku-card ${selectedSku && selectedSku.id === sku.id ? 'is-selected' : ''}"
           data-sku-id="${esc(sku.id)}"
           data-search="${esc(sku.searchText)}"
           data-category="${esc(sku.majorCategory)}"
           data-status="${esc(sku.status || '관찰')}"
           data-platforms="${esc(getSkuPlatforms(sku).join('|'))}"
           data-week="${esc(sku.weeklyHistory.filter(w => !w.estimated).map(w => w.week).join('|'))}"
           data-score="0">
        ${img}
        <button type="button" class="sku-card-fav ${isFav ? 'active' : ''}" data-sku-id="${esc(sku.id)}"
                aria-label="${isFav ? '즐겨찾기 해제' : '즐겨찾기 추가'}" aria-pressed="${isFav}">
          ${isFav ? '❤️' : '🤍'}
        </button>
        <div class="sku-card-brand">${esc(sku.brand)}</div>
        <div class="sku-card-name">${esc(sku.name || '—')}</div>
        <div class="sku-card-category">${esc(sku.majorCategory)} · ${esc(sku.category)}</div>
        <div>${tagsHtml}</div>
        <div class="sku-card-prices">
          <span class="sku-card-price-label">국내가</span>
          <span class="sku-card-price-value">${sku.domesticPriceText}</span>
          <span class="sku-card-price-label">Qoo10가</span>
          <span class="sku-card-price-value">${sku.qoo10PriceText}</span>
        </div>
        <div class="sku-score-row">
          <span class="sku-score-badge" title="추정 점수 — 위 '인기 판단 기준' 참고">인기점수 <b data-score-label="${esc(sku.id)}">0</b></span>
          <span class="tag ${statusClass}">${esc(sku.status || '관찰')}</span>
        </div>
        <div class="sku-card-links">${linksHtml}</div>
        <div class="sku-card-footer">
          <span>경쟁 ${esc(sku.competitorCount || 0)}개</span>
          <span>${esc(sku.lastOfflineCheck ? `현장 ${sku.lastOfflineCheck}` : '현장 미확인')}</span>
        </div>
        <button type="button" class="btn btn-primary sku-detail-button" data-sku-id="${esc(sku.id)}">상세 분석</button>
      </div>`;
  }).join('');
}

function renderProductDetailPanel(originalSku) {
  const sku = normalizeSku(originalSku);
  const isEstimated = sku.weeklyHistory.every(w => w.estimated);
  const historyHtml = sku.weeklyHistory.map(item => `
    <div class="detail-history-item">
      <strong>${esc(item.week)}</strong>
      <span>${esc(item.signal)}</span>
      <p>${esc(item.summary)}</p>
    </div>
  `).join('');
  const prosHtml = sku.pros.map(item => `<li>${esc(item)}</li>`).join('');
  const consHtml = sku.cons.map(item => `<li>${esc(item)}</li>`).join('');
  const linksHtml = sku.links.map(l => extLink(l.url, l.label, 'btn btn-outline')).join('');

  return `
    <div class="card product-detail-panel">
      <div class="product-detail-media">
        ${sku.image ? `<img src="${esc(sku.image)}" alt="${esc(sku.name)}">` : '<div></div>'}
      </div>
      <div class="product-detail-body">
        <div class="product-detail-eyebrow">${esc(sku.brand)} · ${esc(sku.majorCategory)}</div>
        <h2>${esc(sku.name || '—')}</h2>
        <p class="product-detail-summary">
          ${esc(sku.status || '관찰')} SKU입니다. ${esc(sku.ingredients.join(', ') || '주요 성분')} 키워드와
          ${esc(sku.domesticSource || '국내 채널')} 소싱, Qoo10 경쟁 페이지를 함께 추적합니다.
        </p>
        <div class="product-detail-links">${linksHtml}</div>
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
          ${isEstimated ? '<p class="card-meta" style="color:var(--accent-orange);">⚠️ 실제 주차 기록(weeklyHistory)이 없어 제품 정보로 자동 생성한 체크 포인트입니다.</p>' : ''}
          ${historyHtml}
        </div>
      </div>
    </div>
  `;
}

function showSkuDetail(container, skuId, scroll) {
  const sku = (DataStore.skus || []).find(item => item.id === skuId);
  const detail = container.querySelector('#sku-detail-panel');
  if (!sku || !detail) return;
  detail.innerHTML = renderProductDetailPanel(sku);
  container.querySelectorAll('.sku-card').forEach(c => c.classList.toggle('is-selected', c.dataset.skuId === skuId));
  saveSkuFilterState({ selectedId: skuId });
  if (scroll) detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function bindSkuEvents(container) {
  const grid = container.querySelector('#sku-grid');

  // 카드 영역 클릭 처리 (이벤트 위임)
  // - ❤️ : 즐겨찾기 토글
  // - 링크 : 링크만 열고 상세는 안 바꿈
  // - 그 외 카드 아무 곳 / '상세 분석' : 상세 패널 열기 (예전엔 '상세 분석' 버튼만 동작)
  grid.addEventListener('click', (e) => {
    const fav = e.target.closest('.sku-card-fav');
    if (fav) {
      const skuId = fav.dataset.skuId;
      DataStore.toggleFavorite(skuId);
      const isFav = DataStore.isFavorite(skuId);
      fav.classList.toggle('active', isFav);
      fav.textContent = isFav ? '❤️' : '🤍';
      fav.setAttribute('aria-pressed', String(isFav));
      fav.setAttribute('aria-label', isFav ? '즐겨찾기 해제' : '즐겨찾기 추가');
      const favCount = container.querySelector('#sku-fav-count');
      if (favCount) favCount.textContent = `(${DataStore.getFavorites().length})`;
      applySkuFilters(container); // '즐겨찾기만' 보는 중이면 즉시 반영
      return;
    }
    if (e.target.closest('a')) return;
    const card = e.target.closest('.sku-card');
    if (card) showSkuDetail(container, card.dataset.skuId, !!e.target.closest('.sku-detail-button'));
  });

  container.querySelectorAll('.category-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.category-pill').forEach(item => item.classList.remove('active'));
      btn.classList.add('active');
      applySkuFilters(container);
    });
  });

  const search = container.querySelector('#sku-search');
  if (search) search.addEventListener('input', () => applySkuFilters(container));
  ['sku-filter-week', 'sku-filter-platform', 'sku-filter-status', 'sku-filter-score', 'sku-filter-fav'].forEach(id => {
    const el = container.querySelector(`#${id}`);
    if (el) el.addEventListener('change', () => applySkuFilters(container));
  });

  container.querySelectorAll('[data-weight]').forEach(input => {
    input.addEventListener('input', () => {
      updateSkuScores(container);
      applySkuFilters(container);
    });
  });

  const reset = container.querySelector('#reset-popularity-scale');
  if (reset) {
    reset.addEventListener('click', () => {
      Object.entries(DEFAULT_WEIGHTS).forEach(([key, value]) => {
        const input = container.querySelector(`[data-weight="${key}"]`);
        if (input) input.value = value;
      });
      updateSkuScores(container);
      applySkuFilters(container);
    });
  }

  const resetFilters = container.querySelector('#sku-reset-filters');
  if (resetFilters) {
    resetFilters.addEventListener('click', () => {
      const { weights, selectedId } = getSkuFilterState();
      writeSession(SKU_FILTER_KEY, { ...DEFAULT_SKU_FILTERS, weights, selectedId });
      renderSkuView();
    });
  }
}

function updateSkuScores(container) {
  updateWeightLabels(container);
  const weights = getCurrentWeights(container);
  (DataStore.skus || []).forEach(original => {
    const sku = normalizeSku(original);
    const score = calculatePopularityScore(sku, weights);
    const card = container.querySelector(`.sku-card[data-sku-id="${CSS.escape(sku.id)}"]`);
    const label = container.querySelector(`[data-score-label="${CSS.escape(sku.id)}"]`);
    if (card) card.dataset.score = score;
    if (label) label.textContent = score;
  });
}

// 필터 규칙: 모든 조건을 동시에 만족(AND)하는 카드만 표시
//  - 검색어: matchesQuery() — 띄어쓰기로 나눈 단어가 모두 포함, 대소문자·전각·띄어쓰기 무시
//  - 카테고리/주차/플랫폼/상태: 정확히 일치 (예전엔 문자열 includes 라 '올리브영' 이 '올리브영 글로벌' 에도 걸릴 수 있었음)
//  - 인기점수: 현재 가중치로 계산한 점수 ≥ 기준
//  - 즐겨찾기만: ❤️ 누른 제품만
function applySkuFilters(container) {
  const filters = {
    query: (container.querySelector('#sku-search')?.value || '').trim(),
    category: container.querySelector('.category-pill.active')?.dataset.category || '전체',
    week: container.querySelector('#sku-filter-week')?.value || '전체',
    platform: container.querySelector('#sku-filter-platform')?.value || '전체',
    status: container.querySelector('#sku-filter-status')?.value || '전체',
    minScore: Number(container.querySelector('#sku-filter-score')?.value || 0),
    favOnly: !!container.querySelector('#sku-filter-fav')?.checked,
    weights: getCurrentWeights(container),
  };
  saveSkuFilterState(filters);
  const favs = DataStore.getFavorites();

  const cards = [...container.querySelectorAll('.sku-card')];
  let shown = 0;
  cards.forEach(card => {
    const has = (attr, value) => (card.dataset[attr] || '').split('|').includes(value);
    const visible =
      (!filters.query || matchesQuery(card.dataset.search, filters.query)) &&
      (filters.category === '전체' || card.dataset.category === filters.category) &&
      (filters.week === '전체' || has('week', filters.week)) &&
      (filters.platform === '전체' || has('platforms', filters.platform)) &&
      (filters.status === '전체' || card.dataset.status === filters.status) &&
      Number(card.dataset.score || 0) >= filters.minScore &&
      (!filters.favOnly || favs.includes(card.dataset.skuId));
    card.classList.toggle('hidden', !visible);
    if (visible) shown++;
  });

  const active = [
    filters.query && `검색 "${filters.query}"`,
    filters.category !== '전체' && filters.category,
    filters.week !== '전체' && filters.week,
    filters.platform !== '전체' && filters.platform,
    filters.status !== '전체' && filters.status,
    filters.minScore > 0 && `${filters.minScore}점 이상`,
    filters.favOnly && '즐겨찾기',
  ].filter(Boolean);
  renderResultCount(
    container.querySelector('#sku-result-count'), shown, cards.length,
    `조건에 맞는 제품이 없습니다 (${active.join(' + ')}). 조건을 하나씩 풀어 보거나 '필터 초기화'를 누르세요.`
  );
  const resetBtn = container.querySelector('#sku-reset-filters');
  if (resetBtn) resetBtn.classList.toggle('hidden', active.length === 0);
}
