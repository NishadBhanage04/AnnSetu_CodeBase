import { TopNav } from "@/components/TopNav";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { ListingForm } from "@/components/ListingForm";
import { requireUser } from "@/lib/auth";

export default async function NewListingPage() {
  const me = await requireUser({ role: "donor" });

  return (
    <>
      <TopNav org={me.org} />
      <div className="mx-auto w-full max-w-2xl px-6 py-8">
        <Card>
          <CardTitle>New listing</CardTitle>
          <CardDescription>
            All fields except the photo are required. The pickup window
            determines when the listing auto-expires.
          </CardDescription>
          <div className="mt-6">
            <ListingForm mode={{ kind: "create" }} />
          </div>
        </Card>
      </div>
    </>
  );
}
