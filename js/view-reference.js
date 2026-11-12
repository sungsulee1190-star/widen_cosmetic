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
  // 예전엔 이 목록이 코드에 하드코딩돼 있었음 → data/references.json 으로 이동 (코드 수정 없이 내용만 교체 가능)
  const competitors = (DataStore.references || {}).competitors || [];
  if (competitors.length === 0) {
    return sectionDivider('🏢', '경쟁사 레퍼런스') + emptyState('경쟁사 데이터가 없습니다. data/references.json 의 competitors 에 추가하세요.');
  }

  const cardsHtml = competitors.map(c => {
    const obsHtml = (c.observations || []).map(o =>
      `<li style="font-size:13px;color:var(--text-secondary);line-height:1.8;">${esc(o)}</li>`
    ).join('');

    return `
      <div class="card">
        <div class="card-title">${esc(c.name)}</div>
        <div class="card-meta">📍 ${esc(c.platform)}</div>
        <div class="mt-8">
          <div style="font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:4px;">주요 관찰 사항</div>
          <ul style="margin-left:16px;">${obsHtml}</ul>
        </div>
        ${extLink(c.link, '매장 방문', 'btn btn-outline mt-16')}
      </div>`;
  }).join('');

  return `
    <div class="section-divider">
      <span class="section-divider-icon">🏢</span>
      <span class="section-divider-title">경쟁사 레퍼런스</span>
      ${competitors.some(c => c.sample) ? '<span class="sample-badge" title="sample:true 인 예시 항목이 있습니다. 링크도 Qoo10 메인으로만 연결됩니다.">샘플 데이터</span>' : ''}
      <span class="section-divider-line"></span>
    </div>
    <div class="grid-3">${cardsHtml}</div>
  `;
}

function renderInfluencerSection() {
  const influencers = (DataStore.references || {}).influencers || [];
  if (influencers.length === 0) {
    return sectionDivider('🌟', '인플루언서 레퍼런스') + emptyState('인플루언서 데이터가 없습니다. data/references.json 의 influencers 에 추가하세요.');
  }

  const cardsHtml = influencers.map(inf => {
    const skusHtml = (inf.mentionedSkus || []).map(s =>
      `<span class="tag tag-ingredient">${esc(s)}</span>`
    ).join('');

    return `
      <div class="card">
        <div class="card-title">${esc(inf.platformIcon)} ${esc(inf.name)}</div>
        <div class="card-meta">${esc(inf.platform)} · ${esc(inf.contentType)}</div>
        <div class="mt-8">${skusHtml}</div>
        ${inf.keyExpression ? `<div style="font-size:12px;color:var(--accent-secondary);margin-top:8px;font-style:italic;">💬 ${esc(inf.keyExpression)}</div>` : ''}
        ${extLink(inf.link, '프로필 보기', 'btn btn-outline mt-16')}
      </div>`;
  }).join('');

  return `
    <div class="section-divider">
      <span class="section-divider-icon">🌟</span>
      <span class="section-divider-title">인플루언서 레퍼런스</span>
      ${influencers.some(i => i.sample) ? '<span class="sample-badge" title="sample:true 인 예시 항목이 있습니다. 실제 계정이 아닌 예시 핸들입니다.">샘플 데이터</span>' : ''}
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

function bindRefEvents(container) {
  bindCopyButton(container.querySelector('#ref-copy-md-template'), () => MD_REPORT_TEMPLATE);
}

// ── Page 8: Notion / Drive DB ──

// 실제 워크스페이스 주소 — 바뀌면 여기 한 곳만 수정
// 2026-11-12: 예전 주소(37744d5c…)는 404 → 실제 허브 '🧴 코스메틱 해외 판매 대시보드' 로 교체
const NOTION_URL = 'https://app.notion.com/p/38f44d5ca46c81db994ad66b684ff8bc';
const DRIVE_URL = 'https://drive.google.com/drive/folders/10d_wFsMKYxc8lPJ9AhtU8PF-u15IHp9e';

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
        ${extLink(NOTION_URL, 'Notion 열기', 'btn btn-primary mb-16')}
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
        ${extLink(DRIVE_URL, 'Drive 열기', 'btn btn-primary mb-16')}
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
