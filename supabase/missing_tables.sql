-- VELIOR — Missing tables & columns
-- Run this in Supabase SQL Editor

-- 1. Favorites
create table if not exists favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  listing_id uuid references listings(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, listing_id)
);
alter table favorites enable row level security;
create policy "Users can manage their own favorites" on favorites
  for all using (auth.uid() = user_id);

-- 2. Notifications
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  type text not null check (type in ('message', 'offer', 'favorite', 'transaction')),
  title text not null,
  body text,
  listing_id uuid references listings(id) on delete set null,
  read boolean default false,
  created_at timestamptz default now()
);
alter table notifications enable row level security;
create policy "Users can manage their own notifications" on notifications
  for all using (auth.uid() = user_id);

-- 3. Views column on listings
alter table listings add column if not exists views integer default 0;

-- 4. RPC to safely increment views
create or replace function increment_listing_views(listing_id uuid)
returns void as $$
  update listings set views = views + 1 where id = listing_id;
$$ language sql security definer;

-- 5. is_admin flag on profiles (for admin dashboard)
alter table profiles add column if not exists is_admin boolean default false;
