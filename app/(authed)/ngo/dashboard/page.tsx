import { TopNav } from "@/components/TopNav";
import { NgoListingCard } from "@/components/NgoListingCard";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { requireUser } from "@/lib/auth";
import { listOpenListingsForNgo } from "@/lib/listings";

export default async function NgoDashboardPage() {
  const me = await requireUser({ role: "ngo" });
  const listings = await listOpenListingsForNgo();

  return (
    <>
      <TopNav org={me.org} />
      <div className="mx-auto w-full max-w-5xl px-6 py-8">
        <h1 className="text-2xl font-semibold text-stone-900">Open listings</h1>
        <p className="text-sm text-stone-600">
          Listings you can claim right now. Sort by ready-by time so the
          most urgent ones are at the top.
        </p>
        <div className="mt-8">
          {listings.length === 0 ? (
            <Card>
              <CardTitle>Nothing to claim right now</CardTitle>
              <CardDescription>
                New listings appear here as donors add them. Check back
                shortly.
              </CardDescription>
            </Card>
          ) : (
            <div className="space-y-4">
              {listings.map((l) => (
                <NgoListingCard key={l.id} listing={l} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
