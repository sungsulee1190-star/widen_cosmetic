// ============================================================
// WIDEN — workspace-config.js · 작업 기록 저장 위치
// backend: 'local'  → 이 브라우저에만 저장 (기본)
//          'supabase' → 팀 공유. url과 key(publishable/anon key)를 채운다.
// '데이터 관리' 화면에서 브라우저별로 덮어쓸 수 있다 (localStorage 'widen-workspace').
// ============================================================

window.WIDEN_WORKSPACE = {
  backend: 'local',
  supabase: { url: '', key: '' }
};
