"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp, type SignupState } from "./actions";

/** One box: their WhatsApp number. That's the whole form. */
export function SignupForm({ uni, refCode, src }: { uni: string; refCode?: string; src?: string }) {
  const [state, action, pending] = useActionState<SignupState, FormData>(signUp, {});
  return (
    <form action={action} noValidate className="mt-6">
      <input type="hidden" name="uni" value={uni} />
      <input type="hidden" name="ref" value={refCode ?? ""} />
      <input type="hidden" name="src" value={src ?? ""} />

      <label className="block">
        <span className="eyebrow">Your WhatsApp</span>
        {/* Keyed on the last attempt so the number survives React's form reset. */}
        <input
          key={state.whatsapp ?? ""}
          name="whatsapp"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="07700 900123"
          defaultValue={state.whatsapp}
          aria-invalid={!!state.error}
          className="field mt-1.5 text-xl font-bold"
        />
      </label>
      {state.error && <p role="alert" className="mt-2 inline-block bg-orange px-2 py-1 text-sm font-bold text-ink">{state.error}</p>}
      {state.notice && <p role="status" className="mt-2 border-3 border-ink bg-lime p-3 font-bold text-ink">{state.notice}</p>}

      <button type="submit" disabled={pending} className="btn btn-lime mt-5 w-full text-lg">
        {pending ? "Entering…" : "Enter →"}
      </button>
      <p className="mt-4 text-xs font-medium text-ink/70">
        By entering you confirm you&apos;re 18+ and agree to the{" "}
        <Link href="/terms" target="_blank" className="font-bold underline underline-offset-2">T&amp;Cs</Link>, including WhatsApp messages from Mad Monkey. Reply STOP any time.
      </p>
    </form>
  );
}
