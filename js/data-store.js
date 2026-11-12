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
  references: {},
  loadErrors: [],

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
      references: 'data/references.json',
    };

    this.loadErrors = [];
    const entries = Object.entries(files);
    const results = await Promise.all(
      entries.map(([key, url]) =>
        fetch(url)
          .then(r => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.json();
          })
          .catch(err => {
            // 실패를 조용히 삼키지 않고 기록 → app.js 가 화면 상단에 안내
            this.loadErrors.push({ file: url, message: err.message });
            return Array.isArray(this[key]) ? [] : {};
          })
      )
    );
    entries.forEach(([key], i) => {
      this[key] = results[i];
    });
  },

  // ── Action states (LocalStorage) ──
  getActionState(actionId) {
    const states = readStore('widen-action-states', {});
    return states[actionId] || '미완료';
  },
  setActionState(actionId, state) {
    const states = readStore('widen-action-states', {});
    states[actionId] = state;
    writeStore('widen-action-states', states);
  },
  // "남은 액션" 정의를 한 곳에서 관리 (예전엔 사이드바 배지와 요약 카드 기준이 달랐음)
  // 미완료 + 진행중 = 남은 일. 완료·보류는 제외.
  countOpenActions() {
    return (this.actions || []).filter(a => {
      const state = this.getActionState(a.id);
      return state === '미완료' || state === '진행중';
    }).length;
  },

  // ── Upload checklist (LocalStorage) ──
  getUploadChecks(day) {
    const checks = readStore('widen-upload-checks', {});
    return checks[day] || {};
  },
  setUploadCheck(day, key, checked) {
    const checks = readStore('widen-upload-checks', {});
    if (!checks[day]) checks[day] = {};
    checks[day][key] = checked;
    writeStore('widen-upload-checks', checks);
  },

  // ── Favorites (LocalStorage) ──
  getFavorites() {
    const favs = readStore('widen-favorites', []);
    return Array.isArray(favs) ? favs : [];
  },
  toggleFavorite(skuId) {
    const favs = this.getFavorites();
    const idx = favs.indexOf(skuId);
    if (idx === -1) favs.push(skuId);
    else favs.splice(idx, 1);
    writeStore('widen-favorites', favs);
  },
  isFavorite(skuId) {
    return this.getFavorites().includes(skuId);
  },

  // ── Visit logs (LocalStorage) ──
  getVisitLogs() {
    const logs = readStore('widen-visit-logs', []);
    return Array.isArray(logs) ? logs : [];
  },
  addVisitLog(log) {
    const logs = this.getVisitLogs();
    log.id = Date.now().toString();
    logs.unshift(log);
    writeStore('widen-visit-logs', logs);
  },
  deleteVisitLog(logId) {
    writeStore('widen-visit-logs', this.getVisitLogs().filter(l => l.id !== logId));
  },
};
