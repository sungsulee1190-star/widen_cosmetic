// ============================================================
// WIDEN — view-cockpit.js · 이번 주 콕핏 (Page 1)
// ============================================================

// normalizeLinks / extLink / esc 는 js/utils.js 에 있음

function listContent(content) {
  if (Array.isArray(content)) {
    return `<ul style="margin-left:16px;">${content.map(item => `<li>${esc(item)}</li>`).join('')}</ul>`;
  }
  return content || '정보 없음';
}

function renderCockpitView() {
  const container = document.getElementById('view-cockpit');
  if (!container) return;

  // Determine current day — 실제 오늘 요일 우선, 없으면 데이터의 status:'today', 그것도 없으면 첫째 날
  // (예전엔 JSON 에 목요일이 'today' 로 박혀 있어서 무슨 요일에 열어도 목요일이 '오늘'로 표시됨)
  const uploads = DataStore.weeklyUploads || [];
  const currentDay = uploads.find(u => u.day === todayDayKey())
    || uploads.find(u => u.status === 'today')
    || uploads[0];

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
  const incomplete = DataStore.countOpenActions();
  // 요약 숫자의 뜻을 실제 계산과 일치시킴
  //  - 예전 'Qoo10 우선 채널' 은 플랫폼 이름에 Qoo10 이 들어간 개수(=항상 1)라 의미가 없었음
  //    → Qoo10 JP 에서 실제로 벤치마킹할 샵 수로 변경
  //  - 예전 '트렌드 신호 / 국내+해외+성분' 은 실제로는 트렌드 SKU 들의 '왜 뜨는가' 근거 개수 합계였음 → 이름·설명 수정
  //  - '추적 SKU / 주간/월간 누적' 은 월간 데이터가 없음 → 출처를 그대로 표기
  const qoo10 = channels.find(c => (c.platform || '').includes('Qoo10'));
  const qoo10Shops = qoo10 ? (qoo10.channels || []).length : 0;
  const trendReasons = trends.reduce((sum, t) => sum + (t.whyTrending || []).length, 0);

  const metrics = [
    { icon: '✅', label: '남은 액션', value: `${incomplete}건`, note: '미완료 + 진행중' },
    { icon: '📦', label: '추적 SKU', value: `${skus.length}개`, note: 'sku-list.json 등록 기준' },
    { icon: '🔥', label: '이번 주 트렌드 SKU', value: `${trends.length}개`, note: `상승 근거 ${trendReasons}건` },
    { icon: '🔍', label: 'Qoo10 벤치마킹 샵', value: `${qoo10Shops}곳`, note: qoo10 ? `${qoo10.cadence || ''} 확인` : '채널 데이터 없음' }
  ];

  return `
    <div class="grid-4">
      ${metrics.map(m => `
        <div class="card metric-card">
          <div class="metric-icon">${esc(m.icon)}</div>
          <div class="metric-value">${esc(m.value)}</div>
          <div class="metric-label">${esc(m.label)}</div>
          <div class="metric-note">${esc(m.note)}</div>
        </div>
      `).join('')}
    </div>
  `;
}

// ── Section 1: 데일리 업로드 ──

