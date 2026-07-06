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
  if (routes.length === 0) return '';

  const cardsHtml = routes.map(route => {
    const storesHtml = (route.stores || []).map(store => `
      <div style="padding:6px 0;border-bottom:1px solid var(--bg-subtle);font-size:13px;">
        <strong>${store.name || ''}</strong>
        ${store.focus ? `<span style="color:var(--text-muted);font-size:12px;"> — ${store.focus}</span>` : ''}
      </div>
    `).join('');

    const checksHtml = (route.checkItems || []).map(item =>
      `<li style="font-size:12px;color:var(--text-secondary);line-height:1.8;">${item}</li>`
    ).join('');

    return `
      <div class="card">
        <div class="card-title">${route.icon || '📍'} ${route.name || '—'}</div>
        ${route.purpose ? `<div class="card-meta">🎯 ${route.purpose}</div>` : ''}
        ${route.frequency ? `<div class="card-meta">📅 방문 주기: ${route.frequency}</div>` : ''}
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
    `<option value="${r.name || ''}">${r.name || ''}</option>`
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
          <input type="text" id="visit-photo" placeholder="Google Drive 또는 이미지 URL">
        </div>
        <div class="visit-form-group full-width">
          <button type="submit" class="btn btn-primary">📝 기록 추가</button>
        </div>
      </form>
    </div>
  `;
}

// ── 최근 방문 기록 ──

function renderVisitLogs() {
  const logs = DataStore.getVisitLogs();

  const logsHtml = logs.length === 0
    ? '<p style="color:var(--text-muted);font-size:13px;padding:16px 0;">아직 방문 기록이 없습니다.</p>'
    : logs.map(log => {
        const stockColor = log.stock === '품절' ? 'var(--accent-red)' : log.stock === '소량' ? 'var(--accent-orange)' : 'var(--accent-green)';
        return `
          <div class="visit-log-item">
            <span class="visit-log-date">${log.date || '—'}</span>
            <span style="font-weight:600;color:var(--text-main);min-width:80px;">${log.route || ''}</span>
            <span style="min-width:80px;">${log.store || ''}</span>
            <span style="flex:1;">${log.sku || ''}</span>
            <span style="font-weight:600;color:${stockColor};">${log.stock || ''}</span>
          </div>`;
      }).join('');

  return `
    <div class="section-divider">
      <span class="section-divider-icon">📊</span>
      <span class="section-divider-title">최근 방문 기록</span>
      <span class="section-divider-line"></span>
    </div>
    <div class="card" id="visit-logs-container">${logsHtml}</div>
  `;
}

function bindSourcingEvents(container, routes) {
  const form = container.querySelector('#visit-form');
  if (!form) return;

  // Set today as default date
  const dateInput = form.querySelector('#visit-date');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const log = {
      date: form.querySelector('#visit-date').value,
      route: form.querySelector('#visit-route').value,
      store: form.querySelector('#visit-store').value,
      sku: form.querySelector('#visit-sku').value,
      price: form.querySelector('#visit-price').value,
      stock: form.querySelector('#visit-stock').value,
      memo: form.querySelector('#visit-memo').value,
      photoLink: form.querySelector('#visit-photo').value,
    };

    DataStore.addVisitLog(log);

    // Clear form
    form.reset();
    if (dateInput) {
      const today = new Date().toISOString().split('T')[0];
      dateInput.value = today;
    }

    // Re-render visit logs section
    const logsContainer = container.querySelector('#visit-logs-container');
    if (logsContainer) {
      const logs = DataStore.getVisitLogs();
      logsContainer.innerHTML = logs.map(l => {
        const stockColor = l.stock === '품절' ? 'var(--accent-red)' : l.stock === '소량' ? 'var(--accent-orange)' : 'var(--accent-green)';
        return `
          <div class="visit-log-item">
            <span class="visit-log-date">${l.date || '—'}</span>
            <span style="font-weight:600;color:var(--text-main);min-width:80px;">${l.route || ''}</span>
            <span style="min-width:80px;">${l.store || ''}</span>
            <span style="flex:1;">${l.sku || ''}</span>
            <span style="font-weight:600;color:${stockColor};">${l.stock || ''}</span>
          </div>`;
      }).join('');
    }
  });
}
