-- VELIOR Payment System Schema
-- Run this in Supabase SQL Editor AFTER schema.sql

-- 1. Add subscription_tier to profiles (missing from original schema)
alter table profiles
  add column if not exists subscription_tier text default 'free'
    check (subscription_tier in ('free', 'pro', 'elite'));

-- 2. Stripe Connect accounts (one per seller)
create table stripe_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null unique,
  stripe_connect_id text not null unique,
  kyc_status text default 'pending' check (kyc_status in ('pending', 'verified', 'rejected')),
  payouts_enabled boolean default false,
  charges_enabled boolean default false,
  onboarding_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table stripe_accounts enable row level security;
create policy "Users can view their own stripe account" on stripe_accounts
  for select using (auth.uid() = user_id);
create policy "Service role can manage stripe accounts" on stripe_accounts
  for all using (auth.role() = 'service_role');

create trigger update_stripe_accounts_updated_at
  before update on stripe_accounts
  for each row execute procedure update_updated_at_column();

-- 3. Transactions (core escrow table)
create table transactions (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references listings(id) on delete restrict not null,
  buyer_id uuid references profiles(id) on delete restrict not null,
  seller_id uuid references profiles(id) on delete restrict not null,

  -- Amounts in EUR cents (avoid floating point)
  amount_gross integer not null check (amount_gross > 0),   -- what buyer paid
  commission integer not null check (commission >= 0),       -- platform fee
  amount_net integer not null check (amount_net > 0),        -- seller receives

  -- Stripe references
  stripe_payment_intent_id text unique,
  stripe_transfer_id text unique,
  stripe_refund_id text unique,
  stripe_event_ids text[] default '{}',                      -- idempotency: processed event IDs

  -- Status machine
  status text not null default 'pending'
    check (status in (
      'pending',           -- payment intent created, not paid yet
      'paid',              -- buyer paid, funds held
      'awaiting_shipment', -- seller notified to ship
      'shipped',           -- seller entered tracking number
      'delivered',         -- carrier confirmed delivery (or manual)
      'releasing',         -- 72h window passed / buyer confirmed, releasing payout
      'completed',         -- payout sent to seller
      'disputed',          -- dispute opened
      'refunded',          -- buyer refunded
      'cancelled'          -- cancelled before payment
    )),

  -- Shipping
  tracking_number text,
  carrier text check (carrier in ('dhl', 'fedex', 'ups', 'colissimo', 'other')),
  shipped_at timestamptz,
  delivered_at timestamptz,

  -- Release window
  release_after timestamptz,  -- auto-release payout after this timestamp
  released_at timestamptz,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table transactions enable row level security;
create policy "Buyers and sellers can view their transactions" on transactions
  for select using (auth.uid() = buyer_id or auth.uid() = seller_id);
create policy "Service role can manage transactions" on transactions
  for all using (auth.role() = 'service_role');

create trigger update_transactions_updated_at
  before update on transactions
  for each row execute procedure update_updated_at_column();

-- Index for webhook idempotency check
create index idx_transactions_stripe_event_ids on transactions using gin (stripe_event_ids);

-- 4. Dispute cases
create table dispute_cases (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid references transactions(id) on delete cascade not null,
  opened_by uuid references profiles(id) on delete restrict not null,
  reason text not null check (reason in (
    'item_not_received',
    'item_not_as_described',
    'counterfeit',
    'damaged',
    'other'
  )),
  description text,
  evidence_urls text[] default '{}',  -- buyer/seller uploaded photos
  status text default 'open' check (status in ('open', 'under_review', 'resolved_buyer', 'resolved_seller', 'resolved_partial')),
  resolution_note text,
  resolved_by uuid references profiles(id),
  resolved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table dispute_cases enable row level security;
create policy "Parties can view their disputes" on dispute_cases
  for select using (
    auth.uid() = opened_by or
    auth.uid() = (select buyer_id from transactions where id = transaction_id) or
    auth.uid() = (select seller_id from transactions where id = transaction_id)
  );
create policy "Authenticated users can open disputes" on dispute_cases
  for insert with check (auth.uid() = opened_by);
create policy "Service role can manage disputes" on dispute_cases
  for all using (auth.role() = 'service_role');

create trigger update_dispute_cases_updated_at
  before update on dispute_cases
  for each row execute procedure update_updated_at_column();

-- 5. Notifications for transaction events (extends existing notification pattern)
-- Add transaction_id column if notifications table exists
-- (skip if notifications table not in original schema)
