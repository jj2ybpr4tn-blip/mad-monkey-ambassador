import { LADDER, nextRung } from "@/lib/trip";

/** The trip referral ladder. Every rung shows the next one; the top prize is most mates. */
export function Ladder({
  mates,
  showProgress,
  uniName,
  leader,
}: {
  mates: number;
  showProgress?: boolean;
  uniName: string;
  leader?: { name: string; mates: number };
}) {
  const next = nextRung(mates);
  return (
    <div>
      {showProgress && (
        <p className="mb-4 text-lg font-semibold">
          {mates === 0 ? "No mates booked yet." : `${mates} ${mates === 1 ? "mate has" : "mates have"} booked on your link.`}{" "}
          <span className="text-lime">
            {next
              ? `${next.mates - mates} more and you get ${next.you.charAt(0).toLowerCase()}${next.you.slice(1)}.`
              : `Ladder done. Now go for the top spot at ${uniName}.`}
          </span>
        </p>
      )}
      <ol className="space-y-2.5">
        {LADDER.map((r) => {
          const reached = mates >= r.mates;
          const isNext = next?.mates === r.mates;
          return (
            <li
              key={r.mates}
              className={`flex items-center gap-3 border-3 p-3 ${reached ? "border-lime bg-lime text-ink" : isNext ? "border-lime" : "border-bone/40"}`}
            >
              <span className={`display grid size-11 shrink-0 place-content-center rounded-full text-2xl ${reached ? "bg-ink text-lime" : "bg-bone text-ink"}`}>{r.mates}</span>
              <span className="flex-1">
                <span className="block font-black uppercase leading-tight">{r.you}</span>
                <span className={`text-sm font-medium ${reached ? "" : "text-bone/70"}`}>
                  {r.mates} {r.mates === 1 ? "mate books" : "mates book"}
                </span>
              </span>
              {isNext && <span className="eyebrow text-lime">Next</span>}
              {reached && <span className="eyebrow">Done</span>}
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-sm text-bone/70">You keep every perk on the way up.</p>
      <div className="mt-6 bg-lime p-4 text-ink">
        <p className="display text-3xl">Most mates goes free.</p>
        <p className="mt-1 font-semibold">Whoever brings the most mates at {uniName} gets their trip free.</p>
        {leader && (
          <p className="mt-2 text-sm font-bold">
            Top now: {leader.name} with {leader.mates}.
          </p>
        )}
      </div>
    </div>
  );
}
