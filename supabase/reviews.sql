-- Reviews table
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid references transactions(id) on delete cascade not null unique,
  reviewer_id uuid references profiles(id) not null,
  seller_id uuid references profiles(id) not null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now()
);
alter table reviews enable row level security;
create policy "Public can view reviews" on reviews for select using (true);
create policy "Buyers can insert their review" on reviews
  for insert with check (auth.uid() = reviewer_id);
