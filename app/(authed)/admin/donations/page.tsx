import { TopNav } from "@/components/TopNav";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { requireUser } from "@/lib/auth";
import { getFundTotals, listDonationsForAdmin } from "@/lib/donations";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
const inr2 = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
});

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function AdminDonationsPage() {
  const me = await requireUser({ role: "admin" });
  const [donations, totals] = await Promise.all([
    listDonationsForAdmin(),
    getFundTotals(),
  ]);

  return (
    <>
      <TopNav org={me.org} />
      <div className="mx-auto w-full max-w-4xl px-6 py-8 space-y-8">
        <h1 className="text-2xl font-semibold text-stone-900">Simulated donations</h1>
        <p className="text-sm text-stone-600">
          Donations made through the public <code>/support</code> page. No
          real money is collected.
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardDescription>Total raised</CardDescription>
            <div className="mt-1 text-2xl font-semibold text-stone-900">
              {inr.format(totals.grand_total)}
            </div>
            <p className="text-xs text-stone-500">
              {totals.donation_count} donation
              {totals.donation_count === 1 ? "" : "s"}
            </p>
          </Card>
          <Card>
            <CardDescription>NGO Logistics Fund</CardDescription>
            <div className="mt-1 text-2xl font-semibold text-emerald-700">
              {inr.format(totals.logistics_total)}
            </div>
          </Card>
          <Card>
            <CardDescription>Donor Packaging Support Fund</CardDescription>
            <div className="mt-1 text-2xl font-semibold text-emerald-700">
              {inr.format(totals.packaging_total)}
            </div>
          </Card>
        </div>

        <Card>
          <CardTitle>Recent donations</CardTitle>
          {donations.length === 0 ? (
            <CardDescription>No donations yet.</CardDescription>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wide text-stone-500">
                    <th className="py-2 pr-4">When</th>
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4 text-right">Total</th>
                    <th className="py-2 pr-4 text-right">Logistics</th>
                    <th className="py-2 pr-4 text-right">Packaging</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.map((d) => (
                    <tr key={d.id} className="border-b border-stone-100 last:border-0">
                      <td className="py-2 pr-4 text-stone-600">
                        {formatDate(d.created_at)}
                      </td>
                      <td className="py-2 pr-4 text-stone-800">
                        {d.donor_name ?? "—"}
                      </td>
                      <td className="py-2 pr-4 text-right text-stone-900">
                        {inr2.format(d.amount_inr)}
                      </td>
                      <td className="py-2 pr-4 text-right text-stone-600">
                        {inr2.format(d.logistics_share)}
                      </td>
                      <td className="py-2 pr-4 text-right text-stone-600">
                        {inr2.format(d.packaging_share)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
