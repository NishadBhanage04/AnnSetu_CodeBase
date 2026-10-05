"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import {
  ErrorText,
  FieldGroup,
  HelpText,
  Input,
  Label,
  Select,
  Textarea,
} from "@/components/ui/Form";

import { updateProfileAction } from "@/app/actions/profile";
import type { Org } from "@/lib/supabase/types";

export function ProfileForm({ org }: { org: Org }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        const result = await updateProfileAction(fd);
        if (!result.success) {
          setError(result.error);
          return;
        }
        setSaved(true);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FieldGroup>
        <Label htmlFor="org_name">Organisation name</Label>
        <Input id="org_name" name="org_name" required defaultValue={org.org_name} />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="org_type">Organisation type</Label>
        <Select id="org_type" name="org_type" defaultValue={org.org_type ?? ""}>
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
          <Input
            id="contact_name"
            name="contact_name"
            defaultValue={org.contact_name ?? ""}
          />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="contact_phone">Contact phone</Label>
          <Input
            id="contact_phone"
            name="contact_phone"
            type="tel"
            defaultValue={org.contact_phone ?? ""}
          />
        </FieldGroup>
      </div>
      <FieldGroup>
        <Label htmlFor="contact_email">Contact email</Label>
        <Input
          id="contact_email"
          name="contact_email"
          type="email"
          defaultValue={org.contact_email ?? ""}
        />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="address_line">Address</Label>
        <Textarea
          id="address_line"
          name="address_line"
          rows={3}
          defaultValue={org.address_line ?? ""}
        />
      </FieldGroup>
      <FieldGroup>
        <Label htmlFor="city">City</Label>
        <Input id="city" name="city" defaultValue={org.city ?? ""} />
      </FieldGroup>
      <ErrorText>{error}</ErrorText>
      {saved ? <p className="text-sm text-emerald-700">Saved.</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
      <HelpText>
        Your role and verified status can&apos;t be edited here. Contact an
        admin if either is wrong.
      </HelpText>
    </form>
  );
}
