import type { Spots } from "@/lib/spots";

const TONE = { green: "bg-green", yellow: "bg-yellow", orange: "bg-orange" } as const;

/** Counts down, never up: a bar that drains from full to empty. */
export function SpotsBar({ spots, size = "lg" }: { spots: Spots; size?: "lg" | "sm" }) {
  const full = spots.remaining === 0;
  return (
    <div>
      {spots.released && !full && <p className="eyebrow mb-1 text-lime">Extra spots released</p>}
      <p className={`display whitespace-nowrap ${size === "lg" ? "text-4xl" : "text-2xl"}`}>
        {full ? "FULL" : spots.remaining}
        {!full && <span className={size === "lg" ? "text-xl" : "text-base"}> {spots.remaining === 1 ? "spot" : "spots"} left</span>}
      </p>
      <div className={`mt-2 border-3 border-bone ${size === "lg" ? "h-6" : "h-4"}`} role="meter" aria-valuemin={0} aria-valuemax={spots.capacity} aria-valuenow={spots.remaining} aria-label="Spots left">
        <div className={`h-full ${TONE[spots.tone]}`} style={{ width: `${spots.fraction * 100}%` }} />
      </div>
    </div>
  );
}
