"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/StatusBadge";
import { cancelListingAction } from "@/app/actions/listings";
import { getListingPhotoUrl } from "@/lib/listings";
import type { Listing } from "@/lib/supabase/types";

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function DonorListingRow({ listing }: { listing: Listing }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  function handleCancel() {
    startTransition(async () => {
      try {
        await cancelListingAction(listing.id);
        router.refresh();
      } catch (err) {
        // Best-effort; surface the error in the dev console.
        console.error(err);
      }
    });
  }

  const photoUrl = getListingPhotoUrl(listing.photo_path);
  const canCancel = listing.status === "open" || listing.status === "claimed";

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt=""
            width={96}
            height={96}
            className="h-24 w-24 flex-none rounded-md border border-stone-200 object-cover"
          />
        ) : (
          <div
            aria-hidden
            className="h-24 w-24 flex-none rounded-md border border-dashed border-stone-300 bg-stone-50"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-semibold text-stone-900">
              {listing.food_type}
            </h3>
            <StatusBadge status={listing.status} />
          </div>
          <p className="mt-1 text-sm text-stone-600">{listing.quantity}</p>
          <p className="mt-2 text-xs text-stone-500">
            Ready by {formatDateTime(listing.ready_by)} · Pickup window{" "}
            {listing.pickup_window_minutes} min · Expires{" "}
            {formatDateTime(listing.expires_at)}
          </p>
          <p className="mt-1 text-xs text-stone-500">{listing.pickup_address}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {listing.status === "open" || listing.status === "claimed" ? (
          <Link href={`/donor/listings/${listing.id}/edit`}>
            <Button variant="secondary">Edit</Button>
          </Link>
        ) : null}
        {canCancel ? (
          confirming ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-stone-600">Cancel this listing?</span>
              <Button
                variant="danger"
                onClick={handleCancel}
                disabled={pending}
                className="!py-1.5"
              >
                {pending ? "Cancelling…" : "Yes, cancel"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setConfirming(false)}
                disabled={pending}
                className="!py-1.5"
              >
                Keep
              </Button>
            </div>
          ) : (
            <Button variant="secondary" onClick={() => setConfirming(true)}>
              Cancel listing
            </Button>
          )
        ) : null}
      </div>
    </div>
  );
}
