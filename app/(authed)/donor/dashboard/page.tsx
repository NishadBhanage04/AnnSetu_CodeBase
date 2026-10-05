import Link from "next/link";

import { TopNav } from "@/components/TopNav";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { requireUser } from "@/lib/auth";
import { listMyListings } from "@/lib/listings";
import { DonorListingRow } from "@/components/DonorListingRow";
import { ListingForm } from "@/components/ListingForm";

export default async function DonorDashboardPage() {
  const me = await requireUser({ role: "donor" });
  const listings = await listMyListings(me.org.id);

  return (
    <>
      <TopNav org={me.org} />
      <div className="mx-auto w-full max-w-5xl px-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-stone-900">My listings</h1>
            <p className="text-sm text-stone-600">
              List surplus food that&apos;s ready or almost ready. NGOs can
              claim it during the pickup window.
            </p>
          </div>
          <Link
            href="/donor/listings/new"
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            + New listing
          </Link>
        </div>

        <div className="mt-8">
          {listings.length === 0 ? (
            <Card>
              <CardTitle>No listings yet</CardTitle>
              <CardDescription>
                Use the &ldquo;New listing&rdquo; button above to add your
                first batch of surplus food.
              </CardDescription>
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-stone-700">
                  Or create one inline
                </summary>
                <div className="mt-4">
                  <ListingForm mode={{ kind: "create" }} />
                </div>
              </details>
            </Card>
          ) : (
            <div className="space-y-4">
              {listings.map((l) => (
                <DonorListingRow key={l.id} listing={l} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
