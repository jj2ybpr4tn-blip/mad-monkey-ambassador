import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { daysUntil, finalBalanceDate, longDate, shortDate } from "@/lib/dates";
import { itineraryFor } from "@/lib/itineraries";
import { param } from "@/lib/me";
import { DEPOSIT_PENCE, FRIEND_DISCOUNT_PENCE, gbp } from "@/lib/money";
import { shortUniName, siteUrl } from "@/lib/site";
import { rungFor, tripLeaderboard, tripReferralCount } from "@/lib/trip";
import { BoardingPass } from "@/components/BoardingPass";
import { Footer, Header } from "@/components/Chrome";
import { Confetti } from "@/components/Confetti";
import { Ticker } from "@/components/Giveaway";
import { Ladder } from "@/components/Ladder";
import { ShareTools } from "@/components/ShareTools";

export default async function BookedPage({ params, searchParams }: { params: Promise<{ uni: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { uni: slug } = await params;
  const sp = await searchParams;
  const booking = await db.booking.findUnique({
    where: { id: param(sp.b) ?? "" },
    include: { university: true, entrant: true, payments: { orderBy: { dueDate: "asc" } } },
  });
  if (!booking || booking.university.slug !== slug || !booking.depositPaidAt) notFound();
  const { university: uni, entrant: me } = booking;

  const spotNumber = await db.booking.count({
    where: { universityId: uni.id, depositPaidAt: { not: null, lte: booking.depositPaidAt }, status: { not: "refunded" } },
  });
  const mates = await tripReferralCount(me.id);
  const rung = rungFor(mates);
  const leader = (await tripLeaderboard(uni.id, 1))[0];
  const instalments = booking.payments.filter((p) => p.kind === "instalment");
  const upcoming = instalments.filter((p) => !p.paidAt);
  const paid = booking.payments.filter((p) => p.paidAt).reduce((s, p) => s + p.amountPence, 0);
  const owed = upcoming.reduce((s, p) => s + p.amountPence, 0);
  const shareUrl = `${await siteUrl()}/trip/${uni.slug}?r=${me.referralCode}`;
  const finalDate = finalBalanceDate(uni.departureDate);

  const it = itineraryFor(uni);
  const toGo = daysUntil(uni.departureDate);
  const preNight = new Date(uni.departureDate.getTime() - 24 * 60 * 60 * 1000);
  const next = [
    { title: "Group chat", body: me.whatsapp ? "We'll add you to the trip WhatsApp group. Meet your crew before you land." : "We'll email you the link to the trip group chat." },
    {
      title: "Pay as you go",
      body: upcoming.length ? `Next payment ${gbp(upcoming[0].amountPence, { exact: true })} on ${shortDate(upcoming[0].dueDate)}. Done by ${longDate(finalDate)}.` : "All paid. Nothing more to do but pack.",
    },
    { title: "Bring your mates", body: `Every mate who books on your link gets ${gbp(FRIEND_DISCOUNT_PENCE)} off, and you climb the ladder.` },
    { title: "Fly in", body: `Land in time for a free pre-night on ${shortDate(preNight)}. Day 1 is ${longDate(uni.departureDate)}.` },
  ];

  return (
    <main className="overflow-x-clip">
      <Confetti />
      <section className="rays pb-14">
        <div className="mx-auto max-w-md px-4">
          <Header eyebrow={`${shortUniName(uni.name)} uni trip`} />
          <p className="eyebrow mt-6 text-lime">Spot #{spotNumber} is yours</p>
          <h1 className="display hero mt-2">You&apos;re going to {uni.destination}.</h1>
          <p className="mt-4 text-lg font-medium">{toGo} days to go. Start telling people.</p>
          <div className="mt-8">
            <BoardingPass
              passenger={`${me.firstName} ${me.lastName}`}
              from={shortUniName(uni.name)}
              to={uni.destination}
              departs={uni.departureDate}
              days={uni.days}
              spot={spotNumber}
              of={uni.hardCapReleased ? uni.hardCap : uni.softCap}
              code={it?.tripCode ?? uni.destination.slice(0, 3).toUpperCase()}
              daysToGo={toGo}
              booked
            />
          </div>
        </div>
      </section>

      <Ticker items={[`${me.firstName} is going to ${uni.destination}`, `${toGo} days to go`, "All in"]} />

      <section className="on-bone dots pt-16 pb-14">
        <div className="mx-auto max-w-md px-4">
          <h2 className="display text-[2.6rem]">What happens next.</h2>
          <ol className="mt-6 space-y-3">
            {next.map((n, i) => (
              <li key={n.title} className="tile flex gap-4 bg-paper p-4">
                <span className={`display grid size-11 shrink-0 place-content-center rounded-full border-3 border-ink text-xl ${["bg-lime", "bg-pink", "bg-cyan", "bg-yellow"][i]}`}>{i + 1}</span>
                <span>
                  <span className="block font-black uppercase">{n.title}</span>
                  <span className="block font-medium">{n.body}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <div className="mx-auto max-w-md px-4">
      <section className="card mt-14 p-5">
        <h2 className="display text-2xl">Your plan</h2>
        <dl className="mt-4 space-y-2 font-medium">
          <Row label="Trip">{gbp(booking.totalPence)}</Row>
          <Row label="Deposit (paid)">{gbp(DEPOSIT_PENCE)}</Row>
          {booking.friendDiscountPence > 0 && <Row label="Mate's link">−{gbp(booking.friendDiscountPence)}</Row>}
          {booking.referrerDiscountPence > 0 && <Row label={`Ladder: ${rung?.mates} mates`}>−{gbp(booking.referrerDiscountPence)}</Row>}
          <Row label="Paid so far">{gbp(paid)}</Row>
        </dl>
        <div className="mt-4 flex items-end justify-between border-t-3 border-ink pt-4">
          <span className="font-black uppercase">Left to pay</span>
          <span className="display text-4xl">{gbp(owed, { exact: owed % 100 !== 0 })}</span>
        </div>
        {upcoming.length > 0 ? (
          <>
            <ul className="mt-5 space-y-1.5 text-sm font-medium">
              {upcoming.slice(0, 4).map((p) => (
                <li key={p.id} className="flex justify-between">
                  <span>{shortDate(p.dueDate)}</span>
                  <span className="font-bold">{gbp(p.amountPence, { exact: true })}</span>
                </li>
              ))}
            </ul>
            {upcoming.length > 4 && <p className="mt-2 text-sm font-medium">…and {upcoming.length - 4} more, last one by {longDate(finalDate)}.</p>}
          </>
        ) : (
          <p className="mt-4 font-bold">All paid. Nothing more to do but pack.</p>
        )}
      </section>

      <section className="mt-14">
        <h2 className="display text-4xl">Bring your mates.</h2>
        <p className="mt-2 mb-6 font-medium">They get {gbp(FRIEND_DISCOUNT_PENCE)} off. You climb the ladder. Bring the most and you go free.</p>
        <div className="card mb-8 p-5">
          <ShareTools url={shareUrl} message={`I'm going to ${uni.destination} with Mad Monkey. Book on my link and you get ${gbp(FRIEND_DISCOUNT_PENCE)} off:`} />
        </div>
        <Ladder mates={mates} showProgress uniName={shortUniName(uni.name)} leader={leader} />
      </section>

      <p className="mt-10 text-xs leading-relaxed text-bone/70">
        Ladder discounts are provisional until {longDate(finalDate)}, when we recount against bookings that are confirmed and not refunded. If a mate drops out and is refunded, the rung drops with them.
      </p>
      <Footer />
      </div>
    </main>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt>{label}</dt>
      <dd className="font-bold">{children}</dd>
    </div>
  );
}
