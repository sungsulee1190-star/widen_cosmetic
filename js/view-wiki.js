// ============================================================
// WIDEN — view-wiki.js · 성분 위키 + 국가별 주의사항 (Pages 4 & 5)
// ============================================================

// ── Page 4: 성분 위키 ──

function renderWikiView() {
  const container = document.getElementById('view-wiki');
  if (!container) return;

  const ingredients = DataStore.ingredients || [];

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">🧪 성분/트렌드</h1>
      <p class="page-subtitle">K-뷰티 핵심 성분 정보, 국가별 적합도, 안전/위험 표현을 확인하세요.</p>
    </div>

    <div class="search-wrapper">
      <span class="search-icon">🔍</span>
      <input type="text" class="search-input" id="wiki-search" placeholder="성분명, 효능, 대표 SKU 검색...">
    </div>

    <div class="grid-2" id="wiki-grid">
      ${renderIngredientCards(ingredients)}
    </div>
  `;

  bindWikiEvents(container);
}

// ingredients.json 의 suitability 는 { japan: 5, taiwan: 4 } 객체인데
// 예전 코드는 배열로 가정하고 .map() 을 호출 → TypeError 로 '성분/트렌드' 화면 전체가 렌더되지 않았음.
// 객체/배열 둘 다 받아서 [{flag, country, stars}] 로 통일.
const COUNTRY_META = {
  japan: { flag: '🇯🇵', name: '일본' },
  taiwan: { flag: '🇹🇼', name: '대만' },
  korea: { flag: '🇰🇷', name: '한국' },
  china: { flag: '🇨🇳', name: '중국' },
  usa: { flag: '🇺🇸', name: '미국' },
};

function normalizeSuitability(suitability) {
  if (!suitability) return [];
  if (Array.isArray(suitability)) {
    return suitability.map(s => ({ flag: s.flag || '', country: s.country || '', stars: s.stars || 0 }));
  }
  return Object.entries(suitability).map(([key, score]) => ({
    flag: (COUNTRY_META[key] || {}).flag || '',
    country: (COUNTRY_META[key] || {}).name || key,
    stars: score,
  }));
}

function renderIngredientCards(ingredients) {
  if (ingredients.length === 0) {
    return '<p class="text-center" style="grid-column:1/-1;color:var(--text-muted);padding:40px;">성분 데이터가 없습니다.</p>';
  }

  return ingredients.map(ing => {
    // Suitability stars
    const suitabilityHtml = normalizeSuitability(ing.suitability).map(s =>
      `<span class="wiki-suitability-item">${s.flag} ${esc(s.country)} ${stars(s.stars)}</span>`
    ).join('');

    // Representative SKUs
    const skusHtml = (ing.representativeSkus || []).map(s =>
      `<span class="tag tag-ingredient">${s}</span>`
    ).join('');

    // Safe expressions
    const safeHtml = (ing.safeExpressions || []).map(expr =>
      `<span style="display:inline-block;padding:3px 8px;border-radius:6px;font-size:11px;font-weight:600;background:var(--accent-green-light);color:var(--accent-green);margin:2px;">${expr}</span>`
    ).join('');

    // Dangerous expressions
    const dangerHtml = (ing.dangerousExpressions || []).map(expr =>
      `<span style="display:inline-block;padding:3px 8px;border-radius:6px;font-size:11px;font-weight:600;background:var(--accent-red-light);color:var(--accent-red);margin:2px;">${expr}</span>`
    ).join('');

    // JSON 은 qoo10SearchUrl(완성된 URL)을 갖고 있는데 예전 코드는 qoo10SearchKeyword 만 읽어서 링크가 안 나왔음
    const qoo10Url = ing.qoo10SearchUrl
      || (ing.qoo10SearchKeyword ? `https://www.qoo10.jp/s/${encodeURIComponent(ing.qoo10SearchKeyword)}` : '');
    const qoo10Link = extLink(qoo10Url, 'Qoo10 검색', 'ext-link mt-8', '🔍 ');

    return `
      <div class="card wiki-card" data-search="${esc([ing.name, ing.fullName, ing.description, ing.whyTrending, ...(ing.representativeSkus || [])].filter(Boolean).join(' ').toLowerCase())}">
        <div class="wiki-card-header">
          <div class="wiki-card-icon">${ing.icon || '🧪'}</div>
          <div>
            <div style="font-size:15px;font-weight:700;color:var(--text-main);">${ing.name || '—'}</div>
            <div style="font-size:12px;color:var(--text-muted);">${ing.fullName || ''}</div>
          </div>
        </div>

        ${ing.description ? `<p style="font-size:13px;color:var(--text-secondary);line-height:1.6;margin-bottom:8px;">${ing.description}</p>` : ''}
        ${ing.whyTrending ? `<p style="font-size:12px;color:var(--accent-secondary);margin-bottom:6px;">🔥 ${ing.whyTrending}</p>` : ''}
        ${ing.targetCustomer ? `<p style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">🎯 타겟: ${ing.targetCustomer}</p>` : ''}

        ${skusHtml ? `<div class="mb-8"><span style="font-size:11px;font-weight:600;color:var(--text-muted);">대표 SKU:</span> ${skusHtml}</div>` : ''}

        ${suitabilityHtml ? `<div class="wiki-suitability mb-8">${suitabilityHtml}</div>` : ''}

        ${safeHtml ? `<div class="mb-8"><div style="font-size:11px;font-weight:600;color:var(--accent-green);margin-bottom:4px;">✅ 안전 표현</div>${safeHtml}</div>` : ''}
        ${dangerHtml ? `<div class="mb-8"><div style="font-size:11px;font-weight:600;color:var(--accent-red);margin-bottom:4px;">⚠️ 위험 표현</div>${dangerHtml}</div>` : ''}

        ${qoo10Link}
      </div>`;
  }).join('');
}

function bindWikiEvents(container) {
  const searchInput = container.querySelector('#wiki-search');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.toLowerCase().trim();
      container.querySelectorAll('.wiki-card').forEach(card => {
        // 성분명뿐 아니라 설명·대표 SKU 로도 검색 (예: '리들샷' → PDRN, 스피큘)
        const visible = !query || (card.dataset.search || '').includes(query);
        card.classList.toggle('hidden', !visible);
      });
    });
  }
}

// ── Page 5: 국가별 주의사항 ──

function renderCountryView() {
  const container = document.getElementById('view-country');
  if (!container) return;

  const countries = DataStore.countries || [];

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">🌏 국가별 규제</h1>
      <p class="page-subtitle">일본, 대만 등 타겟 국가의 규제와 내 SKU에 걸릴 수 있는 표현 리스크를 확인하세요.</p>
    </div>

    <div class="grid-2" id="country-grid">
      ${renderCountryCards(countries)}
    </div>
  `;
}

