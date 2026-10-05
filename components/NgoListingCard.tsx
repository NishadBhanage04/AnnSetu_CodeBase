"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { claimListingAction } from "@/app/actions/claims";
import { getListingPhotoUrl } from "@/lib/listings";
import type { Listing } from "@/lib/supabase/types";

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function NgoListingCard({ listing }: { listing: Listing }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClaim() {
    setError(null);
    startTransition(async () => {
      try {
        await claimListingAction(listing.id);
        router.push("/ngo/claims");
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    });
  }

  const photoUrl = getListingPhotoUrl(listing.photo_path);

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
          <h3 className="truncate text-base font-semibold text-stone-900">
            {listing.food_type}
          </h3>
          <p className="mt-1 text-sm text-stone-600">{listing.quantity}</p>
          <p className="mt-2 text-xs text-stone-500">
            Ready by {formatDateTime(listing.ready_by)} · Pickup window{" "}
            {listing.pickup_window_minutes} min · Expires{" "}
            {formatDateTime(listing.expires_at)}
          </p>
          <p className="mt-1 text-xs text-stone-500">{listing.pickup_address}</p>
        </div>
      </div>
      <div className="mt-4">
        <Button onClick={handleClaim} disabled={pending}>
          {pending ? "Claiming…" : "Claim listing"}
        </Button>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      </div>
    </div>
  );
}