function renderUploadSection(uploads, currentDay) {
  const dayLabels = { mon: '월', tue: '화', wed: '수', thu: '목', fri: '금', sat: '토', sun: '일' };

  const realToday = todayDayKey();

  const timelineHtml = uploads.map(u => {
    const isActive = currentDay && u.day === currentDay.day;
    const statusClass = u.status === 'completed' ? 'completed' : '';
    // '오늘' 배지는 실제 요일 기준. 데이터에 박힌 status:'today' 는 '예정'으로 취급
    const statusBadge = u.day === realToday
      ? '<span class="status-badge status-today">오늘</span>'
      : u.status === 'completed'
        ? '<span class="status-badge status-done">완료</span>'
        : '<span class="status-badge status-upcoming">예정</span>';
    const name = uploadName(u);
    const thumbUrl = safeImageSrc(u.thumbnail || u.imageUrl || u.image);
    const thumb = thumbUrl
      ? `<img class="timeline-day-thumb" src="${esc(thumbUrl)}" alt="${esc(name)}" loading="lazy">`
      : `<div class="timeline-day-thumb"></div>`;
    return `
      <div class="timeline-day ${isActive ? 'active' : ''} ${statusClass}" data-day="${esc(u.day)}" title="${esc(name)}">
        <div class="timeline-day-label">${dayLabels[u.day] || esc(u.dayLabel || u.day)}</div>
        ${thumb}
        <div class="timeline-day-name">${esc(name.length > 8 ? name.substring(0, 8) + '…' : name)}</div>
        ${statusBadge}
      </div>`;
  }).join('');

  const detailHtml = currentDay ? renderUploadDetail(currentDay) : emptyState('이번 주 업로드 계획이 없습니다. data/weekly-uploads.json 을 확인하세요.');

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

// weekly-uploads.json 은 name/imageUrl/estimatedMargin 을 쓰고, 예전 코드는 skuName/image/margin 을 읽어서
// 타임라인 이름·사진·마진이 전부 비어 보였음 → 두 이름 모두 받아줌
function uploadName(u) {
  return u.skuName || u.name || '—';
}

function formatUploadPrice(value, currency) {
  if (value === undefined || value === null || value === '') return '—';
  if (typeof value === 'string') return value;
  return currency === 'JPY' ? `¥${value.toLocaleString('ja-JP')}` : `₩${value.toLocaleString('ko-KR')}`;
}

const DEFAULT_UPLOAD_CHECKLIST = ['상품 사진 촬영 완료', '제목 키워드 최적화', '가격 설정 확인', '상세페이지 등록', '쿠폰/프로모션 설정'];

// 체크리스트는 문자열 배열(현재 JSON) 또는 {key,label} 배열 둘 다 지원
// (예전엔 문자열 배열이 들어오면 라벨이 'undefined' 로 나오고 모든 체크박스가 같은 key 를 공유했음)
function normalizeChecklist(list) {
  return (list && list.length ? list : DEFAULT_UPLOAD_CHECKLIST).map((item, i) =>
    typeof item === 'string' ? { key: `item-${i}-${item}`, label: item } : { key: item.key || `item-${i}`, label: item.label || '' }
  );
}

function renderUploadDetail(day) {
  if (!day) return '';
  const checks = DataStore.getUploadChecks(day.day);
  const checklistItems = normalizeChecklist(day.checklist);
  const name = uploadName(day);
  const imageUrl = safeImageSrc(day.image || day.imageUrl);
  const margin = day.margin || day.estimatedMargin;

  const img = imageUrl
    ? `<img src="${esc(imageUrl)}" alt="${esc(name)}" style="width:120px;height:120px;border-radius:12px;object-fit:cover;flex-shrink:0;background:var(--bg-subtle);border:1px solid var(--border-default);">`
    : '';

  const linksHtml = normalizeLinks(day.links).map(l => extLink(l.url, l.label)).join('');

  return `
    <div class="card" style="display:flex;gap:20px;margin-bottom:20px;">
      ${img}
      <div style="flex:1;">
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px;">${esc([day.brand, day.category].filter(Boolean).join(' · '))}</div>
        <div style="font-size:16px;font-weight:700;color:var(--text-main);margin-bottom:6px;">${esc(name)}</div>
        <div class="sku-card-prices">
          <span class="sku-card-price-label">국내가</span>
          <span class="sku-card-price-value">${formatUploadPrice(day.domesticPrice, 'KRW')}</span>
          <span class="sku-card-price-label">Qoo10가</span>
          <span class="sku-card-price-value">${formatUploadPrice(day.qoo10Price, day.qoo10Currency || 'JPY')}</span>
        </div>
        ${margin ? `<span class="sku-card-margin" style="background:var(--accent-green-light);color:var(--accent-green);">마진 ${esc(margin)}</span>` : ''}
        ${day.reason ? `<p style="font-size:13px;color:var(--text-secondary);margin-top:8px;">📝 ${esc(day.reason)}</p>` : ''}
        <div style="margin-top:8px;">${linksHtml}</div>
      </div>
    </div>
    <div class="card" style="margin-bottom:20px;">
      <div class="card-title">✅ 업로드 체크리스트</div>
      ${checklistItems.map(item => {
        const isChecked = checks[item.key] === true;
        return `<label class="checklist-item ${isChecked ? 'checked' : ''}">
          <input type="checkbox" data-day="${esc(day.day)}" data-key="${esc(item.key)}" ${isChecked ? 'checked' : ''}>
          <span>${esc(item.label)}</span>
        </label>`;
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
          <div class="signal-title">${esc(signal.title)}</div>
          <div class="signal-source">${esc(signal.source)}</div>
          <ul class="signal-evidence">
            ${signal.evidence.map(item => `<li>${esc(item)}</li>`).join('')}
          </ul>
          <div class="signal-action">다음 액션: ${esc(signal.action)}</div>
        </div>
      `).join('')}
    </div>
  `;
}

// ── Section 4: 이번 주 트렌드 ──

function renderTrendsSection() {
  const trends = DataStore.weeklyTrends || [];
  if (trends.length === 0) return sectionDivider('🔥', '이번 주 트렌드') + emptyState('이번 주 트렌드 데이터가 없습니다. data/weekly-trends.json 을 확인하세요.');

  const cardsHtml = trends.map((t, idx) => {
    const tagsHtml = (t.tags || []).map(tag => {
      const cls = tag.includes('트렌드') ? 'tag-trend' : tag.includes('스테디') ? 'tag-steady' : tag.includes('시즌') ? 'tag-season' : 'tag-hot';
      return `<span class="tag ${cls}">${esc(tag)}</span>`;
    }).join('');

    const linksHtml = normalizeLinks(t.links).map(l => extLink(l.url, l.label)).join('');

    const imageUrl = esc(safeImageSrc(t.image || t.imageUrl));
    const img = imageUrl
      ? `<img class="trend-card-image" src="${imageUrl}" alt="${esc(t.name || '')}">`
      : `<div class="trend-card-image"></div>`;

    const toggles = [
      { id: `trend-why-${idx}`, label: '왜 뜨는가?', content: listContent(t.whyTrending) },
      { id: `trend-pro-${idx}`, label: '특장점', content: listContent(t.strengths) },
      { id: `trend-con-${idx}`, label: '단점/리스크', content: listContent(t.risks) }
    ];

    const togglesHtml = toggles.map(tgl => `
      <div class="toggle-section">
        <div class="toggle-header" data-toggle="${esc(tgl.id)}">
          <span class="toggle-arrow">▶</span>
          <span>${esc(tgl.label)}</span>
        </div>
        <div class="toggle-content" id="${esc(tgl.id)}">${tgl.content}</div>
      </div>
    `).join('');

    return `
      <div class="card trend-card">
        ${img}
        <div class="trend-card-body">
          <div class="trend-card-header">
            <div>
              <div class="trend-card-brand">${esc(t.brand || '')}</div>
              <div class="trend-card-name">${esc(t.name || '—')}</div>
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
  if (channels.length === 0) return sectionDivider('🏢', '플랫폼별 벤치마킹 채널') + emptyState('벤치마킹 채널 데이터가 없습니다. data/platform-channels.json 을 확인하세요.');

  const cardsHtml = channels
    .slice()
    .sort((a, b) => (a.priority || 99) - (b.priority || 99))
    .map(channel => {
      const channelTags = (channel.channels || []).slice(0, 5).map(name =>
        `<span class="tag tag-ingredient">${esc(name)}</span>`
      ).join('');
      const watchList = (channel.watchPoints || []).slice(0, 5).map(point =>
        `<li>${esc(point)}</li>`
      ).join('');

      return `
        <div class="card platform-card">
          <div class="platform-card-head">
            <div>
              <div class="platform-priority">#${esc(channel.priority || '-')}</div>
              <div class="platform-name">${esc(channel.platform || '—')}</div>
              <div class="platform-role">${esc(channel.role || '')}</div>
            </div>
            <span class="status-badge status-today">${esc(channel.cadence || '')}</span>
          </div>
          <div class="platform-type">${esc(channel.type || '')}</div>
          <div class="mb-8">${channelTags}</div>
          <ul class="platform-watch">${watchList}</ul>
          <div class="signal-action">다음 액션: ${esc(channel.nextAction || '확인 필요')}</div>
          ${extLink(channel.url, '채널 열기', 'btn btn-outline mt-16')}
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
  if (!cal || typeof cal !== 'object') return sectionDivider('📅', '시즌 캘린더') + emptyState('시즌 캘린더 데이터가 없습니다.');

  // season-calendar.json 의 실제 키는 currentMonth.categories / upcoming.categories / lastYear.rankings.
  // 예전 코드는 current.items / upcoming.items / lastYear.items 를 읽어서 시즌 캘린더가 거의 비어 있었음 → 둘 다 지원
  const current = cal.currentMonth || cal.current;
  const upcoming = cal.upcoming;
  const lastYear = cal.lastYear;
  const itemsOf = (block, ...keys) => {
    for (const k of keys) if (block && Array.isArray(block[k])) return block[k];
    return [];
  };
  const periodOf = (block) => block.period || [block.year && `${block.year}년`, block.month].filter(Boolean).join(' ');
  const linksOf = (block) => {
    const html = normalizeLinks(block.links).map(l => extLink(l.url, l.label)).join('');
    return html ? `<div class="mt-8">${html}</div>` : '';
  };

  const cards = [];

  // Card 1: 지금 뜨는 카테고리
  if (current) {
    const itemsHtml = itemsOf(current, 'categories', 'items').map(item => `
      <div class="season-item">
        <span class="season-icon">${esc(item.icon || '📦')}</span>
        <span class="season-name">${esc(item.name)}</span>
        <span class="season-metric ${item.direction === 'up' ? 'season-up' : 'season-stable'}">${esc(item.metric)}</span>
      </div>
    `).join('');
    cards.push(`
      <div class="card">
        <div class="card-title">🔥 지금 뜨는 카테고리</div>
        <div class="card-meta">${esc(periodOf(current))}</div>
        ${itemsHtml}
        ${linksOf(current)}
      </div>
    `);
  }

  // Card 2: 준비할 카테고리
  if (upcoming) {
    const itemsHtml = itemsOf(upcoming, 'categories', 'items').map(item => `
      <div class="season-item">
        <span class="season-icon">${esc(item.icon || '📦')}</span>
        <span class="season-name">${esc(item.name)}</span>
        <span class="season-metric season-stable">${esc(item.note)}</span>
      </div>
    `).join('');
    cards.push(`
      <div class="card">
        <div class="card-title">📅 준비할 카테고리</div>
        <div class="card-meta">${esc(periodOf(upcoming))}</div>
        ${itemsHtml}
        ${upcoming.tip ? `<p style="font-size:12px;color:var(--accent-primary);margin-top:10px;">💡 ${esc(upcoming.tip)}</p>` : ''}
      </div>
    `);
  }

  // Card 3: 작년 이맘때
  if (lastYear) {
    const itemsHtml = itemsOf(lastYear, 'rankings', 'items').map((item, i) => `
      <div class="season-item">
        <span class="season-icon" style="font-weight:700;color:var(--text-muted);">${esc(item.rank || i + 1)}</span>
        <span class="season-name">${esc(item.name)}${item.note ? `<br><small style="color:var(--text-muted);">${esc(item.note)}</small>` : ''}</span>
        ${extLink(item.link, '링크', 'ext-link', '')}
      </div>
    `).join('');
    cards.push(`
      <div class="card">
        <div class="card-title">📊 작년 이맘때</div>
        <div class="card-meta">${esc(periodOf(lastYear))}</div>
        ${itemsHtml}
        ${linksOf(lastYear)}
      </div>
    `);
  }

  if (cards.length === 0) return sectionDivider('📅', '시즌 캘린더') + emptyState('시즌 캘린더 데이터가 없습니다. data/season-calendar.json 을 확인하세요.');

  // 데이터 기준 월이 지금과 다르면 경고 (예: 11월에 열었는데 7월 데이터 → '지금 뜨는 카테고리 = 선크림')
  const now = new Date();
  const dataMonth = current && parseInt(String(current.month || '').replace(/\D/g, ''), 10);
  const dataYear = current && Number(current.year);
  const stale = dataMonth && (dataMonth !== now.getMonth() + 1 || (dataYear && dataYear !== now.getFullYear()));
  const staleBadge = stale
    ? `<span class="stale-badge" title="season-calendar.json 을 이번 달 기준으로 갱신해야 합니다">⚠️ ${esc(dataYear ? `${dataYear}년 ` : '')}${dataMonth}월 데이터 — 현재 ${now.getMonth() + 1}월</span>`
    : '';

  return `
    ${sectionDivider('📅', '시즌 캘린더', staleBadge)}
    <div class="grid-3">${cards.join('')}</div>
  `;
}

// ── Section 2: 할 일 체크리스트 ──

function renderActionsSection() {
  const actions = DataStore.actions || [];
  if (actions.length === 0) return sectionDivider('✅', '할 일 체크리스트') + emptyState('등록된 할 일이 없습니다. data/actions.json 을 확인하세요.');

  const statusOptions = ['미완료', '진행중', '완료', '보류'];
  const statusClasses = {
    '미완료': 'status-incomplete',
    '진행중': 'status-progress',
    '완료': 'status-done',
    '보류': 'status-hold'
  };

  const cardsHtml = actions.map(a => {
    const state = DataStore.getActionState(a.id);
    const linksHtml = normalizeLinks(a.links).map(l => extLink(l.url, l.label)).join('');

    const optionsHtml = statusOptions.map(s =>
      `<option value="${s}" ${s === state ? 'selected' : ''}>${s}</option>`
    ).join('');

    return `
      <div class="card action-card mb-16" data-action-id="${esc(a.id)}" data-status="${state}">
        <div class="flex-between mb-8">
          <div class="card-title" style="margin-bottom:0;">${esc(a.task || '—')}</div>
          <select class="filter-select action-status-select" data-action-id="${esc(a.id)}">
            ${optionsHtml}
          </select>
        </div>
        ${a.targetSku ? `<div style="font-size:13px;margin-bottom:4px;">📦 <strong>${esc(a.targetSku)}</strong></div>` : ''}
        ${a.channel ? `<div style="font-size:12px;color:var(--text-muted);margin-bottom:4px;">📢 ${esc(a.channel)}</div>` : ''}
        ${a.purpose ? `<div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;">🎯 ${esc(a.purpose)}</div>` : ''}
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
      // 예전엔 상태를 바꿔도 탭 숫자(미완료 3 등)와 현재 필터가 갱신되지 않았음
      refreshActionTabs(container);
      applyActionFilter(container);
      updateActionBadge();
    });
  });

  // Filter tabs
  container.querySelectorAll('#action-filter-tabs .filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('#action-filter-tabs .filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      applyActionFilter(container);
    });
  });
}

function applyActionFilter(container) {
  const active = container.querySelector('#action-filter-tabs .filter-tab.active');
  const filter = active ? active.dataset.filter : '전체';
  container.querySelectorAll('.action-card').forEach(card => {
    card.classList.toggle('hidden', filter !== '전체' && card.dataset.status !== filter);
  });
}

function refreshActionTabs(container) {
  const cards = [...container.querySelectorAll('.action-card')];
  container.querySelectorAll('#action-filter-tabs .filter-tab').forEach(tab => {
    const filter = tab.dataset.filter;
    const count = filter === '전체' ? cards.length : cards.filter(c => c.dataset.status === filter).length;
    const label = tab.querySelector('.tab-count');
    if (label) label.textContent = `(${count})`;
  });
}

function updateActionBadge() {
  const el = document.getElementById('badge-actions');
  if (el) el.textContent = DataStore.countOpenActions() || '';
  // 상단 요약 카드의 '남은 액션' 숫자도 같이 갱신
  const metric = document.querySelector('#view-cockpit .metric-card .metric-value');
  if (metric) metric.textContent = `${DataStore.countOpenActions()}건`;
}
