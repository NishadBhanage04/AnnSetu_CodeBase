import { notFound } from "next/navigation";

import { TopNav } from "@/components/TopNav";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { ListingForm } from "@/components/ListingForm";
import { requireUser } from "@/lib/auth";
import { getListing } from "@/lib/listings";

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await requireUser({ role: "donor" });
  const listing = await getListing(id);
  if (!listing || listing.donor_org_id !== me.org.id) notFound();
  if (listing.status !== "open" && listing.status !== "claimed") {
    // Editing a closed listing is confusing — send them back.
    return (
      <>
        <TopNav org={me.org} />
        <div className="mx-auto w-full max-w-2xl px-6 py-8">
          <Card>
            <CardTitle>This listing is no longer editable</CardTitle>
            <CardDescription>
              Once a listing is completed, expired, or cancelled, the
              details can&apos;t be changed. Cancel the listing from your
              dashboard if you need to start over.
            </CardDescription>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <TopNav org={me.org} />
      <div className="mx-auto w-full max-w-2xl px-6 py-8">
        <Card>
          <CardTitle>Edit listing</CardTitle>
          <CardDescription>
            Updating ready_by or the pickup window will change when the
            listing expires.
          </CardDescription>
          <div className="mt-6">
            <ListingForm mode={{ kind: "edit", listing }} />
          </div>
        </Card>
      </div>
    </>
  );
}
