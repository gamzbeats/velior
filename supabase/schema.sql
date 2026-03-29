-- VELIOR Luxury Watch Marketplace — Supabase Schema

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles (extends auth.users)
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique,
  full_name text,
  avatar_url text,
  phone text,
  location text,
  bio text,
  verified boolean default false,
  created_at timestamptz default now()
);

-- RLS
alter table profiles enable row level security;
create policy "Public profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can insert their own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile" on profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Listings
create table listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  brand text not null,
  model text not null,
  price numeric(12,2) not null check (price > 0),
  condition text not null check (condition in ('mint','excellent','good','fair')),
  description text,
  images text[] default '{}',
  year integer check (year >= 1900 and year <= extract(year from now()) + 1),
  reference_number text,
  movement text,
  case_size text,
  status text default 'active' check (status in ('active','sold','draft')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table listings enable row level security;
create policy "Active listings are viewable by everyone" on listings for select using (status = 'active' or auth.uid() = seller_id);
create policy "Authenticated users can create listings" on listings for insert with check (auth.uid() = seller_id);
create policy "Sellers can update their own listings" on listings for update using (auth.uid() = seller_id);
create policy "Sellers can delete their own listings" on listings for delete using (auth.uid() = seller_id);

-- Auto-update updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_listings_updated_at
  before update on listings
  for each row execute procedure update_updated_at_column();

-- Messages
create table messages (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references listings(id) on delete cascade not null,
  sender_id uuid references profiles(id) on delete set null,
  recipient_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  sender_name text,
  sender_email text,
  read boolean default false,
  created_at timestamptz default now()
);

alter table messages enable row level security;
create policy "Recipients can view their messages" on messages for select using (auth.uid() = recipient_id or auth.uid() = sender_id);
create policy "Anyone can send messages" on messages for insert with check (true);
create policy "Recipients can mark messages as read" on messages for update using (auth.uid() = recipient_id);

-- Storage bucket for listing images
insert into storage.buckets (id, name, public) values ('listing-images', 'listing-images', true)
on conflict (id) do nothing;

create policy "Anyone can view listing images" on storage.objects for select using (bucket_id = 'listing-images');
create policy "Authenticated users can upload listing images" on storage.objects for insert with check (bucket_id = 'listing-images' and auth.role() = 'authenticated');
create policy "Users can delete their own listing images" on storage.objects for delete using (bucket_id = 'listing-images' and auth.uid()::text = (storage.foldername(name))[1]);
