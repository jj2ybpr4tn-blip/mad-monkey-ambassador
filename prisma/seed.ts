import { seedDemo } from "../src/lib/seed";
import { db } from "../src/lib/db";

/**
 * Seeds demo data. Runs on every deploy, so it stops when the database already
 * has universities in it: a redeploy must never wipe entries people have made.
 * Set FORCE_SEED=1 to reseed on purpose.
 */
async function main() {
  if (process.env.FORCE_SEED !== "1" && (await db.university.count()) > 0) {
    console.log("Database already seeded, leaving it alone.");
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
