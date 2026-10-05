# Project Security Rules & Golden Rules

## 🚨 THE GOLDEN RULE
**The Supabase Service Role Key (`SUPABASE_SERVICE_ROLE_KEY`) must NEVER be prefixed with `NEXT_PUBLIC_` and must NEVER be used or imported outside of server-side contexts.**

### What this means in practice:
1. **No `NEXT_PUBLIC_` for Admin Keys**: Only the `SUPABASE_ANON_KEY` should be public. The Service Role key allows complete bypass of Row Level Security (RLS). If leaked, the entire database is compromised.
2. **No Client-Side Admin Client**: Never import `createAdminClient` (or any utility using the service role) into a file marked with `'use client'`.
3. **Server-Side Only**: Only use the admin client in:
   - Server Actions (`"use server"`)
   - Route Handlers (`app/api/...`)
   - Server Components (default files in `app/`)

## 🛡️ Guardrails in Place
- **`server-only` package**: We use the `server-only` package in sensitive files (like `lib/supabase/admin.ts`). If you accidentally import these into a client component, the build will fail immediately.
- **RLS by Default**: All tables must have Row Level Security enabled. The admin client is the only intentional exception for specific administrative tasks.

## ⚠️ Warning Signs
- If you see `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` anywhere in the project $\rightarrow$ **DELETE IT IMMEDIATELY** and rotate the key in the Supabase dashboard.
- If a build fails with a `server-only` error $\rightarrow$ **DO NOT** bypass it by removing the import. Instead, move the sensitive logic into a Server Action.
