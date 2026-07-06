// ============================================================
// WIDEN — view-sku.js · SKU 인텔리전스 (Page 2)
// ============================================================

function renderSkuView() {
  const container = document.getElementById('view-sku');
  if (!container) return;

  const skus = DataStore.skus || [];

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">📦 SKU 인텔리전스</h1>
      <p class="page-subtitle">전체 SKU 목록을 검색하고, 카테고리·상태·마진별로 필터링하세요.</p>
    </div>

    <div class="search-wrapper">
      <span class="search-icon">🔍</span>
      <input type="text" class="search-input" id="sku-search" placeholder="SKU 이름 또는 브랜드 검색...">
    </div>

    <div class="filter-bar" id="sku-filters">
      <select class="filter-select" id="sku-filter-category">
        <option value="전체">대분류: 전체</option>
        <option value="세럼">세럼</option>
        <option value="토너">토너</option>
        <option value="패드">패드</option>
        <option value="클렌징">클렌징</option>
        <option value="선크림">선크림</option>
        <option value="립">립</option>
        <option value="베이스">베이스</option>
      </select>
      <select class="filter-select" id="sku-filter-status">
        <option value="전체">상태: 전체</option>
        <option value="트렌드">트렌드</option>
        <option value="스테디">스테디</option>
        <option value="시즌성">시즌성</option>
      </select>
      <select class="filter-select" id="sku-filter-margin">
        <option value="전체">마진: 전체</option>
        <option value="5~10%">5~10%</option>
        <option value="8~12%">8~12%</option>
        <option value="10~15%">10~15%</option>
      </select>
    </div>

    <div class="grid-3" id="sku-grid">
      ${renderSkuCards(skus)}
    </div>
  `;

  bindSkuEvents(container, skus);
}

function renderSkuCards(skus) {
  if (skus.length === 0) {
    return '<p class="text-center" style="grid-column:1/-1;color:var(--text-muted);padding:40px;">SKU 데이터가 없습니다.</p>';
  }

  return skus.map(sku => {
    const isFav = DataStore.isFavorite(sku.id);
    const statusClass = sku.status === '트렌드' ? 'tag-trend'
      : sku.status === '스테디' ? 'tag-steady'
      : sku.status === '시즌성' ? 'tag-season' : 'tag-hot';

    const tagsHtml = (sku.ingredients || []).map(ing =>
      `<span class="tag tag-ingredient">${ing}</span>`
    ).join('');

    const marginNum = parseFloat(sku.margin) || 0;
    const marginColor = marginNum >= 10 ? 'var(--accent-green)' : marginNum >= 5 ? 'var(--accent-orange)' : 'var(--accent-red)';
    const marginBg = marginNum >= 10 ? 'var(--accent-green-light)' : marginNum >= 5 ? 'var(--accent-orange-light)' : 'var(--accent-red-light)';

    const img = sku.image
      ? `<img class="sku-card-image" src="${sku.image}" alt="${sku.name || ''}">`
      : `<div class="sku-card-image"></div>`;

    return `
      <div class="card sku-card"
           data-sku-id="${sku.id}"
           data-name="${(sku.name || '').toLowerCase()}"
           data-brand="${(sku.brand || '').toLowerCase()}"
           data-category="${sku.category || ''}"
           data-status="${sku.status || ''}"
           data-margin="${sku.margin || ''}"
           ${sku.domesticUrl ? `style="cursor:pointer;" onclick="window.open('${sku.domesticUrl}','_blank')"` : ''}>
        ${img}
        <button class="sku-card-fav ${isFav ? 'active' : ''}" data-sku-id="${sku.id}" onclick="event.stopPropagation();">
          ${isFav ? '❤️' : '🤍'}
        </button>
        <div class="sku-card-brand">${sku.brand || ''}</div>
        <div class="sku-card-name">${sku.name || '—'}</div>
        <div>${tagsHtml}</div>
        <div class="sku-card-prices">
          <span class="sku-card-price-label">국내가</span>
          <span class="sku-card-price-value">${sku.domesticPrice || '—'}</span>
          <span class="sku-card-price-label">Qoo10가</span>
          <span class="sku-card-price-value">${sku.qoo10Price || '—'}</span>
        </div>
        <span class="sku-card-margin" style="background:${marginBg};color:${marginColor};">마진 ${sku.margin || '—'}</span>
        <span class="tag ${statusClass}" style="margin-left:6px;">${sku.status || ''}</span>
        <div class="sku-card-footer">
          <span>경쟁사 ${sku.competitorCount || 0}개</span>
          <span>오프라인 ${sku.lastOfflineCheck || '미확인'}</span>
        </div>
      </div>`;
  }).join('');
}

function bindSkuEvents(container, skus) {
  // Favorite toggle
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

  // Search
  const searchInput = container.querySelector('#sku-search');
  const filterCategory = container.querySelector('#sku-filter-category');
  const filterStatus = container.querySelector('#sku-filter-status');
  const filterMargin = container.querySelector('#sku-filter-margin');

  function applyFilters() {
    const query = (searchInput.value || '').toLowerCase().trim();
    const category = filterCategory.value;
    const status = filterStatus.value;
    const marginRange = filterMargin.value;

    container.querySelectorAll('.sku-card').forEach(card => {
      const name = card.dataset.name || '';
      const brand = card.dataset.brand || '';
      const cat = card.dataset.category || '';
      const st = card.dataset.status || '';
      const margin = parseFloat(card.dataset.margin) || 0;

      let visible = true;

      // Search filter
      if (query && !name.includes(query) && !brand.includes(query)) visible = false;

      // Category filter
      if (category !== '전체' && cat !== category) visible = false;

      // Status filter
      if (status !== '전체' && st !== status) visible = false;

      // Margin filter
      if (marginRange !== '전체') {
        if (marginRange === '5~10%' && (margin < 5 || margin > 10)) visible = false;
        if (marginRange === '8~12%' && (margin < 8 || margin > 12)) visible = false;
        if (marginRange === '10~15%' && (margin < 10 || margin > 15)) visible = false;
      }

      card.classList.toggle('hidden', !visible);
    });
  }

  if (searchInput) searchInput.addEventListener('input', applyFilters);
  if (filterCategory) filterCategory.addEventListener('change', applyFilters);
  if (filterStatus) filterStatus.addEventListener('change', applyFilters);
  if (filterMargin) filterMargin.addEventListener('change', applyFilters);
}
