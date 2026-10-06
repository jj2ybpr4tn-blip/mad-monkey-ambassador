"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { logIn, requireAdmin } from "@/lib/admin";
import { privateToken, referralCode } from "@/lib/codes";
import { drawMonth, finalBalanceDate, termFor } from "@/lib/dates";
import { newSeed, pickWinner } from "@/lib/draw";
import { drawSnapshot, voidGiveawayReferral } from "@/lib/giveaway";
import { MONTHLY_PRIZE, TERMLY_PRIZE } from "@/lib/prizes";
import { DEPOSIT_PENCE } from "@/lib/money";
import { buildSchedule } from "@/lib/plans";
import { seedDemo } from "@/lib/seed";
import { bookedCount, recalcBooking } from "@/lib/trip";
import { normaliseEmail } from "@/lib/validate";

export async function login(_prev: { error?: string }, form: FormData): Promise<{ error?: string }> {
  if (!(await logIn(String(form.get("password") ?? "")))) return { error: "Wrong password." };
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete("mm_admin");
  redirect("/admin");
}

export async function updateUniversity(form: FormData) {
  await requireAdmin();
  const s = (k: string) => String(form.get(k) ?? "").trim();
  const n = (k: string) => Math.max(0, Math.round(Number(form.get(k))));
  const soft = n("softCap");
  const hard = Math.max(soft, n("hardCap"));
  await db.university.update({
    where: { id: s("id") },
    data: {
      ambassadorName: s("ambassadorName") || null,
      destination: s("destination"),
      itineraryKey: s("itineraryKey") || null,
      route: s("route"),
      days: n("days"),
      departureDate: new Date(`${s("departureDate")}T00:00:00Z`),
      pricePence: Math.round(Number(form.get("priceGbp")) * 100),
      softCap: soft,
      hardCap: hard,
      flightsIncluded: form.get("flightsIncluded") === "on",
      isLive: form.get("isLive") === "on",
    },
  });
  revalidatePath("/", "layout");
}

