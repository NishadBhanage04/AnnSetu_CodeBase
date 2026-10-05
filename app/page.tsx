import Link from "next/link";

import { getCurrentUser, dashboardPathForRole } from "@/lib/auth";

export default async function HomePage() {
  const me = await getCurrentUser();
  const dashboardHref = me ? dashboardPathForRole(me.org.role) : null;

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-16">
      <section className="rounded-2xl border border-stone-200 bg-white p-10 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
          Move surplus food from kitchens to communities.
        </h1>
        <p className="mt-4 max-w-2xl text-stone-600">
          Hotels, caterers, and canteens list what they have ready. NGOs claim
          it and pick it up before it goes to waste.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {me ? (
            <Link
              href={dashboardHref!}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Go to your dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/signup"
                className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                Sign up
              </Link>
              <Link
                href="/login"
                className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-100"
              >
                Log in
              </Link>
            </>
          )}
          <Link
            href="/support"
            className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-100"
          >
            Support our work
          </Link>
        </div>
      </section>

      <section className="mt-10 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-stone-200 bg-white p-6">
          <h2 className="text-base font-semibold text-stone-900">For donors</h2>
          <p className="mt-2 text-sm text-stone-600">
            List a batch of surplus food in under a minute. Add a photo, a
            pickup window, and a contact address. We&apos;ll show it to verified
            NGOs nearby.
          </p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-6">
          <h2 className="text-base font-semibold text-stone-900">For NGOs</h2>
          <p className="mt-2 text-sm text-stone-600">
            Browse open listings, claim what you can collect, and mark pickup
            complete once you&apos;ve reached the donor.
          </p>
        </div>
      </section>
    </div>
  );
}
