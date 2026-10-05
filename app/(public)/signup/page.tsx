import Link from "next/link";

import { Card, CardDescription, CardTitle } from "@/components/ui/Card";

import { SignupForm } from "./SignupForm";

export default function SignupPage() {
  return (
    <div className="mx-auto w-full max-w-md px-6 py-12">
      <Card>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Sign up as a donor (hotel, caterer, mess) or an NGO. Admins are
          created manually.
        </CardDescription>
        <div className="mt-6">
          <SignupForm />
        </div>
        <p className="mt-6 text-sm text-stone-600">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-stone-900 underline">
            Log in
          </Link>
          .
        </p>
      </Card>
    </div>
  );
}
