import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { getFundTotals } from "@/lib/donations";

import { DonationForm } from "./DonationForm";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default async function SupportPage() {
  const totals = await getFundTotals();
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10 space-y-8">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight text-stone-900">
          Support our work
        </h1>
        <p className="mt-2 max-w-2xl text-stone-600">
          Your contribution keeps our pilot running. Every rupee is split
          evenly between two funds that make the food-redistribution loop
          work.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardTitle>NGO Logistics Fund</CardTitle>
          <CardDescription>
            Covers vehicle fuel, cold-chain boxes, and pickup coordination
            for the NGOs on the platform.
          </CardDescription>
          <div className="mt-4 text-2xl font-semibold text-emerald-700">
            {inr.format(totals.logistics_total)}
          </div>
          <p className="text-xs text-stone-500">
            {totals.donation_count} donation
            {totals.donation_count === 1 ? "" : "s"} so far
          </p>
        </Card>
        <Card>
          <CardTitle>Donor Packaging Support Fund</CardTitle>
          <CardDescription>
            Subsidises food-grade containers and labelling so hotels and
            caterers can pack and hand off quickly.
          </CardDescription>
          <div className="mt-4 text-2xl font-semibold text-emerald-700">
            {inr.format(totals.packaging_total)}
          </div>
          <p className="text-xs text-stone-500">
            {inr.format(totals.grand_total)} raised in total
          </p>
        </Card>
      </section>

      <section>
        <Card>
          <CardTitle>Make a donation</CardTitle>
          <CardDescription>
            This is a simulated checkout for the pilot demo — no real
            payment is processed.
          </CardDescription>
          <div className="mt-6">
            <DonationForm
              initialTotals={{
                logistics: totals.logistics_total,
                packaging: totals.packaging_total,
                grand: totals.grand_total,
                count: totals.donation_count,
              }}
            />
          </div>
        </Card>
      </section>
    </div>
  );
}
