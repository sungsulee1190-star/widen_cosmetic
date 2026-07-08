# Trend Intelligence Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first durable WIDEN trend loop so trend signals, verification logs, scoring rules, and SKU recommendations are separated, testable, and reusable.

**Architecture:** Keep the current static dashboard architecture, but add a small pure JavaScript trend engine and JSON data files. Views should read computed recommendations instead of hardcoded first-SKU assumptions.

**Tech Stack:** Static HTML, CSS, browser JavaScript, JSON data files, Node-based static tests in `tests/dashboard-static.test.mjs`.

## Global Constraints

- Do not introduce a build system unless a later plan explicitly requires it.
- Keep JSON field names Notion-compatible so they can become database columns later.
- Do not make live scraping part of this MVP.
- Recommendations must be explainable with score breakdowns and missing evidence.
- A SKU must not become `testReady` without at least one A or B grade evidence item.
- Existing user changes and untracked files must not be reverted.

---

### Task 1: Add Trend Loop Seed Data

**Files:**
- Create: `data/trend-signals.json`
- Create: `data/trend-verifications.json`
- Create: `data/trend-score-rules.json`
- Modify: `js/data-store.js`
- Test: `tests/dashboard-static.test.mjs`

**Interfaces:**
- Consumes: existing `DataStore.load()` JSON loading pattern.
- Produces: `DataStore.trendSignals`, `DataStore.trendVerifications`, `DataStore.trendScoreRules`.

- [ ] **Step 1: Extend the static test first**

Add assertions:

```js
assert.ok(existsSync('data/trend-signals.json'), 'trend signal JSON exists');
assert.ok(existsSync('data/trend-verifications.json'), 'trend verification JSON exists');
assert.ok(existsSync('data/trend-score-rules.json'), 'trend score rule JSON exists');
assert.match(store, /trendSignals/, 'DataStore loads trend signals');
assert.match(store, /trendVerifications/, 'DataStore loads trend verification logs');
assert.match(store, /trendScoreRules/, 'DataStore loads trend score rules');
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
node tests/dashboard-static.test.mjs
```

Expected: failure mentioning missing trend JSON or missing `trendSignals`.

- [ ] **Step 3: Add seed JSON**

Create `data/trend-signals.json` with examples:

```json
[
  {
    "id": "sig-pdrn-boj-official-2026w27",
    "observedAt": "2026-07-08",
    "signalType": "officialProduct",
    "market": "japan",
    "platform": "Beauty of Joseon Official",
    "keyword": "PDRN",
    "brand": "Beauty of Joseon",
    "skuName": "붉은팥 PDRN 모공탄력 세럼 30mL",
    "ingredient": "PDRN",
    "category": "스킨케어",
    "sourceUrl": "https://beautyofjoseon.co.kr/product/new-%EB%B6%89%EC%9D%80%ED%8C%A5-pdrn-%EB%AA%A8%EA%B3%B5%ED%83%84%EB%A0%A5-%EC%84%B8%EB%9F%BC-30ml/182/category/1/display/2/?icid=MAIN.product_listmain_1",
    "sourceTitle": "[NEW] 붉은팥 PDRN 모공탄력 세럼 30mL",
    "evidenceGrade": "A",
    "confidence": 85,
    "freshnessDays": 90,
    "rawObservation": "공식몰 신제품명에 PDRN, 모공, 탄력 키워드가 함께 쓰임",
    "relatedSkuIds": [],
    "relatedIngredientIds": ["ing-pdrn"],
    "relatedBrandIds": [],
    "nextVerificationAction": "Qoo10 JP에서 PDRN serum 상위 상세페이지 5개 비교"
  },
  {
    "id": "sig-hyaluronic-torriden-sku-2026w27",
    "observedAt": "2026-07-08",
    "signalType": "marketplaceProduct",
    "market": "japan",
    "platform": "Qoo10 JP",
    "keyword": "ヒアルロン酸 セラム",
    "brand": "Torriden",
    "skuName": "토리든 다이브인 저분자 히알루론산 세럼",
    "ingredient": "히알루론산",
    "category": "스킨케어",
    "sourceUrl": "https://www.qoo10.jp/s/トリデン+ダイブイン+セラム",
    "sourceTitle": "Qoo10 JP Torriden search",
    "evidenceGrade": "B",
    "confidence": 78,
    "freshnessDays": 14,
    "rawObservation": "히알루론산 보습 키워드는 일본/대만 모두 범용성이 높음",
    "relatedSkuIds": ["sku-torriden-dive-in-serum"],
    "relatedIngredientIds": ["ing-hyaluronic-acid"],
    "relatedBrandIds": [],
    "nextVerificationAction": "Shopee TW에서 판매량/가격대 확인"
  }
]
```

