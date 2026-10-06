import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { daysUntil } from "@/lib/dates";
import { itineraryFor } from "@/lib/itineraries";
import { DEPOSIT_PENCE, gbp } from "@/lib/money";
import { shortUniName } from "@/lib/site";
import { bookedCount, spotsState } from "@/lib/trip";
import { BoardingPass } from "@/components/BoardingPass";
import { Header } from "@/components/Chrome";
import { payDeposit } from "./actions";

const PLAN_LABEL = { full: "Paying in full", monthly: "Monthly instalments", weekly: "Weekly instalments" } as Record<string, string>;

/** Placeholder for Stripe Checkout, dressed as the moment you get your ticket. Nothing is charged. */
export default async function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await db.booking.findUnique({ where: { id }, include: { university: true, entrant: true } });
  if (!booking) notFound();
  const uni = booking.university;
  if (booking.depositPaidAt) redirect(`/trip/${uni.slug}/booked?b=${booking.id}`);

  const today = booking.plan === "full" ? booking.totalPence - booking.friendDiscountPence : DEPOSIT_PENCE;
  const booked = await bookedCount(uni.id);
  const spots = spotsState(uni, booked);
  const toGo = daysUntil(uni.departureDate);
  const it = itineraryFor(uni);

  return (
    <main className="rays min-h-dvh pb-16">
      <div className="mx-auto max-w-md px-4">
        <Header eyebrow="Last step" />
        <p className="eyebrow mt-4 text-lime">{toGo} days till {uni.destination}</p>
        <h1 className="display hero mt-2">Here&apos;s your ticket.</h1>
        <p className="mt-3 text-lg font-medium">One tap and spot #{booked + 1} is yours.</p>

        <div className="mt-8">
          <BoardingPass
            passenger={`${booking.entrant.firstName} ${booking.entrant.lastName}`}
            from={shortUniName(uni.name)}
            to={uni.destination}
            departs={uni.departureDate}
            days={uni.days}
            spot={booked + 1}
            of={spots.released ? uni.hardCap : uni.softCap}
            code={it?.tripCode ?? uni.destination.slice(0, 3).toUpperCase()}
            daysToGo={toGo}
          />
        </div>

        {it && (
          <ul className="mt-8 flex flex-wrap gap-2">
            {it.highlights.slice(0, 4).map((h) => (
              <li key={h.name} className="bubble bg-lime text-xs">{h.name}</li>
            ))}
          </ul>
        )}

        <section className="card mt-10 p-5">
          <dl className="space-y-2 font-medium">
            <Row label="Trip">{gbp(booking.totalPence)}</Row>
            {booking.friendDiscountPence > 0 && <Row label="Mate's link">−{gbp(booking.friendDiscountPence)}</Row>}
            <Row label="Plan">{PLAN_LABEL[booking.plan]}</Row>
          </dl>
          <div className="mt-5 flex items-end justify-between border-t-3 border-ink pt-4">
            <span className="font-black uppercase">Pay today</span>
            <span className="display text-5xl">{gbp(today)}</span>
          </div>
          <form action={payDeposit}>
            <input type="hidden" name="bookingId" value={booking.id} />
            <button type="submit" className="btn btn-lime mt-6 w-full text-lg">Pay {gbp(today)} · I&apos;m going →</button>
          </form>
          <p className="mt-4 border-3 border-dashed border-ink p-3 text-xs font-semibold">
            Demo: in the real build this is Stripe Checkout on Mad Monkey&apos;s account. No card, no money here.
          </p>
        </section>
        <p className="mt-6 text-center">
          <Link href={`/trip/${uni.slug}`} className="font-semibold underline underline-offset-4">Back to the trip</Link>
        </p>
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
