import Link from "next/link";
import { db } from "@/lib/db";
import { isAdmin, listEntrants } from "@/lib/admin";
import { drawMonth, finalBalanceDate, longDate, monthLabel, shortDate, termByKey, termFor, TERMS } from "@/lib/dates";
import { pickWinner, type SnapshotRow } from "@/lib/draw";
import { giveawayLeaderboard } from "@/lib/giveaway";
import { ITINERARY_KEYS, itineraryFor } from "@/lib/itineraries";
import { param } from "@/lib/me";
import { gbp } from "@/lib/money";
import { MONTHLY_PRIZE, TERMLY_PRIZE } from "@/lib/prizes";
import { displayName, shortUniName, siteUrl } from "@/lib/site";
import { bookedCount, spotsState, tripLeaderboard } from "@/lib/trip";
import { Logo } from "@/components/Logo";
import { QrCode } from "@/components/QrCode";
import { SpotsBar } from "@/components/SpotsBar";
import {
  addDemoBookings, addUniversity, logout, refundBooking, resetDemo, runDraw, toggleHardCap, updateUniversity, verifyWinner, voidAndRedraw, voidReferral,
} from "./actions";
import { Login } from "./Login";

type SP = Record<string, string | string[] | undefined>;

const TABS = [
  ["unis", "Universities"],
  ["entrants", "Entrants"],
  ["draw", "Draw"],
  ["bookings", "Bookings"],
  ["leaderboard", "Leaderboard"],
  ["qr", "QR codes"],
  ["demo", "Demo tools"],
] as const;

export default async function AdminPage({ searchParams }: { searchParams: Promise<SP> }) {
  if (!(await isAdmin())) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Logo />
        {/* Shown in local dev only, so whoever is clicking through the demo can get in. */}
        <Login hint={process.env.NODE_ENV === "production" ? undefined : process.env.ADMIN_PASSWORD} />
      </main>
    );
  }
  const sp = await searchParams;
  const tab = param(sp.tab) ?? "unis";

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex items-center justify-between">
        <Logo />
        <form action={logout}>
          <button className="eyebrow underline underline-offset-4">Log out</button>
        </form>
      </div>
      <nav className="mt-6 flex gap-2 overflow-x-auto pb-2">
        {TABS.map(([key, label]) => (
          <Link key={key} href={`/admin?tab=${key}`} className={`btn btn-sm shrink-0 rounded-full ${tab === key ? "bg-lime text-ink" : "btn-outline"}`}>
            {label}
          </Link>
        ))}
      </nav>
      <div className="mt-8">
        {tab === "unis" && <Universities />}
        {tab === "entrants" && <Entrants sp={sp} />}
        {tab === "draw" && <Draws />}
        {tab === "bookings" && <Bookings />}
        {tab === "leaderboard" && <Leaderboards />}
        {tab === "qr" && <QrCodes sp={sp} />}
        {tab === "demo" && <DemoTools />}
      </div>
    </main>
  );
}

const th = "eyebrow px-2 pb-2 text-left whitespace-nowrap";
const td = "border-b-2 border-bone/15 px-2 py-2 align-top";

