// ============================================================
// WIDEN — view-cockpit.js · 이번 주 콕핏 (Page 1)
// ============================================================

function renderCockpitView() {
  const container = document.getElementById('view-cockpit');
  if (!container) return;

  // Determine current day
  const uploads = DataStore.weeklyUploads || [];
  let currentDay = uploads.find(u => u.status === 'today');
  if (!currentDay && uploads.length > 0) {
    currentDay = uploads.find(u => u.day === 'thu') || uploads[0];
  }

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">⚡ 이번 주 콕핏</h1>
      <p class="page-subtitle">이번 주 업로드 일정, 트렌드, 시즌 캘린더, 할 일을 한눈에 확인하세요.</p>
    </div>

    <!-- Section 1: 데일리 업로드 -->
    ${renderUploadSection(uploads, currentDay)}

    <!-- Section 2: 이번 주 트렌드 -->
    ${renderTrendsSection()}

    <!-- Section 3: 시즌 캘린더 -->
    ${renderSeasonSection()}

    <!-- Section 4: 할 일 체크리스트 -->
    ${renderActionsSection()}
  `;

  // Bind events
  bindUploadEvents(container, uploads);
  bindToggleEvents(container);
  bindActionEvents(container);
}

// ── Section 1: 데일리 업로드 ──

function renderUploadSection(uploads, currentDay) {
  const dayLabels = { mon: '월', tue: '화', wed: '수', thu: '목', fri: '금', sat: '토', sun: '일' };

  const timelineHtml = uploads.map(u => {
    const isActive = currentDay && u.day === currentDay.day;
    const statusClass = u.status === 'completed' ? 'completed' : '';
    const statusBadge = u.status === 'completed'
      ? '<span class="status-badge status-done">완료</span>'
      : u.status === 'today'
        ? '<span class="status-badge status-today">오늘</span>'
        : '<span class="status-badge status-upcoming">예정</span>';
    const thumb = u.thumbnail
      ? `<img class="timeline-day-thumb" src="${u.thumbnail}" alt="${u.skuName || ''}">`
      : `<div class="timeline-day-thumb"></div>`;
    return `
      <div class="timeline-day ${isActive ? 'active' : ''} ${statusClass}" data-day="${u.day}">
        <div class="timeline-day-label">${dayLabels[u.day] || u.day}</div>
        ${thumb}
        <div class="timeline-day-name">${(u.skuName || '—').substring(0, 8)}</div>
        ${statusBadge}
      </div>`;
  }).join('');

  const detailHtml = currentDay ? renderUploadDetail(currentDay) : '<p style="color:var(--text-muted);font-size:13px;">업로드 데이터가 없습니다.</p>';

  return `
    <div class="section-divider">
      <span class="section-divider-icon">📤</span>
      <span class="section-divider-title">이번 주 데일리 업로드</span>
      <span class="section-divider-line"></span>
    </div>
    <div class="grid-7" id="upload-timeline">${timelineHtml}</div>
    <div id="upload-detail">${detailHtml}</div>
  `;
}

function renderUploadDetail(day) {
  if (!day) return '';
  const checks = DataStore.getUploadChecks(day.day);
  const checklistItems = (day.checklist || [
    { key: 'photo', label: '상품 사진 촬영 완료' },
    { key: 'title', label: '제목 키워드 최적화' },
    { key: 'price', label: '가격 설정 확인' },
    { key: 'description', label: '상세페이지 등록' },
    { key: 'coupon', label: '쿠폰/프로모션 설정' }
  ]);

  const img = day.image
    ? `<img src="${day.image}" alt="${day.skuName || ''}" style="width:120px;height:120px;border-radius:12px;object-fit:cover;flex-shrink:0;background:var(--bg-subtle);border:1px solid var(--border-default);">`
    : '';

  const linksHtml = (day.links || []).map(l =>
    `<a href="${l.url}" target="_blank" class="ext-link">🔗 ${l.label}</a>`
  ).join('');

  return `
    <div class="card" style="display:flex;gap:20px;margin-bottom:20px;">
      ${img}
      <div style="flex:1;">
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px;">${day.category || ''}</div>
        <div style="font-size:16px;font-weight:700;color:var(--text-main);margin-bottom:6px;">${day.skuName || '—'}</div>
        <div class="sku-card-prices">
          <span class="sku-card-price-label">국내가</span>
          <span class="sku-card-price-value">${day.domesticPrice || '—'}</span>
          <span class="sku-card-price-label">Qoo10가</span>
          <span class="sku-card-price-value">${day.qoo10Price || '—'}</span>
        </div>
        ${day.margin ? `<span class="sku-card-margin" style="background:var(--accent-green-light);color:var(--accent-green);">마진 ${day.margin}</span>` : ''}
        ${day.reason ? `<p style="font-size:13px;color:var(--text-secondary);margin-top:8px;">📝 ${day.reason}</p>` : ''}
        <div style="margin-top:8px;">${linksHtml}</div>
      </div>
    </div>
    <div class="card" style="margin-bottom:20px;">
      <div class="card-title">✅ 업로드 체크리스트</div>
      ${checklistItems.map(item => {
        const isChecked = checks[item.key] === true;
        return `<div class="checklist-item ${isChecked ? 'checked' : ''}">
          <input type="checkbox" data-day="${day.day}" data-key="${item.key}" ${isChecked ? 'checked' : ''}>
          <span>${item.label}</span>
        </div>`;
      }).join('')}
    </div>
  `;
}

function bindUploadEvents(container, uploads) {
  // Timeline day click
  container.querySelectorAll('.timeline-day').forEach(el => {
    el.addEventListener('click', () => {
      const dayKey = el.dataset.day;
      const dayData = uploads.find(u => u.day === dayKey);
      // Update active
      container.querySelectorAll('.timeline-day').forEach(d => d.classList.remove('active'));
      el.classList.add('active');
      // Re-render detail
      const detailContainer = container.querySelector('#upload-detail');
      if (detailContainer && dayData) {
        detailContainer.innerHTML = renderUploadDetail(dayData);
        bindChecklistEvents(container);
      }
    });
  });
  bindChecklistEvents(container);
}

function bindChecklistEvents(container) {
  container.querySelectorAll('#upload-detail input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const day = e.target.dataset.day;
      const key = e.target.dataset.key;
      DataStore.setUploadCheck(day, key, e.target.checked);
      const item = e.target.closest('.checklist-item');
      if (item) item.classList.toggle('checked', e.target.checked);
    });
  });
}

// ── Section 2: 이번 주 트렌드 ──

function renderTrendsSection() {
  const trends = DataStore.weeklyTrends || [];
  if (trends.length === 0) return '';

  const cardsHtml = trends.map((t, idx) => {
    const tagsHtml = (t.tags || []).map(tag => {
      const cls = tag === '트렌드' ? 'tag-trend' : tag === '스테디' ? 'tag-steady' : tag === '시즌성' ? 'tag-season' : 'tag-hot';
      return `<span class="tag ${cls}">${tag}</span>`;
    }).join('');

    const linksHtml = (t.links || []).map(l =>
      `<a href="${l.url}" target="_blank" class="ext-link">🔗 ${l.label}</a>`
    ).join('');

    const img = t.image
      ? `<img class="trend-card-image" src="${t.image}" alt="${t.name || ''}">`
      : `<div class="trend-card-image"></div>`;

    const toggles = [
      { id: `trend-why-${idx}`, label: '왜 뜨는가?', content: t.whyTrending || '정보 없음' },
      { id: `trend-pro-${idx}`, label: '특장점', content: t.strengths || '정보 없음' },
      { id: `trend-con-${idx}`, label: '단점/리스크', content: t.risks || '정보 없음' }
    ];

    const togglesHtml = toggles.map(tgl => `
      <div class="toggle-section">
        <div class="toggle-header" data-toggle="${tgl.id}">
          <span class="toggle-arrow">▶</span>
          <span>${tgl.label}</span>
        </div>
        <div class="toggle-content" id="${tgl.id}">${tgl.content}</div>
      </div>
    `).join('');

    return `
      <div class="card trend-card">
        ${img}
        <div class="trend-card-body">
          <div class="trend-card-header">
            <div>
              <div class="trend-card-brand">${t.brand || ''}</div>
              <div class="trend-card-name">${t.name || '—'}</div>
            </div>
          </div>
          <div class="trend-card-tags">${tagsHtml}</div>
          ${togglesHtml}
          <div class="trend-card-links">${linksHtml}</div>
        </div>
      </div>`;
  }).join('');

  return `
    <div class="section-divider">
      <span class="section-divider-icon">🔥</span>
      <span class="section-divider-title">이번 주 트렌드</span>
      <span class="section-divider-line"></span>
    </div>
    ${cardsHtml}
  `;
}

function bindToggleEvents(container) {
  container.querySelectorAll('.toggle-header').forEach(header => {
    header.addEventListener('click', () => {
      const targetId = header.dataset.toggle;
      const content = document.getElementById(targetId);
      if (!content) return;
      const isOpen = header.classList.contains('open');
      header.classList.toggle('open', !isOpen);
      content.classList.toggle('open', !isOpen);
    });
  });
}

// ── Section 3: 시즌 캘린더 ──

function renderSeasonSection() {
  const cal = DataStore.seasonCalendar;
  if (!cal || typeof cal !== 'object') return '';

  const cards = [];

  // Card 1: 지금 뜨는 카테고리
  if (cal.current) {
    const itemsHtml = (cal.current.items || []).map(item => `
      <div class="season-item">
        <span class="season-icon">${item.icon || '📦'}</span>
        <span class="season-name">${item.name || ''}</span>
        <span class="season-metric ${item.direction === 'up' ? 'season-up' : 'season-stable'}">${item.metric || ''}</span>
      </div>
    `).join('');
    cards.push(`
      <div class="card">
        <div class="card-title">🔥 지금 뜨는 카테고리</div>
        <div class="card-meta">${cal.current.period || ''}</div>
        ${itemsHtml}
      </div>
    `);
  }

  // Card 2: 준비할 카테고리
  if (cal.upcoming) {
    const itemsHtml = (cal.upcoming.items || []).map(item => `
      <div class="season-item">
        <span class="season-icon">${item.icon || '📦'}</span>
        <span class="season-name">${item.name || ''}</span>
        <span class="season-metric season-stable">${item.note || ''}</span>
      </div>
    `).join('');
    cards.push(`
      <div class="card">
        <div class="card-title">📅 준비할 카테고리</div>
        <div class="card-meta">${cal.upcoming.period || ''}</div>
        ${itemsHtml}
        ${cal.upcoming.tip ? `<p style="font-size:12px;color:var(--accent-primary);margin-top:10px;">💡 ${cal.upcoming.tip}</p>` : ''}
      </div>
    `);
  }

  // Card 3: 작년 이맘때
  if (cal.lastYear) {
    const itemsHtml = (cal.lastYear.items || []).map((item, i) => `
      <div class="season-item">
        <span class="season-icon" style="font-weight:700;color:var(--text-muted);">${i + 1}</span>
        <span class="season-name">${item.name || ''}</span>
        ${item.link ? `<a href="${item.link}" target="_blank" class="ext-link">링크</a>` : ''}
      </div>
    `).join('');
    cards.push(`
      <div class="card">
        <div class="card-title">📊 작년 이맘때</div>
        <div class="card-meta">${cal.lastYear.period || ''}</div>
        ${itemsHtml}
      </div>
    `);
  }

  if (cards.length === 0) return '';

  return `
    <div class="section-divider">
      <span class="section-divider-icon">📅</span>
      <span class="section-divider-title">시즌 캘린더</span>
      <span class="section-divider-line"></span>
    </div>
    <div class="grid-3">${cards.join('')}</div>
  `;
}

// ── Section 4: 할 일 체크리스트 ──

function renderActionsSection() {
  const actions = DataStore.actions || [];
  if (actions.length === 0) return '';

  const statusOptions = ['미완료', '진행중', '완료', '보류'];
  const statusClasses = {
    '미완료': 'status-incomplete',
    '진행중': 'status-progress',
    '완료': 'status-done',
    '보류': 'status-hold'
  };

  const cardsHtml = actions.map(a => {
    const state = DataStore.getActionState(a.id);
    const linksHtml = (a.links || []).map(l =>
      `<a href="${l.url}" target="_blank" class="ext-link">🔗 ${l.label}</a>`
    ).join('');

    const optionsHtml = statusOptions.map(s =>
      `<option value="${s}" ${s === state ? 'selected' : ''}>${s}</option>`
    ).join('');

    return `
      <div class="card action-card mb-16" data-action-id="${a.id}" data-status="${state}">
        <div class="flex-between mb-8">
          <div class="card-title" style="margin-bottom:0;">${a.task || '—'}</div>
          <select class="filter-select action-status-select" data-action-id="${a.id}">
            ${optionsHtml}
          </select>
        </div>
        ${a.targetSku ? `<div style="font-size:13px;margin-bottom:4px;">📦 <strong>${a.targetSku}</strong></div>` : ''}
        ${a.channel ? `<div style="font-size:12px;color:var(--text-muted);margin-bottom:4px;">📢 ${a.channel}</div>` : ''}
        ${a.purpose ? `<div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;">🎯 ${a.purpose}</div>` : ''}
        <div>${linksHtml}</div>
      </div>`;
  }).join('');

  // Count by status
  const counts = { '전체': actions.length };
  statusOptions.forEach(s => { counts[s] = 0; });
  actions.forEach(a => {
    const st = DataStore.getActionState(a.id);
    counts[st] = (counts[st] || 0) + 1;
  });

  const tabs = ['전체', ...statusOptions];
  const tabsHtml = tabs.map((t, i) =>
    `<button class="filter-tab ${i === 0 ? 'active' : ''}" data-filter="${t}">${t}<span class="tab-count">(${counts[t] || 0})</span></button>`
  ).join('');

  return `
    <div class="section-divider">
      <span class="section-divider-icon">✅</span>
      <span class="section-divider-title">할 일 체크리스트</span>
      <span class="section-divider-line"></span>
    </div>
    <div class="filter-tabs" id="action-filter-tabs">${tabsHtml}</div>
    <div id="action-cards">${cardsHtml}</div>
  `;
}

function bindActionEvents(container) {
  // Status dropdown
  container.querySelectorAll('.action-status-select').forEach(sel => {
    sel.addEventListener('change', (e) => {
      const actionId = e.target.dataset.actionId;
      const value = e.target.value;
      DataStore.setActionState(actionId, value);
      const card = e.target.closest('.action-card');
      if (card) card.dataset.status = value;
      updateActionBadge();
    });
  });

  // Filter tabs
  container.querySelectorAll('#action-filter-tabs .filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('#action-filter-tabs .filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const filter = tab.dataset.filter;
      container.querySelectorAll('.action-card').forEach(card => {
        if (filter === '전체') {
          card.classList.remove('hidden');
        } else {
          card.classList.toggle('hidden', card.dataset.status !== filter);
        }
      });
    });
  });
}

function updateActionBadge() {
  const incompleteActions = (DataStore.actions || []).filter(a => DataStore.getActionState(a.id) === '미완료').length;
  const el = document.getElementById('badge-actions');
  if (el) el.textContent = incompleteActions || '';
}
