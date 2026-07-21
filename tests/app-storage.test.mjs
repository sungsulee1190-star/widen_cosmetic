import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function createContext() {
  const storage = new Map();
  const context = {
    console,
    window: {},
    localStorage: {
      getItem(key) {
        return storage.has(key) ? storage.get(key) : null;
      },
      setItem(key, value) {
        storage.set(key, String(value));
      },
      removeItem(key) {
        storage.delete(key);
      },
    },
  };
  context.window = context;
  vm.createContext(context);
  return context;
}

function loadScript(context, path) {
  const source = readFileSync(path, 'utf8');
  vm.runInContext(source, context, { filename: path });
}

const context = createContext();
loadScript(context, 'js/app-storage.js');
loadScript(context, 'js/data-store.js');

assert.ok(context.AppStorage, 'AppStorage is exposed globally');
assert.equal(typeof context.AppStorage.load, 'function', 'AppStorage can load shared state');

await context.AppStorage.load({
  remote: {
    async readMany(keys) {
      assert.deepEqual(Array.from(keys), [
        'widen-action-states',
        'widen-upload-checks',
        'widen-favorites',
        'widen-visit-logs',
      ]);
      return {
        'widen-action-states': { action_1: '완료' },
        'widen-favorites': ['sku_1'],
      };
    },
    async write() {},
  },
});

const dataStore = vm.runInContext('DataStore', context);

assert.equal(dataStore.getActionState('action_1'), '완료', 'remote action state is readable through DataStore');
assert.equal(dataStore.getActionState('missing'), '미완료', 'missing action state uses default');
assert.equal(dataStore.isFavorite('sku_1'), true, 'remote favorite state is readable through DataStore');

dataStore.setUploadCheck('mon', 'photo', true);
assert.equal(JSON.stringify(dataStore.getUploadChecks('mon')), '{"photo":true}', 'upload checks persist through shared storage');

dataStore.toggleFavorite('sku_2');
assert.equal(dataStore.isFavorite('sku_2'), true, 'favorite toggle persists through shared storage');

dataStore.addVisitLog({ date: '2026-07-10', store: 'Olive Young', sku: 'test sku' });
const logs = dataStore.getVisitLogs();
assert.equal(logs.length, 1, 'visit log is added through shared storage');
assert.equal(logs[0].store, 'Olive Young', 'visit log keeps submitted fields');
assert.ok(logs[0].id, 'visit log gets an id');

console.log('app storage checks passed');
