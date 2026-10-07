import { db } from "./db";
import { finalBalanceDate } from "./dates";
import { DEPOSIT_PENCE, gbp } from "./money";
import { buildSchedule } from "./plans";
import { displayName } from "./site";

/**
 * The weekly price, the one number the whole trip site leads with.
 *
 * It is worked out from the day you ask, so it climbs on its own as departure
 * gets nearer and the balance is split over fewer weeks. Never hard-code the
 * figure or the "under a tenner" line in copy: both come from here, so they
 * stop being said the moment they stop being true.
 */
export function weeklyPrice(uni: { pricePence: number; departureDate: Date }, from: Date = new Date()) {
  const schedule = buildSchedule(uni.pricePence - DEPOSIT_PENCE, "weekly", from, finalBalanceDate(uni.departureDate));
  const pence = Math.max(...schedule.map((p) => p.amountPence));
  const underATenner = pence < 1000;
  return {
    pence,
    weeks: schedule.length,
    // Always the exact amount, so the headline, the pay block and the plan
    // picker can never disagree with each other.
    label: gbp(pence, { exact: true }),
    // The headline version. Drops back to the real figure once it's over £10.
    hook: underATenner ? "less than £10 a week" : `${gbp(pence, { exact: true })} a week`,
    underATenner,
  };
}

/** A cash rung. The label is built from the amount so the two can't drift apart. */
const cash = (mates: number, cashPence: number): Rung => ({ mates, cashPence, you: `${gbp(cashPence)} off your trip` });

// Every mate who books gets FRIEND_DISCOUNT_PENCE off. The booker climbs this.
// Perks stack on the way up; cash off is the highest rung reached, not a sum.
// Above four there are no more rungs: whoever brings the most at each uni goes free.
//
// The cash rungs are sized against the trip price. They started at £40 and £80
// against a £475 trip; at £365 that is the same share of the trip, rounded down
// to the nearest £5. Re-scale them if the price moves again.
export const LADDER: Rung[] = [
  { mates: 1, you: "Free-flow drinks voucher on arrival night", cashPence: 0 },
  { mates: 2, you: "10% off food and drink all trip", cashPence: 0 },
  cash(3, 3000),
  cash(4, 6000),
];

export type Rung = { mates: number; you: string; cashPence: number };

export function rungFor(mates: number): Rung | null {
  return [...LADDER].reverse().find((r) => mates >= r.mates) ?? null;
}

export function nextRung(mates: number): Rung | null {
  return LADDER.find((r) => r.mates > mates) ?? null;
}

/** A spot is taken the moment a deposit clears, never at enquiry. */
export function bookedCount(universityId: string) {
  return db.booking.count({ where: { universityId, depositPaidAt: { not: null }, status: { not: "refunded" } } });
}

export { spotsState, type Spots } from "./spots";

/** Spots gone in the last week, for the board's "2 this week". */
export function recentBookedCount(universityId: string, days = 7) {
  return db.booking.count({
    where: { universityId, depositPaidAt: { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) }, status: { not: "refunded" } },
  });
}

/** Confirmed trip referrals: mates whose deposit cleared and who haven't been refunded. */
export function tripReferralCount(entrantId: string) {
  return db.referral.count({ where: { kind: "trip", referrerId: entrantId, status: "confirmed" } });
}

/**
 * Re-prices a booking's balance: the friend discount plus whatever ladder rung
 * the booker has reached. Discounts never touch the deposit. Remaining
 * instalments are re-split so the student always sees their real number.
 */
export async function recalcBooking(bookingId: string) {
  const booking = await db.booking.findUnique({ where: { id: bookingId }, include: { payments: true } });
  if (!booking || booking.status === "refunded") return;

  const balance = booking.totalPence - DEPOSIT_PENCE;
  const rung = rungFor(await tripReferralCount(booking.entrantId));
  const maxReferrerDiscount = balance - booking.friendDiscountPence; // Can't go below the deposit.
  const referrerDiscount = Math.min(rung?.cashPence ?? 0, maxReferrerDiscount);

  const paid = booking.payments.filter((p) => p.kind === "instalment" && p.paidAt).reduce((s, p) => s + p.amountPence, 0);
  const owed = Math.max(0, balance - booking.friendDiscountPence - referrerDiscount - paid);
  const scheduled = booking.payments
    .filter((p) => p.kind === "instalment" && !p.paidAt)
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  const n = scheduled.length;
  const base = n ? Math.floor(owed / n) : 0;
  const extra = owed - base * n;

  await db.$transaction([
    db.booking.update({ where: { id: booking.id }, data: { referrerDiscountPence: referrerDiscount } }),
    ...scheduled.map((p, i) =>
      db.payment.update({ where: { id: p.id }, data: { amountPence: base + (i < extra ? 1 : 0) } }),
    ),
  ]);
}

/** Who has brought the most mates at a university. The top spot goes free. */
export async function tripLeaderboard(universityId: string, limit = 10) {
  const rows = await db.referral.groupBy({
    by: ["referrerId"],
    where: { kind: "trip", status: "confirmed", referrer: { universityId } },
    _count: { _all: true },
    orderBy: { _count: { referrerId: "desc" } },
    take: limit,
  });
  const people = await db.entrant.findMany({ where: { id: { in: rows.map((r) => r.referrerId) } } });
  return rows.map((r) => {
    const p = people.find((x) => x.id === r.referrerId)!;
    return { id: p.id, name: displayName(p), mates: r._count._all };
  });
}
