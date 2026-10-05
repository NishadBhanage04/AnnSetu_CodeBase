import { TopNav } from "@/components/TopNav";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth";
import type { Org } from "@/lib/supabase/types";
import { AdminOrgRow } from "@/components/AdminOrgRow";

export default async function AdminDashboardPage() {
  const me = await requireUser({ role: "admin" });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("orgs")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    return (
      <>
        <TopNav org={me.org} />
        <div className="mx-auto w-full max-w-3xl px-6 py-8">
          <Card>
            <CardTitle>Couldn&apos;t load organisations</CardTitle>
            <CardDescription>{error.message}</CardDescription>
          </Card>
        </div>
      </>
    );
  }
  const orgs = (data ?? []) as Org[];
  const pending = orgs.filter((o) => !o.verified && o.id !== me.org.id);
  const verified = orgs.filter((o) => o.verified && o.id !== me.org.id);

  return (
    <>
      <TopNav org={me.org} />
      <div className="mx-auto w-full max-w-4xl px-6 py-8 space-y-10">
        <section>
          <h1 className="text-2xl font-semibold text-stone-900">Pending verifications</h1>
          <p className="text-sm text-stone-600">
            New donor and NGO signups. Approve to give them access to the
            platform.
          </p>
          <div className="mt-4">
            {pending.length === 0 ? (
              <Card>
                <CardTitle>Nothing to review</CardTitle>
                <CardDescription>
                  New signups will appear here for verification.
                </CardDescription>
              </Card>
            ) : (
              <div className="space-y-3">
                {pending.map((o) => (
                  <AdminOrgRow key={o.id} org={o} />
                ))}
              </div>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-stone-900">Verified organisations</h2>
          {verified.length === 0 ? (
            <p className="mt-2 text-sm text-stone-500">No verified orgs yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white">
              {verified.map((o) => (
                <li
                  key={o.id}
                  className="flex items-center justify-between px-4 py-3 text-sm"
                >
                  <div>
                    <div className="font-medium text-stone-900">{o.org_name}</div>
                    <div className="text-xs text-stone-500">
                      {o.role} · {o.org_type ?? "—"} · {o.city ?? "—"}
                    </div>
                  </div>
                  <span className="text-xs text-emerald-700">Verified</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
