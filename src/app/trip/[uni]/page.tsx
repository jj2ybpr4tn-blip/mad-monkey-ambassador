import { cookies } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { daysUntil, finalBalanceDate, longDate } from "@/lib/dates";
import { itineraryFor } from "@/lib/itineraries";
import { currentEntrant } from "@/lib/me";
import { DEPOSIT_PENCE, FRIEND_DISCOUNT_PENCE, gbp, gbpCeil } from "@/lib/money";

import { displayName, shortUniName } from "@/lib/site";
import { bookedCount, recentBookedCount, spotsState, tripLeaderboard, tripReferralCount, weeklyPrice } from "@/lib/trip";
import { Footer, Header } from "@/components/Chrome";
import { Ticker } from "@/components/Giveaway";
import { Ladder } from "@/components/Ladder";
import { SpotsBoard } from "@/components/SpotsBoard";
import { TripDetails, TripPhoto } from "@/components/TripDetails";
import { BookingForm } from "./BookingForm";

export default async function TripPage({ params, searchParams }: { params: Promise<{ uni: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { uni: slug } = await params;
  const sp = await searchParams;
  const uni = await db.university.findUnique({ where: { slug } });
  if (!uni || !uni.isLive) notFound();

  let me = await currentEntrant(sp.t);
  if (me && me.universityId !== uni.id) me = null;

  const booking = me ? await db.booking.findFirst({ where: { entrantId: me.id, universityId: uni.id, depositPaidAt: { not: null }, status: "active" } }) : null;
  if (booking) redirect(`/trip/${uni.slug}/booked?b=${booking.id}`);

  const today = new Date();
  const finalDate = finalBalanceDate(uni.departureDate);
  const weekly = weeklyPrice(uni, today);
  const weeks = weekly.weeks;
  const perDay = gbpCeil(uni.pricePence / uni.days);
  const spots = spotsState(uni, await bookedCount(uni.id));
  const recent = await recentBookedCount(uni.id);

  // Did a mate send them? First touch wins: an existing trip referral, the
  // giveaway referrer, then the 30-day cookie from a ?r= link.
  const tripRef = me ? await db.referral.findUnique({ where: { kind_refereeId: { kind: "trip", refereeId: me.id } }, include: { referrer: true } }) : null;
  const cookieCode = (await cookies()).get("mm_ref")?.value;
  const friend =
    tripRef?.referrer ??
    (me?.referredById ? await db.entrant.findUnique({ where: { id: me.referredById } }) : null) ??
    (cookieCode ? await db.entrant.findFirst({ where: { referralCode: cookieCode, ...(me ? { id: { not: me.id } } : {}) } }) : null);
  const friendDiscount = friend && tripRef?.status !== "voided" ? FRIEND_DISCOUNT_PENCE : 0;

  const myMates = me ? await tripReferralCount(me.id) : 0;
  const leader = (await tripLeaderboard(uni.id, 1))[0];
  const stops = uni.route.split(",");

  const it = itineraryFor(uni);
  const activities = it ? it.days.reduce((n, d) => n + (d.included?.length ?? 0), 0) : 0;
  const name = shortUniName(uni.name);
  const toGo = daysUntil(uni.departureDate, today);

  return (
    <main className="overflow-x-clip">
      {/* Hero: the place, the price per week, and how many spots are left. */}
      <section className="rays pb-16">
        <div className="mx-auto max-w-md px-4">
          <Header eyebrow={`${name} uni trip`} />
          <p className="eyebrow mt-4 text-lime">
            {uni.days} days · departs {longDate(uni.departureDate)} · {toGo} days to go
          </p>
          <h1 className="display hero mt-3">
            {uni.destination}, from <span className="bg-lime px-1.5 text-ink [box-decoration-break:clone]">{weekly.hook}</span>.
          </h1>
          <p className="mt-4 text-lg font-semibold">{stops.join(" → ")}</p>
          <p className="mt-3 font-medium text-bone/80">
            {activities > 0 && <>{activities} parties and activities, </>}every bed and every transfer in. {gbp(DEPOSIT_PENCE)} holds your spot.
          </p>
          {it && (
            <div className="mt-14">
              <TripPhoto src={it.hero.src} alt={it.hero.alt} caption={`${name} does ${uni.destination}`} />
            </div>
          )}
          <div className="mt-12">
            <SpotsBoard spots={spots} eyebrow={`${name}'s ${uni.destination} trip`} recent={recent} />
            <p className="mt-2 text-sm text-bone/70">A spot&apos;s gone the moment a deposit clears.</p>
          </div>
          <a href="#book" className="btn btn-lime mt-8 w-full text-lg">
            Lock in my spot · {gbp(DEPOSIT_PENCE)} →
          </a>
        </div>
      </section>

      {/* Party first, then the price: both scroll past every few seconds. */}
      <Ticker
        items={[
          ...(it ? it.highlights.map((h) => h.name) : [uni.destination]),
          `${uni.days} days`,
          `From ${weekly.hook}`,
          `${gbp(DEPOSIT_PENCE)} holds your spot`,
          "Zero planning",
        ]}
      />

      <section className="on-bone dots pt-16 pb-14">
        <div className="mx-auto max-w-md px-4">
          {it ? (
            <TripDetails it={it} days={uni.days} />
          ) : (
            <div>
              <h2 className="display text-[2.6rem]">What you&apos;re paying for.</h2>
              <p className="mt-3 text-lg font-medium">The full day-by-day plan drops as soon as {name}&apos;s trip is locked in.</p>
            </div>
          )}
        </div>
      </section>

      {/* Booking: the price, then the plan picker. */}
      <section id="book" className="scroll-mt-4 py-14">
        <div className="mx-auto max-w-md px-4">
          <h2 className="display text-[2.6rem]">Lock it in.</h2>
          <span className="bubble mt-3 bg-lime text-sm">{gbp(DEPOSIT_PENCE)} today, the rest whenever</span>
          {/* Lead with the two numbers they actually pay. The total sits underneath. */}
          <div className="mt-8">
            {!uni.flightsIncluded && (
              <p className="border-3 border-b-0 border-bone bg-orange px-4 py-3 text-ink">
                <span className="font-black uppercase">Flights not included.</span> <span className="font-semibold">Everything on the ground is.</span>
              </p>
            )}
            <div className="border-3 border-bone">
              <div className="grid grid-cols-2">
                <div className="border-r-3 border-bone p-4">
                  <p className="eyebrow text-lime">Today</p>
                  <p className="display mt-1 text-5xl">{gbp(DEPOSIT_PENCE)}</p>
                  <p className="mt-1 text-sm font-medium">holds your spot</p>
                </div>
                <div className="p-4">
                  <p className="eyebrow text-lime">Then</p>
                  <p className="display mt-1 text-5xl">{weekly.label}</p>
                  <p className="mt-1 text-sm font-medium">a week · {weeks} payments</p>
                </div>
              </div>
              <p className="border-t-3 border-bone px-4 py-3 text-sm font-medium text-bone/70">
                <b className="text-bone">{gbp(uni.pricePence)} all in</b> — that&apos;s {perDay} a day for your bed, every transfer and every activity on the plan. Nothing extra to pay out there.
              </p>
            </div>
          </div>

          <section className="card mt-10 p-5">
            {spots.remaining === 0 ? (
              <div>
                <p className="display text-4xl">Full.</p>
                <p className="mt-2 font-semibold">Every spot&apos;s taken. Ask your ambassador if more are coming.</p>
              </div>
            ) : (
              <BookingForm
                slug={uni.slug}
                token={me?.token}
                missing={{ name: !me?.firstName, email: !me?.email, whatsapp: !me?.whatsapp }}
                bookerName={me ? displayName(me) : undefined}
                pricePence={uni.pricePence}
                depositPence={DEPOSIT_PENCE}
                friendDiscountPence={friendDiscount}
                friendName={friend?.firstName ?? undefined}
                todayIso={today.toISOString()}
                finalIso={finalDate.toISOString()}
              />
            )}
          </section>
        </div>
      </section>

      <section className="rays py-14">
        <div className="mx-auto max-w-md px-4">
          <h2 className="display text-[2.6rem]">Bring your mates.</h2>
          <p className="mt-2 mb-6 font-medium">
            Every mate who books on your link gets {gbp(FRIEND_DISCOUNT_PENCE)} off. You climb the ladder.
          </p>
          <Ladder mates={myMates} showProgress={!!me} uniName={name} leader={leader} />
          <p className="mt-10 text-xs leading-relaxed text-bone/70">
            Discounts come off your balance, never the {gbp(DEPOSIT_PENCE)} deposit. They&apos;re provisional until {longDate(finalDate)}, when we recount against bookings that are confirmed and not refunded. One discount scheme per booking.{" "}
            <Link href="/terms" className="underline underline-offset-2">Booking terms</Link>.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-md px-4">
        <Footer />
      </div>
    </main>
  );
}
