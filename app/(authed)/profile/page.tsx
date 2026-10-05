import { TopNav } from "@/components/TopNav";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { ProfileForm } from "@/components/ProfileForm";
import { requireUser } from "@/lib/auth";

export default async function ProfilePage() {
  const me = await requireUser();

  return (
    <>
      <TopNav org={me.org} />
      <div className="mx-auto w-full max-w-2xl px-6 py-8 space-y-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your organisation</CardTitle>
              <CardDescription>
                {me.org.role === "donor"
                  ? "Donor profile — visible to NGOs you list to."
                  : me.org.role === "ngo"
                    ? "NGO profile — visible to donors and admins."
                    : "Admin profile."}
              </CardDescription>
            </div>
            {me.org.verified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-inset ring-emerald-200">
                <span aria-hidden>✓</span> Verified
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-700 ring-1 ring-inset ring-stone-200">
                Pending verification
              </span>
            )}
          </div>
          <div className="mt-6">
            <ProfileForm org={me.org} />
          </div>
        </Card>
      </div>
    </>
  );
}
