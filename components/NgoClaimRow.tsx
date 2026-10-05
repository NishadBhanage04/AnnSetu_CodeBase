"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/StatusBadge";
import {
  completeListingAction,
  releaseClaimAction,
} from "@/app/actions/claims";
import { getListingPhotoUrl } from "@/lib/listings";
import type { Listing } from "@/lib/supabase/types";

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function NgoClaimRow({ listing }: { listing: Listing }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleComplete() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await completeListingAction(listing.id);
        if (!result.success) {
          setError(result.error);
          return;
        }
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    });
  }

  function handleRelease() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await releaseClaimAction(listing.id);
        if (!result.success) {
          setError(result.error);
          return;
        }
        router.push("/ngo/dashboard");
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    });
  }

  const photoUrl = getListingPhotoUrl(listing.photo_path);
  const canComplete = listing.status === "claimed";
  const canRelease = listing.status === "claimed";

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt=""
            width={80}
            height={80}
            className="h-20 w-20 flex-none rounded-md border border-stone-200 object-cover"
          />
        ) : (
          <div
            aria-hidden
            className="h-20 w-20 flex-none rounded-md border border-dashed border-stone-300 bg-stone-50"
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
            Claimed {listing.claimed_at ? formatDateTime(listing.claimed_at) : "—"}{" "}
            · Ready by {formatDateTime(listing.ready_by)} · Expires{" "}
            {formatDateTime(listing.expires_at)}
          </p>
          <p className="mt-1 text-xs text-stone-500">{listing.pickup_address}</p>
        </div>
      </div>
      {canComplete || canRelease ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {canComplete ? (
            <Button onClick={handleComplete} disabled={pending}>
              {pending ? "Saving…" : "Mark pickup complete"}
            </Button>
          ) : null}
          {canRelease ? (
            <Button
              variant="secondary"
              onClick={handleRelease}
              disabled={pending}
            >
              Release claim
            </Button>
          ) : null}
        </div>
      ) : null}
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
