// ============================================================
// WIDEN — sku-catalog.js · 제품 카탈로그 (정규화 · 필터 · 인기점수)
// DOM을 모르는 순수 로직. 브라우저에서는 전역 SkuCatalog, Node 테스트에서는 module.exports.
// ============================================================

(function (root) {
  const CATEGORIES = [
    { key: '전체', icon: '🧴' },
    { key: '향수', icon: '🧪' },
    { key: '립', icon: '💄' },
    { key: '베이스', icon: '🪞' },
    { key: '아이메이크업', icon: '🎨' },
    { key: '스킨케어', icon: '🧴' },
    { key: '선케어', icon: '☀️' },
    { key: '클렌징/필링', icon: '🫧' },
    { key: '바디케어', icon: '🧼' },
    { key: '헤어케어', icon: '🧖' },
    { key: '디바이스', icon: '🔋' },
    { key: '헬스/푸드', icon: '🥤' },
    { key: '쉐이빙/제모', icon: '🪒' }
  ];

  // 원본 데이터의 세부 카테고리 → 대분류. 여기 없는 값은 대분류 이름 그대로이거나 '기타'.
  const SUBCATEGORY_TO_MAJOR = {
    '세럼': '스킨케어', '세럼/앰플': '스킨케어', '토너': '스킨케어', '패드': '스킨케어',
    '에센스': '스킨케어', '크림': '스킨케어', '로션': '스킨케어', '마스크팩': '스킨케어',
    '선크림': '선케어', '선스틱': '선케어',
    '클렌징': '클렌징/필링', '필링': '클렌징/필링',
    '쿠션': '베이스', '파운데이션': '베이스',
    '틴트': '립', '립밤': '립'
  };
  const MAJOR_KEYS = new Set(CATEGORIES.map(c => c.key).filter(k => k !== '전체'));

  const PLATFORMS = ['올리브영', '무신사뷰티', '다이소', 'Qoo10 JP', 'Shopee TW'];

  const WEIGHT_FACTORS = [
    { key: 'ranking', label: '플랫폼 랭킹', desc: '올리브영/무신사/Qoo10 상위 노출', default: 25 },
    { key: 'reactions', label: '조회·댓글 반응', desc: '콘텐츠 조회수, 댓글, 리뷰 언급', default: 15 },
    { key: 'sales', label: '예상 판매량', desc: '리뷰 수, 판매량, 샵 운영 규모', default: 20 },
    { key: 'offline', label: '오프라인 신호', desc: '명동/성수/홍대 진열, 품절, 관광객 반응', default: 10 },
    { key: 'margin', label: '마진 가능성', desc: '국내 소싱가와 해외 판매가 차이', default: 20 },
    { key: 'competition', label: '경쟁 강도', desc: '경쟁 판매자 수가 낮을수록 가점', default: 10 }
  ];
  const DEFAULT_WEIGHTS = Object.fromEntries(WEIGHT_FACTORS.map(f => [f.key, f.default]));

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
  }

  // http(s) 링크만 허용 — javascript: 등은 버림.
  function safeUrl(url) {
    if (!url) return '';
    try {
      const parsed = new URL(String(url), 'https://placeholder.invalid');
      return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? String(url) : '';
    } catch {
      return '';
    }
  }

  function toMajorCategory(category) {
    if (!category) return '기타';
    if (SUBCATEGORY_TO_MAJOR[category]) return SUBCATEGORY_TO_MAJOR[category];
    if (MAJOR_KEYS.has(category)) return category;
    return '기타';
  }

  // "5~10%" → { min: 5, max: 10, mid: 7.5 }. 숫자 하나("12%")도 허용.
  function parseMargin(text) {
    const nums = String(text || '').match(/\d+(\.\d+)?/g);
    if (!nums) return null;
    const min = Number(nums[0]);
    const max = Number(nums[1] ?? nums[0]);
    return { min, max, mid: (min + max) / 2 };
  }

  function formatPrice(value, currency) {
    if (value === undefined || value === null || value === '' || Number.isNaN(Number(value))) return '—';
    if (currency === 'JPY') return `¥${Number(value).toLocaleString('ja-JP')}`;
    if (currency === 'TWD') return `NT$${Number(value).toLocaleString('zh-TW')}`;
    return `₩${Number(value).toLocaleString('ko-KR')}`;
  }

  function buildLinks(sku) {
    return [
      { label: sku.domesticSource || '국내 소싱처', url: sku.domesticUrl },
      { label: 'Qoo10 검색', url: sku.qoo10SearchUrl },
      { label: 'Shopee 검색', url: sku.shopeeSearchUrl },
      { label: 'Notion DB', url: sku.notionLink },
      { label: 'Drive 자료', url: sku.driveLink }
    ].map(l => ({ ...l, url: safeUrl(l.url) })).filter(l => l.url);
  }

  // 실제로 근거가 있는 플랫폼만: 국내 소싱처 + 해외 판매 데이터가 있는 채널.
  function derivePlatforms(sku) {
    const platforms = new Set(sku.platforms || []);
    if (sku.domesticSource) platforms.add(sku.domesticSource);
    if (sku.qoo10SearchUrl || sku.qoo10Price) platforms.add('Qoo10 JP');
    if (sku.shopeeSearchUrl || sku.shopeePrice) platforms.add('Shopee TW');
    return [...platforms];
  }

  function buildPros(sku) {
    const pros = [];
    if (sku.status === '트렌드') pros.push('최근 트렌드 신호가 강해 테스트 등록 후보로 적합');
    if (sku.status === '스테디') pros.push('반복 노출되는 스테디 후보라 누적 판매 판단에 유리');
    if (sku.marginRange && sku.marginRange.mid >= 10) pros.push(`마진 ${sku.margin}로 단품/세트 테스트 여지 있음`);
    if (sku.competitorCount > 0 && sku.competitorCount <= 20) pros.push(`경쟁 판매자 ${sku.competitorCount}개로 진입 여지 있음`);
    if (sku.ingredients.length) pros.push(`${sku.ingredients.join(', ')} 성분/키워드로 상세페이지 카피 확장 가능`);
    return pros.length ? pros : ['제품 사진과 판매 링크가 있어 비교 조사 시작이 쉬움'];
  }

  function buildCons(sku) {
    const cons = [];
    if (sku.competitorCount >= 35) cons.push(`경쟁 판매자 ${sku.competitorCount}개 — 가격 경쟁과 상세페이지 차별화 필요`);
    if (sku.marginRange && sku.marginRange.mid < 10) cons.push(`마진 ${sku.margin}로 폭이 얇아 세트 구성이나 쿠폰 전략 검토 필요`);
    if (!sku.marginRange) cons.push('마진 정보가 없어 원가/판매가 확인 필요');
    if (!sku.lastOfflineCheck) cons.push('오프라인 현장 확인 기록 없음');
    if (!safeUrl(sku.notionLink)) cons.push('Notion 상세 DB 연결이 아직 없어 누적 기록 보강 필요');
    return cons.length ? cons : ['규제 표현과 해외 리뷰 반응은 추가 확인 필요'];
  }

  function normalizeSku(raw) {
    const ingredients = raw.ingredients || raw.ingredientTags || [];
    const margin = raw.estimatedMargin || raw.margin || '';
    const majorCategory = toMajorCategory(raw.category);
    const sku = {
      ...raw,
      name: raw.name || '',
      brand: raw.brand || '',
      status: raw.status || '관찰',
      majorCategory,
      image: safeUrl(raw.image || raw.imageUrl),
      ingredients,
      margin,
      marginRange: parseMargin(margin),
      competitorCount: Number(raw.competitorCount || 0),
      domesticPriceText: formatPrice(raw.domesticPrice, 'KRW'),
      qoo10PriceText: formatPrice(raw.qoo10Price, raw.qoo10Currency || 'JPY'),
      links: buildLinks(raw),
      platforms: derivePlatforms(raw),
      // 관찰된 주차. createRecords가 실제 기록(observations)으로 채운다 — 가짜 이력을 만들지 않는다.
      weeks: []
    };
    sku.searchText = [sku.name, sku.brand, sku.category, majorCategory, sku.status, sku.trendType, ...ingredients]
      .filter(Boolean).join(' ').toLowerCase();
    sku.pros = raw.pros || buildPros(sku);
    sku.cons = raw.cons || buildCons(sku);
    return sku;
  }

  // 가중치를 합계 대비 비율(%)로. 합계 0이면 null.
  function weightShares(weights) {
    const total = WEIGHT_FACTORS.reduce((sum, f) => sum + Math.max(0, Number(weights[f.key]) || 0), 0);
    if (total === 0) return null;
    return Object.fromEntries(WEIGHT_FACTORS.map(f => [f.key, (Math.max(0, Number(weights[f.key]) || 0) / total) * 100]));
  }

  function factorScores(sku) {
    const marginMid = sku.marginRange ? sku.marginRange.mid : 0;
    return {
      ranking: sku.status === '트렌드' ? 92 : sku.status === '스테디' ? 78 : 66,
      reactions: Math.min(95, 55 + sku.ingredients.length * 8 + (sku.status === '트렌드' ? 18 : 8)),
      sales: Math.min(95, 50 + Math.max(0, 45 - sku.competitorCount / 2)),
      offline: sku.lastOfflineCheck ? 76 : 40,
      margin: Math.min(95, marginMid * 7),
      competition: Math.max(30, 100 - sku.competitorCount)
    };
  }

  // 가중치가 모두 0이면 null (점수 산정 불가).
  function popularityScore(sku, weights) {
    const shares = weightShares(weights);
    if (!shares) return null;
    const scores = factorScores(sku);
    return Math.round(WEIGHT_FACTORS.reduce((sum, f) => sum + scores[f.key] * shares[f.key], 0) / 100);
  }

  function matchesFilters(sku, criteria, score) {
    const query = (criteria.query || '').toLowerCase().trim();
    if (query && !sku.searchText.includes(query)) return false;
    if (criteria.category && criteria.category !== '전체' && sku.majorCategory !== criteria.category) return false;
    if (criteria.week && criteria.week !== '전체' && !sku.weeks.includes(criteria.week)) return false;
    if (criteria.platform && criteria.platform !== '전체' && !sku.platforms.includes(criteria.platform)) return false;
    if (criteria.status && criteria.status !== '전체' && sku.status !== criteria.status) return false;
    if (criteria.minScore && (score ?? 0) < criteria.minScore) return false;
    return true;
  }

  function categoryCounts(skus) {
    const counts = { '전체': skus.length };
    skus.forEach(s => { counts[s.majorCategory] = (counts[s.majorCategory] || 0) + 1; });
    return counts;
  }

  // ── SKU 레코드: 모든 데이터가 skuId로 붙는 허브 ──────────────────

  const DAY_MS = 24 * 60 * 60 * 1000;
  const HISTORY_WINDOWS = [
    { key: 'week', label: '1주', days: 7 },
    { key: 'month', label: '1개월', days: 30 },
    { key: 'quarter', label: '3개월', days: 91 },
    { key: 'half', label: '6개월', days: 182 },
    { key: 'all', label: '누적', days: Infinity }
  ];

  function parseDate(value) {
    if (!value || !/^\d{4}-\d{2}-\d{2}/.test(String(value))) return null;
    const d = new Date(`${String(value).slice(0, 10)}T00:00:00Z`);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  // ISO 8601 주차 ("2026-W28")
  function isoWeek(date) {
    const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const week = Math.ceil(((d - yearStart) / DAY_MS + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
  }

  /**
   * SKU 레코드 module. 원본 데이터 묶음을 받아 skuId 기준으로 연결한다.
   * sources: { skus, uploads, trends, actions, ingredients, observations }
   *   observations: [{ skuId | sku(이름), date: 'YYYY-MM-DD', kind, source, summary }]
   * now: 기간 집계 기준일 (테스트용 주입)
   */
  function createRecords(sources, now = new Date()) {
    const products = (sources.skus || []).map(normalizeSku);
    const byId = new Map(products.map(p => [p.id, p]));
    const byName = new Map(products.map(p => [p.name.replace(/\s+/g, ''), p]));

    // id 우선, 없으면 표시 이름으로 (옛 자유 텍스트 기록 호환)
    function resolve(idOrName) {
      if (!idOrName) return null;
      if (byId.has(idOrName)) return byId.get(idOrName);
      return byName.get(String(idOrName).replace(/\s+/g, '')) || null;
    }

    const links = new Map(products.map(p => [p.id, { uploads: [], trends: [], actions: [], ingredients: [] }]));
    const attach = (skuId, kind, item) => { if (links.has(skuId)) links.get(skuId)[kind].push(item); };

    (sources.uploads || []).forEach(u => attach(u.skuId, 'uploads', u));
    (sources.trends || []).forEach(t => attach(t.skuId, 'trends', t));
    (sources.actions || []).forEach(a => {
      const ids = a.scope === 'all' ? products.map(p => p.id) : (a.skuIds || []);
      ids.forEach(id => attach(id, 'actions', a));
    });
    (sources.ingredients || []).forEach(i => (i.representativeSkuIds || []).forEach(id => attach(id, 'ingredients', i)));

    const observations = (sources.observations || []).map(o => {
      const sku = resolve(o.skuId) || resolve(o.sku);
      const date = parseDate(o.date);
      return { ...o, skuId: sku ? sku.id : null, dateObj: date, week: date ? isoWeek(date) : null };
    });

    const weeksBySku = new Map();
    observations.forEach(o => {
      if (!o.skuId || !o.week) return;
      if (!weeksBySku.has(o.skuId)) weeksBySku.set(o.skuId, new Set());
      weeksBySku.get(o.skuId).add(o.week);
    });
    products.forEach(p => { p.weeks = [...(weeksBySku.get(p.id) || [])].sort(); });

    function timeline(skuId) {
      return observations
        .filter(o => o.skuId === skuId && o.dateObj)
        .sort((a, b) => b.dateObj - a.dateObj);
    }

    // 기간별 관찰 횟수와 관찰된 주 수. 날짜 없는 기록은 세지 않는다.
    function history(skuId) {
      const items = timeline(skuId);
      const windows = HISTORY_WINDOWS.map(w => {
        const inWindow = items.filter(o => (now - o.dateObj) / DAY_MS < w.days && o.dateObj <= now);
        return { ...w, count: inWindow.length, weeks: new Set(inWindow.map(o => o.week)).size };
      });
      return { windows, signal: classify(windows), weeks: [...new Set(items.map(o => o.week))] };
    }

    // 기록으로부터의 판정. 근거가 부족하면 '기록 부족'으로 정직하게.
    function classify(windows) {
      const get = k => windows.find(w => w.key === k);
      if (get('half').weeks >= 6 && get('month').count > 0) return '스테디 후보';
      if (get('month').weeks >= 2 && get('month').count >= get('half').count * 0.6 && get('half').count >= 3) return '급상승 후보';
      if (get('all').count === 0) return '기록 부족';
      return '관찰 중';
    }

    function linked(skuId) {
      return links.get(skuId) || { uploads: [], trends: [], actions: [], ingredients: [] };
    }

    // 데이터 무결성: 어떤 SKU에도 연결되지 않은 참조
    function unresolved() {
      const out = [];
      (sources.uploads || []).forEach(u => !byId.has(u.skuId) && out.push({ source: 'weekly-uploads', ref: u.skuId }));
      (sources.trends || []).forEach(t => t.skuId && !byId.has(t.skuId) && out.push({ source: 'weekly-trends', ref: t.skuId }));
      (sources.actions || []).forEach(a => (a.skuIds || []).forEach(id => !byId.has(id) && out.push({ source: 'actions', ref: id })));
      (sources.ingredients || []).forEach(i => (i.representativeSkuIds || []).forEach(id => !byId.has(id) && out.push({ source: 'ingredients', ref: id })));
      observations.forEach(o => !o.skuId && out.push({ source: 'observations', ref: o.sku || o.skuId || '' }));
      return out;
    }

    return {
      list: () => products,
      get: id => byId.get(id) || null,
      resolve,
      linked,
      timeline,
      history,
      unresolved,
      weeks: () => [...new Set(observations.filter(o => o.week).map(o => o.week))].sort()
    };
  }

  const SkuCatalog = {
    CATEGORIES, PLATFORMS, WEIGHT_FACTORS, DEFAULT_WEIGHTS, HISTORY_WINDOWS,
    escapeHtml, safeUrl, toMajorCategory, parseMargin, formatPrice, isoWeek,
    normalizeSku, weightShares, popularityScore, matchesFilters, categoryCounts,
    createRecords
  };

  root.SkuCatalog = SkuCatalog;
  if (typeof module !== 'undefined' && module.exports) module.exports = SkuCatalog;
})(typeof window !== 'undefined' ? window : globalThis);
