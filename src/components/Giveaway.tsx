/* eslint-disable @next/next/no-img-element */
import { drawDate, longDate, termDrawDate, termFor } from "@/lib/dates";
import { ENTRY_VALUES } from "@/lib/giveaway";
import { PHOTOS, TRIPS } from "@/lib/prizes";
import { Starburst } from "./Starburst";

/** A tilted lime band of scrolling copy. Full-bleed: put it outside the page column. */
export function Ticker({ items }: { items: string[] }) {
  const run = items.flatMap((t, i) => [
    <span key={`t${i}`}>{t}</span>,
    <span key={`d${i}`} aria-hidden className="text-pink">●</span>,
  ]);
  return (
    <div className="relative z-10 -my-3 -rotate-2 border-y-3 border-ink bg-lime py-3 text-ink" aria-label={items.join(". ")}>
      <div className="overflow-hidden">
        <div className="marquee-track display gap-5 text-2xl whitespace-nowrap" aria-hidden>
          {/* Two copies so the loop is seamless. */}
          <span className="flex gap-5 pr-5">{run}</span>
          <span className="flex gap-5 pr-5">{run}</span>
        </div>
      </div>
    </div>
  );
}

/** The hero photo, polaroid style, with the termly prize carried on a starburst. */
export function HeroPhoto() {
  return (
    <div className="relative mx-auto mt-2 w-[88%] max-w-sm">
      <figure className="polaroid rotate-3">
        <img src={PHOTOS.volleyball.src} alt={PHOTOS.volleyball.alt} className="aspect-[4/3] w-full object-cover" />
        <figcaption className="mt-2 text-center text-xs font-bold tracking-wide text-ink uppercase">This could be your term break</figcaption>
      </figure>
      <div className="wobble absolute -top-10 -left-5">
        <Starburst size={128} rotate={0} bg="bg-pink">
          <span className="font-sticker text-3xl leading-none normal-case">WIN</span>
          <span className="mt-1 block text-[11px] leading-tight">
            a free trip
            <br />
            every term
          </span>
        </Starburst>
      </div>
    </div>
  );
}

/** Two ways to win: the monthly 7 nights and the termly trip. */
export function PrizeDuo() {
  const term = termFor();
  return (
    <div>
      <h2 className="display text-[2.6rem]">Two ways to win.</h2>
      <span className="bubble mt-3 bg-lime text-sm">one entry, both draws</span>
      <div className="mt-6 space-y-6">
        <section className="tile bg-pink p-5 text-ink">
          <p className="eyebrow">Every month</p>
          <p className="display mt-2 text-5xl">7 free nights.</p>
          <p className="mt-2 font-semibold">At Mad Monkey. A new winner every month.</p>
          <p className="mt-4 inline-block bg-ink px-3 py-1.5 text-sm font-black text-pink uppercase">Next draw {longDate(drawDate())}</p>
        </section>
        <section className="tile bg-cyan p-5 text-ink">
          <p className="eyebrow">Every term</p>
          <p className="display mt-2 text-5xl">A free trip. Any trip.</p>
          <p className="mt-2 font-semibold">Pick any Mad Monkey trip. Yes, any.</p>
          <p className="mt-4 inline-block bg-ink px-3 py-1.5 text-sm font-black text-cyan uppercase">Next draw {longDate(termDrawDate(term.key))}</p>
        </section>
      </div>
    </div>
  );
}

const TRIP_COLOURS = ["bg-yellow", "bg-cyan", "bg-lime", "bg-pink"];

/** Every trip the termly winner can pick, as swipeable property-style cards. */
export function TripCarousel() {
  return (
    <div>
      <h2 className="display text-[2.6rem]">Win any of these.</h2>
      <p className="mt-2 font-medium">Swipe. Pick the one you&apos;d go on.</p>
      <ul className="no-scrollbar -mx-4 mt-6 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pt-1 pb-6">
        {TRIPS.map((t, i) => (
          <li key={t.name} className="w-64 shrink-0 snap-start">
            <article className="h-full border-3 border-ink bg-paper text-ink shadow-[8px_8px_0_0_#ccff01]">
              <div className="relative h-40 overflow-hidden border-b-3 border-ink">
                <img src={PHOTOS[t.photo].src} alt={PHOTOS[t.photo].alt} className="absolute inset-0 h-full w-full object-cover" />
                <span className={`display absolute bottom-0 left-0 border-t-3 border-r-3 border-ink px-3 py-1 text-xl ${TRIP_COLOURS[i % TRIP_COLOURS.length]}`}>
                  {t.days ? `${t.days} days` : "New for 2027"}
                </span>
              </div>
              <div className="p-4">
                <p className="display text-3xl">{t.name}</p>
                <p className="mt-2 text-sm font-medium">{t.route ?? "Route dropping soon."}</p>
              </div>
            </article>
          </li>
        ))}
      </ul>
      <p className="text-sm font-medium opacity-80">Flights and insurance not included. Everything on the ground is.</p>
    </div>
  );
}

const STACK = [
  { n: ENTRY_VALUES.verified, what: "Get in", how: "Your WhatsApp and one tap. That's it.", bg: "bg-lime" },
  { n: ENTRY_VALUES.referral, what: "Every mate", how: "Who gets in on your link. No limit.", bg: "bg-pink" },
  { n: ENTRY_VALUES.follow, what: "Follow us", how: "Add your Instagram after. We check the winner.", bg: "bg-cyan" },
  { n: ENTRY_VALUES.story, what: "Every week", how: "Share our post to your story.", bg: "bg-lime" },
];

/** How to stack up entries, as four loud tiles. */
export function StackEntries() {
  return (
    <div>
      <h2 className="display text-[2.6rem]">Stack your entries.</h2>
      <p className="mt-2 font-medium">More entries, more chances. Every one counts in both draws.</p>
      <ul className="mt-6 grid grid-cols-2 gap-4">
        {STACK.map((s) => (
          <li key={s.what} className={`${s.bg} min-w-0 border-3 border-ink p-4 break-words text-ink shadow-[6px_6px_0_0_#f5efe2]`}>
            <p className="display text-5xl">+{s.n}</p>
            <p className="mt-2 font-black uppercase leading-tight">{s.what}</p>
            <p className="mt-1 text-sm font-medium leading-snug">{s.how}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
