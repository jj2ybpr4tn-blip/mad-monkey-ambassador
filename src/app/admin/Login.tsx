"use client";

import { useActionState } from "react";
import { login } from "./actions";

export function Login({ hint }: { hint?: string }) {
  const [state, action, pending] = useActionState(login, {});
  return (
    <form action={action} className="mt-10 max-w-sm">
      <h1 className="display text-5xl">Admin.</h1>
      <label className="mt-8 block">
        <span className="eyebrow">Password</span>
        <input name="password" type="password" autoComplete="current-password" className="field mt-1.5" autoFocus />
      </label>
      {state.error && <p className="mt-2 font-semibold text-orange">{state.error}</p>}
      <button className="btn btn-lime mt-6 w-full" disabled={pending}>Log in →</button>
      {hint && <p className="mt-4 text-sm text-bone/70">Demo password: <b className="text-bone">{hint}</b></p>}
    </form>
  );
}
