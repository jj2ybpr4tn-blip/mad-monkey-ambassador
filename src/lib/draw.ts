import { createHash, randomBytes } from "node:crypto";

export type SnapshotRow = { id: string; name: string; entries: number };

/** Deterministic PRNG from a seed string, so a draw can be re-run and proved. */
function seededRandom(seed: string) {
  let a = createHash("sha256").update(seed).digest().readUInt32LE(0);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function newSeed() {
  return randomBytes(8).toString("hex");
}

/**
 * Weighted pick: a cumulative sum over entry counts and one random number.
 * Eleven entries is eleven times the chance of one. No duplicated rows.
 */
export function pickWinner(snapshot: SnapshotRow[], seed: string): SnapshotRow | null {
  const total = snapshot.reduce((sum, r) => sum + r.entries, 0);
  if (total === 0) return null;
  const target = Math.floor(seededRandom(seed)() * total);
  let running = 0;
  for (const row of snapshot) {
    running += row.entries;
    if (target < running) return row;
  }
  return snapshot[snapshot.length - 1];
}
