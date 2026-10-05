import { TopNav } from "@/components/TopNav";
import { NgoClaimRow } from "@/components/NgoClaimRow";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { requireUser } from "@/lib/auth";
import { listMyClaims } from "@/lib/listings";

export default async function NgoClaimsPage() {
  const me = await requireUser({ role: "ngo" });
  const claims = await listMyClaims(me.org.id);

  const active = claims.filter((c) => c.status === "claimed");
  const past = claims.filter((c) => c.status !== "claimed");

  return (
    <>
      <TopNav org={me.org} />
      <div className="mx-auto w-full max-w-5xl px-6 py-8 space-y-10">
        <section>
          <h1 className="text-2xl font-semibold text-stone-900">Active claims</h1>
          <p className="text-sm text-stone-600">
            Listings you&apos;ve claimed and haven&apos;t marked complete yet.
          </p>
          <div className="mt-4">
            {active.length === 0 ? (
              <Card>
                <CardTitle>No active claims</CardTitle>
                <CardDescription>
                  Visit Browse to find a listing to claim.
                </CardDescription>
              </Card>
            ) : (
              <div className="space-y-4">
                {active.map((l) => (
                  <NgoClaimRow key={l.id} listing={l} />
                ))}
              </div>
            )}
          </div>
        </section>

        {past.length > 0 ? (
          <section>
            <h2 className="text-xl font-semibold text-stone-900">History</h2>
            <div className="mt-4 space-y-4">
              {past.map((l) => (
                <NgoClaimRow key={l.id} listing={l} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}
