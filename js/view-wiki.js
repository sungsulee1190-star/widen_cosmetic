// ============================================================
// WIDEN — view-wiki.js · 성분 위키 + 국가별 주의사항 (Pages 4 & 5)
// ============================================================

// ── Page 4: 성분 위키 ──

function renderWikiView() {
  const container = document.getElementById('view-wiki');
  if (!container) return;

  const ingredients = DataStore.ingredients || [];
  const query = readSession('widen-wiki-query', '');

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">🧪 성분/트렌드</h1>
      <p class="page-subtitle">K-뷰티 핵심 성분 정보, 국가별 적합도, 안전/위험 표현을 확인하세요.</p>
    </div>

    ${ingredients.length === 0 ? emptyState('성분 데이터가 없습니다. data/ingredients.json 을 확인하세요.') : `
      <div class="search-wrapper">
        <span class="search-icon">🔍</span>
        <input type="search" class="search-input" id="wiki-search" value="${esc(query)}"
               placeholder="성분명, 효능, 대표 SKU, 표현 검색 — 예: PDRN / 리들샷 / 미백">
      </div>
      <div class="result-bar">
        <span class="result-count" id="wiki-result-count"></span>
        <span class="card-meta">표현(예: '미백')으로 검색하면 그 표현이 <span style="color:var(--accent-green);">안전</span>인지 <span style="color:var(--accent-red);">위험</span>인지 카드에 표시됩니다.</span>
        <p class="result-empty hidden"></p>
      </div>

      <div class="grid-2" id="wiki-grid">
        ${renderIngredientCards(ingredients)}
      </div>
    `}
  `;

  if (ingredients.length) bindWikiEvents(container);
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

const EXPR_STYLE = 'display:inline-block;padding:3px 8px;border-radius:6px;font-size:11px;font-weight:600;margin:2px;';

function renderIngredientCards(ingredients) {
  return ingredients.map(ing => {
    const suitabilityHtml = normalizeSuitability(ing.suitability).map(s =>
      `<span class="wiki-suitability-item">${s.flag} ${esc(s.country)} ${stars(s.stars)}</span>`
    ).join('');

    const skusHtml = (ing.representativeSkus || []).map(s =>
      `<span class="tag tag-ingredient">${esc(s)}</span>`
    ).join('');

    const safeHtml = (ing.safeExpressions || []).map(expr =>
      `<span class="expr-chip" data-expr="${esc(expr)}" style="${EXPR_STYLE}background:var(--accent-green-light);color:var(--accent-green);">${esc(expr)}</span>`
    ).join('');

    const dangerHtml = (ing.dangerousExpressions || []).map(expr =>
      `<span class="expr-chip" data-expr="${esc(expr)}" style="${EXPR_STYLE}background:var(--accent-red-light);color:var(--accent-red);">${esc(expr)}</span>`
    ).join('');

    // JSON 은 qoo10SearchUrl(완성된 URL)을 갖고 있는데 예전 코드는 qoo10SearchKeyword 만 읽어서 링크가 안 나왔음
    const qoo10Url = ing.qoo10SearchUrl
      || (ing.qoo10SearchKeyword ? `https://www.qoo10.jp/s/${encodeURIComponent(ing.qoo10SearchKeyword)}` : '');
    const qoo10Link = extLink(qoo10Url, 'Qoo10 검색', 'ext-link mt-8', '🔍 ');

    // 검색 대상: 성분명·정식명·설명·트렌드 이유·타겟·대표 SKU·안전/위험 표현
    // (예전엔 성분명·정식명만 → '리들샷'이나 '미백'으로 찾을 수 없었음)
    const searchText = [
      ing.name, ing.fullName, ing.description, ing.whyTrending, ing.targetCustomer,
      ...(ing.representativeSkus || []), ...(ing.safeExpressions || []), ...(ing.dangerousExpressions || [])
    ].filter(Boolean).join(' ');

    return `
      <div class="card wiki-card" data-search="${esc(searchText)}">
        <div class="wiki-card-header">
          <div class="wiki-card-icon">${esc(ing.icon || '🧪')}</div>
          <div>
            <div style="font-size:15px;font-weight:700;color:var(--text-main);">${esc(ing.name || '—')}</div>
            <div style="font-size:12px;color:var(--text-muted);">${esc(ing.fullName)}</div>
          </div>
        </div>

        ${ing.description ? `<p style="font-size:13px;color:var(--text-secondary);line-height:1.6;margin-bottom:8px;">${esc(ing.description)}</p>` : ''}
        ${ing.whyTrending ? `<p style="font-size:12px;color:var(--accent-secondary);margin-bottom:6px;">🔥 ${esc(ing.whyTrending)}</p>` : ''}
        ${ing.targetCustomer ? `<p style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">🎯 타겟: ${esc(ing.targetCustomer)}</p>` : ''}

        ${skusHtml ? `<div class="mb-8"><span style="font-size:11px;font-weight:600;color:var(--text-muted);">대표 SKU:</span> ${skusHtml}</div>` : ''}

        ${suitabilityHtml ? `<div class="wiki-suitability mb-8">${suitabilityHtml}</div>` : ''}

        ${safeHtml ? `<div class="mb-8"><div style="font-size:11px;font-weight:600;color:var(--accent-green);margin-bottom:4px;">✅ 안전 표현</div>${safeHtml}</div>` : ''}
        ${dangerHtml ? `<div class="mb-8"><div style="font-size:11px;font-weight:600;color:var(--accent-red);margin-bottom:4px;">⚠️ 위험 표현</div>${dangerHtml}</div>` : ''}

        ${qoo10Link}
      </div>`;
  }).join('');
}

function applyWikiFilter(container) {
  const query = (container.querySelector('#wiki-search')?.value || '').trim();
  writeSession('widen-wiki-query', query);
  const cards = [...container.querySelectorAll('.wiki-card')];
  let shown = 0;
  cards.forEach(card => {
    const visible = !query || matchesQuery(card.dataset.search, query);
    card.classList.toggle('hidden', !visible);
    if (visible) shown++;
    // 검색어에 걸린 표현 칩 강조 → "이 표현 써도 되나?"를 바로 확인
    card.querySelectorAll('.expr-chip').forEach(chip =>
      chip.classList.toggle('is-match', !!query && matchesQuery(chip.dataset.expr, query)));
  });
  renderResultCount(container.querySelector('#wiki-result-count'), shown, cards.length,
    `"${query}"와 일치하는 성분이 없습니다. 다른 표기(영문/한글)로도 검색해 보세요.`);
}

function bindWikiEvents(container) {
  const searchInput = container.querySelector('#wiki-search');
  if (searchInput) searchInput.addEventListener('input', () => applyWikiFilter(container));
  applyWikiFilter(container);
}

// ── Page 5: 국가별 주의사항 ──

const COUNTRY_CHECK_KEY = 'widen-country-checks';

function renderCountryView() {
  const container = document.getElementById('view-country');
  if (!container) return;

  const countries = DataStore.countries || [];
  const query = readSession('widen-country-query', '');

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">🌏 국가별 규제</h1>
      <p class="page-subtitle">일본, 대만 등 타겟 국가의 규제와 내 SKU에 걸릴 수 있는 표현 리스크를 확인하세요.</p>
    </div>

    ${countries.length === 0 ? emptyState('국가 데이터가 없습니다. data/countries.json 을 확인하세요.') : `
      <div class="search-wrapper">
        <span class="search-icon">🔍</span>
        <input type="search" class="search-input" id="country-search" value="${esc(query)}"
               placeholder="규제 항목 검색 — 예: 레티놀 / 미백 / 라벨 / 통관">
      </div>
      <div class="result-bar">
        <span class="result-count" id="country-result-count"></span>
        <span class="card-meta">✅ 판매 전 체크리스트는 이 브라우저에 저장됩니다.</span>
        <p class="result-empty hidden"></p>
      </div>
      <div class="grid-2" id="country-grid">
        ${renderCountryCards(countries)}
      </div>
    `}
  `;

  if (countries.length) bindCountryEvents(container);
}

