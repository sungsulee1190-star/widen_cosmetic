import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const C = require('../js/sku-catalog.js');
const load = name => JSON.parse(readFileSync(new URL(`../data/${name}.json`, import.meta.url), 'utf8'));

const sources = {
  skus: load('sku-list'),
  uploads: load('weekly-uploads'),
  trends: load('weekly-trends'),
  actions: load('actions'),
  ingredients: load('ingredients'),
  observations: load('observations')
};

// 데이터 무결성: 모든 skuId 참조가 SKU 목록에 존재
const records = C.createRecords(sources);
assert.deepEqual(records.unresolved(), [], 'every skuId reference resolves to a SKU');

// 업로드는 SKU 정보 복사본을 갖지 않는다 (레코드에서 가져옴)
sources.uploads.forEach(u => {
  assert.ok(u.skuId, 'upload has skuId');
  ['name', 'brand', 'imageUrl', 'domesticPrice', 'qoo10Price', 'estimatedMargin'].forEach(k =>
    assert.ok(!(k in u), `upload ${u.day} does not duplicate ${k}`));
});

// 연결: VT 리들샷에 업로드·트렌드·할 일·성분이 붙는다
const VT = 'sku-vt-riddle-shot-100';
const vtLinks = records.linked(VT);
assert.ok(vtLinks.uploads.length >= 1);
assert.ok(vtLinks.trends.length === 1);
assert.ok(vtLinks.actions.some(a => a.id === 'act-001'));
assert.ok(vtLinks.actions.some(a => a.scope === 'all'), 'scope:all actions attach to every SKU');
assert.ok(vtLinks.ingredients.some(i => i.id === 'ing-pdrn'));

// 이름으로 resolve (옛 자유 텍스트 기록 호환, 공백 무시)
assert.equal(records.resolve('VT 리들샷100')?.id, VT);
assert.equal(records.resolve('없는 제품'), null);

// 기간별 기록과 판정 — now 주입
const now = new Date('2026-07-31T00:00:00Z');
const weeksAgo = n => new Date(now - n * 7 * 864e5).toISOString().slice(0, 10);
const steadyObs = [0, 2, 5, 9, 14, 20].map(n => ({ skuId: VT, date: weeksAgo(n), kind: 'offline-visit' }));
const r2 = C.createRecords({ ...sources, observations: [
  ...steadyObs,
  { sku: '조선미녀 맑은쌀 선크림', date: weeksAgo(0), kind: 'offline-visit' },
  { sku: '조선미녀 맑은쌀 선크림', date: weeksAgo(1), kind: 'offline-visit' },
  { sku: '조선미녀 맑은쌀 선크림', date: weeksAgo(2), kind: 'offline-visit' },
  { skuId: 'sku-anua-heartleaf-77-toner', kind: 'note' } // 날짜 없음 → 집계 제외
] }, now);

const h = r2.history(VT);
assert.equal(h.windows.find(w => w.key === 'all').count, 6);
assert.equal(h.windows.find(w => w.key === 'week').count, 1);
assert.equal(h.windows.find(w => w.key === 'month').count, 2, '0w and 2w ago are within 30 days; 5w is not');
assert.equal(h.signal, '스테디 후보');
assert.equal(r2.history('sku-beauty-of-joseon-sunscreen').signal, '급상승 후보');
assert.equal(r2.history('sku-anua-heartleaf-77-toner').signal, '기록 부족', 'undated observation is not counted');
assert.equal(r2.history('sku-romand-juicy-lasting-tint').signal, '기록 부족');

// 타임라인은 최신순, 주차 필터는 실제 관찰 주에만 걸린다
const tl = r2.timeline(VT);
assert.ok(tl[0].date > tl[tl.length - 1].date);
const vt2 = r2.get(VT);
const week = C.isoWeek(new Date(weeksAgo(2) + 'T00:00:00Z'));
assert.ok(C.matchesFilters(vt2, { week }, 80));
assert.ok(!C.matchesFilters(r2.get('sku-romand-juicy-lasting-tint'), { week }, 80));
assert.ok(r2.weeks().includes(week));

// ISO 주차
assert.equal(C.isoWeek(new Date('2026-07-06T00:00:00Z')), '2026-W28');
assert.equal(C.isoWeek(new Date('2026-01-01T00:00:00Z')), '2026-W01');

console.log('sku records checks passed');
