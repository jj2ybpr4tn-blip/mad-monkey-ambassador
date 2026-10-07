// Demo data: two universities on the same Cambodia trip, a few dozen giveaway
// entrants (most verified, some still verifying), referrals, story shares, last
// month's draw, and some trip bookings, so every screen has something on it.
import { db } from "./db";
import { privateToken, referralCode } from "./codes";
import { addDays, drawMonth, finalBalanceDate, termFor, weekStart } from "./dates";
import { pickWinner } from "./draw";
import { drawSnapshot, ENTRY_VALUES, newVerifyCode } from "./giveaway";
import { MONTHLY_PRIZE } from "./prizes";
import { buildSchedule, type Plan } from "./plans";
import { DEPOSIT_PENCE, FRIEND_DISCOUNT_PENCE } from "./money";
import { normaliseEmail } from "./validate";
import { recalcBooking } from "./trip";

const FIRST = ["Olivia", "Jack", "Amelia", "Harry", "Isla", "Oscar", "Ava", "Charlie", "Mia", "George", "Grace", "Leo", "Freya", "Alfie", "Lily", "Noah", "Ella", "Archie", "Sophie", "Theo", "Evie", "Finn", "Poppy", "Max", "Ruby", "Josh", "Millie", "Sam", "Daisy", "Will", "Zara", "Ben", "Chloe", "Tom", "Maya", "Ollie", "Hannah", "Luke", "Erin", "Dan"];
const LAST = ["Smith", "Jones", "Taylor", "Brown", "Williams", "Wilson", "Johnson", "Davies", "Patel", "Robinson", "Wright", "Thompson", "Evans", "Walker", "White", "Roberts", "Green", "Hall", "Wood", "Jackson", "Clarke", "Hughes", "Khan", "Lewis", "Morgan", "Turner", "Hill", "Cooper", "Ward", "Moore"];

const DAY = 24 * 60 * 60 * 1000;

function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Each university's trip. Editable in Admin once it's running; this is only the
 * starting point. `syncTrips` below re-applies it on every deploy, so changing
 * a trip here updates the live site without touching anyone's entries.
 */
export const TRIPS: Record<string, {
  destination: string;
  route: string;
  days: number;
  departureDate: Date;
  returnDate: Date;
  pricePence: number;
  softCap: number;
  hardCap: number;
}> = {
  exeter: {
    destination: "Cambodia",
    route: "Phnom Penh,Siem Reap,Koh Rong,Koh Sdach",
    days: 14,
    departureDate: new Date("2027-06-20T00:00:00Z"),
    returnDate: new Date("2027-07-03T00:00:00Z"),
    pricePence: 36500,
    softCap: 30,
    hardCap: 40,
  },
  loughborough: {
    destination: "Indonesia",
    route: "Uluwatu,Nusa Lembongan,Gili Trawangan,Kuta Lombok",
    days: 12,
    // Indonesia departs on Saturdays.
    departureDate: new Date("2027-06-26T00:00:00Z"),
    returnDate: new Date("2027-07-08T00:00:00Z"),
    pricePence: 36500,
    softCap: 30,
    hardCap: 40,
  },
};

/** Re-applies the trip above to each university, leaving entrants and bookings alone. */
export async function syncTrips() {
  for (const [slug, trip] of Object.entries(TRIPS)) {
    const uni = await db.university.findUnique({ where: { slug } });
    if (uni) await db.university.update({ where: { slug }, data: trip });
  }
}

