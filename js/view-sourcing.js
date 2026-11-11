// ============================================================
// WIDEN — view-sourcing.js · 오프라인 소싱 루트 (Page 6)
// ============================================================

function renderSourcingView() {
  const container = document.getElementById('view-sourcing');
  if (!container) return;

  const routes = DataStore.sourcingRoutes || [];

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">🏪 오프라인 소싱 루트</h1>
      <p class="page-subtitle">주요 소싱 매장 루트, 방문 기록 관리, 가격·재고 확인</p>
    </div>

    <!-- 소싱 루트 카드 -->
    ${renderRouteCards(routes)}

    <!-- 방문 기록 추가 -->
    ${renderVisitForm(routes)}

    <!-- 최근 방문 기록 -->
    ${renderVisitLogs()}
  `;

  bindSourcingEvents(container, routes);
}

// ── 소싱 루트 카드 ──

function renderRouteCards(routes) {
  if (routes.length === 0) return `<div class="section-divider"><span class="section-divider-icon">🗺️</span><span class="section-divider-title">소싱 루트</span><span class="section-divider-line"></span></div>` + emptyState('소싱 루트 데이터가 없습니다. data/sourcing-routes.json 을 확인하세요. (방문 기록은 아래에서 계속 추가할 수 있습니다)');

  const cardsHtml = routes.map(route => {
    const storesHtml = (route.stores || []).map(store => `
      <div style="padding:6px 0;border-bottom:1px solid var(--bg-subtle);font-size:13px;">
        <strong>${esc(store.name || '')}</strong>
        ${store.focus ? `<span style="color:var(--text-muted);font-size:12px;"> — ${esc(store.focus)}</span>` : ''}
      </div>
    `).join('');

    const checksHtml = (route.checkItems || []).map(item =>
      `<li style="font-size:12px;color:var(--text-secondary);line-height:1.8;">${esc(item)}</li>`
    ).join('');

    return `
      <div class="card">
        <div class="card-title">${esc(route.icon || '📍')} ${esc(route.name || '—')}</div>
        ${route.purpose ? `<div class="card-meta">🎯 ${esc(route.purpose)}</div>` : ''}
        ${route.frequency ? `<div class="card-meta">📅 방문 주기: ${esc(route.frequency)}</div>` : ''}
        <div class="mt-8">${storesHtml}</div>
        ${checksHtml ? `<div class="mt-8"><strong style="font-size:12px;color:var(--text-muted);">체크 항목</strong><ul style="margin:4px 0 0 16px;">${checksHtml}</ul></div>` : ''}
      </div>`;
  }).join('');

  return `
    <div class="section-divider">
      <span class="section-divider-icon">🗺️</span>
      <span class="section-divider-title">소싱 루트</span>
      <span class="section-divider-line"></span>
    </div>
    <div class="grid-3">${cardsHtml}</div>
  `;
}

// ── 방문 기록 추가 폼 ──

function renderVisitForm(routes) {
  const routeOptions = routes.map(r =>
    `<option value="${esc(r.name)}">${esc(r.name)}</option>`
  ).join('');

  return `
    <div class="section-divider">
      <span class="section-divider-icon">📝</span>
      <span class="section-divider-title">방문 기록 추가</span>
      <span class="section-divider-line"></span>
    </div>
    <div class="card mb-24">
      <form class="visit-form" id="visit-form">
        <div class="visit-form-group">
          <label>날짜</label>
          <input type="date" id="visit-date" required>
        </div>
        <div class="visit-form-group">
          <label>루트</label>
          <select id="visit-route" required>
            <option value="">루트 선택</option>
            ${routeOptions}
          </select>
        </div>
        <div class="visit-form-group">
          <label>매장</label>
          <input type="text" id="visit-store" placeholder="매장명 입력" required>
        </div>
        <div class="visit-form-group">
          <label>SKU</label>
          <input type="text" id="visit-sku" placeholder="확인한 SKU">
        </div>
        <div class="visit-form-group">
          <label>가격</label>
          <input type="text" id="visit-price" placeholder="현장 가격">
        </div>
        <div class="visit-form-group">
          <label>재고</label>
          <select id="visit-stock">
            <option value="재고있음">재고있음</option>
            <option value="품절">품절</option>
            <option value="소량">소량</option>
          </select>
        </div>
        <div class="visit-form-group full-width">
          <label>메모</label>
          <textarea id="visit-memo" rows="2" placeholder="특이사항, 진열 위치 등"></textarea>
        </div>
        <div class="visit-form-group full-width">
          <label>사진 링크</label>
          <input type="url" id="visit-photo" placeholder="https:// Google Drive 또는 이미지 URL">
        </div>
        <div class="visit-form-group full-width">
          <button type="submit" class="btn btn-primary">📝 기록 추가</button>
        </div>
      </form>
    </div>
  `;
}

// ── 최근 방문 기록 ──

// 방문 기록은 사용자가 직접 입력한 값이라 반드시 esc() 로 이스케이프
// (예전엔 그대로 innerHTML 에 넣어서 메모에 <img onerror=…> 같은 걸 넣으면 스크립트가 실행됐음)
// 예전엔 가격·메모·사진 링크를 저장만 하고 화면에 안 보여줬음 → 함께 표시
function renderVisitLogItems(logs) {
  if (logs.length === 0) {
    return '<p style="color:var(--text-muted);font-size:13px;padding:16px 0;">아직 방문 기록이 없습니다.</p>';
  }
  return logs.map(log => {
    const stockColor = log.stock === '품절' ? 'var(--accent-red)' : log.stock === '소량' ? 'var(--accent-orange)' : 'var(--accent-green)';
    const extras = [
      log.price ? `💰 ${esc(log.price)}` : '',
      log.memo ? `📝 ${esc(log.memo)}` : '',
      extLink(log.photoLink, '사진', 'ext-link', '📷 '),
    ].filter(Boolean).join(' &nbsp;·&nbsp; ');
    return `
      <div class="visit-log-item" style="flex-wrap:wrap;">
        <span class="visit-log-date">${esc(log.date || '—')}</span>
        <span style="font-weight:600;color:var(--text-main);min-width:80px;">${esc(log.route)}</span>
        <span style="min-width:80px;">${esc(log.store)}</span>
        <span style="flex:1;">${esc(log.sku)}</span>
        <span style="font-weight:600;color:${stockColor};">${esc(log.stock)}</span>
        <button type="button" class="btn btn-outline visit-log-delete" data-log-id="${esc(log.id)}" title="이 기록 삭제" style="padding:2px 8px;font-size:11px;">삭제</button>
        ${extras ? `<div style="flex-basis:100%;font-size:12px;color:var(--text-secondary);margin-top:4px;">${extras}</div>` : ''}
      </div>`;
  }).join('');
}

function renderVisitLogs() {
  return `
    <div class="section-divider">
      <span class="section-divider-icon">📊</span>
      <span class="section-divider-title">최근 방문 기록</span>
      <span class="section-divider-line"></span>
    </div>
    <div class="flex-between" style="margin-bottom:8px;gap:12px;flex-wrap:wrap;">
      <p class="card-meta" style="margin:0;">⚠️ 방문 기록은 이 브라우저(LocalStorage)에만 저장됩니다. 다른 PC·브라우저와 공유되지 않고, 브라우저 데이터를 지우면 사라집니다. 주기적으로 CSV 로 백업하세요.</p>
      <button type="button" class="btn btn-outline" id="visit-export-csv">⬇️ CSV 내보내기</button>
    </div>
    <div class="card" id="visit-logs-container">${renderVisitLogItems(DataStore.getVisitLogs())}</div>
  `;
}

function bindSourcingEvents(container, routes) {
  const form = container.querySelector('#visit-form');
  if (!form) return;

  // 오늘 날짜 기본값 — toISOString() 은 UTC 라 한국 오전 9시 전엔 어제 날짜가 들어갔음
  const dateInput = form.querySelector('#visit-date');
  if (dateInput) dateInput.value = localDateISO();

  const logsContainer = container.querySelector('#visit-logs-container');
  const refreshLogs = () => {
    if (logsContainer) logsContainer.innerHTML = renderVisitLogItems(DataStore.getVisitLogs());
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const value = (sel) => form.querySelector(sel).value.trim();
    DataStore.addVisitLog({
      date: value('#visit-date'),
      route: value('#visit-route'),
      store: value('#visit-store'),
      sku: value('#visit-sku'),
      price: value('#visit-price'),
      stock: value('#visit-stock'),
      memo: value('#visit-memo'),
      photoLink: value('#visit-photo'),
    });

    form.reset();
    if (dateInput) dateInput.value = localDateISO();
    refreshLogs();
  });

  // CSV 내보내기 — 브라우저에만 있는 기록을 엑셀/구글 시트로 옮기거나 백업하기 위함
  const exportBtn = container.querySelector('#visit-export-csv');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const logs = DataStore.getVisitLogs();
      if (logs.length === 0) {
        alert('내보낼 방문 기록이 없습니다.');
        return;
      }
      const csv = toCSV(logs, [
        { key: 'date', label: '날짜' }, { key: 'route', label: '루트' }, { key: 'store', label: '매장' },
        { key: 'sku', label: 'SKU' }, { key: 'price', label: '가격' }, { key: 'stock', label: '재고' },
        { key: 'memo', label: '메모' }, { key: 'photoLink', label: '사진 링크' },
      ]);
      downloadText(`widen-방문기록-${localDateISO()}.csv`, csv);
    });
  }

  // 삭제 (이벤트 위임 — 목록이 다시 그려져도 동작)
  if (logsContainer) {
    logsContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.visit-log-delete');
      if (!btn) return;
      if (!confirm('이 방문 기록을 삭제할까요? 되돌릴 수 없습니다.')) return;
      DataStore.deleteVisitLog(btn.dataset.logId);
      refreshLogs();
    });
  }
}
