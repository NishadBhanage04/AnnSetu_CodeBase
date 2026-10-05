import Link from "next/link";

import { Card, CardDescription, CardTitle } from "@/components/ui/Card";

import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next = "", error } = await searchParams;
  return (
    <div className="mx-auto w-full max-w-md px-6 py-12">
      <Card>
        <CardTitle>Log in</CardTitle>
        <CardDescription>
          Use the email and password you signed up with.
        </CardDescription>
        <div className="mt-6">
          <LoginForm next={next} />
        </div>
        {error === "role-mismatch" ? (
          <p className="mt-4 text-sm text-red-600">
            Your account doesn&apos;t have access to that page.
          </p>
        ) : null}
        <p className="mt-6 text-sm text-stone-600">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-stone-900 underline">
            Sign up
          </Link>
          .
        </p>
      </Card>
    </div>
  );
}
