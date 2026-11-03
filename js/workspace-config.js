// ============================================================
// WIDEN — workspace-config.js · 작업 기록 저장 위치 (팀 기본값)
// backend: 'auto'     → 대시보드를 연 주소에 WIDEN 서버(server/server.mjs)가 있으면 그걸로 공유,
//                       없으면 이 브라우저에만 저장 (기본)
//          'server'   → server.url의 WIDEN 서버 (빈 값이면 같은 주소)
//          'supabase' → supabase.url / supabase.key (publishable key)
//          'local'    → 이 브라우저에만
// '데이터 관리' 화면에서 브라우저별로 덮어쓸 수 있다 (localStorage 'widen-workspace').
// ============================================================

window.WIDEN_WORKSPACE = {
  backend: 'auto',
  server: { url: '', token: '' },
  supabase: { url: '', key: '' }
};
