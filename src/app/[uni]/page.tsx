import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { param } from "@/lib/me";
import { shortUniName } from "@/lib/site";
import { Footer, Header } from "@/components/Chrome";
import { HeroPhoto, PrizeDuo, StackEntries, Ticker, TripCarousel } from "@/components/Giveaway";
import { SignupForm } from "./SignupForm";

/** The giveaway sign-up. Ambassador story links and campus QR codes land here, uni pre-filled. */
export default async function GiveawaySignup({ params, searchParams }: { params: Promise<{ uni: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { uni: slug } = await params;
  const sp = await searchParams;
  const uni = await db.university.findUnique({ where: { slug } });
  if (!uni || !uni.isLive) notFound();

  const refCode = (param(sp.r) ?? (await cookies()).get("mm_ref")?.value)?.toUpperCase();
  const referrer = refCode ? await db.entrant.findFirst({ where: { referralCode: refCode } }) : null;
  const name = shortUniName(uni.name);

  return (
    <main className="overflow-x-clip">
      {/* Hero: the hook, a real Mad Monkey photo, one starburst. */}
      <section className="rays pb-14">
        <div className="mx-auto max-w-md px-4">
          <Header eyebrow={`${name} × Mad Monkey`} />
          {referrer && (
            <p className="bubble mt-2 bg-lime text-sm">
              {referrer.firstName ?? "A mate"} sent you. Get in and they get +5.
            </p>
          )}
          <div className="mt-12">
            <HeroPhoto />
          </div>
          <h1 className="display hero mt-12">
            Want to win a <span className="bg-lime px-1.5 text-ink [box-decoration-break:clone]">free trip</span> to SE Asia?
          </h1>
          <p className="mt-5 text-lg font-medium leading-snug">
            {name}, swap the library for a beach. A free trip every term, 7 free nights every month.
          </p>
        </div>
      </section>

      {/* The form comes straight after the hook: no extra button to tap. */}
      <section id="enter" className="on-bone scroll-mt-4 py-14">
        <div className="mx-auto max-w-md px-4">
          <div className="flex items-end justify-between gap-3">
            <h2 className="display text-[2.6rem]">Get in.</h2>
            <span className="bubble mb-2 shrink-0 bg-pink text-sm">free, no catch</span>
          </div>
          <p className="mt-2 font-medium">Just your WhatsApp. {name} students only, one entry per person.</p>
          <SignupForm uni={uni.slug} refCode={referrer?.referralCode ?? undefined} src={param(sp.src)} />
        </div>
      </section>

      <Ticker items={[`${name} × Mad Monkey`, "7 free nights every month", "A free trip every term", "Free to enter", "All in"]} />

      <section className="on-bone dots pt-16 pb-14">
        <div className="mx-auto max-w-md px-4">
          <PrizeDuo />
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto max-w-md px-4">
          <TripCarousel />
        </div>
      </section>

      <section className="rays py-14">
        <div className="mx-auto max-w-md px-4">
          <StackEntries />
        </div>
      </section>

      <div className="mx-auto max-w-md px-4">
        <Footer />
      </div>
    </main>
  );
}
