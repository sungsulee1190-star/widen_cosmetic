import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');

const cockpit = read('js/view-cockpit.js');
const store = read('js/data-store.js');
const app = read('js/app.js');

assert.match(cockpit, /renderTrendSignalRadar/, 'cockpit renders trend signal radar');
assert.match(cockpit, /renderPlatformBenchmarkSection/, 'cockpit renders platform benchmark channels');
assert.match(cockpit, /normalizeLinks/, 'cockpit normalizes object and array links');
assert.match(store, /platformChannels/, 'DataStore loads platform benchmark channel data');
assert.ok(existsSync('data/platform-channels.json'), 'platform channel JSON exists');
assert.match(app, /renderCountryView/, 'country view stays routable');

console.log('dashboard static checks passed');
