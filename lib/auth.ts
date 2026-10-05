// Auth helpers for server components / route handlers / server actions.
import { redirect } from "next/navigation";

import { createClient } from "./supabase/server";
import type { Org, OrgRole } from "./supabase/types";

export type CurrentUser = {
  authUserId: string;
  email: string | null;
  org: Org;
};

/**
 * Returns the current user + their org row, or null if not signed in.
 * Use this in components that are shown to both authed and anonymous users.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: org, error } = await supabase
    .from("orgs")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  if (error || !org) return null;

  return {
    authUserId: user.id,
    email: user.email ?? null,
    org: org as Org,
  };
}

/**
 * Require a signed-in user; redirect to /login otherwise.
 * Optionally enforce a role and a verification status.
 */
export async function requireUser(opts?: {
  role?: OrgRole | OrgRole[];
  verified?: boolean;
  nextPath?: string;
}): Promise<CurrentUser> {
  const me = await getCurrentUser();
  if (!me) {
    const next = opts?.nextPath
      ? `?next=${encodeURIComponent(opts.nextPath)}`
      : "";
    redirect(`/login${next}`);
  }

  if (opts?.role) {
    const allowed = Array.isArray(opts.role) ? opts.role : [opts.role];
    if (!allowed.includes(me.org.role)) {
      redirect("/login?error=role-mismatch");
    }
  }

  if (opts?.verified && !me.org.verified) {
    redirect("/profile?error=not-verified");
  }

  return me;
}

/** Dashboard route for a given role. */
export function dashboardPathForRole(role: OrgRole): string {
  switch (role) {
    case "donor":
      return "/donor/dashboard";
    case "ngo":
      return "/ngo/dashboard";
    case "admin":
      return "/admin/dashboard";
  }
}
