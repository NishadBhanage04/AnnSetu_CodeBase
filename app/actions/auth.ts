// Server actions for auth: sign up + log out.
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { dashboardPathForRole } from "@/lib/auth";
import type { OrgRole } from "@/lib/supabase/types";
import { safeAction, ActionResult } from "@/lib/action-result";

type SignupState = ActionResult<{ success: boolean }> | undefined;

export async function signupAction(
  _prev: SignupState,
  formData: FormData,
): Promise<ActionResult<{ success: boolean }>> {
  return safeAction(async () => {
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const role = String(formData.get("role") ?? "") as OrgRole;
    const orgName = String(formData.get("org_name") ?? "").trim();
    const orgType = String(formData.get("org_type") ?? "").trim() || null;
    const contactName = String(formData.get("contact_name") ?? "").trim() || null;
    const contactPhone = String(formData.get("contact_phone") ?? "").trim() || null;
    const addressLine = String(formData.get("address_line") ?? "").trim() || null;
    const city = String(formData.get("city") ?? "").trim() || null;

    if (!email || !password || !orgName) {
      throw new Error("Email, password, and organisation name are required.");
    }
    if (role !== "donor" && role !== "ngo") {
      throw new Error("Pick a role: Donor or NGO.");
    }
    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters.");
    }

    const supabase = await createClient();

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role, org_name: orgName },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/login`,
      },
    });

    if (signUpError) {
      throw signUpError;
    }
    if (!signUpData.user) {
      throw new Error("Sign-up failed: no user returned.");
    }

    const { data: org, error: orgError } = await supabase
      .from("orgs")
      .insert({
        auth_user_id: signUpData.user.id,
        role,
        org_name: orgName,
        org_type: orgType,
        contact_name: contactName,
        contact_phone: contactPhone,
        contact_email: email,
        address_line: addressLine,
        city,
      })
      .select()
      .single();

    if (orgError || !org) {
      throw new Error("Could not save organisation profile: " + (orgError?.message ?? "unknown error"));
    }

    if (signUpData.session) {
      redirect(dashboardPathForRole(role));
    }
    redirect("/signup/check-email");

    return { success: true };
  });
}

export async function loginAction(
  _prev: ActionResult<{ success: boolean }> | undefined,
  formData: FormData,
): Promise<ActionResult<{ success: boolean }>> {
  return safeAction(async () => {
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const next = String(formData.get("next") ?? "");

    if (!email || !password) {
      throw new Error("Email and password are required.");
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      throw error;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Login succeeded but no user was returned.");
    }
    const { data: org, error: orgError } = await supabase
      .from("orgs")
      .select("role")
      .eq("auth_user_id", user.id)
      .single();
    if (orgError || !org) {
      throw new Error("No organisation profile found for this account.");
    }

    if (next && next.startsWith("/")) {
      redirect(next);
    }
    redirect(dashboardPathForRole(org.role));

    return { success: true };
  });
}

export async function logoutAction() {
  return safeAction(async () => {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/");
  });
}
