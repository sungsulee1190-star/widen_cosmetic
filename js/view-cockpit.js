// ============================================================
// WIDEN — view-cockpit.js · 이번 주 콕핏 (Page 1)
// ============================================================

function normalizeLinks(links) {
  if (!links) return [];
  if (Array.isArray(links)) return links.filter(l => l && l.url);
  return Object.entries(links)
    .filter(([, url]) => typeof url === 'string' && url.trim())
    .map(([label, url]) => ({ label, url }));
}

function listContent(content) {
  if (Array.isArray(content)) {
    return `<ul style="margin-left:16px;">${content.map(item => `<li>${item}</li>`).join('')}</ul>`;
  }
  return content || '정보 없음';
}

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
      <h1 class="page-title">⚡ 이번주 할일</h1>
      <p class="page-subtitle">대표 관점에서 이번 주 트렌드 신호, 해야 할 일, SKU 기회, 벤치마킹 채널을 한 화면에서 판단합니다.</p>
    </div>

    <!-- Section 1: 운영 요약 -->
    ${renderExecutiveSummary()}

    <!-- Section 2: 할 일 체크리스트 -->
    ${renderActionsSection()}

    <!-- Section 3: 트렌드 신호 레이더 -->
    ${renderTrendSignalRadar()}

    <!-- Section 4: 이번 주 SKU 트렌드 -->
    ${renderTrendsSection()}

    <!-- Section 5: 벤치마킹 채널 -->
    ${renderPlatformBenchmarkSection()}

    <!-- Section 6: 시즌 캘린더 -->
    ${renderSeasonSection()}

    <!-- Section 7: 데일리 업로드 -->
    ${renderUploadSection(uploads, currentDay)}
  `;

  // Bind events
  bindUploadEvents(container, uploads);
  bindToggleEvents(container);
  bindActionEvents(container);
}

function renderExecutiveSummary() {
  const actions = DataStore.actions || [];
  const skus = DataStore.skus || [];
  const trends = DataStore.weeklyTrends || [];
  const channels = DataStore.platformChannels || [];
  const incomplete = actions.filter(a => DataStore.getActionState(a.id) !== '완료').length;
  const qoo10Targets = channels.filter(c => c.platform && c.platform.includes('Qoo10')).length;
  const hotSignals = trends.reduce((sum, t) => sum + ((t.whyTrending || []).length || 1), 0);

  const metrics = [
    { icon: '✅', label: '미완료 액션', value: `${incomplete}건`, note: '오늘 체크 필요' },
    { icon: '📦', label: '추적 SKU', value: `${skus.length}개`, note: '주간/월간 누적' },
    { icon: '🔥', label: '트렌드 신호', value: `${hotSignals}개`, note: '국내+해외+성분' },
    { icon: '🔍', label: 'Qoo10 우선 채널', value: `${qoo10Targets}개`, note: 'Fast copycat' }
  ];

  return `
    <div class="grid-4">
      ${metrics.map(m => `
        <div class="card metric-card">
          <div class="metric-icon">${m.icon}</div>
          <div class="metric-value">${m.value}</div>
          <div class="metric-label">${m.label}</div>
          <div class="metric-note">${m.note}</div>
        </div>
      `).join('')}
    </div>
  `;
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
    const thumb = u.imageUrl
      ? `<img class="timeline-day-thumb" src="${u.imageUrl}" alt="${u.name || ''}">`
      : `<div class="timeline-day-thumb"></div>`;
    return `
      <div class="timeline-day ${isActive ? 'active' : ''} ${statusClass}" data-day="${u.day}">
        <div class="timeline-day-label">${dayLabels[u.day] || u.day}</div>
        ${thumb}
        <div class="timeline-day-name">${(u.name || '—').substring(0, 8)}</div>
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
  let checklistItems = day.checklist || [];
  if (checklistItems.length > 0 && typeof checklistItems[0] === 'string') {
    checklistItems = checklistItems.map((label, idx) => ({ key: 'check-' + idx, label }));
  }
  if (checklistItems.length === 0) {
    checklistItems = [
      { key: 'photo', label: '상품 사진 촬영 완료' },
      { key: 'title', label: '제목 키워드 최적화' },
      { key: 'price', label: '가격 설정 확인' },
      { key: 'description', label: '상세페이지 등록' },
      { key: 'coupon', label: '쿠폰/프로모션 설정' }
    ];
  }

  const img = day.imageUrl
    ? `<img src="${day.imageUrl}" alt="${day.name || ''}" style="width:120px;height:120px;border-radius:12px;object-fit:cover;flex-shrink:0;background:var(--bg-subtle);border:1px solid var(--border-default);">`
    : '';

  const linksHtml = normalizeLinks(day.links).map(l =>
    `<a href="${l.url}" target="_blank" class="ext-link">🔗 ${l.label}</a>`
  ).join('');

  const formattedDomestic = day.domesticPrice ? '₩' + Number(day.domesticPrice).toLocaleString('ko-KR') : '—';
  const formattedQoo10 = day.qoo10Price ? '¥' + Number(day.qoo10Price).toLocaleString('ja-JP') : '—';

  return `
    <div class="card" style="display:flex;gap:20px;margin-bottom:20px;">
      ${img}
      <div style="flex:1;">
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px;">${day.category || ''}</div>
        <div style="font-size:16px;font-weight:700;color:var(--text-main);margin-bottom:6px;">${day.name || '—'}</div>
        <div class="sku-card-prices">
          <span class="sku-card-price-label">국내가</span>
          <span class="sku-card-price-value">${formattedDomestic}</span>
          <span class="sku-card-price-label">Qoo10가</span>
          <span class="sku-card-price-value">${formattedQoo10}</span>
        </div>
        ${day.estimatedMargin ? `<span class="sku-card-margin" style="background:var(--accent-green-light);color:var(--accent-green);">마진 ${day.estimatedMargin}</span>` : ''}
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

// ── Section 3: 트렌드 신호 레이더 ──

function renderTrendSignalRadar() {
  const trends = DataStore.weeklyTrends || [];
  const channels = DataStore.platformChannels || [];
  const topTrend = trends[0];
  const qoo10 = channels.find(c => c.platform === 'Qoo10 JP');
  const offline = channels.find(c => c.platform === '다이소') || channels.find(c => c.platform === '올리브영');
  const musinsa = channels.find(c => c.platform === '무신사뷰티');

  const signals = [
    {
      title: 'SKU 급상승 신호',
      source: topTrend ? `${topTrend.brand} · ${topTrend.name}` : '주간 트렌드',
      evidence: topTrend ? (topTrend.whyTrending || []).slice(0, 2) : ['주간 트렌드 데이터 확인 필요'],
      action: topTrend ? `${topTrend.name} 경쟁 페이지 3개 캡처` : 'Qoo10 상위 SKU 확인'
    },
    {
      title: 'Qoo10 판매 문법',
      source: qoo10 ? qoo10.channels.slice(0, 3).join(', ') : 'Qoo10 JP',
      evidence: qoo10 ? qoo10.watchPoints.slice(0, 3) : ['제목', '이미지', '쿠폰'],
      action: qoo10 ? qoo10.nextAction : '韓国コスメ 검색 상위 페이지 확인'
    },
    {
      title: '오프라인 소싱 신호',
      source: offline ? offline.platform : '명동/성수/홍대',
      evidence: offline ? offline.watchPoints.slice(0, 3) : ['재고', '품절', '진열'],
      action: offline ? offline.nextAction : '명동 다이소/올리브영 정찰'
    },
    {
      title: '무신사뷰티 대분류 신호',
      source: musinsa ? musinsa.channels.slice(0, 4).join(', ') : '무신사뷰티',
      evidence: musinsa ? musinsa.watchPoints.slice(0, 3) : ['향수', '색조', '남성 그루밍'],
      action: musinsa ? musinsa.nextAction : '향수/립/남성 그루밍 후보 확인'
    }
  ];

  return `
    <div class="section-divider">
      <span class="section-divider-icon">📡</span>
      <span class="section-divider-title">트렌드 신호 레이더</span>
      <span class="section-divider-line"></span>
    </div>
    <div class="grid-4">
      ${signals.map(signal => `
        <div class="card signal-card">
          <div class="signal-title">${signal.title}</div>
          <div class="signal-source">${signal.source}</div>
          <ul class="signal-evidence">
            ${signal.evidence.map(item => `<li>${item}</li>`).join('')}
          </ul>
          <div class="signal-action">다음 액션: ${signal.action}</div>
        </div>
      `).join('')}
    </div>
  `;
}

// ── Section 4: 이번 주 트렌드 ──

function renderTrendsSection() {
  const trends = DataStore.weeklyTrends || [];
  if (trends.length === 0) return '';

  const cardsHtml = trends.map((t, idx) => {
    const tagsHtml = (t.tags || []).map(tag => {
      const cls = tag.includes('트렌드') ? 'tag-trend' : tag.includes('스테디') ? 'tag-steady' : tag.includes('시즌') ? 'tag-season' : 'tag-hot';
      return `<span class="tag ${cls}">${tag}</span>`;
    }).join('');

    const linksHtml = normalizeLinks(t.links).map(l =>
      `<a href="${l.url}" target="_blank" class="ext-link">🔗 ${l.label}</a>`
    ).join('');

    const imageUrl = t.image || t.imageUrl;
    const img = imageUrl
      ? `<img class="trend-card-image" src="${imageUrl}" alt="${t.name || ''}">`
      : `<div class="trend-card-image"></div>`;

    const toggles = [
      { id: `trend-why-${idx}`, label: '왜 뜨는가?', content: listContent(t.whyTrending) },
      { id: `trend-pro-${idx}`, label: '특장점', content: listContent(t.strengths) },
      { id: `trend-con-${idx}`, label: '단점/리스크', content: listContent(t.risks) }
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

// ── Section 5: 플랫폼별 벤치마킹 채널 ──

function renderPlatformBenchmarkSection() {
  const channels = DataStore.platformChannels || [];
  if (channels.length === 0) return '';

  const cardsHtml = channels
    .slice()
    .sort((a, b) => (a.priority || 99) - (b.priority || 99))
    .map(channel => {
      const channelTags = (channel.channels || []).slice(0, 5).map(name =>
        `<span class="tag tag-ingredient">${name}</span>`
      ).join('');
      const watchList = (channel.watchPoints || []).slice(0, 5).map(point =>
        `<li>${point}</li>`
      ).join('');

      return `
        <div class="card platform-card">
          <div class="platform-card-head">
            <div>
              <div class="platform-priority">#${channel.priority || '-'}</div>
              <div class="platform-name">${channel.platform || '—'}</div>
              <div class="platform-role">${channel.role || ''}</div>
            </div>
            <span class="status-badge status-today">${channel.cadence || ''}</span>
          </div>
          <div class="platform-type">${channel.type || ''}</div>
          <div class="mb-8">${channelTags}</div>
          <ul class="platform-watch">${watchList}</ul>
          <div class="signal-action">다음 액션: ${channel.nextAction || '확인 필요'}</div>
          ${channel.url ? `<a href="${channel.url}" target="_blank" class="btn btn-outline mt-16">🔗 채널 열기</a>` : ''}
        </div>
      `;
    }).join('');

  return `
    <div class="section-divider">
      <span class="section-divider-icon">🏢</span>
      <span class="section-divider-title">플랫폼별 벤치마킹 채널</span>
      <span class="section-divider-line"></span>
    </div>
    <div class="grid-3">${cardsHtml}</div>
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

