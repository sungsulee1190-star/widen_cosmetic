import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const W = require('../js/work-log.js');

// localStorage 대역
function fakeStorage(init = {}) {
  const data = { ...init };
  return { getItem: k => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = String(v); }, data };
}

// ── 현재 상태 = kind+key별 최신 항목 ──
{
  const log = W.create(W.memoryAdapter(), { by: '대표' });
  await log.load();
  assert.equal(log.actionState('act-001'), '미완료', 'default state');
  log.setActionState('act-001', '진행중');
  log.setActionState('act-001', '완료');
  assert.equal(log.actionState('act-001'), '완료');
  assert.equal(log.history('action-state', 'act-001').length, 2, 'history keeps every change');
  assert.equal(log.history('action-state', 'act-001')[0].by, '대표');

  log.setUploadCheck('thu', 'item-0', true);
  log.setUploadCheck('thu', 'item-1', true);
  log.setUploadCheck('thu', 'item-1', false);
  log.setUploadCheck('fri', 'item-0', true);
  assert.deepEqual(log.uploadChecks('thu'), { 'item-0': true, 'item-1': false });

  log.toggleFavorite('sku-a');
  log.toggleFavorite('sku-b');
  log.toggleFavorite('sku-a');
  assert.deepEqual(log.favorites(), ['sku-b']);
  assert.ok(!log.isFavorite('sku-a') && log.isFavorite('sku-b'));

  log.addVisit({ date: '2026-11-01', store: 'A', skuId: 'sku-a' });
  await new Promise(r => setTimeout(r, 5));
  log.addVisit({ date: '2026-11-02', store: 'B', skuId: 'sku-b' });
  assert.deepEqual(log.visits().map(v => v.store), ['B', 'A'], 'visits newest first');
  assert.throws(() => log.record('unknown', 'x', {}), /알 수 없는/);
}

// ── 다른 사람이 쓴 기록도 load() 후 반영 (공유 저장소 시뮬레이션) ──
{
  const shared = W.memoryAdapter();
  const a = W.create(shared, { by: 'A' }); await a.load();
  const b = W.create(shared, { by: 'B' }); await b.load();
  await a.setActionState('act-002', '보류').saved;
  assert.equal(b.actionState('act-002'), '미완료', 'not yet reloaded');
  await b.load();
  assert.equal(b.actionState('act-002'), '보류');
}

// ── 저장 실패: 화면 상태는 유지, saved=false, error 이벤트 ──
{
  const failing = { name: 'x', shared: true, load: async () => [], append: async () => { throw new Error('offline'); } };
  const log = W.create(failing); await log.load();
  const events = [];
  log.onChange(e => events.push(e.type));
  const { saved } = log.setActionState('act-003', '완료');
  assert.equal(await saved, false);
  assert.ok(events.includes('error'));
  assert.equal(log.actionState('act-003'), '완료');
}

// ── localAdapter: 새로고침(새 인스턴스)해도 유지 ──
{
  const storage = fakeStorage();
  const log1 = W.create(W.localAdapter(storage)); await log1.load();
  await log1.toggleFavorite('sku-x').saved;
  const log2 = W.create(W.localAdapter(storage)); await log2.load();
  assert.ok(log2.isFavorite('sku-x'));
}

// ── 옛 기능별 localStorage 키 이전 ──
{
  const storage = fakeStorage({
    'widen-action-states': JSON.stringify({ 'act-001': '완료' }),
    'widen-upload-checks': JSON.stringify({ thu: { photo: true } }),
    'widen-favorites': JSON.stringify(['sku-a']),
    'widen-visit-logs': JSON.stringify([{ id: '2', store: '새것' }, { id: '1', store: '옛것' }])
  });
  const entries = W.legacyEntries(storage);
  const log = W.create(W.memoryAdapter(entries)); await log.load();
  assert.equal(log.actionState('act-001'), '완료');
  assert.deepEqual(log.uploadChecks('thu'), { photo: true });
  assert.ok(log.isFavorite('sku-a'));
  assert.deepEqual(log.visits().map(v => v.store).sort(), ['새것', '옛것']);
  log.setActionState('act-001', '진행중');
  assert.equal(log.actionState('act-001'), '진행중', 'new entries win over migrated ones');
}

// ── supabaseAdapter: PostgREST 요청 모양 ──
{
  const calls = [];
  const fetchImpl = async (url, opts = {}) => {
    calls.push({ url, ...opts });
    return { ok: true, status: 200, json: async () => [{ id: '1', kind: 'favorite', key: 'sku-a', data: { on: true }, at: '2026-11-01T00:00:00Z', by: 'A' }] };
  };
  const adapter = W.supabaseAdapter({ url: 'https://p.supabase.co/', key: 'sb_publishable_x', fetchImpl });
  const log = W.create(adapter); await log.load();
  assert.ok(log.isFavorite('sku-a'));
  assert.equal(calls[0].url, 'https://p.supabase.co/rest/v1/work_log?select=id,kind,key,data,at,by&order=at.asc');
  assert.equal(calls[0].headers.apikey, 'sb_publishable_x');
  await log.toggleFavorite('sku-a').saved;
  assert.equal(calls[1].method, 'POST');
  const body = JSON.parse(calls[1].body);
  assert.deepEqual(Object.keys(body).sort(), ['at', 'by', 'data', 'id', 'key', 'kind']);
  assert.deepEqual(body.data, { on: false });

  const failing = W.supabaseAdapter({ url: 'https://p.supabase.co', key: 'k', fetchImpl: async () => ({ ok: false, status: 401 }) });
  await assert.rejects(failing.load(), /401/);
}

console.log('work log checks passed');
