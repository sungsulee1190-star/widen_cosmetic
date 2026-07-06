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
      <h1 class="page-title">🧪 성분 위키</h1>
      <p class="page-subtitle">K-뷰티 핵심 성분 정보, 국가별 적합도, 안전/위험 표현을 확인하세요.</p>
    </div>

    <div class="search-wrapper">
      <span class="search-icon">🔍</span>
      <input type="text" class="search-input" id="wiki-search" placeholder="성분명 검색...">
    </div>

    <div class="grid-2" id="wiki-grid">
      ${renderIngredientCards(ingredients)}
    </div>
  `;

  bindWikiEvents(container);
}

function renderIngredientCards(ingredients) {
  if (ingredients.length === 0) {
    return '<p class="text-center" style="grid-column:1/-1;color:var(--text-muted);padding:40px;">성분 데이터가 없습니다.</p>';
  }

  return ingredients.map(ing => {
    // Suitability stars
    const suitabilityHtml = (ing.suitability || []).map(s => {
      const stars = '★'.repeat(s.stars || 0) + '☆'.repeat(5 - (s.stars || 0));
      return `<span class="wiki-suitability-item">${s.flag || ''} ${s.country || ''} ${stars}</span>`;
    }).join('');

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

    const qoo10Link = ing.qoo10SearchKeyword
      ? `<a href="https://www.qoo10.jp/s/${encodeURIComponent(ing.qoo10SearchKeyword)}" target="_blank" class="ext-link mt-8">🔍 Qoo10 검색</a>`
      : '';

    return `
      <div class="card wiki-card" data-name="${(ing.name || '').toLowerCase()}" data-fullname="${(ing.fullName || '').toLowerCase()}">
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
        const name = card.dataset.name || '';
        const fullName = card.dataset.fullname || '';
        const visible = !query || name.includes(query) || fullName.includes(query);
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
      <h1 class="page-title">🌏 국가별 주의사항</h1>
      <p class="page-subtitle">일본, 대만 등 타겟 국가의 규제 및 판매 시 주의사항을 확인하세요.</p>
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
    const sectionsHtml = (country.sections || []).map(section => {
      const isChecklist = section.title && section.title.includes('체크리스트');

      if (isChecklist) {
        const itemsHtml = (section.items || []).map((item, i) => `
          <div class="checklist-item">
            <input type="checkbox" id="country-${country.code || ''}-${i}">
            <label for="country-${country.code || ''}-${i}">${item}</label>
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
