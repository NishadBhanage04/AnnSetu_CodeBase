"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { safeAction } from "@/lib/action-result";

export async function updateProfileAction(formData: FormData) {
  return safeAction(async () => {
    const me = await requireUser();
    const supabase = await createClient();

    const patch: Record<string, string | null> = {};
    const fields: (keyof typeof patch)[] = [
      "org_name",
      "org_type",
      "contact_name",
      "contact_phone",
      "contact_email",
      "address_line",
      "city",
    ];
    for (const f of fields) {
      const v = String(formData.get(f) ?? "").trim();
      patch[f] = v || null;
    }

    const { error } = await supabase
      .from("orgs")
      .update(patch)
      .eq("id", me.org.id);
    if (error) throw error;
    revalidatePath("/profile");
  });
}
