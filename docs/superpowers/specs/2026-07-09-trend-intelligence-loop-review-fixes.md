# Trend Intelligence Loop — 코드 리뷰 수정 로그

날짜: 2026-07-09  
리뷰어: Claude Code  
대상 커밋: ccff7df (Add trend intelligence loop)  
테스트 결과: `dashboard static checks passed` ✅

---

## 수정 내역

### Fix 1 — `trendScoreRules` 파라미터 누락
**파일:** `js/trend-engine.js`  
**문제:** `view-sku.js`에서 `trendScoreRules`를 전달했지만 `buildRecommendations` 함수 시그니처에 파라미터가 없어 사일런트 무시됨.  
**수정:** 파라미터 구조분해에 `trendScoreRules = []` 추가.

```js
// 수정 전
buildRecommendations({ skus, ingredients, trendSignals, trendVerifications, week, market })

// 수정 후
buildRecommendations({ skus, ingredients, trendSignals, trendVerifications, trendScoreRules, week, market })
```

---

### Fix 2 — margin 조건 불투명
**파일:** `js/trend-engine.js` — `pickRecommendation()`  
**문제:** `(sku.estimatedMargin || '').startsWith('5')` 조건이 왜 5인지 의도가 불명확. 실제 데이터는 `"5~10%"` 형식.  
**수정:** `parseInt(...) < 8`로 변경 — 저마진(5~10%) 제품을 watch로 강제하는 의도를 명시.

```js
// 수정 전
if ((sku.estimatedMargin || '').startsWith('5')) return 'watch';

// 수정 후
if (parseInt(sku.estimatedMargin || '0', 10) < 8) return 'watch';
```

---

### Fix 3 — week 하드코딩 제거
**파일:** `js/trend-engine.js`, `js/view-sku.js`  
**문제:** `week: '2026-W27'`로 고정되어 있어 현재 주차와 불일치.  
**수정:** `getCurrentISOWeek()` 헬퍼 함수를 trend-engine.js에 추가, 기본값으로 사용. view-sku.js에서 week 하드코딩 제거.

```js
// trend-engine.js에 추가
function getCurrentISOWeek() {
  const date = new Date();
  const dayOfWeek = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayOfWeek);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
}
```

---

### Fix 4 — 대만 시장 시드 데이터 없음
**파일:** `data/trend-signals.json`  
**문제:** 기존 신호 2개 모두 `"market": "japan"`. 대만 시장 점수 계산 시 ingredientScore가 항상 기본값(45~55)으로 폴백.  
**수정:** Shopee TW COSRX 달팽이 신호 추가 (`evidenceGrade: "B"`, `market: "taiwan"`).

---

### Fix 5 — market 하드코딩 + 필터 연동 누락
**파일:** `js/view-sku.js`  
**문제:** `buildSkuRecommendations`에서 `market: 'japan'`이 하드코딩되어 대만 신호가 UI에 반영되지 않음. 플랫폼 필터에서 Shopee TW 선택 시에도 일본 점수로 계산됨.  
**수정:**  
- `detectMarketFromPlatform(platform)` 헬퍼 추가 (`'Shopee TW'` → `'taiwan'`, 나머지 → `'japan'`)
- `buildSkuRecommendations(skus, market = 'japan')` 파라미터화
- `syncSkuDetailWithFilters`에서 플랫폼 필터 값을 읽어 market 자동 감지 후 전달

---

## 미수정 — 다음 이터레이션 권장

| 항목 | 이유 |
|------|------|
| 코크핏 레이더(`renderTrendSignalRadar`)를 `DataStore.trendSignals`에 연결 | MVP 범위 초과, 별도 설계 필요 |
| 대만 시장 신호 추가 수집 | 데이터 부족, 실제 조사 필요 |
| `trendScoreRules` JSON을 실제 점수 계산에 활용 | 엔진 로직 대규모 리팩터링 필요 |
