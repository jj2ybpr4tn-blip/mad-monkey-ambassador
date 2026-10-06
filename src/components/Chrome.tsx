import Link from "next/link";
import { Logo } from "./Logo";

export function DemoBar() {
  return (
    <div className="bg-bone text-ink">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-1.5 text-xs font-semibold">
        <span>
          <span className="font-black">DEMO</span>
          <span className="hidden sm:inline"> · no real emails or payments</span>
        </span>
        <span className="flex gap-3">
          <Link href="/" className="underline underline-offset-2">Giveaway</Link>
          <Link href="/trip" className="underline underline-offset-2">Trip</Link>
          <Link href="/demo/inbox" className="underline underline-offset-2">Inbox</Link>
          <Link href="/admin" className="underline underline-offset-2">Admin</Link>
        </span>
      </div>
    </div>
  );
}

export function Header({ eyebrow }: { eyebrow?: string }) {
  return (
    <header className="flex items-center justify-between gap-4 py-5">
      <Logo />
      {eyebrow && <span className="eyebrow text-right text-lime">{eyebrow}</span>}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-16 border-t-3 border-bone pt-6 pb-10 text-xs leading-relaxed text-bone/70">
      <p className="display mb-3 text-2xl text-bone">ALL IN.</p>
      <p>
        18+ students at participating unis, UK residents. Free to enter, no purchase necessary.{" "}
        <Link href="/terms" className="underline underline-offset-2">Prize draw and booking terms</Link>.
      </p>
      <p className="mt-2">This promotion is not sponsored, endorsed or administered by, or associated with, Instagram.</p>
    </footer>
  );
}
