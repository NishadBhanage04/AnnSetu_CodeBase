/** Read the public URL for a stored photo path. */
export function getListingPhotoUrl(path: string | null): string | null {
  if (!path) return null;
  // Public bucket — use the public URL builder.
  // (We avoid instantiating a client here so this helper stays sync.)
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${base}/storage/v1/object/public/listing-photos/${path}`;
}

import type { ListingStatus } from "./supabase/types";

export const STATUS_LABEL: Record<ListingStatus, string> = {
  open: "Open",
  claimed: "Claimed",
  completed: "Completed",
  expired: "Expired",
  cancelled: "Cancelled",
};
