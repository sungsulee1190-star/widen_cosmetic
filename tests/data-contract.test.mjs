// 데이터(JSON) ↔ 코드 계약 테스트
// 이번 리뷰에서 발견된 버그 대부분이 "JSON 키 이름 ≠ 코드가 읽는 키 이름" 이었음.
// JSON 을 수정하거나 구글 시트에서 새로 뽑아올 때 이 테스트로 먼저 확인할 것.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const json = (p) => JSON.parse(readFileSync(p, 'utf8'));

// ── 1. utils.js 순수 함수 ──
const ctx = {};
vm.createContext(ctx);
vm.runInContext(readFileSync('js/utils.js', 'utf8') + '\n;Object.assign(globalThis,{esc,safeUrl,stars,parseMarginRange,normalizeLinks,localDateISO,todayDayKey});', ctx);

assert.equal(ctx.esc('<img onerror="x">'), '&lt;img onerror=&quot;x&quot;&gt;', 'esc escapes HTML');
assert.equal(ctx.safeUrl('javascript:alert(1)'), '', 'safeUrl blocks javascript:');
assert.equal(ctx.safeUrl('https://qoo10.jp'), 'https://qoo10.jp');
assert.equal(ctx.stars(7), '★★★★★', 'stars clamps above 5');
assert.equal(ctx.stars(-1), '☆☆☆☆☆', 'stars clamps below 0');
assert.equal(ctx.parseMarginRange('5~10%'), 7.5, 'margin range uses midpoint');
assert.equal(ctx.parseMarginRange(''), 0);
assert.deepEqual(
  JSON.parse(JSON.stringify(ctx.normalizeLinks({ qoo10: 'https://a.jp', drive: '' }))),
  [{ label: 'Qoo10', url: 'https://a.jp' }],
  'normalizeLinks drops empty urls and maps labels'
);
assert.equal(ctx.localDateISO(new Date(2026, 0, 2, 1, 0)), '2026-01-02', 'local date, not UTC');
assert.equal(ctx.todayDayKey(new Date(2026, 10, 10)), 'tue');

// ── 2. JSON 구조 ──
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);

const uploads = json('data/weekly-uploads.json');
const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
uploads.forEach(u => {
  assert.ok(days.includes(u.day), `upload day "${u.day}" must be mon..sun`);
  assert.ok(u.name || u.skuName, `upload ${u.day} needs name`);
  (u.checklist || []).forEach(item =>
    assert.ok(typeof item === 'string' || (item.key && item.label), `upload ${u.day} checklist item must be string or {key,label}`));
});

const season = json('data/season-calendar.json');
assert.ok(isObj(season), 'season calendar is an object');
const cur = season.currentMonth || season.current;
assert.ok(cur && Array.isArray(cur.categories || cur.items), 'season current needs categories[]');
assert.ok(Array.isArray((season.upcoming || {}).categories || (season.upcoming || {}).items), 'season upcoming needs categories[]');
assert.ok(Array.isArray((season.lastYear || {}).rankings || (season.lastYear || {}).items), 'season lastYear needs rankings[]');

json('data/ingredients.json').forEach(ing => {
  assert.ok(ing.name, 'ingredient needs name');
  if (ing.suitability) assert.ok(isObj(ing.suitability) || Array.isArray(ing.suitability), `${ing.id} suitability object or array`);
  if (isObj(ing.suitability)) Object.values(ing.suitability).forEach(v => assert.ok(v >= 0 && v <= 5, `${ing.id} suitability 0..5`));
});

const countries = json('data/countries.json');
const countryIds = countries.map(c => c.id || c.code || c.name);
assert.equal(new Set(countryIds).size, countryIds.length, 'country ids unique (checkbox ids depend on it)');

json('data/copycat-shops.json').forEach(s =>
  assert.ok((s.aestheticScore ?? 0) >= 0 && (s.aestheticScore ?? 0) <= 5, `${s.id} aestheticScore 0..5`));

const actions = json('data/actions.json');
assert.equal(new Set(actions.map(a => a.id)).size, actions.length, 'action ids unique (LocalStorage state key)');

const skus = json('data/sku-list.json');
assert.equal(new Set(skus.map(s => s.id)).size, skus.length, 'sku ids unique');
const skuIds = new Set(skus.map(s => s.id));
uploads.filter(u => u.skuId).forEach(u => assert.ok(skuIds.has(u.skuId), `upload ${u.day} skuId "${u.skuId}" exists in sku-list`));

console.log('data contract checks passed');
