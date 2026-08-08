create table if not exists public.app_state (
  owner_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (owner_id, id)
);

alter table public.app_state enable row level security;

grant select, insert, update, delete on public.app_state to authenticated;

drop policy if exists app_state_select_own on public.app_state;
create policy app_state_select_own
  on public.app_state for select
  to authenticated
  using ((select auth.uid()) = owner_id);

drop policy if exists app_state_insert_own on public.app_state;
create policy app_state_insert_own
  on public.app_state for insert
  to authenticated
  with check ((select auth.uid()) = owner_id);

drop policy if exists app_state_update_own on public.app_state;
create policy app_state_update_own
  on public.app_state for update
  to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

drop policy if exists app_state_delete_own on public.app_state;
create policy app_state_delete_own
  on public.app_state for delete
  to authenticated
  using ((select auth.uid()) = owner_id);

create index if not exists app_state_owner_id_idx
  on public.app_state (owner_id);
