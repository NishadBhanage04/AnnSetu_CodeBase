"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import {
  ErrorText,
  FieldGroup,
  HelpText,
  Input,
  Label,
} from "@/components/ui/Form";

type Totals = {
  logistics: number;
  packaging: number;
  grand: number;
  count: number;
};

type DonateResult = {
  amount: number;
  logistics: number;
  packaging: number;
  totals: Totals;
};

const PRESETS = [100, 500, 1000, 2500];

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function DonationForm({ initialTotals }: { initialTotals: Totals }) {
  const [step, setStep] = useState<"amount" | "info" | "checkout" | "thanks">(
    "amount",
  );
  const [amount, setAmount] = useState<number>(500);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DonateResult | null>(null);

  function pickPreset(n: number) {
    setAmount(n);
    setCustomAmount("");
  }
  function onCustom(v: string) {
    setCustomAmount(v);
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) setAmount(n);
  }
  const validAmount = amount > 0;

  async function submit() {
    if (!validAmount) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/support/donate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          amount,
          donor_name: name || null,
          donor_email: email || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      const json = (await res.json()) as DonateResult;
      setResult(json);
      setStep("thanks");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setStep("amount");
    setAmount(500);
    setCustomAmount("");
    setName("");
    setEmail("");
    setError(null);
    setResult(null);
  }

  const half = (amount || 0) / 2;

  return (
    <div className="space-y-6">
      {step === "amount" ? (
        <div className="space-y-4">
          <FieldGroup>
            <Label>Pick an amount</Label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => pickPreset(n)}
                  className={`rounded-md border px-4 py-2 text-sm font-medium ${
                    amount === n && !customAmount
                      ? "border-stone-900 bg-stone-900 text-white"
                      : "border-stone-300 bg-white text-stone-800 hover:bg-stone-100"
                  }`}
                >
                  {inr.format(n)}
                </button>
              ))}
            </div>
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="custom">Or enter a custom amount</Label>
            <Input
              id="custom"
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              placeholder="e.g. 750"
              value={customAmount}
              onChange={(e) => onCustom(e.target.value)}
            />
            <HelpText>
              {validAmount
                ? `Your donation will be split: ${inr.format(half)} to each fund.`
                : "Enter an amount of ₹1 or more."}
            </HelpText>
          </FieldGroup>
          <div className="flex justify-end">
            <Button
              onClick={() => setStep("info")}
              disabled={!validAmount}
            >
              Continue
            </Button>
          </div>
        </div>
      ) : null}

      {step === "info" ? (
        <div className="space-y-4">
          <FieldGroup>
            <Label htmlFor="name">Your name (optional)</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="email">Your email (optional)</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <HelpText>We don&apos;t send anything — this is just for the demo.</HelpText>
          </FieldGroup>
          <div className="rounded-md bg-stone-50 p-3 text-sm text-stone-700">
            Donation: <strong>{inr.format(amount)}</strong> · Logistics{" "}
            {inr.format(half)} · Packaging {inr.format(half)}
          </div>
          <ErrorText>{error}</ErrorText>
          <div className="flex justify-between">
            <Button variant="secondary" onClick={() => setStep("amount")}>
              Back
            </Button>
            <Button onClick={() => setStep("checkout")}>Continue</Button>
          </div>
        </div>
      ) : null}

      {step === "checkout" ? (
        <div className="space-y-4">
          <div className="rounded-md border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700">
            <div className="font-medium text-stone-900">Simulated checkout</div>
            <p className="mt-1">
              No card details are collected. Clicking &ldquo;Pay&rdquo; records
              this donation in our database so the totals update.
            </p>
            <ul className="mt-3 space-y-1 text-stone-600">
              <li>
                Amount: <strong>{inr.format(amount)}</strong>
              </li>
              <li>NGO Logistics Fund: {inr.format(half)}</li>
              <li>Donor Packaging Support Fund: {inr.format(half)}</li>
            </ul>
          </div>
          <ErrorText>{error}</ErrorText>
          <div className="flex justify-between">
            <Button variant="secondary" onClick={() => setStep("info")} disabled={busy}>
              Back
            </Button>
            <Button onClick={submit} disabled={busy}>
              {busy ? "Processing…" : `Pay ${inr.format(amount)}`}
            </Button>
          </div>
        </div>
      ) : null}

      {step === "thanks" && result ? (
        <div className="space-y-4">
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <div className="text-base font-semibold">Thank you!</div>
            <p className="mt-1">
              Your donation of {inr.format(result.amount)} has been recorded.
            </p>
            <ul className="mt-2 space-y-0.5">
              <li>→ {inr.format(result.logistics)} to NGO Logistics Fund</li>
              <li>→ {inr.format(result.packaging)} to Donor Packaging Support Fund</li>
            </ul>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-stone-200 bg-white p-4">
              <div className="text-xs uppercase tracking-wide text-stone-500">
                Logistics fund total
              </div>
              <div className="mt-1 text-xl font-semibold text-stone-900">
                {inr.format(result.totals.logistics)}
              </div>
            </div>
            <div className="rounded-md border border-stone-200 bg-white p-4">
              <div className="text-xs uppercase tracking-wide text-stone-500">
                Packaging fund total
              </div>
              <div className="mt-1 text-xl font-semibold text-stone-900">
                {inr.format(result.totals.packaging)}
              </div>
            </div>
          </div>
          <p className="text-xs text-stone-500">
            Grand total raised across {result.totals.count} donation
            {result.totals.count === 1 ? "" : "s"}: {inr.format(result.totals.grand)}
          </p>
          <Button variant="secondary" onClick={reset}>
            Make another donation
          </Button>
        </div>
      ) : null}
    </div>
  );
}
