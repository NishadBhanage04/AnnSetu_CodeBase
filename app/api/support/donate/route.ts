// POST /api/support/donate — record a simulated donation.
// No auth required. Rate-limited in-memory (1 req / sec / IP) to keep
// the demo honest; swap for a real rate limiter before public exposure.
import { NextResponse, type NextRequest } from "next/server";

import { getFundTotals, recordDonation, splitDonation } from "@/lib/donations";

export const runtime = "nodejs";

const buckets = new Map<string, { tokens: number; updatedAt: number }>();
const RATE = 1; // tokens per second
const CAP = 5; // burst

function allow(key: string): boolean {
  const now = Date.now();
  const b = buckets.get(key) ?? { tokens: CAP, updatedAt: now };
  const elapsed = (now - b.updatedAt) / 1000;
  b.tokens = Math.min(CAP, b.tokens + elapsed * RATE);
  b.updatedAt = now;
  if (b.tokens < 1) {
    buckets.set(key, b);
    return false;
  }
  b.tokens -= 1;
  buckets.set(key, b);
  return true;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!allow(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const obj = body as { amount?: unknown; donor_name?: unknown; donor_email?: unknown };
  const amount = Number(obj.amount);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1_00_00_000) {
    return NextResponse.json(
      { error: "amount must be a positive number" },
      { status: 400 },
    );
  }
  if (amount < 1) {
    return NextResponse.json({ error: "minimum donation is ₹1" }, { status: 400 });
  }

  const name =
    typeof obj.donor_name === "string" && obj.donor_name.trim()
      ? obj.donor_name.trim().slice(0, 120)
      : null;
  const email =
    typeof obj.donor_email === "string" && obj.donor_email.trim()
      ? obj.donor_email.trim().slice(0, 200)
      : null;

  try {
    const donation = await recordDonation({ amount, donorName: name, donorEmail: email });
    const totals = await getFundTotals();
    const { logistics, packaging } = splitDonation(amount);
    return NextResponse.json({
      amount,
      logistics,
      packaging,
      donation_id: donation.id,
      totals: {
        logistics: Number(totals.logistics_total),
        packaging: Number(totals.packaging_total),
        grand: Number(totals.grand_total),
        count: totals.donation_count,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to record donation" },
      { status: 500 },
    );
  }
}
