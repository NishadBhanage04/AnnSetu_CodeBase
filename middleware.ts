// Refreshes the Supabase session on every request and gates the authed
// route group. Unauthenticated requests to anything under /(authed) get
// redirected to /login with a `next` query param.
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { dashboardPathForRole } from "@/lib/auth";
import type { OrgRole } from "@/lib/supabase/types";

const PUBLIC_ROUTES = ["/login", "/signup", "/support"];
const ROLE_PREFIXES: Record<string, OrgRole> = {
  "/donor": "donor",
  "/ngo": "ngo",
  "/admin": "admin",
};

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname === route || pathname.startsWith(route + "/"),
  );

  // 1. Path is PUBLIC
  if (isPublicRoute) {
    if (user) {
      // Authenticated users should not see login/signup.
      // We need their role to redirect to the correct dashboard.
      const { data: org } = await supabase
        .from("orgs")
        .select("role")
        .eq("auth_user_id", user.id)
        .single();

      if (org) {
        const dashboard = dashboardPathForRole(org.role);
        if (pathname !== dashboard) {
          return NextResponse.redirect(new URL(dashboard, request.url));
        }
      } else {
        // User exists but has no org record -> force profile setup.
        if (pathname !== "/profile") {
          return NextResponse.redirect(new URL("/profile", request.url));
        }
      }
    }
    return response;
  }

  // 2. Path is PROTECTED (everything else)
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  // 3. Role-Based Access Control (RBAC)
  const rolePrefix = Object.keys(ROLE_PREFIXES).find((p) =>
    pathname === p || pathname.startsWith(p + "/"),
  );

  if (rolePrefix) {
    const requiredRole = ROLE_PREFIXES[rolePrefix];
    const { data: org } = await supabase
      .from("orgs")
      .select("role")
      .eq("auth_user_id", user.id)
      .single();

    if (!org || org.role !== requiredRole) {
      if (org) {
        return NextResponse.redirect(new URL(dashboardPathForRole(org.role), request.url));
      } else {
        return NextResponse.redirect(new URL("/profile", request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Run on everything except static assets and the cron endpoint
    // (cron uses uses its own secret check).
    "/((?!_next/static|_next/image|favicon.ico|api/cron|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
