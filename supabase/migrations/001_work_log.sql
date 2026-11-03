-- WIDEN 작업 기록 (append-only)
-- 할 일 상태 · 업로드 체크 · 즐겨찾기 · 방문 기록을 한 테이블에 쌓는다.
-- 현재 상태 = kind+key별 가장 최근(at) 항목. 수정·삭제 없이 새 항목만 추가한다.

create table if not exists public.work_log (
  id    text primary key,
  kind  text not null check (kind in ('action-state', 'upload-check', 'favorite', 'visit')),
  key   text not null,
  data  jsonb not null default '{}'::jsonb,
  at    timestamptz not null default now(),
  by    text not null default ''
);

create index if not exists work_log_kind_key_at on public.work_log (kind, key, at);

alter table public.work_log enable row level security;

-- 대시보드는 publishable(anon) 키로 접속한다: 읽기와 추가만 허용, 수정·삭제는 막는다.
-- 주의: 키를 아는 사람은 누구나 읽고 추가할 수 있다. 팀 밖으로 공유되면 안 되는 경우
-- Supabase Auth 로그인을 붙이고 아래 정책의 대상을 authenticated로 바꾼다.
drop policy if exists "work_log read" on public.work_log;
create policy "work_log read" on public.work_log
  for select to anon, authenticated using (true);

drop policy if exists "work_log append" on public.work_log;
create policy "work_log append" on public.work_log
  for insert to anon, authenticated
  with check (char_length(key) <= 200 and char_length(by) <= 100 and pg_column_size(data) <= 20000);
