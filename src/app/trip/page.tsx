import Link from "next/link";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { longDate } from "@/lib/dates";
import { shortUniName } from "@/lib/site";
import { DEPOSIT_PENCE, gbp } from "@/lib/money";
import { bookedCount, recentBookedCount, spotsState, weeklyPrice } from "@/lib/trip";
import { Footer, Header } from "@/components/Chrome";
import { SpotsBoard } from "@/components/SpotsBoard";

// The uni trip site's front door: pick your uni, see the price and the spots
// straight away. The weekly figure is the hook, so it leads on every card.
export default async function TripHome() {
  await connection();
  const unis = await db.university.findMany({ where: { isLive: true }, orderBy: { name: "asc" } });
  const boards = await Promise.all(
    unis.map(async (u) => ({ u, spots: spotsState(u, await bookedCount(u.id)), recent: await recentBookedCount(u.id), weekly: weeklyPrice(u) })),
  );
  // The headline quotes the cheapest uni, and only claims "less than £10" while
  // that's true: the weekly figure climbs as departure nears.
  const cheapest = [...boards].sort((a, b) => a.weekly.pence - b.weekly.pence)[0];
  // Unis can run different trips, so only name the length when they all match.
  const days = boards.every((b) => b.u.days === boards[0].u.days) ? boards[0].u.days : null;

  return (
    <main className="mx-auto max-w-md px-4">
      <Header eyebrow="End-of-year uni trip" />
      <h1 className="display hero mt-8">
        {cheapest ? (
          <>
            {days ? `${days} days in Asia` : "The end-of-year trip"}, from{" "}
            <span className="bg-lime px-1.5 text-ink [box-decoration-break:clone]">{cheapest.weekly.hook}</span>.
          </>
        ) : (
          <>The end-of-year trip.</>
        )}
      </h1>
      <p className="mt-4 text-lg font-medium">
        Your uni, one trip, limited spots. {gbp(DEPOSIT_PENCE)} holds your spot and you pay the rest off weekly. Pick yours.
      </p>
      <ul className="mt-10 space-y-10">
        {boards.map(({ u, spots, recent, weekly }) => (
          <li key={u.id}>
            <Link href={`/trip/${u.slug}`} className="block transition-transform hover:-translate-y-1">
              <SpotsBoard
                spots={spots}
                heading={shortUniName(u.name)}
                eyebrow={`${u.destination} · ${u.days} days · ${longDate(u.departureDate)}`}
                recent={recent}
                size="sm"
              >
                <p className="mt-3 flex items-baseline gap-2 border-t-3 border-ink pt-3">
                  <span className="display text-4xl">{weekly.label}</span>
                  <span className="font-black uppercase">a week, all in</span>
                </p>
                <span className="btn btn-lime mt-3 w-full">See the trip →</span>
              </SpotsBoard>
            </Link>
          </li>
        ))}
      </ul>
      <Footer />
    </main>
  );
}
