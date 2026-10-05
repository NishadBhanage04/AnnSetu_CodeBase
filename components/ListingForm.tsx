"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { ErrorText, FieldGroup, HelpText, Input, Label, Select, Textarea } from "@/components/ui/Form";

import { createListingAction, updateListingAction } from "@/app/actions/listings";
import type { Listing } from "@/lib/supabase/types";

type Mode =
  | { kind: "create" }
  | { kind: "edit"; listing: Listing };

// The default datetime-local value should be "now + 1 hour" so donors
// don't accidentally pick a past time. ISO -> "YYYY-MM-DDTHH:mm" for the input.
function defaultReadyBy(): string {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setSeconds(0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function listingReadyByLocal(l: Listing): string {
  const d = new Date(l.ready_by);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ListingForm({ mode, onDone }: { mode: Mode; onDone?: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isEdit = mode.kind === "edit";
  const initial = isEdit ? mode.listing : null;

  const [readyBy, setReadyBy] = useState<string>(
    initial ? listingReadyByLocal(initial) : defaultReadyBy(),
  );
  const [windowMinutes, setWindowMinutes] = useState<string>(
    initial ? String(initial.pickup_window_minutes) : "60",
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const result = isEdit
          ? await updateListingAction(initial!.id, fd)
          : await createListingAction(fd);

        if (!result.success) {
          setError(result.error);
          return;
        }

        router.refresh();
        onDone?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FieldGroup>
        <Label htmlFor="food_type">Food type</Label>
        <Input
          id="food_type"
          name="food_type"
          required
          placeholder="e.g. Cooked rice and dal"
          defaultValue={initial?.food_type}
        />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="quantity">Quantity</Label>
        <Input
          id="quantity"
          name="quantity"
          required
          placeholder="e.g. ~30 plates"
          defaultValue={initial?.quantity}
        />
        <HelpText>Free text — a rough estimate is fine for the pilot.</HelpText>
      </FieldGroup>
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup>
          <Label htmlFor="ready_by">Ready by</Label>
          <Input
            id="ready_by"
            name="ready_by"
            type="datetime-local"
            required
            value={readyBy}
            onChange={(e) => setReadyBy(e.target.value)}
          />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="pickup_window_minutes">Pickup window (minutes)</Label>
          <Select
            id="pickup_window_minutes"
            name="pickup_window_minutes"
            value={windowMinutes}
            onChange={(e) => setWindowMinutes(e.target.value)}
          >
            <option value="30">30 min</option>
            <option value="60">1 hour</option>
            <option value="90">1.5 hours</option>
            <option value="120">2 hours</option>
            <option value="180">3 hours</option>
            <option value="240">4 hours</option>
          </Select>
        </FieldGroup>
      </div>
      <FieldGroup>
        <Label htmlFor="pickup_address">Pickup address</Label>
        <Textarea
          id="pickup_address"
          name="pickup_address"
          required
          rows={3}
          placeholder="Building, street, area, landmark"
          defaultValue={initial?.pickup_address}
        />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="photo">Photo (optional)</Label>
        <Input id="photo" name="photo" type="file" accept="image/*" />
        <HelpText>JPG or PNG. The image is public to logged-in NGOs.</HelpText>
      </FieldGroup>
      <ErrorText>{error}</ErrorText>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : isEdit ? "Save changes" : "Create listing"}
        </Button>
        {onDone ? (
          <Button type="button" variant="secondary" onClick={onDone} disabled={pending}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}