async function Universities() {
  const unis = await db.university.findMany({ orderBy: { name: "asc" } });
  return (
    <div className="space-y-10">
      {await Promise.all(
        unis.map(async (u) => {
          const booked = await bookedCount(u.id);
          const spots = spotsState(u, booked);
          const softFull = booked >= u.softCap;
          return (
            <section key={u.id} className="panel p-5">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div>
                  <h2 className="display text-3xl">{u.name}</h2>
                  <p className="mt-1 text-sm">
                    Giveaway <Link href={`/${u.slug}`} className="underline underline-offset-2">/{u.slug}</Link> · Trip <Link href={`/trip/${u.slug}`} className="underline underline-offset-2">/trip/{u.slug}</Link> · {u.isLive ? "Live" : "Not live"}
                  </p>
                </div>
                <div className="w-full max-w-xs">
                  <SpotsBar spots={spots} size="sm" />
                  <p className="mt-1 text-sm">
                    {booked} booked · soft cap {u.softCap} · hard cap {u.hardCap}
                  </p>
                  <form action={toggleHardCap} className="mt-3">
                    <input type="hidden" name="id" value={u.id} />
                    <button className={`btn btn-sm ${u.hardCapReleased ? "btn-outline" : softFull ? "btn-lime" : "btn-outline"}`}>
                      {u.hardCapReleased ? "Take back the extra spots" : `Release ${u.hardCap - u.softCap} extra spots`}
                    </button>
                    {softFull && !u.hardCapReleased && <p className="mt-2 text-sm font-bold text-lime">Soft cap hit. Release now and tell the ambassador to announce it.</p>}
                  </form>
                </div>
              </div>
              <form action={updateUniversity} className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <input type="hidden" name="id" value={u.id} />
                <Field label="Ambassador" name="ambassadorName" defaultValue={u.ambassadorName ?? ""} placeholder="Name" />
                <Field label="Destination" name="destination" defaultValue={u.destination} />
                <label className="block">
                  <span className="eyebrow">Itinerary</span>
                  <select name="itineraryKey" defaultValue={u.itineraryKey ?? ""} className="field mt-1.5">
                    <option value="">Match the destination ({u.destination})</option>
                    {ITINERARY_KEYS.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                  <span className="mt-1 block text-xs font-semibold opacity-60">
                    {itineraryFor(u) ? "Full day-by-day showing." : "No itinerary yet — the trip page says details are coming."}
                  </span>
                </label>
                <Field label="Route (comma separated)" name="route" defaultValue={u.route} />
                <Field label="Days" name="days" type="number" defaultValue={u.days} />
                <Field label="Departs" name="departureDate" type="date" defaultValue={u.departureDate.toISOString().slice(0, 10)} hint={`Final balance ${longDate(finalBalanceDate(u.departureDate))}`} />
                <Field label="Price (£)" name="priceGbp" type="number" defaultValue={u.pricePence / 100} />
                <Field label="Soft cap" name="softCap" type="number" defaultValue={u.softCap} />
                <Field label="Hard cap" name="hardCap" type="number" defaultValue={u.hardCap} />
                <label className="flex items-center gap-3 font-medium">
                  <input type="checkbox" name="flightsIncluded" defaultChecked={u.flightsIncluded} className="check" /> Flights included
                </label>
                <label className="flex items-center gap-3 font-medium">
                  <input type="checkbox" name="isLive" defaultChecked={u.isLive} className="check" /> Live
                </label>
                <div className="sm:col-span-2 lg:col-span-4">
                  <button className="btn btn-lime btn-sm">Save {shortUniName(u.name)}</button>
                </div>
              </form>
            </section>
          );
        }),
      )}
      <section className="panel border-dashed p-5">
        <h2 className="display text-2xl">Add a university</h2>
        <form action={addUniversity} className="mt-4 flex flex-wrap items-end gap-4">
          <Field label="Name" name="name" placeholder="University of Bristol" />
          <Field label="Slug" name="slug" placeholder="bristol" />
          <button className="btn btn-outline btn-sm">Add (not live yet)</button>
        </form>
      </section>
    </div>
  );
}

async function Entrants({ sp }: { sp: SP }) {
  const f = {
    uni: param(sp.uni) || undefined,
    status: param(sp.status) || undefined,
    minEntries: Number(param(sp.minEntries) || 0),
    minReferrals: Number(param(sp.minReferrals) || 0),
    q: param(sp.q) || undefined,
  };
  const [rows, unis] = await Promise.all([listEntrants(f), db.university.findMany({ orderBy: { name: "asc" } })]);
  const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v).map(([k, v]) => [k, String(v)])).toString();
  return (
    <div>
      <form className="grid items-end gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <input type="hidden" name="tab" value="entrants" />
        <Field label="Search" name="q" defaultValue={f.q ?? ""} placeholder="number, name, @handle" />
        <label className="block">
          <span className="eyebrow">University</span>
          <select name="uni" defaultValue={f.uni ?? ""} className="field mt-1.5">
            <option value="">All</option>
            {unis.map((u) => (
              <option key={u.id} value={u.slug}>{shortUniName(u.name)}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="eyebrow">Status</span>
          <select name="status" defaultValue={f.status ?? ""} className="field mt-1.5">
            <option value="">All</option>
            <option value="entered">In the draws</option>
            <option value="pending">Not verified yet</option>
            <option value="trip">Trip only</option>
          </select>
        </label>
        <Field label="Min entries" name="minEntries" type="number" defaultValue={f.minEntries || ""} />
        <Field label="Min referrals" name="minReferrals" type="number" defaultValue={f.minReferrals || ""} />
        <div className="flex gap-2">
          <button className="btn btn-lime btn-sm">Filter</button>
          <a href={`/admin/export?${qs}`} className="btn btn-outline btn-sm">CSV</a>
        </div>
      </form>
      <p className="mt-6 font-bold">
        {rows.length} people · entries this {termByKey(termFor().key).label.toLowerCase()}
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr>
              {["WhatsApp", "Name", "Uni", "Status", "Instagram", "From", "Entries", "Referrals", "Joined"].map((h) => (
                <th key={h} className={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className={`${td} font-semibold whitespace-nowrap`}>{r.whatsapp ?? "—"}</td>
                <td className={td}>{r.firstName ? `${r.firstName} ${r.lastName ?? ""}` : <span className="text-bone/50">—</span>}</td>
                <td className={td}>{shortUniName(r.university.name)}</td>
                <td className={`${td} whitespace-nowrap`}>
                  {r.source === "trip" ? (
                    <span className="text-bone/70">Trip only</span>
                  ) : r.enteredAt ? (
                    <span className="font-bold text-lime">In the draws</span>
                  ) : (
                    <span className="text-orange">Not verified</span>
                  )}
                </td>
                <td className={td}>
                  {r.instagramHandle ? `@${r.instagramHandle}` : "—"}
                  {r.declaredFollow && <span className="text-lime"> · follows</span>}
                </td>
                <td className={td}>{r.source ?? "—"}</td>
                <td className={`${td} font-black`}>{r.enteredAt ? r.entryTotal : "—"}</td>
                <td className={td}>{r.referralTotal}</td>
                <td className={`${td} whitespace-nowrap`}>{shortDate(r.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

async function Draws() {
  const unis = await db.university.findMany({ orderBy: { name: "asc" } });
  const draws = await db.draw.findMany({ include: { university: true }, orderBy: { createdAt: "desc" } });
  const now = new Date();
  const months = [0, 1, 2].map((i) => drawMonth(new Date(now.getFullYear(), now.getMonth() - i, 1)));

  return (
    <div>
      <p className="max-w-2xl font-medium">
        Two draws. Monthly ({MONTHLY_PRIZE}): standing entries plus what was earned that month. Termly ({TERMLY_PRIZE}): standing entries plus everything earned that term.
        Draw day runs in this order: run the draw, check the winner&apos;s follow, then announce. If the follow can&apos;t be verified, void those entries and draw again.
      </p>
      <form action={runDraw} className="mt-6 flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="eyebrow">Prize</span>
          <select name="kind" className="field mt-1.5">
            <option value="monthly">Monthly · 7 free nights</option>
            <option value="termly">Termly · free trip</option>
          </select>
        </label>
        <label className="block">
          <span className="eyebrow">Who&apos;s in</span>
          <select name="universityId" className="field mt-1.5">
            {unis.map((u) => (
              <option key={u.id} value={u.id}>{shortUniName(u.name)}</option>
            ))}
            <option value="">Every uni together</option>
          </select>
        </label>
        <label className="block">
          <span className="eyebrow">Month (monthly)</span>
          <select name="month" className="field mt-1.5">
            {months.map((m) => (
              <option key={m} value={m}>{monthLabel(m)}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="eyebrow">Term (termly)</span>
          <select name="term" className="field mt-1.5" defaultValue={termFor().key}>
            {TERMS.map((t) => (
              <option key={t.key} value={t.key}>{t.label} {t.key.slice(0, 4)}</option>
            ))}
          </select>
        </label>
        <button className="btn btn-lime">Run the draw</button>
      </form>

      <div className="mt-10 space-y-6">
        {draws.length === 0 && <p className="text-bone/70">No draws yet.</p>}
        {await Promise.all(
          draws.map(async (d) => {
            const snapshot = JSON.parse(d.entrantSnapshot) as SnapshotRow[];
            const total = snapshot.reduce((s, r) => s + r.entries, 0);
            const winner = await db.entrant.findUnique({
              where: { id: d.winnerId },
              include: { entries: { where: d.kind === "monthly" ? { OR: [{ source: { in: ["verified", "follow"] } }, { drawMonth: d.period }] } : { OR: [{ source: { in: ["verified", "follow"] } }, { term: d.period }] } } },
            });
            const inHat = snapshot.find((r) => r.id === d.winnerId)?.entries ?? 0;
            const proved = pickWinner(snapshot, d.seed)?.id === d.winnerId;
            return (
              <section key={d.id} className={`panel p-5 ${d.status === "voided" ? "opacity-60" : ""}`}>
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <p className="eyebrow">
                    {d.university ? shortUniName(d.university.name) : "Every uni"} · {d.kind === "monthly" ? monthLabel(d.period) : `${termByKey(d.period).label} ${d.period.slice(0, 4)}`} · {d.prize}
                  </p>
                  <span className={`eyebrow rounded-full px-3 py-1 ${d.status === "verified" ? "bg-lime text-ink" : d.status === "voided" ? "bg-bone/20" : "bg-yellow text-ink"}`}>{d.status}</span>
                </div>
                {winner && (
                  <>
                    <p className="display mt-3 text-4xl">{displayName(winner)}</p>
                    <p className="mt-1 font-medium">
                      WhatsApp {winner.whatsapp}
                      {winner.instagramHandle && (
                        <>
                          {" · "}
                          <a className="underline underline-offset-2" href={`https://www.instagram.com/${winner.instagramHandle}/`} target="_blank" rel="noreferrer">
                            @{winner.instagramHandle}
                          </a>
                        </>
                      )}
                    </p>
                    <p className="mt-3 text-sm">
                      {inHat} of {total} entries in the hat ({((inHat / total) * 100).toFixed(1)}% chance).{" "}
                      Declared: {declared(winner.entries)}.
                    </p>
                  </>
                )}
                <p className="mt-2 font-mono text-xs text-bone/70">
                  seed {d.seed} · {snapshot.length} entrants snapshotted · re-run {proved ? "gives the same winner ✓" : "DOES NOT MATCH"}
                </p>
                {d.status === "drawn" && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    <form action={verifyWinner}>
                      <input type="hidden" name="drawId" value={d.id} />
                      <button className="btn btn-lime btn-sm">Follow verified, announce</button>
                    </form>
                    <form action={voidAndRedraw}>
                      <input type="hidden" name="drawId" value={d.id} />
                      <button className="btn btn-outline btn-sm">Can&apos;t verify: void and redraw</button>
                    </form>
                  </div>
                )}
              </section>
            );
          }),
        )}
      </div>
    </div>
  );
}

async function Bookings() {
  const bookings = await db.booking.findMany({
    where: { depositPaidAt: { not: null } },
    include: { entrant: true, university: true, payments: true },
    orderBy: { depositPaidAt: "desc" },
  });
  const now = new Date();
  const PLAN = { full: "Full", monthly: "Monthly", weekly: "Weekly" } as Record<string, string>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-sm">
        <thead>
          <tr>
            {["Student", "Uni", "Plan", "Price", "Discounts", "Paid", "Next payment", "Status", ""].map((h) => (
              <th key={h} className={th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => {
            const paid = b.payments.filter((p) => p.paidAt).reduce((s, p) => s + p.amountPence, 0);
            const next = b.payments.filter((p) => !p.paidAt && p.status !== "cancelled").sort((a, c) => a.dueDate.getTime() - c.dueDate.getTime())[0];
            const behind = b.payments.some((p) => !p.paidAt && p.status !== "cancelled" && p.dueDate < now);
            const status = b.status === "refunded" ? "Refunded" : behind ? "Behind" : next ? "On track" : "Paid off";
            return (
              <tr key={b.id} className={b.status === "refunded" ? "opacity-50" : ""}>
                <td className={`${td} font-semibold`}>{displayName(b.entrant)}</td>
                <td className={td}>{shortUniName(b.university.name)}</td>
                <td className={td}>{PLAN[b.plan]}</td>
                <td className={td}>{gbp(b.totalPence)}</td>
                <td className={td}>{b.friendDiscountPence + b.referrerDiscountPence ? `−${gbp(b.friendDiscountPence + b.referrerDiscountPence)}` : "—"}</td>
                <td className={td}>{gbp(paid, { exact: paid % 100 !== 0 })}</td>
                <td className={`${td} whitespace-nowrap`}>{next ? `${gbp(next.amountPence, { exact: true })} · ${shortDate(next.dueDate)}` : "—"}</td>
                <td className={`${td} font-black ${status === "Behind" ? "text-orange" : status === "On track" || status === "Paid off" ? "text-lime" : ""}`}>{status}</td>
                <td className={td}>
                  {b.status !== "refunded" && (
                    <form action={refundBooking}>
                      <input type="hidden" name="bookingId" value={b.id} />
                      <button className="text-xs font-bold underline underline-offset-2">Refund</button>
                    </form>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

async function Leaderboards() {
  const unis = await db.university.findMany({ where: { isLive: true }, orderBy: { name: "asc" } });
  const recent = await db.referral.findMany({
    where: { kind: "giveaway" },
    include: { referrer: { include: { university: true } }, referee: true },
    orderBy: { createdAt: "desc" },
    take: 15,
  });
  return (
    <div>
      <div className="grid gap-8 lg:grid-cols-2">
        {await Promise.all(
          unis.map(async (u) => {
            const [give, trip] = await Promise.all([giveawayLeaderboard(u.id), tripLeaderboard(u.id)]);
            return (
              <section key={u.id} className="panel p-5">
                <h2 className="display text-3xl">{shortUniName(u.name)}</h2>
                <div className="mt-4 grid grid-cols-2 gap-6">
                  <Board title="Giveaway mates" rows={give.map((r) => [r.name, r.mates])} note="This term" />
                  <Board title="Trip bookings" rows={trip.map((r) => [r.name, r.mates])} note="Top spot goes free" />
                </div>
              </section>
            );
          }),
        )}
      </div>
      <h2 className="display mt-12 text-2xl">Recent giveaway referrals</h2>
      <p className="mt-1 text-sm text-bone/70">Voiding takes the 5 entries back and the totals recalculate.</p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr>
              {["Referrer", "Brought", "Uni", "Status", ""].map((h) => (
                <th key={h} className={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recent.map((r) => (
              <tr key={r.id} className={r.status === "voided" ? "opacity-50" : ""}>
                <td className={`${td} font-semibold`}>{displayName(r.referrer)}</td>
                <td className={td}>{displayName(r.referee)} · {r.referee.whatsapp}</td>
                <td className={td}>{shortUniName(r.referrer.university.name)}</td>
                <td className={td}>{r.status}</td>
                <td className={td}>
                  {r.status !== "voided" && (
                    <form action={voidReferral}>
                      <input type="hidden" name="referralId" value={r.id} />
                      <button className="text-xs font-bold underline underline-offset-2">Void</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** "signup 1, follow 1, referral 20 (4 mates)", with voided sources marked. */
function declared(entries: { source: string; count: number; voidedAt: Date | null }[]) {
  const by = new Map<string, { n: number; rows: number; voided: boolean }>();
  for (const e of entries) {
    const key = `${e.source}${e.voidedAt ? "-voided" : ""}`;
    const cur = by.get(key) ?? { n: 0, rows: 0, voided: !!e.voidedAt };
    by.set(key, { n: cur.n + e.count, rows: cur.rows + 1, voided: cur.voided });
  }
  return [...by.entries()]
    .map(([key, v]) => `${key.replace("-voided", "")} ${v.n}${key.startsWith("referral") ? ` (${v.rows} ${v.rows === 1 ? "mate" : "mates"})` : ""}${v.voided ? " voided" : ""}`)
    .join(", ");
}

function Board({ title, rows, note }: { title: string; rows: [string, number][]; note?: string }) {
  return (
    <div>
      <p className="eyebrow text-lime">{title}</p>
      {note && <p className="text-xs text-bone/70">{note}</p>}
      <ol className="mt-2">
        {rows.length === 0 && <li className="text-sm text-bone/70">Nobody yet</li>}
        {rows.map(([name, n], i) => (
          <li key={name + i} className="flex justify-between gap-2 border-b-2 border-bone/15 py-1.5 text-sm">
            <span>
              <span className="font-black">{i + 1}</span> {name}
            </span>
            <span className="font-black">{n}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Posters around campus: one code per spot, so you can see which spots work. */
async function QrCodes({ sp }: { sp: SP }) {
  const unis = await db.university.findMany({ where: { isLive: true }, orderBy: { name: "asc" } });
  const uni = unis.find((u) => u.slug === param(sp.uni)) ?? unis[0];
  const spot = (param(sp.spot) ?? "").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40);
  const url = `${await siteUrl()}/${uni.slug}${spot ? `?src=${spot}` : ""}`;
  const sources = await db.entrant.groupBy({
    by: ["universityId", "source"],
    where: { OR: [{ source: null }, { source: { not: "trip" } }] },
    _count: { _all: true },
    orderBy: { _count: { source: "desc" } },
  });
  const entered = await db.entrant.groupBy({ by: ["universityId", "source"], where: { enteredAt: { not: null } }, _count: { _all: true } });
  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <section className="panel p-5">
        <h2 className="display text-2xl">Make a poster code</h2>
        <form className="mt-4 flex flex-wrap items-end gap-3">
          <input type="hidden" name="tab" value="qr" />
          <label className="block">
            <span className="eyebrow">University</span>
            <select name="uni" defaultValue={uni.slug} className="field mt-1.5">
              {unis.map((u) => (
                <option key={u.id} value={u.slug}>{shortUniName(u.name)}</option>
              ))}
            </select>
          </label>
          <Field label="Spot" name="spot" defaultValue={spot} placeholder="library" />
          <button className="btn btn-lime btn-sm">Make code</button>
        </form>
        <div className="mt-6 flex flex-wrap items-center gap-5">
          <QrCode value={url} size={200} label={`QR code for ${url}`} />
          <div className="text-sm">
            <p className="font-bold break-all">{url}</p>
            <a href={`/admin/qr?uni=${uni.slug}&spot=${spot}`} className="btn btn-outline btn-sm mt-3">Download SVG</a>
          </div>
        </div>
      </section>
      <section>
        <h2 className="display text-2xl">Which spots work</h2>
        <p className="mt-1 text-sm text-bone/70">Giveaway sign-ups by where they came from.</p>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr>
              {["Uni", "From", "Signed up", "In the draws"].map((h) => (
                <th key={h} className={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sources.map((r) => (
              <tr key={`${r.universityId}-${r.source}`}>
                <td className={td}>{shortUniName(unis.find((u) => u.id === r.universityId)?.name ?? "")}</td>
                <td className={`${td} font-semibold`}>{r.source ?? "direct"}</td>
                <td className={td}>{r._count._all}</td>
                <td className={`${td} font-black`}>{entered.find((e) => e.universityId === r.universityId && e.source === r.source)?._count._all ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}


async function DemoTools() {
  const unis = await db.university.findMany({ orderBy: { name: "asc" } });
  return (
    <div className="max-w-2xl space-y-8">
      <section className="panel p-5">
        <h2 className="display text-2xl">Drain the counter</h2>
        <p className="mt-1 text-sm">Books made-up students so you can watch the bar go green → yellow → orange, hit the soft cap, then release the extra ten.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {unis.map((u) => (
            <form key={u.id} action={addDemoBookings}>
              <input type="hidden" name="universityId" value={u.id} />
              <input type="hidden" name="count" value="5" />
              <button className="btn btn-outline btn-sm">+5 bookings at {shortUniName(u.name)}</button>
            </form>
          ))}
        </div>
      </section>
      <section className="panel p-5">
        <h2 className="display text-2xl">Demo inbox</h2>
        <p className="mt-1 text-sm">Every email the site would send lands here instead.</p>
        <Link href="/demo/inbox" className="btn btn-outline btn-sm mt-4">Open inbox</Link>
      </section>
      <section className="panel border-orange p-5">
        <h2 className="display text-2xl">Reset everything</h2>
        <p className="mt-1 text-sm">Wipes all demo data and reseeds Exeter and Loughborough.</p>
        <form action={resetDemo}>
          <button className="btn btn-sm mt-4 border-orange bg-orange text-ink">Reset demo data</button>
        </form>
      </section>
    </div>
  );
}

function Field({ label, hint, ...rest }: { label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="eyebrow">{label}</span>
      <input className="field mt-1.5" {...rest} />
      {hint && <span className="mt-1 block text-xs text-bone/70">{hint}</span>}
    </label>
  );
}
