"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/Button";
import { ErrorText, FieldGroup, Input, Label } from "@/components/ui/Form";

import { loginAction } from "@/app/actions/auth";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(loginAction, undefined);
  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <FieldGroup>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
        />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
      </FieldGroup>
      <ErrorText>{state?.error}</ErrorText>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Logging in…" : "Log in"}
      </Button>
    </form>
  );
}
