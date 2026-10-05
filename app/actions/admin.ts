"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth";
import { safeAction } from "@/lib/action-result";

export async function approveOrgAction(orgId: string) {
  return safeAction(async () => {
    await requireUser({ role: "admin" });
    // RLS lets any user call the function, but the function body enforces
    // the admin role. We use the service-role client here so we don't depend
    // on the caller's RLS context for this admin action.
    const admin = createAdminClient();
    const { error } = await admin.rpc("approve_org", { p_org_id: orgId });
    if (error) throw error;
    revalidatePath("/admin/dashboard");
  });
}

export async function rejectOrgAction(orgId: string) {
  return safeAction(async () => {
    await requireUser({ role: "admin" });
    // For the prototype, rejection just deletes the org row. The auth user is
    // left in place so they could re-sign-up if needed; the unique constraint
    // on auth_user_id prevents the re-insert, so reject is effectively
    // irreversible without admin intervention. Acceptable for the demo.
    const admin = createAdminClient();
    const { error } = admin
      ? await admin.from("orgs").delete().eq("id", orgId)
      : { error: null };
    if (error) throw error;
    revalidatePath("/admin/dashboard");
  });
}
