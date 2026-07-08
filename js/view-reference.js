// ============================================================
// WIDEN — view-reference.js · 경쟁사/인플루언서 + Notion/Drive 링크 (Pages 7 & 8)
// ============================================================

// ── Page 7: 경쟁사/인플루언서 ──

function renderReferenceView() {
  const container = document.getElementById('view-reference');
  if (!container) return;

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">📋 경쟁페이지 분석</h1>
      <p class="page-subtitle">경쟁사 판매페이지의 제목, 이미지, 색감, 배치, 상세 문구를 분석해 성공공식으로 저장합니다.</p>
    </div>

    <!-- Section 1: 경쟁사 레퍼런스 -->
    ${renderCompetitorSection()}

    <!-- Section 2: 인플루언서 레퍼런스 -->
    ${renderInfluencerSection()}

    <!-- Section 3: MD 리포트 템플릿 -->
    ${renderRefMdTemplate()}
  `;

  bindRefEvents(container);
}

function renderCompetitorSection() {
  const competitors = [
    {
      name: 'K-Beauty Official',
      platform: 'Qoo10 JP',
      observations: ['세트 구성 중심 판매 전략', '쿠폰 + 타임세일 적극 활용', '리뷰 수 3,000+ 확보'],
      link: 'https://www.qoo10.jp/shop/oliveyoungglobal'
    },
    {
      name: 'Seoul Cosmetics JP',
      platform: 'Qoo10 JP',
      observations: ['신제품 빠른 입점 (출시 후 1주 이내)', '일본어 네이티브 상세페이지', '인플루언서 콜라보 기획전'],
      link: 'https://www.qoo10.jp/shop/beautitopping'
    },
    {
      name: 'OLIVE YOUNG Global',
      platform: 'Qoo10 JP / 자사몰',
      observations: ['올리브영 랭킹 활용 마케팅', '대량 SKU 운영 (500+)', '공식 브랜드 인증 강조'],
      link: 'https://www.qoo10.jp/shop/oliveyoungglobal'
    },
    {
      name: 'Shopee TW K-Beauty Search',
      platform: 'Shopee TW',
      observations: ['대만 가격/번들 기준 확인', '중국어 제목 키워드 수집', '무료배송·쿠폰 구조 비교'],
      link: 'https://shopee.tw/search?keyword=kbeauty%20韓國美妝'
    },
    {
      name: 'Amazon JP Korean Beauty',
      platform: 'Amazon JP',
      observations: ['리뷰 사진과 별점 분포 확인', 'FBA/공식 셀러 여부 확인', '일본 소비자 클레임 표현 수집'],
      link: 'https://www.amazon.co.jp/s?k=%E9%9F%93%E5%9B%BD%E3%82%B3%E3%82%B9%E3%83%A1'
    }
  ];

  const cardsHtml = competitors.map(c => {
    const obsHtml = c.observations.map(o =>
      `<li style="font-size:13px;color:var(--text-secondary);line-height:1.8;">${o}</li>`
    ).join('');

    return `
      <div class="card">
        <div class="card-title">${c.name}</div>
        <div class="card-meta">📍 ${c.platform}</div>
        <div class="mt-8">
          <div style="font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:4px;">주요 관찰 사항</div>
          <ul style="margin-left:16px;">${obsHtml}</ul>
        </div>
        <a href="${c.link}" target="_blank" class="btn btn-outline mt-16">🔗 매장 방문</a>
      </div>`;
  }).join('');

  return `
    <div class="section-divider">
      <span class="section-divider-icon">🏢</span>
      <span class="section-divider-title">경쟁사 레퍼런스</span>
      <span class="section-divider-line"></span>
    </div>
    <div class="grid-3">${cardsHtml}</div>
  `;
}

function renderInfluencerSection() {
  const influencers = [
    {
      platformIcon: '📺',
      name: '@kbeauty_jp_review',
      platform: 'YouTube',
      contentType: '제품 리뷰 / 비교 영상',
      mentionedSkus: ['VT 리들샷', 'ANUA 어성초 토너', 'Torriden 다이브인 세럼'],
      keyExpression: '「毎日使える低刺激セラム」— 매일 사용할 수 있는 저자극 세럼',
      link: 'https://youtube.com'
    },
    {
      platformIcon: '📸',
      name: '@skincare_tokyo',
      platform: 'Instagram',
      contentType: '스킨케어 루틴 / 비포&애프터',
      mentionedSkus: ['COSRX 스네일 뮤신', 'numbuzin 3번 세럼'],
      keyExpression: '「韓国スキンケアの底力」— 한국 스킨케어의 저력',
      link: 'https://instagram.com'
    },
    {
      platformIcon: '🎵',
      name: '@cosme_trend_jp',
      platform: 'TikTok',
      contentType: '트렌드 제품 숏폼 / 1분 리뷰',
      mentionedSkus: ['TIRTIR 마스크핏 쿠션', 'rom&nd 글래스팅 틴트'],
      keyExpression: '「バズコスメ」— 버즈 코스메(입소문 화장품)',
      link: 'https://tiktok.com'
    }
  ];

  const cardsHtml = influencers.map(inf => {
    const skusHtml = inf.mentionedSkus.map(s =>
      `<span class="tag tag-ingredient">${s}</span>`
    ).join('');

    return `
      <div class="card">
        <div class="card-title">${inf.platformIcon} ${inf.name}</div>
        <div class="card-meta">${inf.platform} · ${inf.contentType}</div>
        <div class="mt-8">${skusHtml}</div>
        ${inf.keyExpression ? `<div style="font-size:12px;color:var(--accent-secondary);margin-top:8px;font-style:italic;">💬 ${inf.keyExpression}</div>` : ''}
        <a href="${inf.link}" target="_blank" class="btn btn-outline mt-16">🔗 프로필 보기</a>
      </div>`;
  }).join('');

  return `
    <div class="section-divider">
      <span class="section-divider-icon">🌟</span>
      <span class="section-divider-title">인플루언서 레퍼런스</span>
      <span class="section-divider-line"></span>
    </div>
    <div class="grid-3">${cardsHtml}</div>
  `;
}

function renderRefMdTemplate() {
  return `
    <div class="section-divider">
      <span class="section-divider-icon">📄</span>
      <span class="section-divider-title">MD 리포트 템플릿</span>
      <span class="section-divider-line"></span>
    </div>
    <div class="card">
      <p style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;">경쟁 분석 시 아래 템플릿을 복사해서 사용하세요.</p>
      <button class="btn btn-primary" id="ref-copy-md-template">📄 MD 리포트 템플릿 복사</button>
    </div>
  `;
}

function getRefMdTemplate() {
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

function bindRefEvents(container) {
  const copyBtn = container.querySelector('#ref-copy-md-template');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(getRefMdTemplate()).then(() => {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✅ 복사 완료!';
        setTimeout(() => { copyBtn.textContent = originalText; }, 2000);
      }).catch(() => {
        alert('클립보드 복사에 실패했습니다. 브라우저 권한을 확인하세요.');
      });
    });
  }
}

// ── Page 8: Notion / Drive DB ──

function renderLinksView() {
  const container = document.getElementById('view-links');
  if (!container) return;

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">🔗 데이터 관리</h1>
      <p class="page-subtitle">프로젝트 데이터베이스 및 파일 저장소 바로가기</p>
    </div>

    <div class="grid-2">
      <!-- Notion Card -->
      <div class="card">
        <div class="card-title" style="font-size:18px;">📒 Notion 데이터베이스</div>
        <p style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;">모든 운영 데이터의 원본이 관리되는 Notion 워크스페이스</p>
        <a href="https://app.notion.com/p/37744d5ca46c817db9f0e04cbf8b7c2c" target="_blank" class="btn btn-primary mb-16">🔗 Notion 열기</a>
        <div class="mt-16">
          <div style="font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:8px;">포함된 DB</div>
          <div class="season-item"><span class="season-icon">📦</span><span class="season-name">SKU DB</span></div>
          <div class="season-item"><span class="season-icon">🧪</span><span class="season-name">성분 위키</span></div>
          <div class="season-item"><span class="season-icon">🌏</span><span class="season-name">국가별 주의사항</span></div>
          <div class="season-item"><span class="season-icon">🏪</span><span class="season-name">매장 방문 로그</span></div>
          <div class="season-item"><span class="season-icon">🔍</span><span class="season-name">벤치마킹 DB</span></div>
        </div>
      </div>

      <!-- Drive Card -->
      <div class="card">
        <div class="card-title" style="font-size:18px;">📁 Google Drive 저장소</div>
        <p style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;">이미지, 문서, 스크린샷 등 파일 기반 자료 저장소</p>
        <a href="https://drive.google.com/drive/folders/10d_wFsMKYxc8lPJ9AhtU8PF-u15IHp9e" target="_blank" class="btn btn-primary mb-16">🔗 Drive 열기</a>
        <div class="mt-16">
          <div style="font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:8px;">폴더 구조</div>
          <div class="season-item"><span class="season-icon">📂</span><span class="season-name">01_SKU</span></div>
          <div class="season-item"><span class="season-icon">📂</span><span class="season-name">02_Benchmarking</span></div>
          <div class="season-item"><span class="season-icon">📂</span><span class="season-name">03_Ingredients</span></div>
          <div class="season-item"><span class="season-icon">📂</span><span class="season-name">04_Regulations</span></div>
          <div class="season-item"><span class="season-icon">📂</span><span class="season-name">05_Offline_Visits</span></div>
          <div class="season-item"><span class="season-icon">📂</span><span class="season-name">06_References</span></div>
          <div class="season-item"><span class="season-icon">📂</span><span class="season-name">07_Screenshots_Archive</span></div>
        </div>
      </div>
    </div>

    <!-- 파일명 규칙 가이드 -->
    <div class="section-divider">
      <span class="section-divider-icon">📏</span>
      <span class="section-divider-title">파일명 규칙 가이드</span>
      <span class="section-divider-line"></span>
    </div>
    <div class="card">
      <div class="card-title">📝 파일 네이밍 컨벤션</div>
      <p style="font-size:13px;color:var(--text-secondary);line-height:1.8;margin-bottom:12px;">
        모든 파일은 아래 규칙에 따라 이름을 지정합니다.
      </p>
      <div style="background:var(--bg-subtle);border-radius:8px;padding:16px;font-family:monospace;font-size:13px;line-height:1.8;">
        <div><strong>SKU 이미지:</strong> SKU_[브랜드]_[제품명]_[날짜].jpg</div>
        <div><strong>벤치마킹:</strong> BM_[셀러명]_[날짜].png</div>
        <div><strong>성분 자료:</strong> ING_[성분명]_[출처].pdf</div>
        <div><strong>규제 문서:</strong> REG_[국가코드]_[항목]_[날짜].pdf</div>
        <div><strong>매장 방문:</strong> VISIT_[매장명]_[날짜].jpg</div>
        <div><strong>스크린샷:</strong> SS_[플랫폼]_[내용]_[날짜].png</div>
      </div>
      <p style="font-size:12px;color:var(--text-muted);margin-top:8px;">
        📅 날짜 형식: YYMMDD (예: 260704) &nbsp;|&nbsp; 🔤 언더스코어(_)로 구분
      </p>
    </div>
  `;
}