function renderCountryCards(countries) {
  const checks = readStore(COUNTRY_CHECK_KEY, {});

  return countries.map(country => {
    const sectionsHtml = (country.sections || []).map((section, sIdx) => {
      const isChecklist = section.title && section.title.includes('체크리스트');

      if (isChecklist) {
        // countries.json 엔 code 가 없어서 예전엔 모든 나라 체크박스 id 가 'country--0' 으로 겹쳤음
        // → 대만 항목 라벨을 누르면 일본 체크박스가 체크되는 버그. id 기반으로 고유하게.
        const checkId = `country-${country.id || country.code || country.name}-${sIdx}`;
        // 체크 상태 저장 (예전엔 새로고침/메뉴 이동하면 다 풀려서 체크리스트로 쓸 수 없었음)
        const itemsHtml = (section.items || []).map((item, i) => `
          <label class="checklist-item country-rule ${checks[`${checkId}-${i}`] ? 'checked' : ''}" data-search="${esc(item)}">
            <input type="checkbox" id="${esc(checkId)}-${i}" data-check-key="${esc(checkId)}-${i}" ${checks[`${checkId}-${i}`] ? 'checked' : ''}>
            <span>${esc(item)}</span>
          </label>
        `).join('');
        return `
          <div class="mt-16 country-section">
            <div class="flex-between" style="margin-bottom:8px;">
              <div style="font-size:13px;font-weight:700;color:var(--text-main);">${esc(section.title)}</div>
              <button type="button" class="btn btn-outline country-check-reset" data-check-prefix="${esc(checkId)}-" style="padding:2px 8px;font-size:11px;">체크 초기화</button>
            </div>
            ${itemsHtml}
          </div>`;
      }

      const itemsHtml = (section.items || []).map(item =>
        `<li class="country-rule" data-search="${esc(item)}" style="font-size:13px;color:var(--text-secondary);line-height:1.8;">${esc(item)}</li>`
      ).join('');
      return `
        <div class="mt-16 country-section">
          <div style="font-size:13px;font-weight:700;color:var(--text-main);margin-bottom:8px;">${esc(section.title)}</div>
          <ul style="margin-left:16px;">${itemsHtml}</ul>
        </div>`;
    }).join('');

    return `
      <div class="card country-card">
        <div class="card-title" style="font-size:18px;">
          ${esc(country.flag || '🏳️')} ${esc(country.name || '—')}
        </div>
        ${sectionsHtml}
      </div>`;
  }).join('');
}

