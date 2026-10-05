// Server-side Supabase client (Server Components, Route Handlers, Server Actions).
// Reads/writes cookies via next/headers so auth survives SSR.
import { cookies } from "next/headers";

import { createServerClient } from "@supabase/ssr";

import type { Database } from "./types";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll called from a Server Component — ignored, the middleware
            // is responsible for refreshing the session.
          }
        },
      },
    },
  );
}
