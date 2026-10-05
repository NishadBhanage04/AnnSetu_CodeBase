-- 0002_donations.sql
-- Simulated donations from /support, the fund_totals view, and the listing
-- state-transition functions. RLS comes in 0003.

-- ---------------------------------------------------------------------------
-- donations: a record of one simulated gift. No real money, no PII required.
-- ---------------------------------------------------------------------------
create table if not exists public.donations (
  id              uuid primary key default gen_random_uuid(),
  donor_name      text,
  donor_email     text,
  amount_inr      numeric(10, 2) not null check (amount_inr > 0),
  logistics_share numeric(10, 2) not null check (logistics_share >= 0),
  packaging_share numeric(10, 2) not null check (packaging_share >= 0),
  created_at      timestamptz not null default now()
);

create index if not exists donations_created_idx on public.donations (created_at desc);

-- ---------------------------------------------------------------------------
-- fund_totals: aggregate view for the /support thank-you screen.
-- Always returns exactly one row (zeros when empty).
-- ---------------------------------------------------------------------------
create or replace view public.fund_totals
with (security_invoker = on) as
select
  coalesce(sum(logistics_share), 0)::numeric as logistics_total,
  coalesce(sum(packaging_share), 0)::numeric as packaging_total,
  coalesce(sum(amount_inr), 0)::numeric as grand_total,
  count(*)::integer as donation_count
from public.donations;

grant select on public.fund_totals to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Helper: get the current user's org id. Returns null for anon sessions.
-- Used inside the state-transition functions below.
-- ---------------------------------------------------------------------------
create or replace function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.orgs
  where auth_user_id = auth.uid()
  limit 1;
$$;

-- ---------------------------------------------------------------------------
-- claim_listing: NGO claims an open, unexpired listing.
-- Atomically flips status and inserts a claims row.
-- ---------------------------------------------------------------------------
create or replace function public.claim_listing(p_listing_id uuid)
returns public.listings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid := public.current_org_id();
  v_listing public.listings;
begin
  if v_org_id is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  select * into v_listing
  from public.listings
  where id = p_listing_id
  for update;

  if not found then
    raise exception 'listing not found' using errcode = 'P0002';
  end if;

  if v_listing.status <> 'open' then
    raise exception 'listing is not open' using errcode = 'P0001';
  end if;

  if v_listing.expires_at <= now() then
    raise exception 'listing has expired' using errcode = 'P0001';
  end if;

  update public.listings
     set status         = 'claimed',
         claimed_by_org = v_org_id,
         claimed_at     = now()
   where id = p_listing_id
   returning * into v_listing;

  insert into public.claims (listing_id, ngo_org_id)
  values (p_listing_id, v_org_id);

  return v_listing;
end;
$$;

-- ---------------------------------------------------------------------------
-- release_claim: claiming NGO releases its claim. Status -> 'open' again,
-- and the current claims row is marked released_at.
-- ---------------------------------------------------------------------------
create or replace function public.release_claim(p_listing_id uuid)
returns public.listings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid := public.current_org_id();
  v_listing public.listings;
begin
  if v_org_id is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  select * into v_listing
  from public.listings
  where id = p_listing_id
  for update;

  if not found then
    raise exception 'listing not found' using errcode = 'P0002';
  end if;

  if v_listing.status <> 'claimed' or v_listing.claimed_by_org <> v_org_id then
    raise exception 'not the claiming org' using errcode = 'P0001';
  end if;

  update public.claims
     set released_at = now()
   where listing_id = p_listing_id
     and ngo_org_id = v_org_id
     and released_at is null;

  update public.listings
     set status         = 'open',
         claimed_by_org = null,
         claimed_at     = null
   where id = p_listing_id
   returning * into v_listing;

  return v_listing;
end;
$$;

-- ---------------------------------------------------------------------------
-- complete_listing: claiming NGO confirms pickup happened.
-- ---------------------------------------------------------------------------
create or replace function public.complete_listing(p_listing_id uuid)
returns public.listings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid := public.current_org_id();
  v_listing public.listings;
begin
  if v_org_id is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  select * into v_listing
  from public.listings
  where id = p_listing_id
  for update;

  if not found then
    raise exception 'listing not found' using errcode = 'P0002';
  end if;

  if v_listing.status <> 'claimed' or v_listing.claimed_by_org <> v_org_id then
    raise exception 'not the claiming org' using errcode = 'P0001';
  end if;

  update public.listings
     set status       = 'completed',
         completed_at = now()
   where id = p_listing_id
   returning * into v_listing;

  return v_listing;
end;
$$;

-- ---------------------------------------------------------------------------
-- cancel_listing: owning donor cancels. Allowed from 'open' or 'claimed'.
-- ---------------------------------------------------------------------------
create or replace function public.cancel_listing(p_listing_id uuid)
returns public.listings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid := public.current_org_id();
  v_listing public.listings;
begin
  if v_org_id is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  select * into v_listing
  from public.listings
  where id = p_listing_id
  for update;

  if not found then
    raise exception 'listing not found' using errcode = 'P0002';
  end if;

  if v_listing.donor_org_id <> v_org_id then
    raise exception 'not the listing owner' using errcode = 'P0001';
  end if;

  if v_listing.status not in ('open', 'claimed') then
    raise exception 'listing cannot be cancelled in status %', v_listing.status
      using errcode = 'P0001';
  end if;

  update public.listings
     set status         = 'cancelled',
         claimed_by_org = null,
         claimed_at     = null
   where id = p_listing_id
   returning * into v_listing;

  return v_listing;
end;
$$;

-- ---------------------------------------------------------------------------
-- expire_stale_listings: called by the nightly cron. Returns the count
-- of rows flipped to 'expired'.
-- ---------------------------------------------------------------------------
create or replace function public.expire_stale_listings()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  with stale as (
    select id
    from public.listings
    where status in ('open', 'claimed')
      and expires_at < now()
      and completed_at is null
    for update
  )
  update public.listings l
     set status = 'expired'
    from stale
   where l.id = stale.id;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- approve_org: admin flips verified = true.
-- ---------------------------------------------------------------------------
create or replace function public.approve_org(p_org_id uuid)
returns public.orgs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := public.current_org_id();
  v_org public.orgs;
begin
  if v_caller is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  select * into v_org from public.orgs where id = v_caller;
  if v_org.role <> 'admin' then
    raise exception 'not an admin' using errcode = 'P0001';
  end if;

  update public.orgs
     set verified    = true,
         verified_at = now()
   where id = p_org_id
   returning * into v_org;

  return v_org;
end;
$$;

-- Expose the functions to authenticated callers. The function bodies still
-- enforce role checks; this just lets PostgREST route to them.
grant execute on function public.claim_listing(uuid)        to authenticated;
grant execute on function public.release_claim(uuid)        to authenticated;
grant execute on function public.complete_listing(uuid)     to authenticated;
grant execute on function public.cancel_listing(uuid)       to authenticated;
grant execute on function public.expire_stale_listings()    to service_role;
grant execute on function public.approve_org(uuid)          to authenticated;