// 검색 시 일치하는 항목만 남기고, 일치 항목이 없는 섹션은 접음 (나라 카드는 유지 → "이 나라엔 해당 규제 없음"이 보임)
function applyCountryFilter(container) {
  const query = (container.querySelector('#country-search')?.value || '').trim();
  writeSession('widen-country-query', query);
  let shown = 0;
  const rules = [...container.querySelectorAll('.country-rule')];
  rules.forEach(rule => {
    const visible = !query || matchesQuery(rule.dataset.search, query);
    rule.classList.toggle('hidden', !visible);
    if (visible) shown++;
  });
  container.querySelectorAll('.country-section').forEach(section => {
    section.classList.toggle('hidden', !!query && !section.querySelector('.country-rule:not(.hidden)'));
  });
  container.querySelectorAll('.country-card').forEach(card => {
    let note = card.querySelector('.country-no-match');
    const none = !!query && !card.querySelector('.country-rule:not(.hidden)');
    if (none && !note) {
      note = document.createElement('p');
      note.className = 'card-meta country-no-match';
      card.appendChild(note);
    }
    if (note) {
      note.textContent = `"${query}" 관련 항목 없음`;
      note.classList.toggle('hidden', !none);
    }
  });
  renderResultCount(container.querySelector('#country-result-count'), shown, rules.length,
    `"${query}"와 일치하는 규제 항목이 없습니다.`);
  const count = container.querySelector('#country-result-count');
  if (count) count.textContent = count.textContent.replace('개', '개 항목');
}

function bindCountryEvents(container) {
  container.addEventListener('change', (e) => {
    const cb = e.target.closest('input[data-check-key]');
    if (!cb) return;
    const checks = readStore(COUNTRY_CHECK_KEY, {});
    if (cb.checked) checks[cb.dataset.checkKey] = true;
    else delete checks[cb.dataset.checkKey];
    writeStore(COUNTRY_CHECK_KEY, checks);
    cb.closest('.checklist-item')?.classList.toggle('checked', cb.checked);
  });
  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.country-check-reset');
    if (!btn) return;
    const prefix = btn.dataset.checkPrefix;
    const checks = readStore(COUNTRY_CHECK_KEY, {});
    Object.keys(checks).filter(k => k.startsWith(prefix)).forEach(k => delete checks[k]);
    writeStore(COUNTRY_CHECK_KEY, checks);
    btn.closest('.country-section').querySelectorAll('input[data-check-key]').forEach(cb => {
      cb.checked = false;
      cb.closest('.checklist-item')?.classList.remove('checked');
    });
  });
  const search = container.querySelector('#country-search');
  if (search) search.addEventListener('input', () => applyCountryFilter(container));
  applyCountryFilter(container);
}
