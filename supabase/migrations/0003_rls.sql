-- 0003_rls.sql
-- Row-level security for orgs, listings, claims, and donations.
-- All access flows through authenticated Supabase users except for the
-- public /support donation insert and the public fund_totals view.

-- Enable RLS
alter table public.orgs      enable row level security;
alter table public.listings  enable row level security;
alter table public.claims    enable row level security;
alter table public.donations enable row level security;

-- ---------------------------------------------------------------------------
-- orgs
-- ---------------------------------------------------------------------------
-- Read: a user can read their own org; admins can read all.
drop policy if exists orgs_select_self_or_admin on public.orgs;
create policy orgs_select_self_or_admin on public.orgs
  for select
  to authenticated
  using (
    auth_user_id = auth.uid()
    or exists (
      select 1 from public.orgs o
      where o.auth_user_id = auth.uid() and o.role = 'admin'
    )
  );

-- Insert: a user can insert exactly one row referencing their own auth.uid().
-- The unique constraint on auth_user_id enforces the one-row rule.
drop policy if exists orgs_insert_self on public.orgs;
create policy orgs_insert_self on public.orgs
  for insert
  to authenticated
  with check (auth_user_id = auth.uid());

-- Update: a user can update their own row; admins can update any.
drop policy if exists orgs_update_self_or_admin on public.orgs;
create policy orgs_update_self_or_admin on public.orgs
  for update
  to authenticated
  using (
    auth_user_id = auth.uid()
    or exists (
      select 1 from public.orgs o
      where o.auth_user_id = auth.uid() and o.role = 'admin'
    )
  )
  with check (
    auth_user_id = auth.uid()
    or exists (
      select 1 from public.orgs o
      where o.auth_user_id = auth.uid() and o.role = 'admin'
    )
  );

-- ---------------------------------------------------------------------------
-- listings
-- ---------------------------------------------------------------------------
-- Read: donors see their own (any status); NGOs see open, unexpired
-- listings + their own claimed/completed ones; admins see all.
drop policy if exists listings_select on public.listings;
create policy listings_select on public.listings
  for select
  to authenticated
  using (
    donor_org_id = public.current_org_id()
    or claimed_by_org = public.current_org_id()
    or (
      status = 'open'
      and exists (
        select 1 from public.orgs o
        where o.auth_user_id = auth.uid() and o.role = 'ngo'
      )
    )
    or exists (
      select 1 from public.orgs o
      where o.auth_user_id = auth.uid() and o.role = 'admin'
    )
  );

-- Insert: only donor orgs can create listings, and they must own them.
drop policy if exists listings_insert_donor on public.listings;
create policy listings_insert_donor on public.listings
  for insert
  to authenticated
  with check (
    donor_org_id = public.current_org_id()
    and exists (
      select 1 from public.orgs o
      where o.auth_user_id = auth.uid() and o.role = 'donor'
    )
  );

-- Update: donors can update their own listings (any field).
-- Status transitions for NGOs go through SECURITY DEFINER functions,
-- which already enforce the right org. We still need a permissive UPDATE
-- for the donor path.
drop policy if exists listings_update_owner on public.listings;
create policy listings_update_owner on public.listings
  for update
  to authenticated
  using (donor_org_id = public.current_org_id())
  with check (donor_org_id = public.current_org_id());

-- ---------------------------------------------------------------------------
-- claims
-- ---------------------------------------------------------------------------
-- A claim row is created by the claim_listing function, not by the client.
-- Select: the claiming NGO, the listing's donor, and admins can read.
drop policy if exists claims_select on public.claims;
create policy claims_select on public.claims
  for select
  to authenticated
  using (
    ngo_org_id = public.current_org_id()
    or exists (
      select 1 from public.listings l
      where l.id = claims.listing_id and l.donor_org_id = public.current_org_id()
    )
    or exists (
      select 1 from public.orgs o
      where o.auth_user_id = auth.uid() and o.role = 'admin'
    )
  );

-- No direct INSERT/UPDATE/DELETE — all writes go through RPCs.

-- ---------------------------------------------------------------------------
-- donations
-- ---------------------------------------------------------------------------
-- Anyone (including anon) can insert. We rely on a server-side API route
-- that rate-limits and validates; this policy is the safety net.
drop policy if exists donations_insert_anon on public.donations;
create policy donations_insert_anon on public.donations
  for insert
  to anon, authenticated
  with check (true);

-- Read: admins only.
drop policy if exists donations_select_admin on public.donations;
create policy donations_select_admin on public.donations
  for select
  to authenticated
  using (
    exists (
      select 1 from public.orgs o
      where o.auth_user_id = auth.uid() and o.role = 'admin'
    )
  );

-- ---------------------------------------------------------------------------
-- storage.objects: listing-photos bucket
-- ---------------------------------------------------------------------------
-- Path convention: {donor_org_id}/{listing_id}.{ext}
-- Read: anyone (bucket is public).
drop policy if exists listing_photos_read on storage.objects;
create policy listing_photos_read on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'listing-photos');

-- Write: a donor org can upload to its own folder.
drop policy if exists listing_photos_write on storage.objects;
create policy listing_photos_write on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'listing-photos'
    and exists (
      select 1 from public.orgs o
      where o.auth_user_id = auth.uid()
        and o.role = 'donor'
        and (storage.objects.name)::text like (o.id::text || '/%')
    )
  );

-- Update + delete in the donor's own folder.
drop policy if exists listing_photos_update on storage.objects;
create policy listing_photos_update on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'listing-photos'
    and exists (
      select 1 from public.orgs o
      where o.auth_user_id = auth.uid()
        and o.role = 'donor'
        and (storage.objects.name)::text like (o.id::text || '/%')
    )
  );

drop policy if exists listing_photos_delete on storage.objects;
create policy listing_photos_delete on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'listing-photos'
    and exists (
      select 1 from public.orgs o
      where o.auth_user_id = auth.uid()
        and o.role = 'donor'
        and (storage.objects.name)::text like (o.id::text || '/%')
    )
  );
