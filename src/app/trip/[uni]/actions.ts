"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { privateToken, REFERRAL_CODE_PATTERN, referralCode } from "@/lib/codes";
import { FRIEND_DISCOUNT_PENCE } from "@/lib/money";
import { bookedCount, spotsState } from "@/lib/trip";
import { isDisposable, isEmail, normaliseEmail, ukMobile } from "@/lib/validate";

export type BookState = { error?: string; fieldErrors?: Partial<Record<string, string>>; values?: Record<string, string> };

/**
 * Starts a booking and hands off to checkout. Anyone at the uni can book: a
 * known visitor books as themselves, a new one gives their details and joins
 * the same list the giveaway uses. A spot is only taken once the deposit clears.
 */
export async function startBooking(_prev: BookState, form: FormData): Promise<BookState> {
  const v = (k: string) => String(form.get(k) ?? "").trim();
  const plan = v("plan");
  if (!["full", "monthly", "weekly"].includes(plan)) return { error: "Pick how you want to pay." };
  const uni = await db.university.findUnique({ where: { slug: v("uni") } });
  if (!uni) return { error: "This trip isn't live." };

  let me = v("t") ? await db.entrant.findUnique({ where: { token: v("t") } }) : null;
  const jar = await cookies();
  // Only ask for what's missing. A booking needs a name for the passenger list
  // and an email for the ticket; a giveaway entrant already gave us their
  // WhatsApp, so we never ask for that twice.
  if (!me?.firstName || !me?.email) {
    const needName = !me?.firstName;
    const needEmail = !me?.email;
    const needWhatsapp = !me?.whatsapp;
    const fieldErrors: Record<string, string> = {};

    const [first, ...rest] = v("name").split(/\s+/).filter(Boolean);
    if (needName && (!first || !rest.length)) fieldErrors.name = "First and last name, as on your passport.";
    if (needEmail && !isEmail(v("email"))) fieldErrors.email = "That email doesn't look right.";
    else if (needEmail && isDisposable(normaliseEmail(v("email")))) fieldErrors.email = "Use your real inbox, your ticket goes there.";
    const whatsapp = needWhatsapp ? ukMobile(v("whatsapp")) : me!.whatsapp;
    if (needWhatsapp && !whatsapp) fieldErrors.whatsapp = "Your UK mobile, so we can add you to the trip chat.";
    if (Object.keys(fieldErrors).length) {
      return { fieldErrors, values: Object.fromEntries(["name", "email", "whatsapp"].map((k) => [k, v(k)])) };
    }

    // Already on the list (from the giveaway or an earlier booking)? Book as them and fill the gaps.
    const emailNormalised = needEmail ? normaliseEmail(v("email")) : me!.emailNormalised;
    const details = {
      ...(needName ? { firstName: first, lastName: rest.join(" ") } : {}),
      ...(needEmail ? { email: v("email"), emailNormalised } : {}),
    };
    const existing =
      me ??
      (await db.entrant.findFirst({ where: { whatsapp }, orderBy: { createdAt: "asc" } })) ??
      (emailNormalised ? await db.entrant.findFirst({ where: { emailNormalised }, orderBy: { createdAt: "asc" } }) : null);
    me = existing
      ? await db.entrant.update({ where: { id: existing.id }, data: details })
      : await db.entrant.create({ data: { ...details, token: privateToken(), whatsapp, universityId: uni.id, over18: true, source: "trip" } });
    jar.set("mm_me", me.token, { maxAge: 60 * 60 * 24 * 365, sameSite: "lax", httpOnly: true, path: "/" });
  }

  const spots = spotsState(uni, await bookedCount(uni.id));
  if (spots.remaining <= 0) return { error: "That's the last spot gone. Ask your ambassador about extra spots." };

  const active = await db.booking.findFirst({ where: { entrantId: me.id, universityId: uni.id, depositPaidAt: { not: null }, status: "active" } });
  if (active) redirect(`/trip/${uni.slug}/booked?b=${active.id}`);

  // Bookers need a share link for the mates ladder.
  if (!me.referralCode) {
    let code = referralCode();
    while (await db.entrant.findUnique({ where: { referralCode: code } })) code = referralCode();
    me = await db.entrant.update({ where: { id: me.id }, data: { referralCode: code } });
  }

  // First touch wins: the link they arrived on when they entered, else the 30-day cookie.
  let referrerId = me.referredById;
  if (!referrerId) {
    const code = jar.get("mm_ref")?.value ?? "";
    if (REFERRAL_CODE_PATTERN.test(code)) referrerId = (await db.entrant.findFirst({ where: { referralCode: code } }))?.id ?? null;
  }
  let tripReferral = await db.referral.findUnique({ where: { kind_refereeId: { kind: "trip", refereeId: me.id } } });
  if (!tripReferral && referrerId && referrerId !== me.id) {
    tripReferral = await db.referral.create({ data: { kind: "trip", referrerId, refereeId: me.id } });
  }
  const friendDiscount = tripReferral && tripReferral.status !== "voided" ? FRIEND_DISCOUNT_PENCE : 0;

  const pending = await db.booking.findFirst({ where: { entrantId: me.id, universityId: uni.id, depositPaidAt: null } });
  const data = { plan, totalPence: uni.pricePence, friendDiscountPence: friendDiscount };
  const booking = pending
    ? await db.booking.update({ where: { id: pending.id }, data })
    : await db.booking.create({ data: { ...data, entrantId: me.id, universityId: uni.id } });

  redirect(`/checkout/${booking.id}`);
}
