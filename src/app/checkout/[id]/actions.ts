"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { finalBalanceDate } from "@/lib/dates";
import { DEPOSIT_PENCE } from "@/lib/money";
import { notify } from "@/lib/mail";
import { buildSchedule, type Plan } from "@/lib/plans";
import { displayName, siteUrl } from "@/lib/site";
import { bookedCount, recalcBooking, spotsState, tripReferralCount } from "@/lib/trip";

/**
 * Stand-in for the Stripe Checkout success webhook. In the real build Stripe
 * owns the money: store the customer, subscription and payment intent IDs here.
 */
export async function payDeposit(form: FormData) {
  const booking = await db.booking.findUnique({
    where: { id: String(form.get("bookingId")) },
    include: { university: true, entrant: true },
  });
  if (!booking) redirect("/");
  const { university: uni, entrant: me } = booking;
  if (booking.depositPaidAt) redirect(`/trip/${uni.slug}/booked?b=${booking.id}`);

  const spots = spotsState(uni, await bookedCount(uni.id));
  if (spots.remaining <= 0) redirect(`/trip/${uni.slug}`);

  const now = new Date();
  const balance = booking.totalPence - DEPOSIT_PENCE - booking.friendDiscountPence;
  const plan = booking.plan as Plan;
  const schedule = plan === "full" ? [] : buildSchedule(balance, plan, now, finalBalanceDate(uni.departureDate));

  const tripRef = await db.referral.findUnique({ where: { kind_refereeId: { kind: "trip", refereeId: me.id } } });
  const referrerBooking = tripRef
    ? await db.booking.findFirst({ where: { entrantId: tripRef.referrerId, depositPaidAt: { not: null }, status: "active" } })
    : null;

  await db.$transaction([
    db.booking.update({
      where: { id: booking.id },
      data: {
        depositPaidAt: now,
        status: "active",
        stripeCustomerId: `cus_demo_${me.id.slice(-8)}`,
        stripeSubscriptionId: plan === "full" ? null : `sub_demo_${booking.id.slice(-8)}`,
        referredByBookingId: referrerBooking?.id,
      },
    }),
    db.payment.create({
      data: { bookingId: booking.id, kind: "deposit", amountPence: DEPOSIT_PENCE, dueDate: now, paidAt: now, status: "paid", stripePaymentIntentId: `pi_demo_${booking.id.slice(-8)}` },
    }),
    ...(plan === "full"
      ? [db.payment.create({ data: { bookingId: booking.id, kind: "instalment", amountPence: balance, dueDate: now, paidAt: now, status: "paid" } })]
      : schedule.map((s) => db.payment.create({ data: { bookingId: booking.id, kind: "instalment", amountPence: s.amountPence, dueDate: s.dueDate } }))),
    // The trip referral only counts now the deposit has cleared. Attribution is locked from here.
    ...(tripRef && tripRef.status === "pending"
      ? [db.referral.update({ where: { id: tripRef.id }, data: { status: "confirmed", confirmedAt: now } })]
      : []),
  ]);

  await recalcBooking(booking.id);
  if (referrerBooking) await recalcBooking(referrerBooking.id);

  const base = await siteUrl();
  await notify(me, {
    subject: `You're going to ${uni.destination}`,
    body: "Spot locked in. Your payment plan and your mates link are on your page.",
    ctaLabel: "SEE MY BOOKING",
    ctaUrl: `${base}/trip/${uni.slug}/booked?b=${booking.id}&t=${me.token}`,
  });
  if (tripRef) {
    const referrer = await db.entrant.findUnique({ where: { id: tripRef.referrerId } });
    if (referrer) {
      const n = await tripReferralCount(referrer.id);
      await notify(referrer, {
        subject: `${displayName(me)} just booked on your link`,
        body: `That's ${n} ${n === 1 ? "mate" : "mates"} booked. Check where you are on the ladder.`,
        ctaLabel: "SEE THE LADDER",
        ctaUrl: `${base}/trip/${uni.slug}?t=${referrer.token}`,
      });
    }
  }

  redirect(`/trip/${uni.slug}/booked?b=${booking.id}`);
}
