import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');

const cockpit = read('js/view-cockpit.js');
const html = read('index.html');
const style = read('css/style.css');
const skuView = read('js/view-sku.js');
const referenceView = read('js/view-reference.js');
const trendEngine = read('js/trend-engine.js');
const store = read('js/data-store.js');
const app = read('js/app.js');
const trendSignals = JSON.parse(read('data/trend-signals.json'));
const verifications = JSON.parse(read('data/trend-verifications.json'));

assert.match(cockpit, /renderTrendSignalRadar/, 'cockpit renders trend signal radar');
assert.match(cockpit, /renderPlatformBenchmarkSection/, 'cockpit renders platform benchmark channels');
assert.match(cockpit, /normalizeLinks/, 'cockpit normalizes object and array links');
assert.match(store, /platformChannels/, 'DataStore loads platform benchmark channel data');
assert.ok(existsSync('data/platform-channels.json'), 'platform channel JSON exists');
assert.ok(existsSync('data/trend-signals.json'), 'trend signal JSON exists');
assert.ok(existsSync('data/trend-verifications.json'), 'trend verification JSON exists');
assert.ok(existsSync('data/trend-score-rules.json'), 'trend score rule JSON exists');
assert.match(store, /trendSignals/, 'DataStore loads trend signals');
assert.match(store, /trendVerifications/, 'DataStore loads trend verification logs');
assert.match(store, /trendScoreRules/, 'DataStore loads trend score rules');
assert.match(app, /renderCountryView/, 'country view stays routable');
assert.match(html, /이번주 할일/, 'sidebar uses intuitive weekly tasks menu name');
assert.match(html, /카테고리\/제품/, 'sidebar uses intuitive category/product menu name');
assert.match(html, /벤치마킹샵/, 'sidebar uses intuitive benchmark shop menu name');
assert.match(html, /js\/trend-engine\.js/, 'trend engine is loaded before views');
assert.match(style, /\.sidebar\.collapsed \.nav-section-label/, 'collapsed sidebar hides section labels');
assert.match(trendEngine, /buildRecommendations/, 'trend engine builds SKU recommendations');
assert.match(trendEngine, /missingEvidence/, 'recommendations expose missing evidence');
assert.match(trendEngine, /scoreBreakdown/, 'recommendations expose score breakdown');
assert.doesNotMatch(trendEngine, /signal\.category\s*===\s*sku\.majorCategory/, 'trend signals are not attached to every SKU in a broad category');
assert.match(skuView, /renderCategoryRail/, 'SKU page renders horizontal category rail');
assert.match(skuView, /renderPopularityScalePanel/, 'SKU page renders adjustable popularity scale panel');
assert.match(skuView, /renderProductDetailPanel/, 'SKU page renders product detail panel');
assert.match(skuView, /imageUrl/, 'SKU page reads imageUrl data field');
assert.match(skuView, /qoo10SearchUrl/, 'SKU page links Qoo10 search data field');
assert.match(skuView, /syncSkuDetailWithFilters/, 'SKU detail panel follows the active filters');
assert.match(skuView, /TrendEngine\.buildRecommendations/, 'SKU view uses trend engine recommendations');
assert.match(skuView, /scoreBreakdown/, 'SKU detail renders recommendation score breakdown');
assert.match(skuView, /missingEvidence/, 'SKU detail renders missing evidence');
assert.match(skuView, /nextAction/, 'SKU detail renders next verification action');
assert.match(skuView, /onerror=/, 'SKU images render a fallback when the external image fails');
assert.ok(
  trendSignals.every(item => item.id && item.observedAt && item.evidenceGrade && item.freshnessDays),
  'trend signals include freshness and evidence grade'
);
assert.ok(
  verifications.every(item => item.signalId && item.result && item.verifiedAt),
  'verification logs link back to signals'
);
assert.ok(
  trendSignals.some(item => ['A', 'B'].includes(item.evidenceGrade)),
  'at least one high-grade evidence signal exists'
);
assert.doesNotMatch(skuView, /const selectedSku = skus\[0\]/, 'SKU detail must not stay pinned to first SKU');
assert.doesNotMatch(skuView, /VT 리들샷 100.*renderProductDetailPanel/, 'detail recommendation must not be pinned to VT');
assert.match(style, /\.sidebar\.collapsed \.nav-item[\s\S]*gap:\s*0/, 'collapsed sidebar removes nav item gap so icons do not squeeze');
assert.doesNotMatch(referenceView, /link:\s*'https:\/\/www\.qoo10\.jp'/, 'competitor reference links do not point to the Qoo10 home page');
assert.match(referenceView, /Shopee TW/, 'competitor references include Shopee Taiwan');
assert.match(referenceView, /Amazon JP/, 'competitor references include Amazon Japan');

console.log('dashboard static checks passed');
