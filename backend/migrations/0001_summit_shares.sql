-- Public, privacy-safe share rows for tappable summit links (/s/<slug>).
-- Summits themselves stay private in user_data (JSON); this table holds only
-- the minimal public snapshot needed to render a share page.

create table if not exists public.summit_shares (
  share_slug text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  mountain_id text not null,
  summit_created_at text not null,
  summit_date text,
  mountain_name text not null,
  mountain_country text not null default '',
  mountain_range text not null default '',
  elevation_m integer not null default 0,
  elevation_ft integer not null default 0,
  show_climber boolean not null default false,
  climber_screenname text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One share row per summit record (user + mountain + summit timestamp).
create unique index if not exists summit_shares_user_mountain_created_idx
  on public.summit_shares (user_id, mountain_id, summit_created_at);

alter table public.summit_shares enable row level security;

-- Anyone (anon client) may resolve a slug to render the public page.
create policy "summit_shares_public_select"
  on public.summit_shares
  for select
  using (true);

-- Only the owner may create / update / delete their share rows.
create policy "summit_shares_owner_insert"
  on public.summit_shares
  for insert
  with check (auth.uid() = user_id);

create policy "summit_shares_owner_update"
  on public.summit_shares
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "summit_shares_owner_delete"
  on public.summit_shares
  for delete
  using (auth.uid() = user_id);
