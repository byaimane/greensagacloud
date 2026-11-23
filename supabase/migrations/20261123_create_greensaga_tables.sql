-- GreenSAGA Cozy Farming RPG & Admin Push Sync Schema (namespaced cleanly)

create table if not exists public.greensaga_app_config (
  id text primary key,
  app_id text not null default 'com.ouagx.myapp',
  brand_name text not null default 'GreenSAGA',
  revision integer not null default 0,
  announcement text not null default '',
  config_json jsonb not null default '{}'::jsonb,
  push_bundle_json jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.greensaga_player_saves (
  player_id text primary key,
  username text not null default 'Farmer GreenSAGA',
  level integer not null default 1 check (level >= 1 and level <= 10),
  gold integer not null default 180 check (gold >= 0),
  day integer not null default 1 check (day >= 1),
  room_code text not null default 'VALLEY-01',
  role text not null default 'player' check (role in ('admin', 'vip', 'player')),
  status text not null default 'active' check (status in ('active', 'muted', 'banned')),
  save_json jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists idx_greensaga_player_saves_room
  on public.greensaga_player_saves (room_code);

create table if not exists public.greensaga_push_history (
  id bigint generated always as identity primary key,
  app_id text not null default 'com.ouagx.myapp',
  revision integer not null,
  title text not null,
  body text not null,
  announcement text not null default '',
  active_ads_count integer not null default 0,
  theme_id text not null default 'emerald',
  pushed_at timestamptz not null default now()
);

create index if not exists idx_greensaga_push_history_app_rev
  on public.greensaga_push_history (app_id, revision desc);

create table if not exists public.greensaga_valley_chat (
  id bigint generated always as identity primary key,
  room_code text not null default 'VALLEY-01',
  sender text not null,
  message text not null check (char_length(message) <= 300),
  created_at timestamptz not null default now()
);

create index if not exists idx_greensaga_valley_chat_room_time
  on public.greensaga_valley_chat (room_code, created_at desc);

grant select, insert, update, delete on public.greensaga_app_config to anon, authenticated;
grant select, insert, update, delete on public.greensaga_player_saves to anon, authenticated;
grant select, insert on public.greensaga_push_history to anon, authenticated;
grant select, insert on public.greensaga_valley_chat to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

alter table public.greensaga_app_config enable row level security;
alter table public.greensaga_player_saves enable row level security;
alter table public.greensaga_push_history enable row level security;
alter table public.greensaga_valley_chat enable row level security;

drop policy if exists "greensaga_config_select" on public.greensaga_app_config;
create policy "greensaga_config_select" on public.greensaga_app_config
  for select to anon, authenticated
  using (app_id = 'com.ouagx.myapp');

drop policy if exists "greensaga_config_insert" on public.greensaga_app_config;
create policy "greensaga_config_insert" on public.greensaga_app_config
  for insert to anon, authenticated
  with check (id = 'default' and app_id = 'com.ouagx.myapp');

drop policy if exists "greensaga_config_update" on public.greensaga_app_config;
create policy "greensaga_config_update" on public.greensaga_app_config
  for update to anon, authenticated
  using (id = 'default' and app_id = 'com.ouagx.myapp')
  with check (id = 'default' and app_id = 'com.ouagx.myapp');

drop policy if exists "greensaga_saves_select" on public.greensaga_player_saves;
create policy "greensaga_saves_select" on public.greensaga_player_saves
  for select to anon, authenticated
  using (char_length(player_id) > 0);

drop policy if exists "greensaga_saves_insert" on public.greensaga_player_saves;
create policy "greensaga_saves_insert" on public.greensaga_player_saves
  for insert to anon, authenticated
  with check (char_length(player_id) > 0 and char_length(username) <= 40);

drop policy if exists "greensaga_saves_update" on public.greensaga_player_saves;
create policy "greensaga_saves_update" on public.greensaga_player_saves
  for update to anon, authenticated
  using (char_length(player_id) > 0)
  with check (char_length(player_id) > 0 and char_length(username) <= 40);

drop policy if exists "greensaga_push_select" on public.greensaga_push_history;
create policy "greensaga_push_select" on public.greensaga_push_history
  for select to anon, authenticated
  using (app_id = 'com.ouagx.myapp');

drop policy if exists "greensaga_push_insert" on public.greensaga_push_history;
create policy "greensaga_push_insert" on public.greensaga_push_history
  for insert to anon, authenticated
  with check (app_id = 'com.ouagx.myapp' and revision >= 1);

drop policy if exists "greensaga_chat_select" on public.greensaga_valley_chat;
create policy "greensaga_chat_select" on public.greensaga_valley_chat
  for select to anon, authenticated
  using (char_length(room_code) > 0);

drop policy if exists "greensaga_chat_insert" on public.greensaga_valley_chat;
create policy "greensaga_chat_insert" on public.greensaga_valley_chat
  for insert to anon, authenticated
  with check (char_length(room_code) > 0 and char_length(sender) > 0 and char_length(message) > 0);

insert into public.greensaga_app_config (id, app_id, brand_name, revision, announcement)
values ('default', 'com.ouagx.myapp', 'GreenSAGA', 0, '')
on conflict (id) do nothing;
