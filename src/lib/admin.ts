import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "./db";
import { termFor } from "./dates";

const COOKIE = "mm_admin";

function digest(s: string) {
  return createHash("sha256").update(`mm-admin:${s}`).digest();
}

/** One password, one login. No roles. */
export async function isAdmin() {
  const value = (await cookies()).get(COOKIE)?.value;
  const password = process.env.ADMIN_PASSWORD;
  if (!value || !password) return false;
  const a = Buffer.from(value, "hex");
  const b = digest(password);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function logIn(password: string) {
  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) return false;
  (await cookies()).set(COOKIE, digest(password).toString("hex"), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 12 });
  return true;
}

export async function requireAdmin() {
  if (!(await isAdmin())) throw new Error("Not signed in");
}

export type EntrantFilter = { uni?: string; year?: string; status?: string; minEntries?: number; minReferrals?: number; q?: string };

/**
 * Everyone on the list, with this term's entries and referrals. Shared by the
 * table and the CSV. Status: "entered" (WhatsApp verified), "pending", "trip" (booked only).
 */
export async function listEntrants(f: EntrantFilter) {
  const term = termFor().key;
  const people = await db.entrant.findMany({
    where: {
      university: f.uni ? { slug: f.uni } : undefined,
      yearOfStudy: f.year || undefined,
      ...(f.status === "entered" ? { enteredAt: { not: null } } : {}),
      ...(f.status === "pending" ? { enteredAt: null, OR: [{ source: null }, { source: { not: "trip" } }] } : {}),
      ...(f.status === "trip" ? { source: "trip" } : {}),
      AND: f.q
        ? [
            {
              OR: [
                { whatsapp: { contains: f.q.replace(/\s/g, "").replace(/^0/, "") } },
                { firstName: { contains: f.q } },
                { lastName: { contains: f.q } },
                { email: { contains: f.q } },
                { instagramHandle: { contains: f.q.replace(/^@/, "").toLowerCase() } },
              ],
            },
          ]
        : undefined,
    },
    include: {
      university: true,
      entries: { where: { voidedAt: null } },
      referralsMade: { where: { kind: "giveaway", status: "confirmed" } },
    },
    orderBy: { createdAt: "desc" },
  });
  return people
    .map((p) => ({
      ...p,
      // Standing entries count every term; earned ones only in the term they were earned.
      entryTotal: p.entries.filter((e) => ["verified", "follow"].includes(e.source) || e.term === term).reduce((s, e) => s + e.count, 0),
      referralTotal: p.referralsMade.length,
    }))
    .filter((p) => p.entryTotal >= (f.minEntries ?? 0) && p.referralTotal >= (f.minReferrals ?? 0));
}
