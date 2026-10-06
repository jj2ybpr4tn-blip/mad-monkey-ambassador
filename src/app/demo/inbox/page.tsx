import { connection } from "next/server";
import { db } from "@/lib/db";
import { Header } from "@/components/Chrome";

/** Every email the site would send, newest first. Stands in for a real email provider. */
export default async function InboxPage() {
  await connection();
  const emails = await db.outboxEmail.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  return (
    <main className="mx-auto max-w-md px-4">
      <Header eyebrow="Demo inbox" />
      <h1 className="display mt-6 text-5xl">Inbox.</h1>
      <p className="mt-3 font-medium">WhatsApp and email aren&apos;t wired up in the demo. Every message the site would send lands here.</p>
      <div className="mt-8 space-y-5">
        {emails.length === 0 && <p className="text-bone/70">Nothing yet. Enter the giveaway to get one.</p>}
        {emails.map((m) => (
          <article key={m.id} className={`p-5 text-ink ${m.channel === "whatsapp" ? "border-l-8 border-green bg-paper" : "bg-paper"}`}>
            <p className="text-xs font-semibold text-ink/60">
              {m.channel === "whatsapp" ? "WhatsApp" : "Email"} to {m.to} · {m.createdAt.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            </p>
            <h2 className="mt-1 font-black">{m.subject}</h2>
            <p className="mt-2">{m.body}</p>
            {m.ctaUrl && (
              <a href={m.ctaUrl} className="btn btn-lime mt-4 w-full">
                {m.ctaLabel}
              </a>
            )}
          </article>
        ))}
      </div>
    </main>
  );
}
