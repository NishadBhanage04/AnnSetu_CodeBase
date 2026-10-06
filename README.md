# 🍲 AnnSetu

Connecting generous food donors with NGOs to reduce waste and fight hunger.

## 🌟 Project Overview
This platform facilitates the donation of surplus food. It allows **Donors** to list available food, **NGOs** to claim those listings, and **Admins** to oversee the process and verify participants.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A Supabase Project

### Installation
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file in the root:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## 🏗 Architecture

### High-Level Design
- **Framework**: Next.js 14+ (App Router) for optimized rendering and routing.
- **Styling**: Tailwind CSS for a responsive, utility-first UI.
- **Database & Auth**: Supabase (PostgreSQL + GoTrue).

### Tiered Supabase Strategy
To ensure security and flexibility, we use three distinct clients:
1. **Browser Client**: For client-side interactions.
2. **Server Client**: For Server Components/Actions; operates within the user's RLS context.
3. **Admin Client**: Uses the `service_role` key to bypass RLS for administrative tasks.

### Data Flow (Server Actions)
We use a standardized `safeAction` pattern. Every mutation follows:
`Client Component` $\rightarrow$ `safeAction (Validation)` $\rightarrow$ `Business Logic` $\rightarrow$ `ActionResult`.

## ✨ Core Features
- **Donors**: Create, edit, and manage food listings.
- **NGOs**: Browse available food and claim listings for pickup.
- **Admins**: User management, listing approval, and platform analytics.

## 🛡 Security Model
- **RLS (Row Level Security)**: The primary defense. Database policies ensure users can only access data they own or are permitted to see.
- **Middleware**: Implements a "Public-by-Exception" strategy. By default, all routes are protected; only specifically defined paths (Login, Landing Page) are public.
- **Server-Side Validation**: Every request is re-validated on the server using `requireUser` and the `safeAction` wrapper.

---

## 🛠 Technical Details (for Developers)

### Database Migrations
The migrations in `supabase/migrations/` run in order:
- `0001_init.sql`: Core tables (`orgs`, `listings`, `claims`) and storage buckets.
- `0002_donations.sql`: `donations` table and critical RPC functions (`claim_listing`, `approve_org`, etc.).
- `0003_rls.sql`: Row Level Security policies for all tables.

### Listing Lifecycle
`open` $\rightarrow$ `claimed` (NGO claim) $\rightarrow$ `completed` (NGO pickup)
`open/claimed` $\rightarrow$ `cancelled` (Donor cancellation)
`open/claimed` $\rightarrow$ `expired` (Cron-driven expiry)

### Admin Setup
Admins are created manually in the database. Update an `orgs` record to `role = 'admin'` and `verified = true`.

### Cron Job
`vercel.json` schedules a nightly expiry check via `GET /api/cron/expire-listings`.
