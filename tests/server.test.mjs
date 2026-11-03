import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { createServer, validateEntry } from '../server/server.mjs';

const require = createRequire(import.meta.url);
const W = require('../js/work-log.js');

const dir = mkdtempSync(path.join(tmpdir(), 'widen-server-'));
const dataFile = path.join(dir, 'work-log.jsonl');

async function start(opts) {
  const { server } = await createServer({ dataFile, ...opts });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  return { server, base: `http://127.0.0.1:${server.address().port}` };
}

try {
  // ── 기본: 대시보드 파일 제공, 비공개 파일 차단 ──
  let { server, base } = await start();
  assert.equal((await fetch(`${base}/`)).status, 200);
  assert.match(await (await fetch(`${base}/js/work-log.js`)).text(), /WorkLog/);
  for (const p of ['/var/work-log.jsonl', '/server/server.mjs', '/.git/config', '/../etc/passwd', '/js/%2e%2e/server/server.mjs', '/CONTEXT.md']) {
    assert.equal((await fetch(`${base}${p}`)).status, 404, `${p} is not served`);
  }
  assert.deepEqual(await (await fetch(`${base}/api/health`)).json(), { ok: true, entries: 0, auth: false });

  // ── 두 사람이 같은 서버를 쓰는 흐름 (WorkLog + serverAdapter) ──
  const a = W.create(W.serverAdapter({ baseUrl: base }), { by: '대표' }); await a.load();
  const b = W.create(W.serverAdapter({ baseUrl: base }), { by: '성수팀' }); await b.load();
  assert.equal(await a.setActionState('act-001', '완료').saved, true);
  assert.equal(await b.addVisit({ date: '2026-11-03', store: '성수', skuId: 'sku-a' }).saved, true);
  await a.load(); await b.load();
  assert.equal(b.actionState('act-001'), '완료');
  assert.equal(a.visits()[0].store, '성수');
  assert.equal(a.visits()[0].by, '성수팀');

  // ── 검증: 잘못된 항목·중복·수정/삭제 차단 ──
  const post = body => fetch(`${base}/api/work-log`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: typeof body === 'string' ? body : JSON.stringify(body) });
  assert.equal((await post({ id: 'x', kind: 'hack', key: 'k', data: {}, at: new Date().toISOString() })).status, 400);
  assert.equal((await post('not json')).status, 400);
  assert.equal((await post({ id: 'big', kind: 'visit', key: 'k', data: { memo: 'x'.repeat(30000) }, at: new Date().toISOString() })).status, 413);
  const dup = a.entries()[0];
  assert.deepEqual(await (await post(dup)).json(), { ok: true, duplicate: true });
  assert.equal((await fetch(`${base}/api/work-log`, { method: 'DELETE' })).status, 405);
  assert.equal((await fetch(`${base}/api/work-log`)).headers.get('cache-control'), 'no-store');

  // ── 재시작해도 기록 유지 (파일) ──
  await new Promise(r => server.close(r));
  ({ server, base } = await start());
  const after = await (await fetch(`${base}/api/work-log`)).json();
  assert.equal(after.length, 2);
  assert.equal(readFileSync(dataFile, 'utf8').trim().split('\n').length, 2, 'one line per entry, duplicates not written');
  await new Promise(r => server.close(r));

  // ── 접속 코드 ──
  ({ server, base } = await start({ token: 's3cret' }));
  assert.equal((await fetch(`${base}/api/work-log`)).status, 401);
  assert.equal((await fetch(`${base}/`)).status, 200, 'dashboard page itself still loads');
  const wrong = W.create(W.serverAdapter({ baseUrl: base, token: 'nope' }));
  await assert.rejects(wrong.load(), /접속 코드/);
  const right = W.create(W.serverAdapter({ baseUrl: base, token: 's3cret' }));
  await right.load();
  assert.equal(right.actionState('act-001'), '완료');
  await new Promise(r => server.close(r));

  assert.equal(validateEntry({ id: 'i', kind: 'favorite', key: 'k', data: { on: true }, at: '2026-11-03T00:00:00Z' }), null);
  assert.equal(validateEntry([]), '항목이 객체가 아님');
} finally {
  rmSync(dir, { recursive: true, force: true });
}

console.log('server checks passed');
