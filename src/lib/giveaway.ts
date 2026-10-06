import { db } from "./db";
import { drawMonth, endOfMonth, termByKey, termFor, weekStart } from "./dates";
import { referralCode } from "./codes";
import { sendWhatsApp } from "./mail";
import { displayName } from "./site";
import type { SnapshotRow } from "./draw";

export const ENTRY_VALUES = { verified: 1, follow: 1, referral: 5, story: 3 } as const;
export type EntrySource = keyof typeof ENTRY_VALUES;

// Standing entries count in every draw. Earned ones count in the month and term they were earned.
const STANDING: string[] = ["verified", "follow"];

export type Tally = {
  standing: number;
  follow: number;
  month: { referral: number; story: number; total: number };
  term: { referral: number; story: number; total: number };
};

/** Entries for this month's 7 nights and this term's free trip, from the ledger. */
export async function tally(entrantId: string, month = drawMonth(), term = termFor().key): Promise<Tally> {
  const rows = await db.entry.findMany({ where: { entrantId, voidedAt: null } });
  const sum = (pred: (r: (typeof rows)[number]) => boolean) => rows.filter(pred).reduce((s, r) => s + r.count, 0);
  const standing = sum((r) => STANDING.includes(r.source));
  const follow = sum((r) => r.source === "follow");
  const earned = (source: string, key: "drawMonth" | "term", value: string) => sum((r) => r.source === source && r[key] === value);
  const m = { referral: earned("referral", "drawMonth", month), story: earned("story", "drawMonth", month) };
  const t = { referral: earned("referral", "term", term), story: earned("story", "term", term) };
  return {
    standing,
    follow,
    month: { ...m, total: standing + m.referral + m.story },
    term: { ...t, total: standing + t.referral + t.story },
  };
}

async function uniqueReferralCode() {
  for (;;) {
    const code = referralCode();
    if (!(await db.entrant.findUnique({ where: { referralCode: code } }))) return code;
  }
}

/** Short code they send us on WhatsApp and Instagram. */
export function newVerifyCode() {
  return referralCode().slice(0, 5);
}

export type VerifyResult = { ok: true; entered: boolean } | { ok: false; error: string };

/**
 * WhatsApp verification, the only step. In production the WhatsApp Business
 * webhook calls this when "VERIFY <code>" arrives, with the number it came from
 * and the sender's WhatsApp profile name. Once verified they're in both draws:
 * standing entries are written, their share code is issued, and whoever
 * referred them gets +5. The reply goes back to them on WhatsApp.
 */
export async function verifyWhatsApp(entrantId: string, from: { number: string; profileName?: string }, baseUrl: string): Promise<VerifyResult> {
  const e = await db.entrant.findUnique({ where: { id: entrantId }, include: { university: true } });
  if (!e) return { ok: false, error: "We couldn't find your entry." };
  if (e.enteredAt) return { ok: true, entered: true };
  const clash = await db.entrant.findFirst({ where: { whatsapp: from.number, whatsappVerifiedAt: { not: null }, id: { not: e.id } } });
  if (clash) return { ok: false, error: "That WhatsApp number is already in the giveaway. One entry per person." };

  const now = new Date();
  const period = { drawMonth: drawMonth(now), term: termFor(now).key };
  const code = e.referralCode ?? (await uniqueReferralCode());
  const [first, ...rest] = (from.profileName ?? "").trim().split(/\s+/).filter(Boolean);

  const referral = await db.$transaction(async (tx) => {
    await tx.entrant.update({
      where: { id: e.id },
      data: {
        whatsapp: from.number,
        whatsappVerifiedAt: now,
        enteredAt: now,
        referralCode: code,
        ...(first && !e.firstName ? { firstName: first, lastName: rest.join(" ") || null } : {}),
      },
    });
    await tx.entry.create({ data: { entrantId: e.id, source: "verified", count: ENTRY_VALUES.verified, ...period } });

    // Credit one level up only: the direct referrer.
    const pending = await tx.referral.findFirst({ where: { kind: "giveaway", refereeId: e.id, status: "pending" } });
    if (!pending) return null;
    await tx.referral.update({ where: { id: pending.id }, data: { status: "confirmed", confirmedAt: now } });
    await tx.entry.create({
      data: { entrantId: pending.referrerId, source: "referral", count: ENTRY_VALUES.referral, ...period, referralId: pending.id },
    });
    return pending;
  });

  await sendWhatsApp({
    to: from.number,
    subject: "You're in both draws",
    body: `7 free nights this month, a free trip this term. Share your link for +5 entries a mate: ${baseUrl}/${e.university.slug}?r=${code}`,
    ctaLabel: "SEE MY ENTRIES",
    ctaUrl: `${baseUrl}/${e.university.slug}/me?t=${e.token}`,
  });
  if (referral) {
    const referrer = await db.entrant.findUnique({ where: { id: referral.referrerId }, include: { university: true } });
    if (referrer?.whatsapp) {
      await sendWhatsApp({
        to: referrer.whatsapp,
        subject: "+5 entries",
        body: `A mate just got in on your link. That counts for this month's 7 nights and this term's free trip.`,
        ctaLabel: "SEE MY ENTRIES",
        ctaUrl: `${baseUrl}/${referrer.university.slug}/me?t=${referrer.token}`,
      });
    }
  }
  return { ok: true, entered: true };
}

