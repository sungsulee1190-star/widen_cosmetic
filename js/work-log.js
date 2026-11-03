// ============================================================
// WIDEN — work-log.js · 작업 기록 (할 일 상태 · 업로드 체크 · 즐겨찾기 · 방문 기록)
// 모든 기록은 append-only 항목 { id, kind, key, data, at, by }.
// 현재 상태 = kind+key별 가장 최근 항목. 저장 방식은 adapter 뒤에 숨긴다:
//   localAdapter    — 이 브라우저의 localStorage (기본)
//   memoryAdapter   — 테스트용
//   serverAdapter   — 팀 공유 (맥미니 등에서 돌리는 server/server.mjs, /api/work-log)
//   supabaseAdapter — 팀 공유 (Supabase REST, 테이블 work_log)
// 브라우저에서는 전역 WorkLog, Node 테스트에서는 module.exports.
// ============================================================

(function (root) {
  const KINDS = ['action-state', 'upload-check', 'favorite', 'visit'];

  function newId() {
    if (root.crypto && root.crypto.randomUUID) return root.crypto.randomUUID();
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }

  // ── adapters: load() → Promise<entries[]>, append(entry) → Promise<void> ──

  function memoryAdapter(initial = []) {
    const entries = [...initial];
    return {
      name: 'memory',
      shared: false,
      async load() { return [...entries]; },
      async append(entry) { entries.push(entry); },
      entries
    };
  }

  function localAdapter(storage, storageKey = 'widen-work-log') {
    const read = () => {
      try { return JSON.parse(storage.getItem(storageKey) || '[]'); } catch { return []; }
    };
    return {
      name: 'local',
      shared: false,
      async load() { return read(); },
      async append(entry) {
        const entries = read();
        entries.push(entry);
        storage.setItem(storageKey, JSON.stringify(entries));
      }
    };
  }

  // WIDEN 서버(server/server.mjs). baseUrl ''이면 대시보드를 연 같은 주소.
  function serverAdapter({ baseUrl = '', token = '', fetchImpl } = {}) {
    const doFetch = fetchImpl || root.fetch.bind(root);
    const endpoint = `${String(baseUrl).replace(/\/$/, '')}/api/work-log`;
    const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
    return {
      name: 'server',
      shared: true,
      async load() {
        const res = await doFetch(endpoint, { headers, cache: 'no-store' });
        if (res.status === 401) throw new Error('접속 코드가 틀렸습니다 (401)');
        if (!res.ok) throw new Error(`서버 기록 불러오기 실패 (${res.status})`);
        return res.json();
      },
      async append(entry) {
        const res = await doFetch(endpoint, { method: 'POST', headers, body: JSON.stringify(entry) });
        if (!res.ok) throw new Error(`서버 저장 실패 (${res.status})`);
      }
    };
  }

  // Supabase PostgREST. 테이블 스키마: supabase/migrations/001_work_log.sql
  function supabaseAdapter({ url, key, table = 'work_log', fetchImpl }) {
    const doFetch = fetchImpl || root.fetch.bind(root);
    const base = `${String(url).replace(/\/$/, '')}/rest/v1/${table}`;
    const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
    return {
      name: 'supabase',
      shared: true,
      async load() {
        const res = await doFetch(`${base}?select=id,kind,key,data,at,by&order=at.asc`, { headers });
        if (!res.ok) throw new Error(`work_log 불러오기 실패 (${res.status})`);
        return res.json();
      },
      async append(entry) {
        const res = await doFetch(base, {
          method: 'POST',
          headers: { ...headers, Prefer: 'return=minimal' },
          body: JSON.stringify(entry)
        });
        if (!res.ok) throw new Error(`work_log 저장 실패 (${res.status})`);
      }
    };
  }

  // 옛 localStorage 키(기능별) → 작업 기록 항목. 한 번만 실행.
  // at은 1970-01-01: 공유 저장소로 복사해도 다른 사람의 실제 최신 기록을 덮어쓰지 않도록 가장 오래된 시각.
  function legacyEntries(storage, at = new Date(0).toISOString()) {
    const parse = (k, fallback) => {
      try { return JSON.parse(storage.getItem(k) || fallback); } catch { return JSON.parse(fallback); }
    };
    const out = [];
    Object.entries(parse('widen-action-states', '{}')).forEach(([actionId, state]) =>
      out.push({ kind: 'action-state', key: actionId, data: { state } }));
    Object.entries(parse('widen-upload-checks', '{}')).forEach(([day, checks]) =>
      Object.entries(checks).forEach(([item, checked]) =>
        out.push({ kind: 'upload-check', key: `${day}:${item}`, data: { checked } })));
    parse('widen-favorites', '[]').forEach(skuId => out.push({ kind: 'favorite', key: skuId, data: { on: true } }));
    // 방문 기록은 최신순으로 저장돼 있었음 → 오래된 것부터
    parse('widen-visit-logs', '[]').slice().reverse().forEach(log =>
      out.push({ kind: 'visit', key: log.id || newId(), data: log }));
    return out.map(e => ({ id: newId(), at, by: '', ...e }));
  }

  /**
   * create(adapter, { by }) — 작업 기록 module.
   * load()를 한 번 기다린 뒤에는 읽기가 모두 동기(메모리 캐시).
   * 쓰기는 캐시에 즉시 반영하고 adapter에 비동기 저장; 실패하면 onError로 알린다.
   */
  function create(adapter, options = {}) {
    let entries = [];
    let state = new Map(); // `${kind}|${key}` → 최신 항목
    const listeners = new Set();
    let by = options.by || '';

    function index() {
      state = new Map();
      entries
        .slice()
        .sort((a, b) => String(a.at).localeCompare(String(b.at)))
        .forEach(e => state.set(`${e.kind}|${e.key}`, e));
    }

    function emit(event) { listeners.forEach(fn => fn(event)); }

    async function load() {
      entries = await adapter.load();
      index();
      emit({ type: 'loaded' });
    }

    function record(kind, key, data) {
      if (!KINDS.includes(kind)) throw new Error(`알 수 없는 기록 종류: ${kind}`);
      const entry = { id: newId(), kind, key: String(key), data, at: new Date().toISOString(), by };
      entries.push(entry);
      state.set(`${kind}|${entry.key}`, entry);
      // saved: 저장 성공 여부(true/false). 실패는 onChange의 'error' 이벤트로도 알린다.
      const saved = adapter.append(entry).then(() => true, error => {
        emit({ type: 'error', error, entry });
        return false;
      });
      emit({ type: 'recorded', entry });
      return { entry, saved };
    }

    const current = (kind, key) => state.get(`${kind}|${key}`) || null;
    const all = kind => [...state.values()].filter(e => e.kind === kind);

    return {
      load,
      record,
      current,
      all,
      history: (kind, key) => entries.filter(e => e.kind === kind && e.key === String(key)),
      entries: () => [...entries],
      setAuthor(name) { by = name || ''; },
      onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
      adapterName: adapter.name,
      shared: adapter.shared,

      // ── 도메인 읽기/쓰기 ──
      actionState: actionId => current('action-state', actionId)?.data.state || '미완료',
      setActionState: (actionId, value) => record('action-state', actionId, { state: value }),
      uploadChecks(day) {
        const out = {};
        all('upload-check').forEach(e => {
          const [d, item] = e.key.split(':');
          if (d === day) out[item] = e.data.checked === true;
        });
        return out;
      },
      setUploadCheck: (day, item, checked) => record('upload-check', `${day}:${item}`, { checked }),
      isFavorite: skuId => current('favorite', skuId)?.data.on === true,
      favorites: () => all('favorite').filter(e => e.data.on).map(e => e.key),
      toggleFavorite(skuId) {
        const on = !(current('favorite', skuId)?.data.on === true);
        return record('favorite', skuId, { on });
      },
      // 방문 기록: 최신순
      visits: () => all('visit').sort((a, b) => String(b.at).localeCompare(String(a.at))).map(e => ({ ...e.data, id: e.key, by: e.by })),
      addVisit(log) {
        const id = newId();
        return record('visit', id, { ...log, id });
      }
    };
  }

  const WorkLog = { KINDS, create, memoryAdapter, localAdapter, serverAdapter, supabaseAdapter, legacyEntries };
  root.WorkLog = WorkLog;
  if (typeof module !== 'undefined' && module.exports) module.exports = WorkLog;
})(typeof window !== 'undefined' ? window : globalThis);
