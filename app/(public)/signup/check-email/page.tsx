import Link from "next/link";

import { Card, CardDescription, CardTitle } from "@/components/ui/Card";

export default function CheckEmailPage() {
  return (
    <div className="mx-auto w-full max-w-md px-6 py-12">
      <Card>
        <CardTitle>Check your email</CardTitle>
        <CardDescription>
          We sent you a confirmation link. Click it to finish setting up your
          account, then come back and{" "}
          <Link href="/login" className="underline">
            log in
          </Link>
          .
        </CardDescription>
      </Card>
    </div>
  );
}
