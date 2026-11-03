// ============================================================
// WIDEN — Data Store (JSON loader + LocalStorage manager)
// ============================================================

const DataStore = {
  skus: [],
  actions: [],
  weeklyUploads: [],
  weeklyTrends: [],
  seasonCalendar: {},
  ingredients: [],
  countries: [],
  copycatShops: [],
  platformChannels: [],
  sourcingRoutes: [],
  observations: [],

  // ── Load all JSON data ──
  async load() {
    const files = {
      skus: 'data/sku-list.json',
      actions: 'data/actions.json',
      weeklyUploads: 'data/weekly-uploads.json',
      weeklyTrends: 'data/weekly-trends.json',
      seasonCalendar: 'data/season-calendar.json',
      ingredients: 'data/ingredients.json',
      countries: 'data/countries.json',
      copycatShops: 'data/copycat-shops.json',
      platformChannels: 'data/platform-channels.json',
      sourcingRoutes: 'data/sourcing-routes.json',
      observations: 'data/observations.json',
    };

    const entries = Object.entries(files);
    const results = await Promise.all(
      entries.map(([, url]) =>
        fetch(url).then(r => r.json()).catch(() => [])
      )
    );
    entries.forEach(([key], i) => {
      this[key] = results[i];
    });
    await this.openWorkLog();
  },

  // ── SKU 레코드 (SkuCatalog.createRecords) ──
  // 모든 화면은 SKU를 이것으로 조회한다. 방문 기록이 바뀌면 다시 만들어지도록 매번 생성(데이터가 작음).
  skuRecords() {
    const visits = this.getVisitLogs().map(log => ({
      skuId: log.skuId,
      sku: log.sku,
      date: log.date,
      kind: 'offline-visit',
      source: [log.route, log.store].filter(Boolean).join(' · '),
      summary: [log.stock, log.price && `현장가 ${log.price}`, log.memo].filter(Boolean).join(' · ')
    }));
    return SkuCatalog.createRecords({
      skus: this.skus,
      uploads: this.weeklyUploads,
      trends: this.weeklyTrends,
      actions: this.actions,
      ingredients: this.ingredients,
      observations: [...(this.observations || []), ...visits]
    });
  },

  // ── 작업 기록 (WorkLog) ──
  // 할 일 상태 · 업로드 체크 · 즐겨찾기 · 방문 기록은 모두 work-log.js의 WorkLog를 거친다.
  // 저장 위치(local/supabase)는 workspaceSettings()가 정한다. 아래 메서드는 화면용 얇은 위임.
  workLog: null,
  workLogStatus: { backend: 'local', error: null },

  workspaceSettings() {
    const base = (typeof window !== 'undefined' && window.WIDEN_WORKSPACE) || { backend: 'auto' };
    let override = {};
    try { override = JSON.parse(localStorage.getItem('widen-workspace') || '{}'); } catch { override = {}; }
    return {
      backend: override.backend || base.backend || 'auto',
      server: { url: '', token: '', ...(base.server || {}), ...(override.server || {}) },
      supabase: { ...(base.supabase || {}), ...(override.supabase || {}) },
      author: override.author || ''
    };
  },

  saveWorkspaceSettings(settings) {
    localStorage.setItem('widen-workspace', JSON.stringify(settings));
  },

  // 저장 실패를 상태로 남기고 사이드바에 알린다
  watchWorkLog(log) {
    log.onChange(event => {
      if (event.type !== 'error') return;
      this.workLogStatus = { ...this.workLogStatus, error: `저장 실패: ${event.error.message}` };
      if (typeof updateWorkspaceStatus === 'function') updateWorkspaceStatus();
    });
    return log;
  },

  // 이 주소에서 WIDEN 서버가 응답하는지 (python http.server·파일로 열면 false)
  async probeServer(baseUrl = '') {
    try {
      const res = await fetch(`${String(baseUrl).replace(/\/$/, '')}/api/health`, { cache: 'no-store' });
      if (!res.ok) return false;
      const body = await res.json();
      return body && body.ok === true;
    } catch {
      return false;
    }
  },

  async openWorkLog() {
    const settings = this.workspaceSettings();
    const local = WorkLog.localAdapter(localStorage);

    // 옛 기능별 localStorage 키 → 작업 기록으로 한 번만 옮김
    if (localStorage.getItem('widen-work-log') === null) {
      const legacy = WorkLog.legacyEntries(localStorage);
      localStorage.setItem('widen-work-log', JSON.stringify(legacy));
    }

    // 공유 저장소 후보: 'server'(맥미니 등) · 'supabase' · 'auto'(대시보드를 연 주소에 WIDEN 서버가 있으면 사용)
    let shared = null;
    let label = '';
    if (settings.backend === 'server' || settings.backend === 'auto') {
      const probe = settings.backend === 'auto' ? await this.probeServer(settings.server.url) : true;
      if (probe) { shared = WorkLog.serverAdapter({ baseUrl: settings.server.url, token: settings.server.token }); label = 'server'; }
    } else if (settings.backend === 'supabase' && settings.supabase.url && settings.supabase.key) {
      shared = WorkLog.supabaseAdapter(settings.supabase); label = 'supabase';
    }

    if (shared) {
      const log = this.watchWorkLog(WorkLog.create(shared, { by: settings.author }));
      try {
        await log.load();
        this.workLog = log;
        this.workLogStatus = { backend: label, error: null };
        return;
      } catch (error) {
        // 공유 저장소에 못 붙으면 이 브라우저 기록으로 계속 (상태는 화면에 표시)
        const needsCode = /401/.test(error.message);
        this.workLogStatus = {
          backend: 'local',
          error: needsCode
            ? `WIDEN 서버에 접속 코드가 필요합니다 — 아래에 접속 코드를 넣고 '저장하고 다시 연결'을 누르세요. (그 전까지는 이 브라우저에만 저장)`
            : `공유 저장소 연결 실패 — 이 브라우저에만 저장 중 (${error.message})`
        };
      }
    } else {
      this.workLogStatus = { backend: 'local', error: null };
    }
    const log = this.watchWorkLog(WorkLog.create(local, { by: settings.author }));
    await log.load();
    this.workLog = log;
  },

  getActionState(actionId) { return this.workLog.actionState(actionId); },
  setActionState(actionId, state) { this.workLog.setActionState(actionId, state); },
  getUploadChecks(day) { return this.workLog.uploadChecks(day); },
  setUploadCheck(day, key, checked) { this.workLog.setUploadCheck(day, key, checked); },
  getFavorites() { return this.workLog.favorites(); },
  toggleFavorite(skuId) { this.workLog.toggleFavorite(skuId); },
  isFavorite(skuId) { return this.workLog.isFavorite(skuId); },
  getVisitLogs() { return this.workLog.visits(); },
  addVisitLog(log) { this.workLog.addVisit(log); },
};
