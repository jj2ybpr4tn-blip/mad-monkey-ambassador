import Link from "next/link";
import { redirect } from "next/navigation";
import { currentEntrant } from "@/lib/me";
import { Header } from "@/components/Chrome";
import { demoWhatsAppSent } from "../actions";

// Mad Monkey's WhatsApp Business number goes here. None in the demo.
const MM_WHATSAPP = process.env.MM_WHATSAPP_NUMBER ?? "";

/** The only verification: one message from their WhatsApp proves the number is theirs. */
export default async function VerifyWhatsApp({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const me = await currentEntrant((await searchParams).t);
  if (!me) redirect("/");
  const back = `/${me.university.slug}/me?t=${me.token}`;
  if (me.whatsappVerifiedAt) redirect(back);
  const message = `VERIFY ${me.verifyCode}`;

  return (
    <main className="rays min-h-dvh pb-16">
      <div className="mx-auto max-w-md px-4">
        <Header eyebrow="Last step" />
        <h1 className="display hero mt-6">One tap and you&apos;re in.</h1>
        <p className="mt-4 text-lg font-medium">We&apos;ve written the message. Just hit send in WhatsApp and you&apos;re in both draws.</p>

        {MM_WHATSAPP ? (
          <a href={`https://wa.me/${MM_WHATSAPP}?text=${encodeURIComponent(message)}`} className="btn btn-lime mt-8 w-full text-lg">
            Open WhatsApp →
          </a>
        ) : (
          <p className="mt-8 border-3 border-dashed border-bone p-3 text-sm font-semibold">
            In the real site, this button opens WhatsApp with the message below ready to send to Mad Monkey. Mad Monkey replies straight away with their link.
          </p>
        )}

        {/* Demo: what WhatsApp shows them, and a stand-in for the webhook. */}
        <form action={demoWhatsAppSent} className="mt-6 border-3 border-dashed border-bone p-4">
          <input type="hidden" name="t" value={me.token} />
          <p className="eyebrow">Demo only · their WhatsApp</p>
          <div className="mt-3 bg-paper p-4 text-ink">
            <p className="text-xs font-semibold text-ink/60">To: Mad Monkey · from {me.whatsapp}</p>
            <p className="mt-3 ml-auto w-fit bg-green px-3 py-2 font-bold">{message}</p>
          </div>
          <label className="mt-4 block">
            <span className="eyebrow">Name on their WhatsApp (comes with the message)</span>
            <input name="profileName" className="field mt-1.5" placeholder="e.g. Olivia Smith" autoComplete="off" />
          </label>
          <button className="btn btn-lime mt-4 w-full">Send (demo) →</button>
        </form>

        <p className="mt-6 text-sm text-bone/70">The number that sends it is the one we verify. One entry per number.</p>
        <Link href={back} className="mt-6 inline-block font-bold underline underline-offset-4">Do it later</Link>
      </div>
    </main>
  );
}