Create `data/trend-verifications.json`:

```json
[
  {
    "id": "ver-pdrn-boj-official-page",
    "signalId": "sig-pdrn-boj-official-2026w27",
    "verifiedAt": "2026-07-08",
    "method": "pageCheck",
    "result": "confirmed",
    "verifiedBy": "Codex",
    "evidenceUrl": "https://beautyofjoseon.co.kr/product/new-%EB%B6%89%EC%9D%80%ED%8C%A5-pdrn-%EB%AA%A8%EA%B3%B5%ED%83%84%EB%A0%A5-%EC%84%B8%EB%9F%BC-30ml/182/category/1/display/2/?icid=MAIN.product_listmain_1",
    "driveAssetUrl": "",
    "note": "공식몰에서 PDRN 신제품명과 가격대 확인"
  }
]
```

Create `data/trend-score-rules.json`:

```json
[
  {
    "id": "rule-evidence-grade",
    "name": "근거 등급",
    "weight": 25,
    "appliesTo": "trendSignal",
    "positiveCondition": "A/B 등급 근거는 높은 신뢰도 부여",
    "negativeCondition": "D 등급 내부 메모는 추천 승격 불가",
    "maxScore": 100,
    "stalePenalty": 20,
    "explanation": "공식몰, 플랫폼 상세페이지, 캡처 근거를 SNS/메모보다 높게 평가한다."
  },
  {
    "id": "rule-freshness",
    "name": "데이터 신선도",
    "weight": 20,
    "appliesTo": "trendSignal",
    "positiveCondition": "observedAt + freshnessDays가 오늘 이후",
    "negativeCondition": "신선도 기간이 지난 신호",
    "maxScore": 100,
    "stalePenalty": 30,
    "explanation": "랭킹/가격/오프라인 재고 신호는 시간이 지나면 감점한다."
  },
  {
    "id": "rule-market-fit",
    "name": "국가 적합도",
    "weight": 20,
    "appliesTo": "skuIngredientMarket",
    "positiveCondition": "성분 DB의 국가 적합도가 4 이상",
    "negativeCondition": "규제 리스크 또는 낮은 적합도",
    "maxScore": 100,
    "stalePenalty": 0,
    "explanation": "일본/대만 시장별 성분 적합도를 추천 점수에 반영한다."
  }
]
```

- [ ] **Step 4: Load the new files**

Modify `js/data-store.js`:

```js
trendSignals: [],
trendVerifications: [],
trendScoreRules: [],
```

Add to `files` inside `load()`:

```js
trendSignals: 'data/trend-signals.json',
trendVerifications: 'data/trend-verifications.json',
trendScoreRules: 'data/trend-score-rules.json',
```

- [ ] **Step 5: Run test to verify it passes**

Run:

```bash
node tests/dashboard-static.test.mjs
```

Expected: `dashboard static checks passed`.

### Task 2: Add Pure Trend Engine

**Files:**
- Create: `js/trend-engine.js`
- Modify: `index.html`
- Modify: `tests/dashboard-static.test.mjs`

**Interfaces:**
- Consumes: arrays of SKUs, ingredients, trend signals, verifications, score rules.
- Produces: `TrendEngine.buildRecommendations({ skus, ingredients, trendSignals, trendVerifications, trendScoreRules, week, market })`.

