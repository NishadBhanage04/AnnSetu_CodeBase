import Link from "next/link";

import { logoutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";
import type { Org } from "@/lib/supabase/types";

export function TopNav({ org }: { org: Org }) {
  const links: { href: string; label: string }[] = [
    { href: "/profile", label: "Profile" },
  ];
  if (org.role === "donor") {
    links.unshift({ href: "/donor/dashboard", label: "My listings" });
  } else if (org.role === "ngo") {
    links.unshift(
      { href: "/ngo/dashboard", label: "Browse" },
      { href: "/ngo/claims", label: "My claims" },
    );
  } else if (org.role === "admin") {
    links.unshift(
      { href: "/admin/dashboard", label: "Verifications" },
      { href: "/admin/donations", label: "Donations" },
    );
  }

  return (
    <div className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-3 text-sm">
        <nav className="flex items-center gap-4">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-2 py-1 text-stone-700 hover:bg-stone-100 hover:text-stone-900"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 text-stone-600">
          <span className="hidden sm:inline">
            {org.org_name} <span className="text-xs text-stone-400">({org.role})</span>
          </span>
          <form action={logoutAction}>
            <Button type="submit" variant="secondary" className="!py-1 !px-2 !text-xs">
              Log out
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
