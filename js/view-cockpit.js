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
      <h1 class="page-title">⚡ 이번주 콕핏 & 의사결정 보드</h1>
      <p class="page-subtitle">대표 관점에서 주간 후보 교차검증(scorecard-v1), 트렌드 신호, 할 일, 벤치마킹 채널을 한 화면에서 판단합니다.</p>
    </div>

    <!-- Section 1: 운영 요약 -->
    ${renderExecutiveSummary()}

    <!-- Section 2: 주간 상품 의사결정 보드 (scorecard-v1) -->
    ${renderDecisionBoardSection()}

    <!-- Section 3: 할 일 체크리스트 -->
    ${renderActionsSection()}

    <!-- Section 4: 트렌드 신호 레이더 -->
    ${renderTrendSignalRadar()}

    <!-- Section 5: 이번 주 SKU 트렌드 -->
    ${renderTrendsSection()}

    <!-- Section 6: 벤치마킹 채널 -->
    ${renderPlatformBenchmarkSection()}

    <!-- Section 7: 시즌 캘린더 -->
    ${renderSeasonSection()}

    <!-- Section 8: 데일리 업로드 -->
    ${renderUploadSection(uploads, currentDay)}
  `;

  // Bind events
  bindDecisionBoardEvents(container);
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

// ── Section: 주간 상품 의사결정 보드 (scorecard-v1) ──

function renderDecisionBoardSection() {
  const candidates = DataStore.getCandidates();
  const criteria = (DataStore.scorecard && DataStore.scorecard.criteria) ? DataStore.scorecard.criteria : [
    { id: 'target_demand', name: '목표 국가 수요', weight: 20 },
    { id: 'review_persistence', name: '리뷰/지속성', weight: 10 },
    { id: 'search_trend', name: '검색 수요', weight: 10 },
    { id: 'supply_feasibility', name: '국내 조달', weight: 10 },
    { id: 'price_competitiveness', name: '가격 경쟁력', weight: 10 },
    { id: 'social_potential', name: '소셜 가능성', weight: 10 },
    { id: 'detail_page_difficulty', name: '상세페이지 제작', weight: 10 },
    { id: 'repurchase_potential', name: '재구매/비계절성', weight: 10 },
    { id: 'operational_risk', name: '운영 위험', weight: 10 }
  ];

  const countryFlags = { JP: '🇯🇵 일본', TW: '🇹🇼 대만', KR: '🇰🇷 한국' };

  const candidateCardsHtml = candidates.map(cand => {
    const scores = cand.scores || {};
    const totalScore = DataStore.calculateCandidateScore(scores);

    const evidenceCount = (cand.evidence || []).length;
    const isCrossVerified = evidenceCount >= 2;
    const evidenceBadge = isCrossVerified
      ? `<span class="status-badge status-done">✅ 교차검증 완료 (${evidenceCount}개 출처)</span>`
      : `<span class="status-badge status-hold">⚠️ 출처 근거 부족 (${evidenceCount}개)</span>`;

    const decisionBadgeClass = cand.decision === '추천'
      ? 'status-done'
      : cand.decision === '보류'
        ? 'status-hold'
        : cand.decision === '탈락'
          ? 'status-incomplete'
          : 'status-today';

    const formattedTargetPrice = cand.currency === 'JPY' ? `¥${Number(cand.targetPrice).toLocaleString()}` : `${cand.targetPrice} ${cand.currency}`;
    const formattedDomesticCost = `₩${Number(cand.domesticCost).toLocaleString()}`;

    const evidenceListHtml = (cand.evidence || []).map(ev => `
      <div style="font-size:12px;color:var(--text-secondary);margin-top:4px;">
        📌 <strong>[${ev.type}]</strong> ${ev.source}: 
        ${ev.url ? `<a href="${ev.url}" target="_blank" class="ext-link">${ev.label}</a>` : ev.label}
      </div>
    `).join('');

    const scoreInputsHtml = criteria.map(crit => {
      const val = scores[crit.id] !== undefined ? scores[crit.id] : 3;
      return `
        <div style="display:flex;align-items:center;justify-content:space-between;font-size:12px;padding:4px 0;border-bottom:1px dashed var(--border-default);">
          <span style="color:var(--text-main);">${crit.name} <small style="color:var(--text-muted);">(${crit.weight}%)</small></span>
          <div style="display:flex;align-items:center;gap:6px;">
            <select class="cand-score-select" data-cand-id="${cand.id}" data-crit-id="${crit.id}" style="padding:2px 6px;border-radius:4px;font-size:12px;border:1px solid var(--border-default);background:var(--bg-card);">
              <option value="0" ${val == 0 ? 'selected' : ''}>0점 (부적합)</option>
              <option value="1" ${val == 1 ? 'selected' : ''}>1점 (미흡)</option>
              <option value="2" ${val == 2 ? 'selected' : ''}>2점 (보통 이하)</option>
              <option value="3" ${val == 3 ? 'selected' : ''}>3점 (보통)</option>
              <option value="4" ${val == 4 ? 'selected' : ''}>4점 (우수)</option>
              <option value="5" ${val == 5 ? 'selected' : ''}>5점 (최우수)</option>
            </select>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="card decision-cand-card mb-20" data-cand-id="${cand.id}" style="border-left: 4px solid ${totalScore >= 80 ? 'var(--accent-green)' : totalScore >= 50 ? '#d97706' : 'var(--accent-red)'};">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
          <div>
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
              <span class="status-badge status-today">${countryFlags[cand.country] || cand.country}</span>
              <span style="font-size:12px;color:var(--text-muted);">${cand.category}</span>
              ${evidenceBadge}
            </div>
            <h3 style="font-size:16px;font-weight:700;color:var(--text-main);margin:0;">${cand.name}</h3>
          </div>
          <div style="text-align:right;">
            <div style="font-size:22px;font-weight:800;color:${totalScore >= 80 ? 'var(--accent-green)' : totalScore >= 50 ? '#d97706' : 'var(--accent-red)'};">
              ${totalScore}점 <small style="font-size:12px;font-weight:normal;color:var(--text-muted);">/ 100점</small>
            </div>
            <span class="status-badge ${decisionBadgeClass}" id="badge-decision-${cand.id}">${cand.decision || '검증 중'}</span>
          </div>
        </div>

        <div style="display:flex;gap:16px;font-size:13px;background:var(--bg-subtle);padding:10px;border-radius:8px;margin-bottom:12px;">
          <div><strong>조달 원가:</strong> ${formattedDomesticCost}</div>
          <div><strong>목표 판매가:</strong> ${formattedTargetPrice}</div>
          <div><strong>수집 주차:</strong> ${cand.week || '최신'} (${cand.collectedAt || ''})</div>
        </div>

        <div style="margin-bottom:12px;">
          <div style="font-size:12px;font-weight:700;color:var(--text-main);margin-bottom:4px;">🔍 교차검증 근거 (Evidence):</div>
          ${evidenceListHtml || '<div style="font-size:12px;color:var(--text-muted);">등록된 근거 URL이 없습니다.</div>'}
        </div>

        <div class="toggle-section" style="margin-bottom:12px;">
          <div class="toggle-header" data-toggle="toggle-score-${cand.id}">
            <span class="toggle-arrow">▶</span>
            <span style="font-weight:600;">📊 9항목 세부 평가표 (scorecard-v1)</span>
          </div>
          <div class="toggle-content" id="toggle-score-${cand.id}">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:8px;">
              ${scoreInputsHtml}
            </div>
          </div>
        </div>

        <div style="background:var(--bg-subtle);padding:12px;border-radius:8px;">
          <div style="font-size:13px;font-weight:700;margin-bottom:6px;">⚖️ 최종 판단 및 결정 사유</div>
          <div style="display:flex;gap:8px;margin-bottom:8px;">
            <button class="btn btn-decision ${cand.decision === '추천' ? 'active' : ''}" data-cand-id="${cand.id}" data-decision="추천" style="background:${cand.decision === '추천' ? '#16a34a' : 'var(--bg-card)'};color:${cand.decision === '추천' ? '#fff' : 'var(--text-main)'};border:1px solid #16a34a;">🟢 추천 (Pass)</button>
            <button class="btn btn-decision ${cand.decision === '보류' ? 'active' : ''}" data-cand-id="${cand.id}" data-decision="보류" style="background:${cand.decision === '보류' ? '#d97706' : 'var(--bg-card)'};color:${cand.decision === '보류' ? '#fff' : 'var(--text-main)'};border:1px solid #d97706;">🟡 보류 (Hold)</button>
            <button class="btn btn-decision ${cand.decision === '탈락' ? 'active' : ''}" data-cand-id="${cand.id}" data-decision="탈락" style="background:${cand.decision === '탈락' ? '#dc2626' : 'var(--bg-card)'};color:${cand.decision === '탈락' ? '#fff' : 'var(--text-main)'};border:1px solid #dc2626;">🔴 탈락 (Reject)</button>
          </div>
          <input type="text" class="input-cand-reason" data-cand-id="${cand.id}" value="${cand.reason || ''}" placeholder="판단 근거 사유 한 문장 입력 (예: Qoo10 Japan 랭킹 노출 및 원가율 우수)" style="width:100%;padding:8px 12px;border-radius:6px;border:1px solid var(--border-default);font-size:13px;background:var(--bg-card);">
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="section-divider">
      <span class="section-divider-icon">🏆</span>
      <span class="section-divider-title">주간 상품 의사결정 보드 (scorecard-v1)</span>
      <span class="section-divider-line"></span>
    </div>
    <div style="background:var(--bg-card);padding:16px;border-radius:12px;border:1px solid var(--border-default);margin-bottom:20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <span style="font-size:13px;color:var(--text-secondary);">
          기준 버전: <strong>scorecard-v1</strong> (일본 5개, 대만 5개 주간 후보 교차검증)
        </span>
        <button class="btn btn-outline" id="btn-add-candidate" style="font-size:12px;">➕ 새 후보 직접 등록</button>
      </div>
      <div id="decision-candidate-list">${candidateCardsHtml}</div>
    </div>
  `;
}

function bindDecisionBoardEvents(container) {
  const candidates = DataStore.getCandidates();

  // Score dropdown change
  container.querySelectorAll('.cand-score-select').forEach(sel => {
    sel.addEventListener('change', (e) => {
      const candId = e.target.dataset.candId;
      const critId = e.target.dataset.critId;
      const val = Number(e.target.value);

      const cand = candidates.find(c => c.id === candId);
      if (cand) {
        if (!cand.scores) cand.scores = {};
        cand.scores[critId] = val;
        DataStore.saveCandidate(cand);

        // Re-render cockpit view to reflect updated total score
        renderCockpitView();
      }
    });
  });

  // Decision buttons click
  container.querySelectorAll('.btn-decision').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const candId = e.target.dataset.candId;
      const decision = e.target.dataset.decision;

      const cand = candidates.find(c => c.id === candId);
      if (cand) {
        cand.decision = decision;
        DataStore.saveCandidate(cand);
        renderCockpitView();
      }
    });
  });

  // Reason text change
  container.querySelectorAll('.input-cand-reason').forEach(inp => {
    inp.addEventListener('change', (e) => {
      const candId = e.target.dataset.candId;
      const reason = e.target.value;

      const cand = candidates.find(c => c.id === candId);
      if (cand) {
        cand.reason = reason;
        DataStore.saveCandidate(cand);
      }
    });
  });

  // Add new candidate button
  const addBtn = container.querySelector('#btn-add-candidate');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const name = prompt('수집된 새 상품명을 입력하세요 (예: 조선미녀 인삼 에센스 150ml):');
      if (!name || !name.trim()) return;

      const country = prompt('목표 국가를 선택하세요 (JP: 일본, TW: 대만):', 'JP') || 'JP';
      const newCand = {
        id: 'cand-' + Date.now(),
        name: name.trim(),
        country: country.toUpperCase(),
        category: '신규수집/검증대기',
        domesticCost: 10000,
        targetPrice: 2000,
        currency: country.toUpperCase() === 'TW' ? 'TWD' : 'JPY',
        collectedAt: new Date().toISOString().split('T')[0],
        week: '2026-W29',
        evidence: [
          { type: '수집 출처', source: '수동 입력', url: '', label: '사용자 직접 수집 등록' }
        ],
        scores: {
          target_demand: 3, review_persistence: 3, search_trend: 3,
          supply_feasibility: 3, price_competitiveness: 3, social_potential: 3,
          detail_page_difficulty: 3, repurchase_potential: 3, operational_risk: 3
        },
        decision: '검증 중',
        reason: '새로 등록된 상품 후보. 교차검증 진행 필요'
      };

      DataStore.saveCandidate(newCand);
      renderCockpitView();
    });
  }
}

