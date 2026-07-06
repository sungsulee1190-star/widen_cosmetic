// ============================================================
// WIDEN — view-copycat.js · Qoo10 Copycat 보드 (Page 3)
// ============================================================

function renderCopycatView() {
  const container = document.getElementById('view-copycat');
  if (!container) return;

  const shops = DataStore.copycatShops || [];

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">🔍 Qoo10 Copycat 보드</h1>
      <p class="page-subtitle">Qoo10 JP 상위 편집샵 벤치마킹, 검색어 바로가기, MD 리포트 분석 도구</p>
    </div>

    <!-- Section 1: 벤치마킹 편집샵 -->
    ${renderCopycatShops(shops)}

    <!-- Section 2: 검색어 바로가기 -->
    ${renderSearchTags()}

    <!-- Section 3: MD 리포트 분석 체크리스트 -->
    ${renderMdChecklist()}
  `;

  bindCopycatEvents(container);
}

// ── Section 1: 벤치마킹 편집샵 ──

function renderCopycatShops(shops) {
  if (shops.length === 0) return '';

  const cardsHtml = shops.map((shop, idx) => {
    const aestheticScore = shop.aestheticScore || shop.aesthetic || 0;
    const brands = shop.mainBrands || shop.brands || [];
    const starsHtml = '★'.repeat(aestheticScore) + '☆'.repeat(5 - aestheticScore);
    const brandsHtml = brands.map(b => `<span class="tag tag-ingredient">${b}</span>`).join('');
    const strengthsHtml = (shop.strengths || []).map(s => `<li style="color:var(--accent-green);"><span style="color:var(--text-secondary);">${s}</span></li>`).join('');
    const weaknessesHtml = (shop.weaknesses || []).map(w => `<li style="color:var(--accent-red);"><span style="color:var(--text-secondary);">${w}</span></li>`).join('');

    return `
      <div class="card">
        <div class="shop-card-rank">#${shop.rank || (idx + 1)}</div>
        <div class="card-title" style="font-size:16px;">${shop.name || '—'}</div>
        <div class="shop-card-type">${shop.type || ''}</div>
        <div class="mb-8">${brandsHtml}</div>
        ${shop.assortment ? `<div class="shop-card-detail">🧭 구성: ${shop.assortment}</div>` : ''}
        ${shop.marketingFeatures ? `<div class="shop-card-detail">📣 벤치마킹: ${shop.marketingFeatures}</div>` : ''}
        <div class="shop-card-stars">디자인 완성도: ${starsHtml}</div>
        ${shop.targetCustomer ? `<div class="shop-card-detail">🎯 타겟 고객: ${shop.targetCustomer}</div>` : ''}
        ${strengthsHtml ? `<div class="shop-card-detail"><strong>강점</strong><ul style="margin:4px 0 0 16px;">${strengthsHtml}</ul></div>` : ''}
        ${weaknessesHtml ? `<div class="shop-card-detail"><strong>약점</strong><ul style="margin:4px 0 0 16px;">${weaknessesHtml}</ul></div>` : ''}
        ${shop.qoo10Url ? `<a href="${shop.qoo10Url}" target="_blank" class="btn btn-outline mt-8">🔗 Qoo10 매장 보기</a>` : ''}
      </div>`;
  }).join('');

  return `
    <div class="section-divider">
      <span class="section-divider-icon">🏪</span>
      <span class="section-divider-title">벤치마킹 편집샵</span>
      <span class="section-divider-line"></span>
    </div>
    <div class="grid-3">${cardsHtml}</div>
  `;
}

// ── Section 2: 검색어 바로가기 ──

function renderSearchTags() {
  const brandKeywords = ['VT', 'ANUA', 'Torriden', 'MEDIHEAL', 'COSRX', 'rom&nd', 'TIRTIR', '마녀공장', '조선미녀', 'numbuzin'];
  const ingredientKeywords = ['PDRN', 'シカ', '毛穴', '鎮静', 'ツヤ肌', 'スピキュール', 'ヒアルロン酸', 'レチノール'];
  const categoryKeywords = ['韓国コスメ セラム', '韓国コスメ トナー', '韓国コスメ 日焼け止め', '韓国コスメ クッション'];

  function tagsRow(label, keywords) {
    const tags = keywords.map(kw =>
      `<a href="https://www.qoo10.jp/s/${encodeURIComponent(kw)}" target="_blank" class="search-tag">${kw}</a>`
    ).join('');
    return `
      <div class="mb-16">
        <div style="font-size:12px;font-weight:700;color:var(--text-muted);margin-bottom:8px;">${label}</div>
        <div>${tags}</div>
      </div>`;
  }

  return `
    <div class="section-divider">
      <span class="section-divider-icon">🔗</span>
      <span class="section-divider-title">검색어 바로가기</span>
      <span class="section-divider-line"></span>
    </div>
    <div class="card">
      ${tagsRow('브랜드', brandKeywords)}
      ${tagsRow('성분/효능 (일본어)', ingredientKeywords)}
      ${tagsRow('카테고리 (일본어)', categoryKeywords)}
    </div>
  `;
}

// ── Section 3: MD 리포트 분석 체크리스트 ──

function renderMdChecklist() {
  const checkItems = [
    '제목 첫 키워드가 핵심 검색어인가?',
    '공식/정품 표현이 포함되어 있는가?',
    '대표 이미지에 강조 문구가 있는가?',
    '세트 구성이 단품 대비 할인율을 보여주는가?',
    '쿠폰 할인이 노출되고 있는가?',
    '리뷰 수와 평점이 경쟁력 있는가?',
    '배송 옵션(Qxpress 등)이 명시되어 있는가?',
    '재구매 유도 문구가 있는가?'
  ];

  const itemsHtml = checkItems.map((item, i) => `
    <div class="checklist-item">
      <input type="checkbox" id="md-check-${i}">
      <label for="md-check-${i}">${item}</label>
    </div>
  `).join('');

  return `
    <div class="section-divider">
      <span class="section-divider-icon">📋</span>
      <span class="section-divider-title">MD 리포트 분석 체크리스트</span>
      <span class="section-divider-line"></span>
    </div>
    <div class="card">
      ${itemsHtml}
      <div class="mt-16">
        <button class="btn btn-primary" id="copy-md-template">📄 MD 리포트 템플릿 복사</button>
      </div>
    </div>
  `;
}

function getMdTemplate() {
  return `# [제품명] Qoo10 JP 경쟁 분석 MD 리포트

## 기본 정보
- 분석 날짜:
- 분석 대상 URL:
- 셀러명:

## 제목 분석
- 첫 키워드:
- 공식/정품 표현:
- 제목 전체:

## 이미지 분석
- 대표 이미지 구성:
- 강조 문구:

## 가격/쿠폰/세트
- 단품 가격:
- 세트 구성:
- 쿠폰:

## 리뷰 분석
- 리뷰 수:
- 반복 구매 이유:

## 액션 아이템
- 따라할 것:
- 변형할 것:
- 버릴 것:`;
}

function bindCopycatEvents(container) {
  const copyBtn = container.querySelector('#copy-md-template');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(getMdTemplate()).then(() => {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✅ 복사 완료!';
        setTimeout(() => { copyBtn.textContent = originalText; }, 2000);
      }).catch(() => {
        alert('클립보드 복사에 실패했습니다. 브라우저 권한을 확인하세요.');
      });
    });
  }
}
