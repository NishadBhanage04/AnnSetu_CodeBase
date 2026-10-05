// /support donation recording. Server-only.
import { createClient } from "./supabase/server";
import type { Donation, FundTotals } from "./supabase/types";

/** Split is hard-coded 50/50 per the demo spec. */
export const LOGISTICS_RATIO = 0.5;
export const PACKAGING_RATIO = 0.5;

export function splitDonation(amount: number): {
  logistics: number;
  packaging: number;
} {
  // Round the packaging share to whole paise; any rounding residue
  // (1-paise at most) is absorbed into logistics so the two shares always
  // sum to `amount` exactly.
  const packaging = Math.round(amount * PACKAGING_RATIO * 100) / 100;
  const logistics = amount - packaging;
  return { logistics, packaging };
}

export async function recordDonation(input: {
  amount: number;
  donorName: string | null;
  donorEmail: string | null;
}): Promise<Donation> {
  const { logistics, packaging } = splitDonation(input.amount);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("donations")
    .insert({
      amount_inr: input.amount,
      logistics_share: logistics,
      packaging_share: packaging,
      donor_name: input.donorName,
      donor_email: input.donorEmail,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Donation;
}

export async function getFundTotals(): Promise<FundTotals> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("fund_totals").select("*").single();
  // The view always returns a single row (coalesce(sum(...), 0) on an empty
  // table is a row of zeros), so any error here means the view is missing or
  // the query is broken — surface it rather than swallowing it as zeros.
  if (error) throw error;
  return data as FundTotals;
}

export async function listDonationsForAdmin(limit = 100): Promise<Donation[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("donations")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Donation[];
}
