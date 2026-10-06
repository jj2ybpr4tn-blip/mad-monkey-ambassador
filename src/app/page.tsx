import Link from "next/link";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { shortUniName } from "@/lib/site";
import { Footer, Header } from "@/components/Chrome";
import { HeroPhoto, PrizeDuo, StackEntries, Ticker, TripCarousel } from "@/components/Giveaway";

// The giveaway site's front door. Most people skip it: story links and QR codes go straight to their uni.
export default async function GiveawayHome() {
  await connection();
  const unis = await db.university.findMany({ where: { isLive: true }, orderBy: { name: "asc" } });
  return (
    <main className="overflow-x-clip">
      <section className="rays pb-14">
        <div className="mx-auto max-w-md px-4">
          <Header eyebrow="Mad Monkey giveaways" />
          <div className="mt-12">
            <HeroPhoto />
          </div>
          <h1 className="display hero mt-12">
            Want to win a <span className="bg-lime px-1.5 text-ink [box-decoration-break:clone]">free trip</span> to SE Asia?
          </h1>
          <p className="mt-5 text-lg font-medium">Free to enter. Pick your uni to start.</p>
          <ul className="mt-7 space-y-4">
            {unis.map((u) => (
              <li key={u.id}>
                <Link href={`/${u.slug}#enter`} className="btn btn-lime w-full justify-between text-lg">
                  <span>{shortUniName(u.name)}</span>
                  <span aria-hidden>→</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Ticker items={["7 free nights every month", "A free trip every term", "Free to enter", "All in"]} />

      <section className="on-bone dots pt-16 pb-14">
        <div className="mx-auto max-w-md px-4">
          <PrizeDuo />
        </div>
      </section>
      <section className="py-14">
        <div className="mx-auto max-w-md px-4">
          <TripCarousel />
        </div>
      </section>
      <section className="rays py-14">
        <div className="mx-auto max-w-md px-4">
          <StackEntries />
        </div>
      </section>
      <div className="mx-auto max-w-md px-4">
        <Footer />
      </div>
    </main>
  );
}
