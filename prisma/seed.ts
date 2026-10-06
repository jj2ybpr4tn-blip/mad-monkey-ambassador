import { seedDemo } from "../src/lib/seed";
import { db } from "../src/lib/db";

seedDemo()
  .then(() => console.log("Seeded demo data."))
  .finally(() => db.$disconnect());
