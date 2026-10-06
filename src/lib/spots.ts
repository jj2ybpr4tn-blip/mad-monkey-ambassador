// Pure spots maths, shared by server pages and the animated board.

export type Tone = "green" | "yellow" | "orange";

export type Spots = {
  remaining: number;
  /** What the counter runs against: the soft cap, or the extra spots once they're released. */
  capacity: number;
  /** Spots drawn on the board: the soft cap, or the hard cap once released. */
  tiles: number;
  booked: number;
  fraction: number;
  released: boolean;
  tone: Tone;
};

/** Green to yellow to orange as it drains. */
export function toneFor(fraction: number): Tone {
  return fraction > 0.5 ? "green" : fraction > 0.2 ? "yellow" : "orange";
}

/** Counts DOWN from the soft cap. Releasing the hard cap resets the counter to the extra spots. */
export function spotsState(u: { softCap: number; hardCap: number; hardCapReleased: boolean }, booked: number): Spots {
  const capacity = u.hardCapReleased ? u.hardCap - u.softCap : u.softCap;
  const tiles = u.hardCapReleased ? u.hardCap : u.softCap;
  const remaining = Math.max(0, tiles - booked);
  const fraction = capacity > 0 ? Math.min(1, remaining / capacity) : 0;
  return { remaining, capacity, tiles, booked: Math.min(booked, tiles), fraction, released: u.hardCapReleased, tone: toneFor(fraction) };
}
