/* eslint-disable @next/next/no-img-element */
import type { Itinerary } from "@/lib/itineraries";
import { Starburst } from "./Starburst";

/** The trip's hero photo as a tilted polaroid, with one starburst carrying the headline perk. */
export function TripPhoto({ src, alt, caption }: { src: string; alt: string; caption: string }) {
  return (
    <div className="relative mx-auto w-[88%] max-w-sm">
      <figure className="polaroid -rotate-2">
        <img src={src} alt={alt} className="aspect-[4/3] w-full object-cover" />
        <figcaption className="mt-2 text-center text-xs font-bold tracking-wide text-ink uppercase">{caption}</figcaption>
      </figure>
      <div className="wobble absolute -top-10 -right-5">
        <Starburst size={132} rotate={0}>
          <span className="font-sticker text-[15px] leading-none normal-case">NESTIVAL</span>
          <span className="mt-1 block text-[11px] leading-tight">ticket included</span>
        </Starburst>
      </div>
    </div>
  );
}

/** Everything the deposit pays for: snapshot, route, highlights, day by day, in and out. */
export function TripDetails({ it, days }: { it: Itinerary; days: number }) {
  return (
    <div>
      <h2 className="display text-[2.6rem]">What you&apos;re paying for.</h2>
      <p className="mt-3 text-lg font-medium leading-snug">{it.pitch}</p>

      {/* auto-rows-fr keeps all four tiles the same height when a label wraps. */}
      <ul className="mt-8 grid auto-rows-fr grid-cols-2 gap-3">
        <Stat big={`${days}`} label="days" bg="bg-lime" />
        {/* Counted from the plan, so it stays true if the itinerary changes. */}
        <Stat big={`${it.days.reduce((n, d) => n + (d.included?.length ?? 0), 0)}`} label="parties & activities" bg="bg-pink" />
        <Stat big={`${it.stops.filter((s) => s.name !== "Sleeper bus").length}`} label="stops" bg="bg-cyan" />
        <Stat big="0" label="planning" bg="bg-yellow" />
      </ul>

      <Route stops={it.stops} />

      <h3 className="display mt-14 text-3xl">The big ones.</h3>
      <ul className="no-scrollbar -mx-4 mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pt-1 pb-5">
        {it.highlights.map((h, i) => (
          <li key={h.name} className="w-56 shrink-0 snap-start">
            <figure className="tile h-full bg-paper">
              <div className={`relative aspect-[4/3] border-b-3 border-ink ${h.photo ? "" : ["bg-pink", "bg-cyan", "bg-lime"][i % 3]}`}>
                {h.photo ? (
                  <img src={h.photo} alt={h.name} className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <span className="display absolute inset-0 grid place-content-center px-3 text-center text-2xl break-words">{h.name}</span>
                )}
                <span className="bubble absolute bottom-2 left-2 bg-lime px-2.5 py-0.5 text-[11px]">included</span>
              </div>
              {/* With no photo the name is already big across the tile, so don't say it twice. */}
              <figcaption className="p-3 font-black uppercase leading-tight">{h.photo ? h.name : "In the price."}</figcaption>
            </figure>
          </li>
        ))}
      </ul>

      <h3 className="display mt-12 text-3xl">Day by day.</h3>
      <p className="mt-1 text-sm font-medium opacity-70">Tap a day to see what&apos;s on.</p>
      <ol className="mt-5 space-y-2.5">
        {it.days.map((d) => (
          <li key={d.day}>
            <details className="group border-3 border-ink bg-paper open:shadow-[6px_6px_0_0_#0a0a0a]">
              <summary className="flex cursor-pointer list-none items-center gap-3 p-3 [&::-webkit-details-marker]:hidden">
                <span className="display grid size-11 shrink-0 place-content-center bg-ink text-lg text-lime">{d.day}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-black uppercase leading-tight">{d.place}</span>
                  <span className="block truncate text-sm font-medium opacity-70 group-open:hidden">{d.line}</span>
                </span>
                <span aria-hidden className="display text-2xl transition-transform group-open:rotate-45">+</span>
              </summary>
              <div className="border-t-3 border-ink p-3">
                <p className="font-medium">{d.line}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {d.transport && <Chip bg="bg-cyan">{d.transport}</Chip>}
                  {d.included?.map((x) => (
                    <Chip key={x} bg="bg-lime">{x}</Chip>
                  ))}
                  {d.meals?.map((x) => (
                    <Chip key={x} bg="bg-yellow">{x}</Chip>
                  ))}
                </div>
              </div>
            </details>
          </li>
        ))}
      </ol>
      <p className="mt-3 flex flex-wrap gap-1.5 text-xs font-bold">
        <Chip bg="bg-cyan">Transport</Chip>
        <Chip bg="bg-lime">Included</Chip>
        <Chip bg="bg-yellow">Food and drink</Chip>
      </p>

      <div className="mt-12 grid gap-5">
        <section className="tile bg-lime p-5">
          <h3 className="display text-3xl">In.</h3>
          <ul className="mt-3 space-y-2 font-semibold">
            {it.included.map((x) => (
              <li key={x} className="flex gap-2">
                <span aria-hidden className="font-black">✓</span>
                <span>{x}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="tile bg-paper p-5">
          <h3 className="display text-3xl">Not in.</h3>
          <ul className="mt-3 space-y-2 font-semibold">
            {it.notIncluded.map((x) => (
              <li key={x} className="flex gap-2">
                <span aria-hidden className="font-black">✕</span>
                <span>{x}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <dl className="mt-8 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="eyebrow">Vibe</dt>
          <dd className="font-semibold">{it.vibe}</dd>
        </div>
        <div>
          <dt className="eyebrow">Fitness</dt>
          <dd className="font-semibold">{it.physical}</dd>
        </div>
      </dl>
    </div>
  );
}

function Stat({ big, label, bg }: { big: string; label: string; bg: string }) {
  return (
    <li className={`${bg} border-3 border-ink p-3`}>
      <p className="display text-5xl">{big}</p>
      <p className="font-black uppercase">{label}</p>
    </li>
  );
}

/** The route as stops on a line, with nights at each. */
function Route({ stops }: { stops: Itinerary["stops"] }) {
  return (
    <div className="mt-12">
      <h3 className="display text-3xl">The route.</h3>
      <ol className="relative mt-5 ml-4 border-l-3 border-dashed border-ink pl-7">
        {stops.map((s) => {
          const bus = s.name === "Sleeper bus";
          return (
            <li key={s.name} className="relative pb-6 last:pb-0">
              <span className={`absolute top-0.5 -left-[42px] size-6 rounded-full border-3 border-ink ${bus ? "bg-paper" : "bg-pink"}`} />
              <p className={`display leading-none ${bus ? "text-lg opacity-70" : "text-3xl"}`}>{s.name}</p>
              <p className="mt-1 text-sm font-bold">
                {s.nights} {s.nights === 1 ? "night" : "nights"}
                {bus && " on the overnight VIP sleeper"}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Chip({ bg, children }: { bg: string; children: React.ReactNode }) {
  return <span className={`${bg} rounded-full border-2 border-ink px-2.5 py-0.5 text-xs font-bold text-ink`}>{children}</span>;
}