// ── Section 6: 시즌 캘린더 ──

function renderSeasonSection() {
  const cal = DataStore.seasonCalendar;
  if (!cal || typeof cal !== 'object') return '';

  const cards = [];

  // Card 1: 지금 뜨는 카테고리
  if (cal.currentMonth) {
    const itemsHtml = (cal.currentMonth.categories || []).map(item => `
      <div class="season-item">
        <span class="season-icon">${item.icon || '📦'}</span>
        <span class="season-name">${item.name || ''}</span>
        <span class="season-metric ${item.direction === 'up' ? 'season-up' : 'season-stable'}">${item.metric || ''}</span>
      </div>
    `).join('');
    cards.push(`
      <div class="card">
        <div class="card-title">🔥 지금 뜨는 카테고리</div>
        <div class="card-meta">${cal.currentMonth.year || ''}년 ${cal.currentMonth.month || ''}</div>
        ${itemsHtml}
      </div>
    `);
  }

  // Card 2: 준비할 카테고리
  if (cal.upcoming) {
    const itemsHtml = (cal.upcoming.categories || []).map(item => `
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
    const itemsHtml = (cal.lastYear.rankings || []).map((item, i) => `
      <div class="season-item">
        <span class="season-icon" style="font-weight:700;color:var(--text-muted);">${item.rank || i + 1}</span>
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

// ── Section 2: 할 일 체크리스트 ──

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
    const linksHtml = normalizeLinks(a.links).map(l =>
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
