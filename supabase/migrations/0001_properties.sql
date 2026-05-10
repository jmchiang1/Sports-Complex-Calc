create table if not exists properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  label text,
  address text,

  listing_json jsonb not null,
  assumptions_json jsonb not null,

  -- Snapshot for list view (denormalized)
  rating text,
  noi numeric,
  total_courts int,
  payback_years numeric
);

create index if not exists properties_user_id_idx on properties(user_id);
create index if not exists properties_created_at_idx on properties(created_at desc);

alter table properties enable row level security;

drop policy if exists "own rows" on properties;
create policy "own rows" on properties
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