- [ ] **Step 1: Add failing static test**

Add:

```js
const trendEngine = read('js/trend-engine.js');
assert.match(html, /js\/trend-engine\.js/, 'trend engine is loaded before views');
assert.match(trendEngine, /buildRecommendations/, 'trend engine builds SKU recommendations');
assert.match(trendEngine, /missingEvidence/, 'recommendations expose missing evidence');
assert.match(trendEngine, /scoreBreakdown/, 'recommendations expose score breakdown');
```

Run:

```bash
node tests/dashboard-static.test.mjs
```

Expected: fail because `js/trend-engine.js` does not exist.

- [ ] **Step 2: Create `js/trend-engine.js`**

Use:

```js
const TrendEngine = {
  buildRecommendations({ skus = [], ingredients = [], trendSignals = [], trendVerifications = [], week = '2026-W27', market = 'japan' }) {
    return skus.map(sku => {
      const normalized = this.normalizeSkuForTrend(sku);
      const signals = this.findSignalsForSku(normalized, trendSignals, market);
      const verifications = trendVerifications.filter(item => signals.some(signal => signal.id === item.signalId));
      const scoreBreakdown = this.scoreSku(normalized, signals, verifications, ingredients, market);
      const trendScore = Math.round(Object.values(scoreBreakdown).reduce((sum, value) => sum + value, 0) / Object.keys(scoreBreakdown).length);
      const missingEvidence = this.findMissingEvidence(signals, verifications);
      const finalRecommendation = this.pickRecommendation(trendScore, missingEvidence, normalized);

      return {
        id: `rec-${week}-${market}-${normalized.id}`,
        week,
        market,
        skuId: normalized.id,
        skuName: normalized.name,
        brand: normalized.brand,
        category: normalized.majorCategory,
        trendScore,
        scoreBreakdown,
        evidenceCount: signals.length,
        verifiedEvidenceCount: verifications.filter(item => item.result === 'confirmed').length,
        missingEvidence,
        finalRecommendation,
        recommendationReason: this.describeRecommendation(normalized, trendScore, signals, finalRecommendation),
        nextAction: signals[0]?.nextVerificationAction || 'Qoo10/Shopee 경쟁 페이지와 오프라인 소싱 근거를 추가 확인'
      };
    }).sort((a, b) => b.trendScore - a.trendScore);
  },

  normalizeSkuForTrend(sku) {
    const ingredientTags = sku.ingredientTags || sku.ingredients || [];
    const majorCategory = ['세럼', '세럼/앰플', '토너', '패드', '에센스'].includes(sku.category)
      ? '스킨케어'
      : sku.category === '선크림'
        ? '선케어'
        : sku.category === '클렌징'
          ? '클렌징/필링'
          : sku.category;

    return { ...sku, ingredientTags, majorCategory };
  },

  findSignalsForSku(sku, trendSignals, market) {
    return trendSignals.filter(signal => {
      const marketMatches = !signal.market || signal.market === market || signal.market === 'global';
      const skuMatches = (signal.relatedSkuIds || []).includes(sku.id)
        || signal.skuName === sku.name
        || signal.brand === sku.brand
        || sku.ingredientTags.includes(signal.ingredient)
        || signal.category === sku.majorCategory;
      return marketMatches && skuMatches;
    });
  },

  scoreSku(sku, signals, verifications, ingredients, market) {
    const bestEvidence = signals.some(signal => signal.evidenceGrade === 'A') ? 100
      : signals.some(signal => signal.evidenceGrade === 'B') ? 80
      : signals.some(signal => signal.evidenceGrade === 'C') ? 60
      : signals.length ? 40 : 20;
    const verificationScore = verifications.some(item => item.result === 'confirmed') ? 90 : signals.length ? 55 : 20;
    const ingredientScore = this.scoreIngredients(sku, ingredients, market);
    const competitionScore = Math.max(30, 100 - Number(sku.competitorCount || 0));
    const marginScore = Math.min(95, (parseFloat(sku.estimatedMargin || sku.margin || '0') || 0) * 7);

    return {
      evidence: bestEvidence,
      verification: verificationScore,
      ingredientFit: ingredientScore,
      competition: competitionScore,
      margin: marginScore
    };
  },

  scoreIngredients(sku, ingredients, market) {
    const key = market === 'taiwan' ? 'taiwan' : 'japan';
    const scores = sku.ingredientTags.map(tag => {
      const item = ingredients.find(ing => ing.name === tag || ing.id === tag || ing.fullName?.includes(tag));
      return item?.suitability?.[key] ? item.suitability[key] * 20 : 55;
    });
    return scores.length ? Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length) : 45;
  },

  findMissingEvidence(signals, verifications) {
    const missing = [];
    if (!signals.length) missing.push('시장 신호 없음');
    if (!signals.some(signal => ['A', 'B'].includes(signal.evidenceGrade))) missing.push('A/B 등급 근거 없음');
    if (!verifications.some(item => item.result === 'confirmed')) missing.push('검증 로그 없음');
    return missing;
  },

  pickRecommendation(trendScore, missingEvidence, sku) {
    if (missingEvidence.includes('A/B 등급 근거 없음') || missingEvidence.includes('검증 로그 없음')) return 'verifyMore';
    if ((sku.estimatedMargin || '').startsWith('5')) return 'watch';
    if (trendScore >= 75) return 'testReady';
    if (trendScore >= 55) return 'watch';
    return 'block';
  },

  describeRecommendation(sku, trendScore, signals, finalRecommendation) {
    const signalText = signals.length ? `${signals.length}개 신호` : '시장 신호 부족';
    const statusText = finalRecommendation === 'testReady' ? '테스트 판매 후보' : finalRecommendation === 'verifyMore' ? '근거 추가 확인 필요' : '관찰 필요';
    return `${sku.brand || ''} ${sku.name || ''}: ${signalText}, 점수 ${trendScore}점으로 ${statusText}`;
  }
};
```

