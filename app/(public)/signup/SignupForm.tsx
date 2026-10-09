"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/Button";
import { ErrorText, FieldGroup, HelpText, Input, Label, Select } from "@/components/ui/Form";

import { signupAction } from "@/app/actions/auth";

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signupAction, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <FieldGroup>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
        />
        <HelpText>At least 6 characters.</HelpText>
      </FieldGroup>

      <FieldGroup>
        <Label htmlFor="role">I am a</Label>
        <Select id="role" name="role" required defaultValue="">
          <option value="" disabled>
            Choose one
          </option>
          <option value="donor">Donor — hotel / caterer / mess</option>
          <option value="ngo">NGO</option>
        </Select>
      </FieldGroup>

      <FieldGroup>
        <Label htmlFor="org_name">Organisation name</Label>
        <Input id="org_name" name="org_name" required />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="org_type">Organisation type</Label>
        <Select id="org_type" name="org_type" defaultValue="">
          <option value="">—</option>
          <option value="hotel">Hotel</option>
          <option value="caterer">Caterer</option>
          <option value="mess">Mess / canteen</option>
          <option value="ngo">NGO</option>
          <option value="other">Other</option>
        </Select>
      </FieldGroup>

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup>
          <Label htmlFor="contact_name">Contact person</Label>
          <Input id="contact_name" name="contact_name" />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="contact_phone">Contact phone</Label>
          <Input id="contact_phone" name="contact_phone" type="tel" />
        </FieldGroup>
      </div>
      <FieldGroup>
        <Label htmlFor="address_line">Address</Label>
        <Input id="address_line" name="address_line" />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="city">City</Label>
        <Input id="city" name="city" />
      </FieldGroup>

      <ErrorText>{state?.error}</ErrorText>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
