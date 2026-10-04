-- 左メニューの「入力履歴」(議事録・資料の本文)の保存先。2026-10-04 作成(Supabase本番に適用済み)。
create table if not exists public.dashboard_input_history (
  id bigint generated always as identity primary key,
  dashboard_slug text not null,
  kind text not null check (kind in ('minutes','material')),
  title text not null default '',
  body text not null,
  provider text,
  editor_name text,
  applied_count integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists dashboard_input_history_slug_created_idx
  on public.dashboard_input_history (dashboard_slug, created_at desc);
-- 本文には非公開の議事録が入るため、RLSを有効にしポリシーは作らない(service roleからのみ読み書き)
alter table public.dashboard_input_history enable row level security;
