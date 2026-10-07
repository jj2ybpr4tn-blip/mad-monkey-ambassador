import { seedDemo, syncTrips } from "../src/lib/seed";
import { db } from "../src/lib/db";

/**
 * Runs on every deploy.
 *
 * An empty database gets the full demo data. A database that already has
 * universities only gets its trips re-synced, so a redeploy updates where each
 * uni is going without wiping entries people have made. FORCE_SEED=1 reseeds
 * from scratch on purpose.
 */
async function main() {
  if (process.env.FORCE_SEED !== "1" && (await db.university.count()) > 0) {
    await syncTrips();
    console.log("Already seeded. Trips re-synced, entries left alone.");
    return;
  }
  await seedDemo();
  console.log("Seeded demo data.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
