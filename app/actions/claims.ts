// Server actions for the NGO claim/complete/release flow.
"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { claimListing, completeListing, releaseClaim } from "@/lib/listings";
import { safeAction } from "@/lib/action-result";

export async function claimListingAction(listingId: string) {
  return safeAction(async () => {
    await requireUser({ role: "ngo" });
    await claimListing(listingId);
    revalidatePath("/ngo/dashboard");
    revalidatePath("/ngo/claims");
  });
}

export async function completeListingAction(listingId: string) {
  return safeAction(async () => {
    await requireUser({ role: "ngo" });
    await completeListing(listingId);
    revalidatePath("/ngo/claims");
  });
}

export async function releaseClaimAction(listingId: string) {
  return safeAction(async () => {
    await requireUser({ role: "ngo" });
    await releaseClaim(listingId);
    revalidatePath("/ngo/dashboard");
    revalidatePath("/ngo/claims");
  });
}
