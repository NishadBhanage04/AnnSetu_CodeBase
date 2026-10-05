import type { ListingStatus } from "@/lib/supabase/types";

const COLORS: Record<ListingStatus, string> = {
  open: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  claimed: "bg-amber-100 text-amber-800 ring-amber-200",
  completed: "bg-sky-100 text-sky-800 ring-sky-200",
  expired: "bg-stone-200 text-stone-700 ring-stone-300",
  cancelled: "bg-red-100 text-red-800 ring-red-200",
};

const LABELS: Record<ListingStatus, string> = {
  open: "Open",
  claimed: "Claimed",
  completed: "Completed",
  expired: "Expired",
  cancelled: "Cancelled",
};

export function StatusBadge({ status }: { status: ListingStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${COLORS[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