/**
 * Optional, after sign-up: their Instagram unlocks the follow entry (checked
 * for winners) and weekly story entries, matched by handle when Instagram's
 * story-mention webhook fires.
 */
export async function addInstagram(entrantId: string, handle: string, follows: boolean): Promise<VerifyResult> {
  const e = await db.entrant.findUnique({ where: { id: entrantId } });
  if (!e?.enteredAt) return { ok: false, error: "Verify your WhatsApp first." };
  const clash = await db.entrant.findFirst({ where: { instagramHandle: handle, id: { not: e.id } } });
  if (clash) return { ok: false, error: "That Instagram account is already in the giveaway." };
  await db.entrant.update({ where: { id: e.id }, data: { instagramHandle: handle, declaredFollow: follows || e.declaredFollow } });
  const hasFollow = await db.entry.findFirst({ where: { entrantId, source: "follow", voidedAt: null } });
  if (follows && !hasFollow) {
    const now = new Date();
    await db.entry.create({ data: { entrantId, source: "follow", count: ENTRY_VALUES.follow, drawMonth: drawMonth(now), term: termFor(now).key } });
  }
  return { ok: true, entered: true };
}

/**
 * +3 for tagging @madmonkeyhostels in a story, once a week. In production
 * Instagram's story-mention webhook calls this for the verified handle.
 */
export async function recordStoryShare(entrantId: string): Promise<"added" | "already" | "not-entered"> {
  const e = await db.entrant.findUnique({ where: { id: entrantId } });
  if (!e?.enteredAt || !e.instagramHandle) return "not-entered";
  if (await sharedStoryThisWeek(entrantId)) return "already";
  const now = new Date();
  await db.entry.create({ data: { entrantId, source: "story", count: ENTRY_VALUES.story, drawMonth: drawMonth(now), term: termFor(now).key } });
  return "added";
}

export async function sharedStoryThisWeek(entrantId: string) {
  return !!(await db.entry.findFirst({ where: { entrantId, source: "story", voidedAt: null, createdAt: { gte: weekStart() } } }));
}

/** Voids a giveaway referral and the 5 entries it paid. Totals recalculate from the ledger. */
export async function voidGiveawayReferral(referralId: string) {
  const now = new Date();
  await db.$transaction([
    db.referral.update({ where: { id: referralId }, data: { status: "voided" } }),
    db.entry.updateMany({ where: { referralId, voidedAt: null }, data: { voidedAt: now } }),
  ]);
}

/** Top ten at a uni by mates brought in this term. */
export async function giveawayLeaderboard(universityId: string, term = termFor().key, limit = 10) {
  const rows = await db.entry.groupBy({
    by: ["entrantId"],
    where: { source: "referral", term, voidedAt: null, entrant: { universityId } },
    _count: { _all: true },
    orderBy: { _count: { entrantId: "desc" } },
    take: limit,
  });
  const people = await db.entrant.findMany({ where: { id: { in: rows.map((r) => r.entrantId) } } });
  return rows.map((r) => {
    const p = people.find((x) => x.id === r.entrantId)!;
    return { id: p.id, name: displayName(p), mates: r._count._all };
  });
}

/**
 * Who is in the hat, and with how many entries. Monthly: standing entries plus
 * what was earned that month. Termly: standing plus what was earned that term.
 */
export async function drawSnapshot(kind: "monthly" | "termly", period: string, universityId: string | null): Promise<SnapshotRow[]> {
  // Only people who were in by the end of the period.
  const end = kind === "monthly" ? endOfMonth(period) : new Date(`${termByKey(period).end}T23:59:59`);
  const people = await db.entrant.findMany({
    where: { enteredAt: { not: null, lte: end }, ...(universityId ? { universityId } : {}) },
    include: { entries: { where: { voidedAt: null } } },
    orderBy: { id: "asc" },
  });
  return people
    .map((p) => {
      const entries = p.entries
        .filter((e) => STANDING.includes(e.source) || (kind === "monthly" ? e.drawMonth === period : e.term === period))
        .reduce((s, e) => s + e.count, 0);
      return { id: p.id, name: displayName(p), entries };
    })
    .filter((r) => r.entries > 0);
}
