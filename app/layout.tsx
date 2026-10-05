import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Surplus Food Redistribution",
  description:
    "Connect food donors with NGOs to redistribute surplus food that would otherwise go to waste.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-stone-50 text-stone-900">
        <header className="border-b border-stone-200 bg-white">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
            <Link href="/" className="text-lg font-semibold text-stone-900">
              <span aria-hidden className="mr-2">🥗</span>
              Surplus Food Network
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link
                href="/support"
                className="text-stone-700 hover:text-stone-900"
              >
                Support
              </Link>
              <Link
                href="/login"
                className="rounded-md bg-stone-900 px-3 py-1.5 text-white hover:bg-stone-800"
              >
                Log in
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-stone-200 bg-white">
          <div className="mx-auto w-full max-w-5xl px-6 py-6 text-xs text-stone-500">
            Pilot prototype · College community engagement project
          </div>
        </footer>
      </body>
    </html>
  );
}