export async function addUniversity(form: FormData) {
  await requireAdmin();
  const name = String(form.get("name") ?? "").trim();
  const slug = String(form.get("slug") ?? "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
  if (!name || !slug) return;
  const template = await db.university.findFirst();
  await db.university.create({
    data: {
      name,
      slug,
      destination: template?.destination ?? "Cambodia",
      route: template?.route ?? "Phnom Penh,Siem Reap,Koh Rong,Koh Sdach",
      days: template?.days ?? 14,
      departureDate: template?.departureDate ?? new Date("2027-06-20T00:00:00Z"),
      pricePence: template?.pricePence ?? 36500,
      softCap: 30,
      hardCap: 40,
      isLive: false,
    },
  });
  revalidatePath("/admin");
}

export async function toggleHardCap(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id"));
  const u = await db.university.findUniqueOrThrow({ where: { id } });
  await db.university.update({ where: { id }, data: { hardCapReleased: !u.hardCapReleased } });
  revalidatePath("/", "layout");
}

type DrawKind = "monthly" | "termly";

async function drawFor(kind: DrawKind, period: string, universityId: string | null) {
  // The snapshot is who was in the hat, with how many entries, at the moment of the draw.
  const snapshot = await drawSnapshot(kind, period, universityId);
  const seed = newSeed();
  const winner = pickWinner(snapshot, seed);
  if (!winner) return null;
  return db.draw.create({
    data: { kind, period, universityId, prize: kind === "monthly" ? MONTHLY_PRIZE : TERMLY_PRIZE, seed, entrantSnapshot: JSON.stringify(snapshot), winnerId: winner.id },
  });
}

export async function runDraw(form: FormData) {
  await requireAdmin();
  const kind = form.get("kind") === "termly" ? "termly" : "monthly";
  const uniId = String(form.get("universityId") ?? "");
  const period = String(form.get(kind === "monthly" ? "month" : "term") || (kind === "monthly" ? drawMonth() : termFor().key));
  await drawFor(kind, period, uniId || null);
  revalidatePath("/admin");
}

export async function verifyWinner(form: FormData) {
  await requireAdmin();
  const draw = await db.draw.update({ where: { id: String(form.get("drawId")) }, data: { status: "verified", verifiedAt: new Date() } });
  await db.entrant.update({ where: { id: draw.winnerId }, data: { followVerified: true } });
  revalidatePath("/admin");
}

/** Follow couldn't be verified: void those bonus entries, void the draw, draw again. */
export async function voidAndRedraw(form: FormData) {
  await requireAdmin();
  const draw = await db.draw.findUniqueOrThrow({ where: { id: String(form.get("drawId")) } });
  await db.$transaction([
    db.entry.updateMany({ where: { entrantId: draw.winnerId, source: "follow", voidedAt: null }, data: { voidedAt: new Date() } }),
    db.draw.update({ where: { id: draw.id }, data: { status: "voided" } }),
  ]);
  await drawFor(draw.kind as DrawKind, draw.period, draw.universityId);
  revalidatePath("/admin");
}

export async function voidReferral(form: FormData) {
  await requireAdmin();
  await voidGiveawayReferral(String(form.get("referralId")));
  revalidatePath("/", "layout");
}

/** Refunds free the spot, and any ladder rung the refunded mate was holding up drops with them. */
export async function refundBooking(form: FormData) {
  await requireAdmin();
  const booking = await db.booking.findUniqueOrThrow({ where: { id: String(form.get("bookingId")) } });
  await db.$transaction([
    db.booking.update({ where: { id: booking.id }, data: { status: "refunded" } }),
    db.payment.updateMany({ where: { bookingId: booking.id, paidAt: null }, data: { status: "cancelled" } }),
  ]);
  const ref = await db.referral.findUnique({ where: { kind_refereeId: { kind: "trip", refereeId: booking.entrantId } } });
  if (ref && ref.status === "confirmed") {
    await db.referral.update({ where: { id: ref.id }, data: { status: "voided" } });
    const referrerBooking = await db.booking.findFirst({ where: { entrantId: ref.referrerId, status: "active" } });
    if (referrerBooking) await recalcBooking(referrerBooking.id);
  }
  revalidatePath("/", "layout");
}

export async function resetDemo() {
  await requireAdmin();
  await seedDemo();
  revalidatePath("/", "layout");
}

/** Demo only: books N made-up students so you can watch the counter drain. */
export async function addDemoBookings(form: FormData) {
  await requireAdmin();
  const uni = await db.university.findUniqueOrThrow({ where: { id: String(form.get("universityId")) } });
  const ceiling = uni.hardCapReleased ? uni.hardCap : uni.softCap;
  const n = Math.min(Number(form.get("count") ?? 5), ceiling - (await bookedCount(uni.id)));
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const id = privateToken().slice(0, 6);
    const email = `demo.${id}@example.com`;
    const e = await db.entrant.create({
      data: {
        token: privateToken(), firstName: "Demo", lastName: `Student ${id.toUpperCase()}`, email, emailNormalised: normaliseEmail(email),
        emailConfirmedAt: now, whatsappVerifiedAt: now, instagramVerifiedAt: now, enteredAt: now, universityId: uni.id, yearOfStudy: "2", instagramHandle: `demo_${id.toLowerCase()}`, over18: true, referralCode: referralCode(),
      },
    });
    await db.entry.create({ data: { entrantId: e.id, source: "verified", count: 1, drawMonth: drawMonth(now), term: termFor(now).key } });
    const b = await db.booking.create({ data: { entrantId: e.id, universityId: uni.id, plan: "monthly", totalPence: uni.pricePence, depositPaidAt: now, status: "active" } });
    await db.payment.create({ data: { bookingId: b.id, kind: "deposit", amountPence: DEPOSIT_PENCE, dueDate: now, paidAt: now, status: "paid" } });
    for (const p of buildSchedule(uni.pricePence - DEPOSIT_PENCE, "monthly", now, finalBalanceDate(uni.departureDate))) {
      await db.payment.create({ data: { bookingId: b.id, kind: "instalment", amountPence: p.amountPence, dueDate: p.dueDate } });
    }
  }
  revalidatePath("/", "layout");
}
