// ============================================================
// WIDEN — view-sku.js · 카테고리/제품 (Page 2)
// ============================================================

const SKU_CATEGORIES = [
  { key: '전체', icon: '🧴' },
  { key: '스킨케어', icon: '🧴' },
  { key: '선케어', icon: '☀️' },
  { key: '클렌징/필링', icon: '🫧' },
  { key: '향수', icon: '🧪' },
  { key: '립', icon: '💄' },
  { key: '베이스', icon: '🪞' },
  { key: '아이메이크업', icon: '🎨' },
  { key: '바디케어', icon: '🧼' },
  { key: '헤어케어', icon: '🧖' },
  { key: '디바이스', icon: '🔋' },
  { key: '헬스/푸드', icon: '🥤' }
];

function renderSkuView() {
  const container = document.getElementById('view-sku');
  if (!container) return;

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">📦 카테고리/제품 (SKU 관리)</h1>
      <p class="page-subtitle">판매 대상 제품들을 카테고리와 상태별로 필터링하고 검색합니다.</p>
    </div>

    <div class="filter-bar" style="display:flex; gap:12px; margin-bottom:20px; align-items:center; flex-wrap:wrap;">
      <div class="search-wrapper" style="flex:1; min-width: 200px; display:flex; align-items:center; background:var(--surface-card); border:1px solid var(--border-default); border-radius:8px; padding:0 12px;">
        <span class="search-icon" style="margin-right:8px;">🔍</span>
        <input type="text" class="search-input" id="sku-search" placeholder="제품명, 브랜드 검색..." style="border:none; outline:none; padding:10px 0; width:100%; font-size:13px; background:transparent;">
      </div>
      <select class="filter-select" id="sku-filter-category" style="padding: 10px 12px; border-radius:8px; border:1px solid var(--border-default); background:var(--surface-card); font-size:13px; outline:none;">
        ${SKU_CATEGORIES.map(c => `<option value="${c.key}">${c.icon} ${c.key}</option>`).join('')}
      </select>
      <select class="filter-select" id="sku-filter-status" style="padding: 10px 12px; border-radius:8px; border:1px solid var(--border-default); background:var(--surface-card); font-size:13px; outline:none;">
        <option value="전체">상태: 전체</option>
        <option value="트렌드">트렌드</option>
        <option value="스테디">스테디</option>
      </select>
    </div>

    <div class="grid-4" id="sku-grid">
      <!-- Cards rendered here -->
    </div>
  `;

  renderCards(DataStore.skus || []);
  bindSkuEvents(container);
}

function renderCards(skusToRender) {
  const grid = document.getElementById('sku-grid');
  if (!grid) return;

  if (skusToRender.length === 0) {
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 40px; color: var(--text-muted);">조건에 맞는 제품이 없습니다.</div>';
    return;
  }

  grid.innerHTML = skusToRender.map(sku => {
    const isFav = DataStore.isFavorite(sku.id);
    const formattedDomestic = sku.domesticPrice ? '₩' + Number(sku.domesticPrice).toLocaleString('ko-KR') : '—';
    const formattedQoo10 = sku.qoo10Price ? '¥' + Number(sku.qoo10Price).toLocaleString('ja-JP') : '—';
    
    return `
      <div class="card sku-card" style="padding:0; overflow:hidden; display:flex; flex-direction:column; height:100%;">
        <div class="sku-card-image" style="position:relative; height:160px; background:var(--bg-subtle);">
          ${sku.imageUrl ? `<img src="${sku.imageUrl}" alt="${sku.name}" loading="lazy" style="width:100%; height:100%; object-fit:cover;">` : ''}
          <button class="favorite-btn ${isFav ? 'active' : ''}" data-id="${sku.id}" style="position:absolute; top:8px; right:8px; background:white; border:none; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 2px 4px rgba(0,0,0,0.1);">
            ${isFav ? '❤️' : '🤍'}
          </button>
        </div>
        <div class="sku-card-content" style="padding:16px; flex:1; display:flex; flex-direction:column;">
          <div class="sku-card-meta" style="font-size:11px; color:var(--text-muted); margin-bottom:4px; display:flex; gap:8px;">
            <span style="font-weight:700;">${sku.brand || ''}</span>
            <span>${sku.category || ''}</span>
          </div>
          <div class="sku-card-title" style="font-size:14px; font-weight:700; color:var(--text-main); line-height:1.4; margin-bottom:12px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${sku.name || '이름 없음'}</div>
          
          <div class="sku-card-tags" style="margin-bottom:12px;">
            ${(sku.ingredientTags || []).map(tag => `<span class="tag tag-ingredient">${tag}</span>`).join('')}
            ${sku.status === '트렌드' ? '<span class="tag tag-trend">트렌드</span>' : ''}
            ${sku.status === '스테디' ? '<span class="tag tag-steady">스테디</span>' : ''}
          </div>
          
          <div style="flex:1;"></div>
          
          <div class="sku-card-prices" style="margin-top:auto; padding-top:12px; border-top:1px solid var(--bg-subtle); display:grid; grid-template-columns:auto 1fr; gap:4px 8px; font-size:13px; align-items:center;">
            <span style="color:var(--text-muted);">국내가</span>
            <span style="font-weight:600;">${formattedDomestic}</span>
            <span style="color:var(--text-muted);">Qoo10가</span>
            <span style="font-weight:600; color:var(--accent-primary);">${formattedQoo10}</span>
          </div>
          ${sku.estimatedMargin ? `<div style="margin-top:8px; padding:4px 8px; background:var(--accent-green-light); color:var(--accent-green); font-size:12px; font-weight:700; border-radius:6px; display:inline-block; align-self:flex-start;">마진 ${sku.estimatedMargin}</div>` : ''}
          
          <div style="margin-top: 12px; display:flex; gap:8px; flex-wrap:wrap;">
            ${sku.domesticUrl ? `<a href="${sku.domesticUrl}" target="_blank" class="ext-link" style="font-size:12px; text-decoration:none; color:var(--text-secondary); background:var(--bg-subtle); padding:4px 8px; border-radius:4px;">🔗 국내 소싱처</a>` : ''}
            ${sku.qoo10SearchUrl ? `<a href="${sku.qoo10SearchUrl}" target="_blank" class="ext-link" style="font-size:12px; text-decoration:none; color:var(--text-secondary); background:var(--bg-subtle); padding:4px 8px; border-radius:4px;">🔗 Qoo10 검색</a>` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function bindSkuEvents(container) {
  const searchInput = container.querySelector('#sku-search');
  const catSelect = container.querySelector('#sku-filter-category');
  const statusSelect = container.querySelector('#sku-filter-status');

  const applyFilters = () => {
    const term = searchInput.value.toLowerCase();
    const cat = catSelect.value;
    const status = statusSelect.value;

    const skus = DataStore.skus || [];
    const filtered = skus.filter(sku => {
      const matchSearch = (sku.name || '').toLowerCase().includes(term) || (sku.brand || '').toLowerCase().includes(term);
      const matchCat = cat === '전체' || (sku.category || '').includes(cat) || cat.includes(sku.category);
      const matchStatus = status === '전체' || sku.status === status;
      return matchSearch && matchCat && matchStatus;
    });

    renderCards(filtered);
    bindFavoriteEvents(); // Re-bind after rendering cards
  };

  searchInput.addEventListener('input', applyFilters);
  catSelect.addEventListener('change', applyFilters);
  statusSelect.addEventListener('change', applyFilters);

  bindFavoriteEvents();
}

function bindFavoriteEvents() {
  document.querySelectorAll('.favorite-btn').forEach(btn => {
    // avoid multiple bindings by cloning or ensuring it's fresh, but innerHTML replaces it so it's fresh
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // prevent card click
      const id = btn.dataset.id;
      DataStore.toggleFavorite(id);
      
      const isFav = DataStore.isFavorite(id);
      btn.classList.toggle('active', isFav);
      btn.innerHTML = isFav ? '❤️' : '🤍';
    });
  });
}
