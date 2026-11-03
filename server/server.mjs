// ============================================================
// WIDEN — server/server.mjs · 대시보드 + 작업 기록 서버 (맥미니 등에서 상시 실행)
// 의존성 없음 (Node 18+). 실행: node server/server.mjs
//
// 환경 변수
//   PORT          기본 8080
//   HOST          기본 0.0.0.0 (같은 네트워크/Tailscale에서 접속 가능)
//   WIDEN_DATA    작업 기록 파일 경로. 기본 <repo>/var/work-log.jsonl
//   WIDEN_TOKEN   설정하면 /api 요청에 "Authorization: Bearer <코드>" 필요
//
// API (append-only — 수정·삭제 없음)
//   GET  /api/work-log   → 전체 항목 배열 (at 오름차순)
//   POST /api/work-log   ← 항목 1개 { id, kind, key, data, at, by }
//   GET  /api/health     → { ok, entries }
// ============================================================

import http from 'node:http';
import { readFile, appendFile, mkdir, stat } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KINDS = new Set(['action-state', 'upload-check', 'favorite', 'visit']);
const MAX_BODY = 20_000;
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.md': 'text/markdown; charset=utf-8'
};
// 대시보드에 필요한 것만 공개. 작업 기록 파일·서버 코드·git은 내보내지 않는다.
const PUBLIC_PREFIXES = ['index.html', 'js/', 'css/', 'data/'];

export function validateEntry(entry) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return '항목이 객체가 아님';
  const { id, kind, key, data, at, by } = entry;
  if (typeof id !== 'string' || !id || id.length > 100) return 'id';
  if (!KINDS.has(kind)) return 'kind';
  if (typeof key !== 'string' || !key || key.length > 200) return 'key';
  if (!data || typeof data !== 'object' || Array.isArray(data)) return 'data';
  if (typeof at !== 'string' || Number.isNaN(Date.parse(at))) return 'at';
  if (by !== undefined && (typeof by !== 'string' || by.length > 100)) return 'by';
  return null;
}

export async function createServer({ dataFile, token = '' } = {}) {
  const file = dataFile || process.env.WIDEN_DATA || path.join(ROOT, 'var', 'work-log.jsonl');
  await mkdir(path.dirname(file), { recursive: true });

  const entries = [];
  const ids = new Set();
  if (existsSync(file)) {
    readFileSync(file, 'utf8').split('\n').filter(Boolean).forEach(line => {
      try {
        const e = JSON.parse(line);
        if (!validateEntry(e) && !ids.has(e.id)) { entries.push(e); ids.add(e.id); }
      } catch { /* 깨진 줄은 건너뜀 */ }
    });
  }

  // 쓰기는 한 줄씩 순서대로
  let writing = Promise.resolve();
  const persist = entry => (writing = writing.then(() => appendFile(file, JSON.stringify(entry) + '\n')));

  const send = (res, status, body, headers = {}) => {
    const payload = typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body);
    res.writeHead(status, { 'Cache-Control': 'no-store', ...(typeof body === 'object' && !Buffer.isBuffer(body) ? { 'Content-Type': 'application/json; charset=utf-8' } : {}), ...headers });
    res.end(payload);
  };

  const authorized = req => !token || req.headers.authorization === `Bearer ${token}`;

  async function readBody(req) {
    let size = 0;
    const chunks = [];
    for await (const chunk of req) {
      size += chunk.length;
      if (size > MAX_BODY) throw Object.assign(new Error('too large'), { status: 413 });
      chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString('utf8');
  }

  async function serveStatic(req, res, pathname) {
    let rel = decodeURIComponent(pathname).replace(/^\/+/, '') || 'index.html';
    if (rel.includes('\0') || rel.split('/').includes('..') || !PUBLIC_PREFIXES.some(p => rel === p || rel.startsWith(p))) {
      return send(res, 404, 'Not found', { 'Content-Type': 'text/plain; charset=utf-8' });
    }
    const full = path.join(ROOT, rel);
    try {
      if (!(await stat(full)).isFile()) throw new Error('not file');
      const body = await readFile(full);
      res.writeHead(200, { 'Content-Type': MIME[path.extname(full)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch {
      send(res, 404, 'Not found', { 'Content-Type': 'text/plain; charset=utf-8' });
    }
  }

  const server = http.createServer(async (req, res) => {
    const { pathname } = new URL(req.url, 'http://localhost');
    try {
      if (pathname.startsWith('/api/')) {
        if (pathname === '/api/health' && req.method === 'GET') return send(res, 200, { ok: true, entries: entries.length, auth: !!token });
        if (pathname !== '/api/work-log') return send(res, 404, { error: 'not found' });
        if (!authorized(req)) return send(res, 401, { error: '접속 코드 필요' });
        if (req.method === 'GET') {
          return send(res, 200, [...entries].sort((a, b) => String(a.at).localeCompare(String(b.at))));
        }
        if (req.method === 'POST') {
          let entry;
          try { entry = JSON.parse(await readBody(req)); } catch (e) { return send(res, e.status || 400, { error: e.status ? '너무 큼' : 'JSON 아님' }); }
          const invalid = validateEntry(entry);
          if (invalid) return send(res, 400, { error: `잘못된 항목: ${invalid}` });
          if (ids.has(entry.id)) return send(res, 200, { ok: true, duplicate: true });
          const clean = { id: entry.id, kind: entry.kind, key: entry.key, data: entry.data, at: entry.at, by: entry.by || '' };
          entries.push(clean); ids.add(clean.id);
          await persist(clean);
          return send(res, 201, { ok: true });
        }
        return send(res, 405, { error: 'GET 또는 POST만' }, { Allow: 'GET, POST' });
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed', { 'Content-Type': 'text/plain; charset=utf-8' });
      return serveStatic(req, res, pathname);
    } catch (error) {
      console.error(error);
      send(res, 500, { error: 'server error' });
    }
  });

  return { server, entries, file };
}

// 직접 실행
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 8080);
  const host = process.env.HOST || '0.0.0.0';
  const { server, entries, file } = await createServer({ token: process.env.WIDEN_TOKEN || '' });
  server.listen(port, host, () => {
    console.log(`WIDEN 대시보드: http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`);
    console.log(`작업 기록: ${file} (${entries.length}건)${process.env.WIDEN_TOKEN ? ' · 접속 코드 사용' : ''}`);
  });
}
