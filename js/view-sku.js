// ============================================================
// WIDEN — view-sku.js · 카테고리/제품 (Page 2)
// 데이터 로직은 sku-catalog.js(SkuCatalog). 여기는 화면 상태와 렌더링만.
// ============================================================

const skuViewState = {
  products: [],
  weights: { ...SkuCatalog.DEFAULT_WEIGHTS },
  scores: {},
  criteria: { query: '', category: '전체', week: '전체', platform: '전체', status: '전체', minScore: 0 },
  selectedId: null
};

function renderSkuView() {
  const container = document.getElementById('view-sku');
  if (!container) return;

  skuViewState.products = (DataStore.skus || []).map(SkuCatalog.normalizeSku);
  skuViewState.selectedId = skuViewState.products[0]?.id || null;

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">📦 카테고리/제품</h1>
      <p class="page-subtitle">대분류별 제품, 주차별 추천 이력, 플랫폼 링크, 인기 판단 기준을 한 화면에서 관리합니다.</p>
    </div>

    ${renderCategoryRail()}
    ${renderProductControls()}
    ${renderPopularityScalePanel()}

    <div id="sku-detail-panel"></div>
    <p class="sku-result-count" id="sku-result-count"></p>
    <div class="grid-3" id="sku-grid">
      ${renderSkuCards(skuViewState.products)}
    </div>
  `;

  bindSkuEvents(container);
  refreshSkuView(container);
}

function renderCategoryRail() {
  const counts = SkuCatalog.categoryCounts(skuViewState.products);
  const esc = SkuCatalog.escapeHtml;
  return `
    <div class="category-rail" id="sku-category-rail">
      ${SkuCatalog.CATEGORIES.map(cat => `
        <button class="category-pill ${cat.key === skuViewState.criteria.category ? 'active' : ''} ${counts[cat.key] ? '' : 'is-empty'}" data-category="${esc(cat.key)}">
          <span class="category-pill-icon">${cat.icon}</span>
          <span>${esc(cat.key)}</span>
          <span class="category-pill-count">${counts[cat.key] || 0}</span>
        </button>
      `).join('')}
    </div>
  `;
}

function renderProductControls() {
  const esc = SkuCatalog.escapeHtml;
  const weeks = SkuCatalog.weekOptions(skuViewState.products);
  return `
    <div class="search-wrapper">
      <span class="search-icon">🔍</span>
      <input type="text" class="search-input" id="sku-search" placeholder="제품명, 브랜드, 성분, 트렌드 검색...">
    </div>

    <div class="filter-bar" id="sku-filters">
      <select class="filter-select" id="sku-filter-week" ${weeks.length ? '' : 'disabled title="주차별 기록이 있는 제품이 아직 없습니다"'}>
        <option value="전체">주차: 전체</option>
        ${weeks.map(w => `<option value="${esc(w)}">${esc(w)}</option>`).join('')}
      </select>
      <select class="filter-select" id="sku-filter-platform">
        <option value="전체">플랫폼: 전체</option>
        ${SkuCatalog.PLATFORMS.map(p => `<option value="${esc(p)}">${esc(p)}</option>`).join('')}
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
  return `
    <div class="card popularity-panel">
      <div class="flex-between mb-16">
        <div>
          <div class="card-title" style="margin-bottom:4px;">📊 인기 판단 기준</div>
          <div class="card-meta">항목별 중요도를 조정하면 비중(%)이 다시 계산되고 제품 카드의 인기점수가 바뀝니다.</div>
        </div>
        <button class="btn btn-outline" id="reset-popularity-scale">기본값</button>
      </div>
      <div class="scale-grid">
        ${SkuCatalog.WEIGHT_FACTORS.map(f => `
          <label class="scale-row">
            <span>
              <strong>${f.label}</strong>
              <em>${f.desc}</em>
            </span>
            <input type="range" min="0" max="40" value="${skuViewState.weights[f.key]}" data-weight="${f.key}">
            <b data-weight-value="${f.key}"></b>
          </label>
        `).join('')}
      </div>
      <p class="scale-warning hidden" id="scale-warning">모든 항목이 0이라 인기점수를 계산할 수 없습니다.</p>
    </div>
  `;
}

function statusTagClass(status) {
  return status === '트렌드' ? 'tag-trend'
    : status === '스테디' ? 'tag-steady'
    : status === '시즌성' ? 'tag-season' : 'tag-hot';
}

function marginBadgeStyle(range) {
  const mid = range ? range.mid : 0;
  const tone = mid >= 10 ? 'green' : mid >= 5 ? 'orange' : 'red';
  return `background:var(--accent-${tone}-light);color:var(--accent-${tone});`;
}

