import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');

const cockpit = read('js/view-cockpit.js');
const html = read('index.html');
const style = read('css/style.css');
const skuView = read('js/view-sku.js');
const store = read('js/data-store.js');
const app = read('js/app.js');

assert.match(cockpit, /renderTrendSignalRadar/, 'cockpit renders trend signal radar');
assert.match(cockpit, /renderPlatformBenchmarkSection/, 'cockpit renders platform benchmark channels');
assert.match(read('js/utils.js'), /function normalizeLinks/, 'utils normalizes object and array links');
assert.match(html, /js\/utils\.js[\s\S]*js\/data-store\.js/, 'utils.js loads before data-store.js');
assert.doesNotMatch(read('js/view-copycat.js') + read('js/view-reference.js'), /## 가격\/쿠폰\/세트/, 'MD template lives only in utils.js');
assert.match(store, /platformChannels/, 'DataStore loads platform benchmark channel data');
assert.ok(existsSync('data/platform-channels.json'), 'platform channel JSON exists');
assert.match(app, /renderCountryView/, 'country view stays routable');
assert.match(html, /이번주 할일/, 'sidebar uses intuitive weekly tasks menu name');
assert.match(html, /카테고리\/제품/, 'sidebar uses intuitive category/product menu name');
assert.match(html, /벤치마킹샵/, 'sidebar uses intuitive benchmark shop menu name');
assert.match(style, /\.sidebar\.collapsed \.nav-section-label/, 'collapsed sidebar hides section labels');
assert.match(skuView, /renderCategoryRail/, 'SKU page renders horizontal category rail');
assert.match(skuView, /renderPopularityScalePanel/, 'SKU page renders adjustable popularity scale panel');
assert.match(skuView, /renderProductDetailPanel/, 'SKU page renders product detail panel');
assert.match(skuView, /imageUrl/, 'SKU page reads imageUrl data field');
assert.match(skuView, /qoo10SearchUrl/, 'SKU page links Qoo10 search data field');

assert.doesNotMatch(read('js/view-reference.js'), /K-Beauty Official/, 'reference samples live in data/references.json, not code');
assert.match(store, /references\.json/, 'DataStore loads references.json');

console.log('dashboard static checks passed');