export async function seedDemo() {
  await db.payment.deleteMany();
  await db.booking.deleteMany();
  await db.draw.deleteMany();
  await db.entry.deleteMany();
  await db.referral.deleteMany();
  await db.entrant.updateMany({ data: { referredById: null } });
  await db.entrant.deleteMany();
  await db.university.deleteMany();
  await db.outboxEmail.deleteMany();


  // people: giveaway sign-ups. The last `pending` are still verifying. tripOnly: booked without entering.
  const unis = [
    { name: "University of Exeter", slug: "exeter", people: 34, pending: 4, bookings: 3, tripOnly: 0, seed: 7, phone: 100 },
    { name: "Loughborough University", slug: "loughborough", people: 28, pending: 3, bookings: 11, tripOnly: 2, seed: 11, phone: 300 },
  ];
  // Where sign-ups came from: campus QR posters and ambassador stories.
  const SOURCES = ["library", "library", "su", "su", "halls", "gym", "story", "story", "story", null];

  const now = new Date();
  const termStart = new Date("2026-09-14T10:00:00");
  const span = Math.max(1, (now.getTime() - termStart.getTime()) / DAY);
  const codes = new Set<string>();
  const freshCode = () => {
    for (;;) {
      const c = referralCode();
      if (!codes.has(c)) return codes.add(c), c;
    }
  };
  const at = (d: Date) => ({ drawMonth: drawMonth(d), term: termFor(d).key, createdAt: d });

  for (const u of unis) {
    const rand = rng(u.seed);
    const pick = <T,>(xs: readonly T[]) => xs[Math.floor(rand() * xs.length)];
    const uni = await db.university.create({ data: { name: u.name, slug: u.slug, ...TRIPS[u.slug] } });

    const people = [];
    for (let i = 0; i < u.people; i++) {
      const firstName = FIRST[(i * 7 + u.seed) % FIRST.length];
      const lastName = pick(LAST);
      const declaredFollow = rand() < 0.75;
      const pending = i >= u.people - u.pending;
      // The first few found it first and got loud about it. Later ones arrive over the term.
      const enteredAt = pending ? null : new Date(termStart.getTime() + (i < 6 ? i * 0.6 : 4 + rand() * (span - 4.5)) * DAY);
      const createdAt = enteredAt ? new Date(enteredAt.getTime() - 20 * 60 * 1000) : new Date(now.getTime() - (i - u.people + u.pending + 1) * 7 * 60 * 60 * 1000);
      // Giveaway sign-ups give a WhatsApp number only. Names arrive with the verify
      // message (most WhatsApp profiles have one); Instagram is an optional extra later.
      const named = !!enteredAt && i % 5 !== 4;
      const instagram = enteredAt && rand() < 0.6 ? `${firstName}.${lastName.toLowerCase()}${Math.floor(rand() * 90 + 10)}`.toLowerCase() : null;
      const follows = !!instagram && declaredFollow;
      const e = await db.entrant.create({
        data: {
          token: privateToken(),
          firstName: named ? firstName : null,
          lastName: named ? lastName : null,
          whatsapp: `+447700900${u.phone + i}`,
          whatsappVerifiedAt: enteredAt,
          instagramHandle: instagram,
          enteredAt,
          universityId: uni.id,
          declaredFollow: follows,
          whatsappConsent: true,
          over18: true,
          source: pick(SOURCES),
          verifyCode: newVerifyCode(),
          referralCode: enteredAt ? freshCode() : null,
          createdAt,
          ip: `203.0.113.${(i % 250) + 1}`,
        },
      });
      if (enteredAt) {
        const standing = [{ source: "verified", count: ENTRY_VALUES.verified }];
        if (follows) standing.push({ source: "follow", count: ENTRY_VALUES.follow });
        await db.entry.createMany({ data: standing.map((x) => ({ ...x, entrantId: e.id, ...at(enteredAt) })) });
      }
      people.push(e);
    }

    // Later sign-ups often came in on the loud ones' links. +5 once the mate is fully verified.
    const loud = people.slice(0, 6);
    const weights = [6, 4, 3, 2, 1, 1];
    for (const e of people.slice(6)) {
      if (rand() > 0.55) continue;
      let r = rand() * weights.reduce((a, b) => a + b, 0);
      const referrer = loud.find((_, i) => (r -= weights[i]) < 0) ?? loud[0];
      await db.entrant.update({ where: { id: e.id }, data: { referredById: referrer.id } });
      const ref = await db.referral.create({
        data: { kind: "giveaway", referrerId: referrer.id, refereeId: e.id, status: e.enteredAt ? "confirmed" : "pending", confirmedAt: e.enteredAt },
      });
      if (e.enteredAt) {
        await db.entry.create({ data: { entrantId: referrer.id, source: "referral", count: ENTRY_VALUES.referral, referralId: ref.id, ...at(e.enteredAt) } });
      }
    }

    // Weekly story shares: the loud ones most weeks, everyone else now and then.
    for (const [i, e] of people.entries()) {
      if (!e.enteredAt || !e.instagramHandle) continue;
      for (let w = weekStart(e.enteredAt); w <= now; w = addDays(w, 7)) {
        if (rand() > (i < 6 ? 0.85 : 0.35)) continue;
        const when = new Date(Math.max(w.getTime(), e.enteredAt.getTime()) + rand() * 2 * DAY);
        if (when > now) continue;
        await db.entry.create({ data: { entrantId: e.id, source: "story", count: ENTRY_VALUES.story, ...at(when) } });
      }
    }

    // Last month's 7-nights draw, already run and announced.
    const lastMonth = drawMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    const snapshot = await drawSnapshot("monthly", lastMonth, uni.id);
    const seed = `${u.slug}-${lastMonth}`;
    const winner = pickWinner(snapshot, seed);
    if (winner) {
      await db.draw.create({
        data: { kind: "monthly", period: lastMonth, universityId: uni.id, prize: MONTHLY_PRIZE, seed, entrantSnapshot: JSON.stringify(snapshot), winnerId: winner.id, status: "verified", verifiedAt: new Date(now.getFullYear(), now.getMonth(), 1, 12) },
      });
      await db.entrant.update({ where: { id: winner.id }, data: { followVerified: true } });
    }

    // Some people book the trip without ever entering the giveaway. Same list.
    for (let k = 0; k < u.tripOnly; k++) {
      const firstName = FIRST[(k * 11 + 3) % FIRST.length];
      const lastName = pick(LAST);
      const email = `${firstName}.${lastName}.trip${k}@example.com`.toLowerCase();
      people.push(
        await db.entrant.create({
          data: {
            token: privateToken(),
            firstName,
            lastName,
            email,
            emailNormalised: normaliseEmail(email),
            whatsapp: `+447700900${u.phone + 90 + k}`,
            universityId: uni.id,
            over18: true,
            source: "trip",
            referralCode: freshCode(),
            createdAt: addDays(now, -3 - k),
          },
        }),
      );
    }

    // Bookings. The first entrant brings mates; on the bigger uni the second does too.
    // Anyone who books gives a name and email at checkout, so fill those in.
    const fromGiveaway = await Promise.all(
      people.slice(0, u.bookings - u.tripOnly).map((p, i) => {
        const firstName = p.firstName ?? FIRST[(i * 7 + u.seed) % FIRST.length];
        const lastName = p.lastName ?? "Smith";
        const email = `${firstName}.${lastName}.${i}@example.com`.toLowerCase();
        return db.entrant.update({ where: { id: p.id }, data: { firstName, lastName, email, emailNormalised: normaliseEmail(email) } });
      }),
    );
    const bookers = [...fromGiveaway, ...people.slice(people.length - u.tripOnly)];
    const finalDate = finalBalanceDate(uni.departureDate);
    for (const [i, e] of bookers.entries()) {
      const tripReferrer = i === 0 ? null : i <= (u.bookings > 5 ? 4 : 2) ? bookers[0] : i <= 6 && u.bookings > 5 ? bookers[1] : null;
      const plan: Plan = (["weekly", "monthly", "weekly", "full", "monthly"] as const)[i % 5];
      const depositAt = addDays(now, -Math.floor(rand() * 9) - 1);
      const friendDiscount = tripReferrer ? FRIEND_DISCOUNT_PENCE : 0;
      const booking = await db.booking.create({
        data: {
          entrantId: e.id,
          universityId: uni.id,
          plan,
          totalPence: uni.pricePence,
          depositPaidAt: depositAt,
          status: "active",
          stripeCustomerId: `cus_demo_${e.id.slice(-8)}`,
          stripeSubscriptionId: plan === "full" ? null : `sub_demo_${e.id.slice(-8)}`,
          friendDiscountPence: friendDiscount,
          createdAt: depositAt,
        },
      });
      await db.payment.create({
        data: { bookingId: booking.id, kind: "deposit", amountPence: DEPOSIT_PENCE, dueDate: depositAt, paidAt: depositAt, status: "paid", stripePaymentIntentId: `pi_demo_${booking.id.slice(-8)}` },
      });
      const schedule = buildSchedule(uni.pricePence - DEPOSIT_PENCE - friendDiscount, plan, depositAt, finalDate);
      for (const [j, p] of schedule.entries()) {
        const due = p.dueDate <= now;
        // One student has missed a payment, so the admin "behind" view has someone in it.
        const missed = due && i === 2 && j === 0 && plan !== "full";
        await db.payment.create({
          data: {
            bookingId: booking.id,
            kind: "instalment",
            amountPence: p.amountPence,
            dueDate: p.dueDate,
            paidAt: due && !missed ? p.dueDate : null,
            status: missed ? "late" : due ? "paid" : "scheduled",
          },
        });
      }
      if (tripReferrer) {
        await db.referral.create({
          data: { kind: "trip", referrerId: tripReferrer.id, refereeId: e.id, status: "confirmed", confirmedAt: depositAt },
        });
        const referrerBooking = await db.booking.findFirst({ where: { entrantId: tripReferrer.id } });
        if (referrerBooking) await db.booking.update({ where: { id: booking.id }, data: { referredByBookingId: referrerBooking.id } });
      }
    }
    for (const b of await db.booking.findMany({ where: { universityId: uni.id } })) await recalcBooking(b.id);
  }
}
