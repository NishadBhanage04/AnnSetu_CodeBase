// Server actions for listing CRUD. These are invoked from <form action={…}>
// in the donor dashboard.
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import {
  cancelListing,
  createListing,
  updateListing,
  uploadListingPhoto,
} from "@/lib/listings";
import { safeAction } from "@/lib/action-result";

function toIsoFromLocal(value: string): string {
  // <input type="datetime-local"> gives us a wall-clock string in the
  // browser's timezone. new Date(...) parses that as local time, then
  // toISOString() converts to UTC — what the DB column wants.
  if (!value) throw new Error("ready_by is required");
  return new Date(value).toISOString();
}

export async function createListingAction(formData: FormData) {
  return safeAction(async () => {
    const me = await requireUser({ role: "donor" });

    const draft = {
      food_type: String(formData.get("food_type") ?? "").trim(),
      quantity: String(formData.get("quantity") ?? "").trim(),
      ready_by: toIsoFromLocal(String(formData.get("ready_by") ?? "")),
      pickup_window_minutes: Number(formData.get("pickup_window_minutes") ?? 60),
      pickup_address: String(formData.get("pickup_address") ?? "").trim(),
      photo_path: null as string | null,
    };

    if (!draft.food_type || !draft.quantity || !draft.pickup_address) {
      throw new Error("Food type, quantity, and pickup address are required.");
    }
    if (!Number.isFinite(draft.pickup_window_minutes) || draft.pickup_window_minutes <= 0) {
      throw new Error("Pickup window must be a positive number of minutes.");
    }

    const photo = formData.get("photo");
    const created = await createListing(me.org.id, draft);

    if (photo instanceof File && photo.size > 0) {
      try {
        const path = await uploadListingPhoto(me.org.id, created.id, photo);
        await updateListing(created.id, me.org.id, { photo_path: path });
      } catch (err) {
        // Don't fail the whole create if the upload fails; the listing
        // is more important than the photo.
        console.error("photo upload failed", err);
      }
    }

    revalidatePath("/donor/dashboard");
    redirect("/donor/dashboard");
    return created;
  });
}

export async function updateListingAction(listingId: string, formData: FormData) {
  return safeAction(async () => {
    const me = await requireUser({ role: "donor" });

    const patch: Parameters<typeof updateListing>[2] = {};
    const foodType = String(formData.get("food_type") ?? "").trim();
    const quantity = String(formData.get("quantity") ?? "").trim();
    const readyBy = String(formData.get("ready_by") ?? "");
    const window = String(formData.get("pickup_window_minutes") ?? "");
    const address = String(formData.get("pickup_address") ?? "").trim();

    if (foodType) patch.food_type = foodType;
    if (quantity) patch.quantity = quantity;
    if (readyBy) patch.ready_by = toIsoFromLocal(readyBy);
    if (window) {
      const n = Number(window);
      if (!Number.isFinite(n) || n <= 0) {
        throw new Error("Pickup window must be a positive number of minutes.");
      }
      patch.pickup_window_minutes = n;
    }
    if (address) patch.pickup_address = address;

    const photo = formData.get("photo");
    if (photo instanceof File && photo.size > 0) {
      const path = await uploadListingPhoto(me.org.id, listingId, photo);
      patch.photo_path = path;
    }

    await updateListing(listingId, me.org.id, patch);
    revalidatePath("/donor/dashboard");
    redirect("/donor/dashboard");
  });
}

export async function cancelListingAction(listingId: string) {
  return safeAction(async () => {
    const me = await requireUser({ role: "donor" });
    await cancelListing(listingId);
    // RLS in the cancel_listing function will reject if the listing doesn't
    // belong to this donor, so the requireUser+RLS combo is enough.
    void me;
    revalidatePath("/donor/dashboard");
  });
}
