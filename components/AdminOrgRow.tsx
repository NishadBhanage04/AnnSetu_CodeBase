"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { approveOrgAction, rejectOrgAction } from "@/app/actions/admin";
import type { Org } from "@/lib/supabase/types";

export function AdminOrgRow({ org }: { org: Org }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(fn: () => Promise<unknown>) {
    setError(null);
    startTransition(async () => {
      try {
        const result = await fn();
        if (result && typeof result === "object" && "success" in result && !result.success) {
          setError((result as any).error);
          return;
        }
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    });
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-medium text-stone-900">
            {org.org_name}{" "}
            <span className="text-xs font-normal text-stone-500">({org.role})</span>
          </div>
          <div className="text-xs text-stone-500">
            {org.org_type ?? "—"} · {org.contact_name ?? "—"} · {org.contact_phone ?? "—"}
          </div>
          <div className="text-xs text-stone-500">
            {org.contact_email ?? "—"}
          </div>
          <div className="text-xs text-stone-500">
            {org.address_line ?? "—"} {org.city ? `· ${org.city}` : ""}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => run(() => approveOrgAction(org.id))}
            disabled={pending}
            className="!py-1.5"
          >
            {pending ? "Saving…" : "Approve"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => run(() => rejectOrgAction(org.id))}
            disabled={pending}
            className="!py-1.5"
          >
            Reject
          </Button>
        </div>
      </div>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
