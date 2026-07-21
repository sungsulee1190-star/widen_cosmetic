// ============================================================
// WIDEN DataStore - JSON loader + shared user state facade
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
  trendSignals: [],
  trendVerifications: [],
  trendScoreRules: [],
  scorecard: null,

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
      trendSignals: 'data/trend-signals.json',
      trendVerifications: 'data/trend-verifications.json',
      trendScoreRules: 'data/trend-score-rules.json',
      scorecard: 'data/scorecard-v1.json',
    };

    const entries = Object.entries(files);
    const results = await Promise.all(
      entries.map(([, url]) =>
        fetch(url).then(r => r.json()).catch(() => null)
      )
    );
    entries.forEach(([key], i) => {
      this[key] = results[i] || (key === 'seasonCalendar' ? {} : []);
    });

    if (window.AppStorage) {
      await window.AppStorage.load();
    }
  },

  getSharedState(key, fallback) {
    if (window.AppStorage) return window.AppStorage.get(key, fallback);
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  },

  setSharedState(key, value) {
    if (window.AppStorage) window.AppStorage.set(key, value);
    else localStorage.setItem(key, JSON.stringify(value));
  },

  getActionState(actionId) {
    const states = this.getSharedState('widen-action-states', {});
    return states[actionId] || '미완료';
  },

  setActionState(actionId, state) {
    const states = this.getSharedState('widen-action-states', {});
    states[actionId] = state;
    this.setSharedState('widen-action-states', states);
  },

  getUploadChecks(day) {
    const checks = this.getSharedState('widen-upload-checks', {});
    return checks[day] || {};
  },

  setUploadCheck(day, key, checked) {
    const checks = this.getSharedState('widen-upload-checks', {});
    if (!checks[day]) checks[day] = {};
    checks[day][key] = checked;
    this.setSharedState('widen-upload-checks', checks);
  },

  getFavorites() {
    return this.getSharedState('widen-favorites', []);
  },

  toggleFavorite(skuId) {
    const favs = this.getFavorites();
    const idx = favs.indexOf(skuId);
    if (idx === -1) favs.push(skuId);
    else favs.splice(idx, 1);
    this.setSharedState('widen-favorites', favs);
  },

  isFavorite(skuId) {
    return this.getFavorites().includes(skuId);
  },

  getVisitLogs() {
    return this.getSharedState('widen-visit-logs', []);
  },

  addVisitLog(log) {
    const logs = this.getVisitLogs();
    const nextLog = {
      ...log,
      id: log.id || Date.now().toString(),
    };
    logs.unshift(nextLog);
    this.setSharedState('widen-visit-logs', logs);
  },

  getCandidates() {
    const stored = this.getSharedState('widen-candidates', null);
    if (stored && Array.isArray(stored) && stored.length > 0) return stored;
    
    // Default sample candidates following scorecard-v1 schema
    const defaultCandidates = [
      {
        id: 'cand-001',
        name: 'VT 리들샷 100 앰플 50ml',
        country: 'JP',
        category: '스킨케어/모공케어',
        domesticCost: 21000,
        targetPrice: 3500, // 3,500 엔
        currency: 'JPY',
        collectedAt: '2026-07-20',
        week: '2026-W29',
        evidence: [
          { type: '목표국가 demand', source: 'Qoo10 Japan', url: 'https://www.qoo10.jp', label: 'Qoo10 종합 랭킹 1위 노출' },
          { type: '검색 demand', source: 'Google Trends', url: 'https://trends.google.com', label: '리들샷 검색량 12개월 상승세 유지' },
          { type: '국내 supply', source: '올리브영', url: 'https://www.oliveyoung.co.kr', label: '올리브영 온/오프라인 수급 안정적' }
        ],
        scores: {
          target_demand: 5,
          review_persistence: 5,
          search_trend: 4,
          supply_feasibility: 5,
          price_competitiveness: 4,
          social_potential: 5,
          detail_page_difficulty: 4,
          repurchase_potential: 4,
          operational_risk: 4
        },
        decision: '추천',
        reason: 'Qoo10 Japan 지속 상위권 및 높은 SNS 화제성. 원가율 및 수급 안정성 우수'
      },
      {
        id: 'cand-002',
        name: '아누아 어성초 77 수딩 토너 250ml',
        country: 'JP',
        category: '스킨케어/진정토너',
        domesticCost: 14000,
        targetPrice: 2650,
        currency: 'JPY',
        collectedAt: '2026-07-21',
        week: '2026-W29',
        evidence: [
          { type: '목표국가 demand', source: 'Qoo10 Japan', url: 'https://www.qoo10.jp', label: '진정 토너 부문 Top 3' },
          { type: '소셜 potential', source: 'TikTok', url: 'https://www.tiktok.com', label: '#ドクダミトナー 해시태그 확산' },
          { type: '국내 supply', source: '올리브영', url: 'https://www.oliveyoung.co.kr', label: '올리브영 행사 수급 용이' }
        ],
        scores: {
          target_demand: 4,
          review_persistence: 4,
          search_trend: 4,
          supply_feasibility: 5,
          price_competitiveness: 3,
          social_potential: 4,
          detail_page_difficulty: 5,
          repurchase_potential: 5,
          operational_risk: 5
        },
        decision: '추천',
        reason: '일본 내 어성초(ドクダミ) 성분 스테디셀러. 재구매율 높음'
      },
      {
        id: 'cand-003',
        name: '롬앤 쥬시 래스팅 틴트 5.5g',
        country: 'TW',
        category: '색조/립메이크업',
        domesticCost: 7500,
        targetPrice: 320, // 320 TWD
        currency: 'TWD',
        collectedAt: '2026-07-21',
        week: '2026-W29',
        evidence: [
          { type: '목표국가 demand', source: 'momo Taiwan', url: 'https://www.momoshop.com.tw', label: 'momo 립 랭킹 상위' },
          { type: '소셜 potential', source: 'Shopee TW', url: 'https://shopee.tw', label: '번체자 리뷰 5,000건 이상' }
        ],
        scores: {
          target_demand: 4,
          review_persistence: 4,
          search_trend: 3,
          supply_feasibility: 4,
          price_competitiveness: 3,
          social_potential: 4,
          detail_page_difficulty: 4,
          repurchase_potential: 3,
          operational_risk: 4
        },
        decision: '보류',
        reason: '인기도는 높으나 현지 단가 경쟁 심화로 마진율 재검토 필요'
      },
      {
        id: 'cand-004',
        name: '다이소 드롭비 어성초 진정 앰플 30ml',
        country: 'JP',
        category: '스킨케어/가성비',
        domesticCost: 3000,
        targetPrice: 1200,
        currency: 'JPY',
        collectedAt: '2026-07-22',
        week: '2026-W29',
        evidence: [
          { type: '국내 supply', source: '다이소 오프라인', url: '', label: '다이소 뷰티 가성비 라인' }
        ],
        scores: {
          target_demand: 2,
          review_persistence: 2,
          search_trend: 3,
          supply_feasibility: 3,
          price_competitiveness: 5,
          social_potential: 4,
          detail_page_difficulty: 4,
          repurchase_potential: 2,
          operational_risk: 3
        },
        decision: '검증 중',
        reason: '가격 경쟁력은 매우 높으나 현지 출처 근거가 부족하여 교차검증 진행 중'
      }
    ];
    this.setSharedState('widen-candidates', defaultCandidates);
    return defaultCandidates;
  },

  saveCandidate(candidate) {
    const candidates = this.getCandidates();
    const idx = candidates.findIndex(c => c.id === candidate.id);
    if (idx >= 0) candidates[idx] = candidate;
    else candidates.unshift(candidate);
    this.setSharedState('widen-candidates', candidates);
  },

  calculateCandidateScore(scores) {
    if (!scores) return 0;
    const weights = {
      target_demand: 20,
      review_persistence: 10,
      search_trend: 10,
      supply_feasibility: 10,
      price_competitiveness: 10,
      social_potential: 10,
      detail_page_difficulty: 10,
      repurchase_potential: 10,
      operational_risk: 10
    };
    let totalScore = 0;
    Object.keys(weights).forEach(key => {
      const score = Number(scores[key]) || 0; // 0..5
      totalScore += (score / 5) * weights[key];
    });
    return Math.round(totalScore);
  }
};

