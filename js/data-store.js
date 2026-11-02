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

  // ── Action states (LocalStorage) ──
  getActionState(actionId) {
    const states = JSON.parse(localStorage.getItem('widen-action-states') || '{}');
    return states[actionId] || '미완료';
  },
  setActionState(actionId, state) {
    const states = JSON.parse(localStorage.getItem('widen-action-states') || '{}');
    states[actionId] = state;
    localStorage.setItem('widen-action-states', JSON.stringify(states));
  },

  // ── Upload checklist (LocalStorage) ──
  getUploadChecks(day) {
    const checks = JSON.parse(localStorage.getItem('widen-upload-checks') || '{}');
    return checks[day] || {};
  },
  setUploadCheck(day, key, checked) {
    const checks = JSON.parse(localStorage.getItem('widen-upload-checks') || '{}');
    if (!checks[day]) checks[day] = {};
    checks[day][key] = checked;
    localStorage.setItem('widen-upload-checks', JSON.stringify(checks));
  },

  // ── Favorites (LocalStorage) ──
  getFavorites() {
    return JSON.parse(localStorage.getItem('widen-favorites') || '[]');
  },
  toggleFavorite(skuId) {
    const favs = this.getFavorites();
    const idx = favs.indexOf(skuId);
    if (idx === -1) favs.push(skuId);
    else favs.splice(idx, 1);
    localStorage.setItem('widen-favorites', JSON.stringify(favs));
  },
  isFavorite(skuId) {
    return this.getFavorites().includes(skuId);
  },

  // ── Visit logs (LocalStorage) ──
  getVisitLogs() {
    return JSON.parse(localStorage.getItem('widen-visit-logs') || '[]');
  },
  addVisitLog(log) {
    const logs = this.getVisitLogs();
    log.id = Date.now().toString();
    logs.unshift(log);
    localStorage.setItem('widen-visit-logs', JSON.stringify(logs));
  },
};
