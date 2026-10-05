-- 0001_init.sql
-- Core tables: orgs, listings, claims, plus the listing-photos storage bucket.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- orgs: one row per Supabase auth user. Covers donors, NGOs, and admins.
-- Admins are seeded manually (see README).
-- ---------------------------------------------------------------------------
create table if not exists public.orgs (
  id              uuid primary key default gen_random_uuid(),
  auth_user_id    uuid not null references auth.users(id) on delete cascade,
  role            text not null check (role in ('donor', 'ngo', 'admin')),
  org_name        text not null,
  org_type        text,
  contact_name    text,
  contact_phone   text,
  contact_email   text,
  address_line    text,
  city            text,
  verified        boolean not null default false,
  verified_at     timestamptz,
  created_at      timestamptz not null default now(),
  constraint orgs_auth_user_id_unique unique (auth_user_id)
);

create index if not exists orgs_role_idx on public.orgs (role);
create index if not exists orgs_verified_idx on public.orgs (verified);

-- ---------------------------------------------------------------------------
-- listings: a single batch of surplus food offered by a donor.
-- expires_at is computed from ready_by + pickup_window_minutes.
-- ---------------------------------------------------------------------------
create table if not exists public.listings (
  id                       uuid primary key default gen_random_uuid(),
  donor_org_id             uuid not null references public.orgs(id) on delete cascade,
  food_type                text not null,
  quantity                 text not null,
  ready_by                 timestamptz not null,
  pickup_window_minutes    integer not null check (pickup_window_minutes > 0),
  pickup_address           text not null,
  photo_path               text,
  status                   text not null default 'open'
                             check (status in ('open', 'claimed', 'completed', 'expired', 'cancelled')),
  claimed_by_org           uuid references public.orgs(id) on delete set null,
  claimed_at               timestamptz,
  completed_at             timestamptz,
  created_at               timestamptz not null default now(),
  expires_at               timestamptz generated always as
                             (ready_by + (pickup_window_minutes || ' minutes')::interval) stored
);

create index if not exists listings_status_idx on public.listings (status);
create index if not exists listings_expires_idx on public.listings (expires_at);
create index if not exists listings_donor_idx on public.listings (donor_org_id);
create index if not exists listings_claimed_by_idx on public.listings (claimed_by_org);

-- ---------------------------------------------------------------------------
-- claims: append-only history of claim events. A listing may be claimed,
-- released, then claimed again — each event is a row.
-- ---------------------------------------------------------------------------
create table if not exists public.claims (
  id            uuid primary key default gen_random_uuid(),
  listing_id    uuid not null references public.listings(id) on delete cascade,
  ngo_org_id    uuid not null references public.orgs(id) on delete cascade,
  claimed_at    timestamptz not null default now(),
  released_at   timestamptz
);

create index if not exists claims_listing_idx on public.claims (listing_id);
create index if not exists claims_ngo_idx on public.claims (ngo_org_id);

-- ---------------------------------------------------------------------------
-- Storage: listing-photos bucket (public read, owner write).
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', true)
on conflict (id) do nothing;
