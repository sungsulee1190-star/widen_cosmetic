import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const C = require('../js/sku-catalog.js');
const raw = JSON.parse(readFileSync(new URL('../data/sku-list.json', import.meta.url), 'utf8'));
const skus = raw.map(C.normalizeSku);
const vt = skus.find(s => s.id === 'sku-vt-riddle-shot-100');

// 검색: 성분 태그로도 찾힌다
assert.ok(C.matchesFilters(vt, { query: 'PDRN' }, 80), 'search matches ingredient tags');
assert.ok(!C.matchesFilters(vt, { query: '없는성분' }, 80));

// 주차: 실제 기록이 없으면 가짜 이력을 만들지 않고, 주차 필터에 걸리지 않는다
assert.deepEqual(vt.weeklyHistory, [], 'no fabricated weekly history');
assert.deepEqual(C.weekOptions(skus), [], 'week options come from real data only');
assert.ok(!C.matchesFilters(vt, { week: '2026-W28' }, 80));
const withHistory = C.normalizeSku({ ...raw[0], weeklyHistory: [{ week: '2026-W28', summary: 'x' }] });
assert.ok(C.matchesFilters(withHistory, { week: '2026-W28' }, 80));
assert.deepEqual(C.weekOptions([withHistory]), ['2026-W28']);

// 플랫폼: 근거 있는 채널만
assert.ok(vt.platforms.includes('올리브영') && vt.platforms.includes('Qoo10 JP'));
assert.ok(!vt.platforms.includes('Shopee TW'));
const shopee = C.normalizeSku({ ...raw[0], shopeeSearchUrl: 'https://shopee.tw/search?keyword=vt' });
assert.ok(C.matchesFilters(shopee, { platform: 'Shopee TW' }, 80), 'shopee link makes Shopee TW filter match');

// 마진: 5~10%는 '얇음'으로만, 10~15%는 '좋음'으로만
assert.deepEqual(C.parseMargin('5~10%'), { min: 5, max: 10, mid: 7.5 });
assert.ok(!vt.pros.some(p => p.includes('마진')), '5~10% margin is not a pro');
assert.ok(vt.cons.some(c => c.includes('마진')), '5~10% margin is a con');
const highMargin = skus.find(s => s.margin === '10~15%');
assert.ok(highMargin.pros.some(p => p.includes('마진')) && !highMargin.cons.some(c => c.includes('마진')));

// 카테고리: 세부 → 대분류, 모르는 값은 '기타'
assert.equal(C.toMajorCategory('세럼/앰플'), '스킨케어');
assert.equal(C.toMajorCategory('선크림'), '선케어');
assert.equal(C.toMajorCategory('립'), '립');
assert.equal(C.toMajorCategory('알수없음'), '기타');
assert.ok(C.matchesFilters(vt, { category: '스킨케어' }, 80));
assert.ok(!C.matchesFilters(vt, { category: '립' }, 80));

// 가중치: 비중 합 100%, 전부 0이면 점수 없음
const shares = C.weightShares({ ...C.DEFAULT_WEIGHTS, ranking: 40 });
assert.equal(Math.round(Object.values(shares).reduce((a, b) => a + b, 0)), 100);
const zero = Object.fromEntries(Object.keys(C.DEFAULT_WEIGHTS).map(k => [k, 0]));
assert.equal(C.weightShares(zero), null);
assert.equal(C.popularityScore(vt, zero), null);
const score = C.popularityScore(vt, C.DEFAULT_WEIGHTS);
assert.ok(score > 0 && score <= 100);

// 안전: HTML 이스케이프, javascript: 링크 차단
assert.equal(C.escapeHtml('3" <b>'), '3&quot; &lt;b&gt;');
assert.equal(C.safeUrl('javascript:alert(1)'), '');
assert.equal(C.safeUrl('https://a.com/x'), 'https://a.com/x');
const evil = C.normalizeSku({ ...raw[0], domesticUrl: 'javascript:alert(1)' });
assert.ok(!evil.links.some(l => l.url.startsWith('javascript')));

console.log('sku catalog checks passed');
