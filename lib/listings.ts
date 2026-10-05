// Listing CRUD + status transitions. Server-only.
import { createClient } from "./supabase/server";
import type { Listing, ListingStatus } from "./supabase/types";

export type ListingDraft = {
  food_type: string;
  quantity: string;
  ready_by: string; // ISO timestamp
  pickup_window_minutes: number;
  pickup_address: string;
  photo_path: string | null;
};

export async function listMyListings(donorOrgId: string): Promise<Listing[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("donor_org_id", donorOrgId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Listing[];
}

export async function listOpenListingsForNgo(): Promise<Listing[]> {
  const supabase = await createClient();
  // expires_at is a generated column; the read-time filter below hides stale
  // rows even if the nightly cron hasn't flipped them yet.
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("status", "open")
    .gt("expires_at", new Date().toISOString())
    .order("ready_by", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Listing[];
}

export async function listMyClaims(ngoOrgId: string): Promise<Listing[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("claimed_by_org", ngoOrgId)
    .order("claimed_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Listing[];
}

export async function getListing(id: string): Promise<Listing | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as Listing | null) ?? null;
}

export async function createListing(
  donorOrgId: string,
  draft: ListingDraft,
): Promise<Listing> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .insert({
      donor_org_id: donorOrgId,
      food_type: draft.food_type,
      quantity: draft.quantity,
      ready_by: draft.ready_by,
      pickup_window_minutes: draft.pickup_window_minutes,
      pickup_address: draft.pickup_address,
      photo_path: draft.photo_path,
      status: "open",
    })
    .select()
    .single();
  if (error) throw error;
  return data as Listing;
}

export async function updateListing(
  id: string,
  donorOrgId: string,
  patch: Partial<ListingDraft>,
): Promise<Listing> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .update(patch)
    .eq("id", id)
    .eq("donor_org_id", donorOrgId)
    .select()
    .single();
  if (error) throw error;
  return data as Listing;
}

// Status transitions go through SECURITY DEFINER functions so the rules
// live in the database, not the client.

export async function claimListing(listingId: string): Promise<Listing> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("claim_listing", {
    p_listing_id: listingId,
  });
  if (error) throw error;
  return data as Listing;
}

export async function completeListing(listingId: string): Promise<Listing> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("complete_listing", {
    p_listing_id: listingId,
  });
  if (error) throw error;
  return data as Listing;
}

export async function releaseClaim(listingId: string): Promise<Listing> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("release_claim", {
    p_listing_id: listingId,
  });
  if (error) throw error;
  return data as Listing;
}

export async function cancelListing(listingId: string): Promise<Listing> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("cancel_listing", {
    p_listing_id: listingId,
  });
  if (error) throw error;
  return data as Listing;
}

export async function uploadListingPhoto(
  donorOrgId: string,
  listingId: string,
  file: File,
): Promise<string> {
  const supabase = await createClient();
  // Restrict the storage path extension to safe image types. Anything else
  // is silently coerced to "jpg" — the file is still uploaded (contentType
  // from the browser is the real guard), but its path can't lie about what
  // it is.
  const ALLOWED_EXTS = ["jpg", "jpeg", "png", "webp", "gif"] as const;
  const rawExt = (file.name.split(".").pop() ?? "").toLowerCase();
  const ext = (ALLOWED_EXTS as readonly string[]).includes(rawExt)
    ? rawExt
    : "jpg";
  const path = `${donorOrgId}/${listingId}.${ext}`;
  const { error } = await supabase.storage
    .from("listing-photos")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;
  return path;
}

/** Read the public URL for a stored photo path. */
export function getListingPhotoUrl(path: string | null): string | null {
  if (!path) return null;
  // Public bucket — use the public URL builder.
  // (We avoid instantiating a client here so this helper stays sync.)
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${base}/storage/v1/object/public/listing-photos/${path}`;
}

export const STATUS_LABEL: Record<ListingStatus, string> = {
  open: "Open",
  claimed: "Claimed",
  completed: "Completed",
  expired: "Expired",
  cancelled: "Cancelled",
};
