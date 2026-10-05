# CLAUDE.md - AI Agent Guide

## 🛠 Build & Dev Commands
- **Install**: `npm install`
- **Dev**: `npm run dev`
- **Build**: `npm run build`
- **Lint**: `npm run lint`

## 📂 Project Structure
- `app/`: Next.js App Router
  - `(public)/`: Publicly accessible routes (Login, Signup, Support)
  - `(authed)/`: Protected routes (Donor, NGO, Admin dashboards)
- `lib/`: Core utilities
  - `supabase/`: Tiered client configuration (client, server, admin)
  - `action-result.ts`: Server Action wrapper logic (`safeAction`)
  - `auth.ts`: Auth helpers (`requireUser`, `getCurrentUser`, `dashboardPathForRole`)
- `components/`: UI components (grouped by feature and `ui/` for primitives)

## 📜 Coding Standards

### Server Actions
- **Pattern**: Always wrap server actions in `safeAction` to standardize responses and handle errors.
- **Naming**: Actions should end in `Action` (e.g., `createListingAction`).
- **Return Type**: Must return `ActionResult<T>`.
- **Authorization**: Always use `requireUser({ role: '...' })` at the start of protected actions.

### Authentication & Authorization
- **Middleware**: Uses a "Public-by-Exception" model. All routes are protected unless listed in `PUBLIC_ROUTES`.
- **RBAC**: Access to `/donor`, `/ngo`, and `/admin` is guarded both in the middleware and within actions via `requireUser`.

### Supabase Client Usage
- **Browser Client (`client.ts`)**: Use in Client Components.
- **Server Client (`server.ts`)**: Use in Server Components and Server Actions (Respects RLS).
- **Admin Client (`admin.ts`)**: **SERVER-ONLY**. Uses `SERVICE_ROLE_KEY` to bypass RLS. Never import into Client Components.

## 🔑 Key Types
- `ActionResult<T>`: `{ success: true; data: T; error: null } | { success: false; data: null; error: string }`
- `CurrentUser`: `{ authUserId: string; email: string | null; org: Org; }`