- [ ] **Step 3: Load script before views**

Modify `index.html` script order:

```html
<script src="js/data-store.js"></script>
<script src="js/trend-engine.js"></script>
<script src="js/view-cockpit.js"></script>
```

- [ ] **Step 4: Run test**

Run:

```bash
node tests/dashboard-static.test.mjs
```

Expected: `dashboard static checks passed`.

### Task 3: Connect Recommendations To SKU Page

**Files:**
- Modify: `js/view-sku.js`
- Modify: `tests/dashboard-static.test.mjs`

**Interfaces:**
- Consumes: `TrendEngine.buildRecommendations(...)`.
- Produces: detail panel text for score breakdown, missing evidence, and next action.

- [ ] **Step 1: Add failing static test**

Add:

```js
assert.match(skuView, /TrendEngine\.buildRecommendations/, 'SKU view uses trend engine recommendations');
assert.match(skuView, /scoreBreakdown/, 'SKU detail renders recommendation score breakdown');
assert.match(skuView, /missingEvidence/, 'SKU detail renders missing evidence');
assert.match(skuView, /nextAction/, 'SKU detail renders next verification action');
```

Run:

```bash
node tests/dashboard-static.test.mjs
```

Expected: fail because SKU view does not use TrendEngine yet.

- [ ] **Step 2: Build recommendations inside `renderSkuView()`**

Add:

```js
const recommendations = typeof TrendEngine !== 'undefined'
  ? TrendEngine.buildRecommendations({
      skus,
      ingredients: DataStore.ingredients || [],
      trendSignals: DataStore.trendSignals || [],
      trendVerifications: DataStore.trendVerifications || [],
      trendScoreRules: DataStore.trendScoreRules || [],
      week: '2026-W27',
      market: 'japan'
    })
  : [];
```

When rendering cards and detail panels, attach matching recommendation by `skuId`.