function renderCountryCards(countries) {
  if (countries.length === 0) {
    return '<p class="text-center" style="grid-column:1/-1;color:var(--text-muted);padding:40px;">국가 데이터가 없습니다.</p>';
  }

  return countries.map(country => {
    const sectionsHtml = (country.sections || []).map((section, sIdx) => {
      const isChecklist = section.title && section.title.includes('체크리스트');

      if (isChecklist) {
        // countries.json 엔 code 가 없어서 예전엔 모든 나라 체크박스 id 가 'country--0' 으로 겹쳤음
        // → 대만 항목 라벨을 누르면 일본 체크박스가 체크되는 버그. id 기반으로 고유하게.
        const checkId = `country-${country.id || country.code || country.name}-${sIdx}`;
        const itemsHtml = (section.items || []).map((item, i) => `
          <div class="checklist-item">
            <input type="checkbox" id="${checkId}-${i}">
            <label for="${checkId}-${i}">${item}</label>
          </div>
        `).join('');
        return `
          <div class="mt-16">
            <div style="font-size:13px;font-weight:700;color:var(--text-main);margin-bottom:8px;">${section.title}</div>
            ${itemsHtml}
          </div>`;
      }

      const itemsHtml = (section.items || []).map(item =>
        `<li style="font-size:13px;color:var(--text-secondary);line-height:1.8;">${item}</li>`
      ).join('');
      return `
        <div class="mt-16">
          <div style="font-size:13px;font-weight:700;color:var(--text-main);margin-bottom:8px;">${section.title || ''}</div>
          <ul style="margin-left:16px;">${itemsHtml}</ul>
        </div>`;
    }).join('');

    return `
      <div class="card">
        <div class="card-title" style="font-size:18px;">
          ${country.flag || '🏳️'} ${country.name || '—'}
        </div>
        ${sectionsHtml}
      </div>`;
  }).join('');
}