function renderSkuCards(products) {
  const esc = SkuCatalog.escapeHtml;
  if (products.length === 0) {
    return '<p class="text-center" style="grid-column:1/-1;color:var(--text-muted);padding:40px;">제품 데이터가 없습니다.</p>';
  }

  return products.map(sku => {
    const isFav = DataStore.isFavorite(sku.id);
    const tagsHtml = sku.ingredients.map(ing => `<span class="tag tag-ingredient">${esc(ing)}</span>`).join('');
    const linksHtml = sku.links.slice(0, 3).map(l =>
      `<a href="${esc(l.url)}" target="_blank" rel="noopener" class="ext-link">🔗 ${esc(l.label)}</a>`
    ).join('');
    const img = sku.image
      ? `<img class="sku-card-image" src="${esc(sku.image)}" alt="${esc(sku.name)}">`
      : `<div class="sku-card-image"></div>`;

    return `
      <div class="sku-card" data-sku-id="${esc(sku.id)}">
        ${img}
        <button class="sku-card-fav ${isFav ? 'active' : ''}" data-sku-id="${esc(sku.id)}">
          ${isFav ? '❤️' : '🤍'}
        </button>
        <div class="sku-card-brand">${esc(sku.brand)}</div>
        <div class="sku-card-name">${esc(sku.name || '—')}</div>
        <div class="sku-card-category">${esc(sku.majorCategory)} · ${esc(sku.category || '')}</div>
        <div>${tagsHtml}</div>
        <div class="sku-card-prices">
          <span class="sku-card-price-label">국내가</span>
          <span class="sku-card-price-value">${esc(sku.domesticPriceText)}</span>
          <span class="sku-card-price-label">Qoo10가</span>
          <span class="sku-card-price-value">${esc(sku.qoo10PriceText)}</span>
        </div>
        <div class="sku-score-row">
          <span class="sku-score-badge">인기점수 <b data-score-label="${esc(sku.id)}">—</b></span>
          <span class="sku-card-margin" style="${marginBadgeStyle(sku.marginRange)}">마진 ${esc(sku.margin || '—')}</span>
          <span class="tag ${statusTagClass(sku.status)}">${esc(sku.status)}</span>
        </div>
        <div class="sku-card-links">${linksHtml}</div>
        <div class="sku-card-footer">
          <span>경쟁 ${sku.competitorCount}개</span>
          <span>${esc(sku.lastOfflineCheck || '현장 미확인')}</span>
        </div>
        <button class="btn btn-primary sku-detail-button" data-sku-id="${esc(sku.id)}">상세 분석</button>
      </div>`;
  }).join('');
}

function renderProductDetailPanel(sku) {
  const esc = SkuCatalog.escapeHtml;
  const score = skuViewState.scores[sku.id];
  const historyHtml = sku.weeklyHistory.length
    ? sku.weeklyHistory.map(item => `
        <div class="detail-history-item">
          <strong>${esc(item.week)}</strong>
          <span>${esc(item.signal || '')}</span>
          <p>${esc(item.summary || '')}</p>
        </div>
      `).join('')
    : '<p class="detail-history-empty">아직 기록된 주차별 추천/관찰 이력이 없습니다. 데이터(weeklyHistory)를 추가하면 여기에 표시됩니다.</p>';
  const prosHtml = sku.pros.map(item => `<li>${esc(item)}</li>`).join('');
  const consHtml = sku.cons.map(item => `<li>${esc(item)}</li>`).join('');
  const linksHtml = sku.links.map(l => `<a href="${esc(l.url)}" target="_blank" rel="noopener" class="btn btn-outline">🔗 ${esc(l.label)}</a>`).join('');

  return `
    <div class="card product-detail-panel">
      <div class="product-detail-media">
        ${sku.image ? `<img src="${esc(sku.image)}" alt="${esc(sku.name)}">` : '<div></div>'}
      </div>
      <div class="product-detail-body">
        <div class="product-detail-eyebrow">${esc(sku.brand)} · ${esc(sku.majorCategory)}</div>
        <h2>${esc(sku.name || '—')}</h2>
        <div class="product-detail-metrics">
          <span>인기점수 <b>${score ?? '—'}</b></span>
          <span>마진 <b>${esc(sku.margin || '—')}</b></span>
          <span>국내가 <b>${esc(sku.domesticPriceText)}</b></span>
          <span>Qoo10가 <b>${esc(sku.qoo10PriceText)}</b></span>
          <span>경쟁 <b>${sku.competitorCount}개</b></span>
        </div>
        <p class="product-detail-summary">
          ${esc(sku.status)} SKU입니다. ${esc(sku.ingredients.join(', ') || '주요 성분')} 키워드와
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
          ${historyHtml}
        </div>
      </div>
    </div>
  `;
}