- [ ] **Step 3: Render score and evidence in detail panel**

Add a compact detail section:

```js
function renderRecommendationEvidence(recommendation) {
  if (!recommendation) return '';
  const breakdown = Object.entries(recommendation.scoreBreakdown || {})
    .map(([key, value]) => `<span class="tag tag-ingredient">${key}: ${value}</span>`)
    .join('');
  const missing = (recommendation.missingEvidence || [])
    .map(item => `<li>${item}</li>`)
    .join('');

  return `
    <div class="recommendation-evidence">
      <h3>추천 근거</h3>
      <div class="sku-score-row">${breakdown}</div>
      <p class="product-detail-summary">${recommendation.recommendationReason}</p>
      ${missing ? `<h3>부족한 근거</h3><ul>${missing}</ul>` : ''}
      <h3>다음 검증 액션</h3>
      <p class="product-detail-summary">${recommendation.nextAction}</p>
    </div>
  `;
}
```

- [ ] **Step 4: Run test**

Run:

```bash
node tests/dashboard-static.test.mjs
```

Expected: pass.

### Task 4: Add Trend Loop Guard Tests

**Files:**
- Modify: `tests/dashboard-static.test.mjs`

**Interfaces:**
- Consumes: source files as strings and JSON files.
- Produces: test failures when the trend loop becomes hardcoded or unverifiable.

- [ ] **Step 1: Add JSON integrity checks**

Add:

```js
const trendSignals = JSON.parse(read('data/trend-signals.json'));
const verifications = JSON.parse(read('data/trend-verifications.json'));

assert.ok(trendSignals.every(item => item.id && item.observedAt && item.evidenceGrade && item.freshnessDays), 'trend signals include freshness and evidence grade');
assert.ok(verifications.every(item => item.signalId && item.result && item.verifiedAt), 'verification logs link back to signals');
assert.ok(trendSignals.some(item => ['A', 'B'].includes(item.evidenceGrade)), 'at least one high-grade evidence signal exists');
```

- [ ] **Step 2: Add anti-hardcoding checks**

Add:

```js
assert.doesNotMatch(skuView, /const selectedSku = skus\[0\]/, 'SKU detail must not stay pinned to first SKU');
assert.doesNotMatch(skuView, /VT 리들샷 100.*renderProductDetailPanel/, 'detail recommendation must not be pinned to VT');
```

- [ ] **Step 3: Run test**

Run:

```bash
node tests/dashboard-static.test.mjs
```

Expected: pass.

### Task 5: Document Claude Code Review Checklist In App Docs

**Files:**
- Create: `docs/superpowers/specs/2026-07-08-trend-intelligence-loop-review-checklist.md`

**Interfaces:**
- Consumes: design doc and this implementation plan.
- Produces: a review checklist that another coding agent can use.

- [ ] **Step 1: Add checklist doc**

Create the file with:

```md
# Trend Intelligence Loop Review Checklist

Use this when reviewing implementation changes for the WIDEN trend loop.

## Must Pass

- Recommendations are generated from trend signals, verifications, score rules, SKU data, and ingredient data.
- No recommended product is pinned to the first SKU or to VT 리들샷 100.
- Every trend signal has evidence grade, observed date, freshness days, and source URL or raw observation.
- Every verified recommendation can show score breakdown, missing evidence, and next action.
- A/B grade evidence and confirmed verification are required before `testReady`.
- Japan and Taiwan can be scored separately.
- Existing category filters still change the detail recommendation panel.
- Broken external images still show a fallback.
- Qoo10 competitor buttons do not point to the Qoo10 home page.

## Should Pass

- Adding a new platform only requires a new trend signal, not a new view rewrite.
- Adding a new ingredient only requires ingredient DB data and signal linkage.
- Old signals can be penalized or marked stale.
- Failed products can be logged as rejected or blocked with reasons.
```

- [ ] **Step 2: Run final static test**

Run:

```bash
node tests/dashboard-static.test.mjs
```

Expected: `dashboard static checks passed`.

