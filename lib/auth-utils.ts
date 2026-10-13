import type { OrgRole } from "./supabase/types";

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