function bindSkuEvents(container) {
  // 카드 안 버튼은 이벤트 위임으로 처리 (카드마다 리스너를 붙이지 않음)
  container.querySelector('#sku-grid').addEventListener('click', (e) => {
    const fav = e.target.closest('.sku-card-fav');
    if (fav) {
      const skuId = fav.dataset.skuId;
      DataStore.toggleFavorite(skuId);
      const isFav = DataStore.isFavorite(skuId);
      fav.classList.toggle('active', isFav);
      fav.textContent = isFav ? '❤️' : '🤍';
      return;
    }
    const detailBtn = e.target.closest('.sku-detail-button');
    if (detailBtn) {
      skuViewState.selectedId = detailBtn.dataset.skuId;
      renderSelectedDetail(container);
      container.querySelector('#sku-detail-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  container.querySelector('#sku-category-rail').addEventListener('click', (e) => {
    const pill = e.target.closest('.category-pill');
    if (!pill) return;
    container.querySelectorAll('.category-pill').forEach(item => item.classList.toggle('active', item === pill));
    skuViewState.criteria.category = pill.dataset.category;
    refreshSkuView(container);
  });

  container.querySelector('#sku-search').addEventListener('input', (e) => {
    skuViewState.criteria.query = e.target.value;
    refreshSkuView(container);
  });

  [['sku-filter-week', 'week'], ['sku-filter-platform', 'platform'], ['sku-filter-status', 'status'], ['sku-filter-score', 'minScore']]
    .forEach(([id, key]) => {
      container.querySelector(`#${id}`).addEventListener('change', (e) => {
        skuViewState.criteria[key] = key === 'minScore' ? Number(e.target.value) : e.target.value;
        refreshSkuView(container);
      });
    });

  container.querySelectorAll('[data-weight]').forEach(input => {
    input.addEventListener('input', () => {
      skuViewState.weights[input.dataset.weight] = Number(input.value);
      refreshSkuView(container);
    });
  });

  container.querySelector('#reset-popularity-scale').addEventListener('click', () => {
    skuViewState.weights = { ...SkuCatalog.DEFAULT_WEIGHTS };
    container.querySelectorAll('[data-weight]').forEach(input => {
      input.value = skuViewState.weights[input.dataset.weight];
    });
    refreshSkuView(container);
  });
}

// 상태(가중치·필터)가 바뀔 때마다 한 번에 다시 반영: 비중 라벨 → 점수 → 카드 표시 → 상세 패널.
function refreshSkuView(container) {
  const { products, weights, criteria } = skuViewState;

  const shares = SkuCatalog.weightShares(weights);
  container.querySelectorAll('[data-weight-value]').forEach(label => {
    label.textContent = shares ? `${Math.round(shares[label.dataset.weightValue])}%` : '0%';
  });
  container.querySelector('#scale-warning').classList.toggle('hidden', !!shares);

  skuViewState.scores = {};
  let visibleCount = 0;
  products.forEach(sku => {
    const score = SkuCatalog.popularityScore(sku, weights);
    skuViewState.scores[sku.id] = score;
    const card = container.querySelector(`.sku-card[data-sku-id="${CSS.escape(sku.id)}"]`);
    if (!card) return;
    const label = card.querySelector('[data-score-label]');
    if (label) label.textContent = score ?? '—';
    const visible = SkuCatalog.matchesFilters(sku, criteria, score);
    card.classList.toggle('hidden', !visible);
    if (visible) visibleCount++;
  });

  const countEl = container.querySelector('#sku-result-count');
  countEl.textContent = products.length
    ? (visibleCount ? `${visibleCount}개 제품` : '조건에 맞는 제품이 없습니다. 필터를 바꿔보세요.')
    : '';

  // 선택된 제품이 필터에 걸려 숨겨졌으면 보이는 첫 제품으로 바꾼다.
  const isVisible = id => {
    const sku = products.find(p => p.id === id);
    return sku && SkuCatalog.matchesFilters(sku, criteria, skuViewState.scores[id]);
  };
  if (!isVisible(skuViewState.selectedId)) {
    skuViewState.selectedId = products.find(p => isVisible(p.id))?.id || null;
  }
  renderSelectedDetail(container);
}

function renderSelectedDetail(container) {
  const detail = container.querySelector('#sku-detail-panel');
  const sku = skuViewState.products.find(p => p.id === skuViewState.selectedId);
  detail.innerHTML = sku ? renderProductDetailPanel(sku) : '';
}
