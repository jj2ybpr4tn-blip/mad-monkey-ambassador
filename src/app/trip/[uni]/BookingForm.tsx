"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { buildSchedule, type Plan } from "@/lib/plans";
import { gbp } from "@/lib/money";
import { startBooking, type BookState } from "./actions";

/** What we still have to ask for. Anything we already hold is never asked twice. */
export type Missing = { name: boolean; email: boolean; whatsapp: boolean };

type Props = {
  slug: string;
  token?: string;
  missing: Missing;
  bookerName?: string;
  pricePence: number;
  depositPence: number;
  friendDiscountPence: number;
  friendName?: string;
  todayIso: string;
  finalIso: string;
};

const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });

export function BookingForm(p: Props) {
  const [plan, setPlan] = useState<Plan>("weekly");
  const [state, action, pending] = useActionState<BookState, FormData>(startBooking, {});
  const today = new Date(p.todayIso);
  const finalDate = new Date(p.finalIso);
  const balance = p.pricePence - p.depositPence - p.friendDiscountPence;

  const options: { plan: Plan; label: string; detail: string; sub: string }[] = (["weekly", "monthly", "full"] as const).map((pl) => {
    const s = buildSchedule(balance, pl, today, finalDate);
    const each = Math.max(...s.map((x) => x.amountPence));
    if (pl === "full") return { plan: pl, label: "Pay in full", detail: gbp(p.pricePence - p.friendDiscountPence), sub: "today, done" };
    return {
      plan: pl,
      label: pl === "weekly" ? "Weekly" : "Monthly",
      detail: `${gbp(each, { exact: true })}`,
      sub: `${pl === "weekly" ? "a week" : "a month"} · ${s.length} payments from ${fmt(s[0].dueDate)}`,
    };
  });
  const todayCharge = plan === "full" ? p.pricePence - p.friendDiscountPence : p.depositPence;
  // Whatsapp alone never triggers the sub-form: we only stop for a name or an email.
  const needsDetails = p.missing.name || p.missing.email;

  return (
    <div>
      {p.friendDiscountPence > 0 && (
        <p className="mb-4 bg-ink px-3 py-2 font-bold text-lime">
          {p.friendName ? `${p.friendName}'s` : "Your mate's"} link saved you {gbp(p.friendDiscountPence)}.
        </p>
      )}

      <fieldset>
        <legend className="eyebrow">How do you want to pay it off?</legend>
        <div className="mt-2 space-y-2.5">
          {options.map((o) => (
            <label key={o.plan} className={`flex cursor-pointer items-center gap-3 border-3 border-ink p-3 has-focus-visible:outline-3 has-focus-visible:outline-orange ${plan === o.plan ? "bg-ink text-bone" : "bg-paper"}`}>
              <input type="radio" name="planPick" value={o.plan} checked={plan === o.plan} onChange={() => setPlan(o.plan)} className="sr-only" />
              <span className="flex-1">
                <span className="block font-black uppercase">{o.label}</span>
                <span className="text-sm font-medium opacity-80">{o.sub}</span>
              </span>
              <span className={`display text-2xl ${plan === o.plan ? "text-lime" : ""}`}>{o.detail}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <p className="mt-4 text-sm font-medium">
        Same finish line whichever you pick: balance cleared by{" "}
        <b>{finalDate.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</b>.
      </p>

      <form action={action} noValidate>
        <input type="hidden" name="uni" value={p.slug} />
        <input type="hidden" name="t" value={p.token ?? ""} />
        <input type="hidden" name="plan" value={plan} />
        {/* Remounts after each attempt so typed details survive the form reset. */}
        {needsDetails && <Details key={JSON.stringify(state.values ?? {})} missing={p.missing} errors={state.fieldErrors ?? {}} values={state.values ?? {}} />}
        {state.error && <p role="alert" className="mt-4 border-3 border-orange bg-paper p-3 font-semibold text-ink">{state.error}</p>}
        <button type="submit" disabled={pending} className="btn btn-lime mt-5 w-full text-lg">
          {pending ? "One sec…" : `Pay ${gbp(todayCharge)} ${plan === "full" ? "now" : "deposit"} →`}
        </button>
        {needsDetails ? (
          <p className="mt-3 text-sm font-medium">
            By paying you confirm you&apos;re 18 or over and accept the{" "}
            <Link href="/terms" target="_blank" className="font-bold underline underline-offset-2">booking terms</Link>.
          </p>
        ) : (
          <p className="mt-3 text-center text-sm font-medium">Booking as {p.bookerName}</p>
        )}
      </form>
    </div>
  );
}

/**
 * The gaps we still need filling. A name goes on the passenger list and an
 * email carries the ticket, so official bookings can't do without either.
 */
function Details({ missing, errors, values }: { missing: Missing; errors: Partial<Record<string, string>>; values: Record<string, string> }) {
  return (
    <div className="mt-6 space-y-4 border-t-3 border-ink pt-5">
      {missing.name && <Field name="name" defaultValue={values.name} label="Full name" autoComplete="name" placeholder="As on your passport" error={errors.name} />}
      {missing.email && <Field name="email" defaultValue={values.email} label="Email" hint="Your ticket goes here" type="email" inputMode="email" autoComplete="email" error={errors.email} />}
      {missing.whatsapp && <Field name="whatsapp" defaultValue={values.whatsapp} label="WhatsApp" hint="For the trip group chat" type="tel" inputMode="tel" autoComplete="tel" placeholder="07700 900123" error={errors.whatsapp} />}
    </div>
  );
}

function Field({ name, label, hint, error, ...rest }: { name: string; label: string; hint?: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="eyebrow">{label}</span>
      {hint && <span className="ml-2 text-xs font-semibold opacity-60">{hint}</span>}
      <input name={name} className="field mt-1.5" aria-invalid={!!error} {...rest} />
      {error && <span className="mt-1 block text-sm font-semibold text-orange">{error}</span>}
    </label>
  );
}
