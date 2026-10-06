import { shortDate } from "@/lib/dates";

/**
 * The booking as a boarding pass. Unstamped at checkout, stamped BOOKED once
 * the deposit clears, so paying feels like getting your ticket.
 */
export function BoardingPass({
  passenger,
  from,
  to,
  departs,
  days,
  spot,
  of,
  code,
  daysToGo,
  booked,
}: {
  passenger: string;
  from: string;
  to: string;
  departs: Date;
  days: number;
  spot: number;
  of: number;
  code: string;
  daysToGo: number;
  booked?: boolean;
}) {
  // A flat, deterministic "barcode" from the passenger and spot.
  const seed = [...`${passenger}${spot}`].reduce((s, c) => s + c.charCodeAt(0), 0);
  const bars = Array.from({ length: 34 }, (_, i) => 1 + ((seed * (i + 7)) % 4));
  const preNight = new Date(departs.getTime() - 24 * 60 * 60 * 1000);

  return (
    <div className="relative">
      <article className="relative border-3 border-ink bg-paper text-ink shadow-[8px_8px_0_0_#ccff01]" aria-label={`Boarding pass: ${passenger}, ${from} to ${to}, departs ${shortDate(departs)}`}>
        <header className="flex items-center justify-between border-b-3 border-ink bg-lime px-4 py-2">
          <span className="eyebrow">Mad Monkey · Boarding pass</span>
          <span className="eyebrow">{code}</span>
        </header>
        <div className="px-4 pt-4 pb-5">
          <div className="grid grid-cols-[3.25rem_1fr] items-baseline gap-x-2 gap-y-1">
            <p className="eyebrow opacity-70">From</p>
            <p className="display text-[1.6rem] [overflow-wrap:anywhere]">{from}</p>
            <p className="eyebrow opacity-70">To</p>
            <p className="display text-[1.6rem] [overflow-wrap:anywhere]">{to}</p>
          </div>
          <dl className="mt-5 grid grid-cols-3 gap-3">
            <Field label="Passenger" value={passenger} wide />
            <Field label="Departs" value={shortDate(departs)} />
            <Field label="Days" value={`${days}`} />
            <Field label="Spot" value={`#${spot} of ${of}`} />
            <Field label="Pre-night" value={`${shortDate(preNight)}, free`} wide />
          </dl>
        </div>
        {/* Perforation, with the stub below. */}
        <div className="relative border-t-3 border-dashed border-ink">
          <span className="absolute -top-[14px] -left-[14px] size-6 rounded-full border-3 border-ink bg-ink" />
          <span className="absolute -top-[14px] -right-[14px] size-6 rounded-full border-3 border-ink bg-ink" />
        </div>
        <div className="flex items-center justify-between gap-4 px-4 py-4">
          <div aria-hidden className="flex h-12 items-stretch gap-[2px]">
            {bars.map((w, i) => (
              <span key={i} className="bg-ink" style={{ width: w }} />
            ))}
          </div>
          <div className="text-right">
            <p className="display text-4xl leading-none">{daysToGo}</p>
            <p className="eyebrow">days to go</p>
          </div>
        </div>
      </article>
      {booked && (
        <span className="display absolute right-3 bottom-24 -rotate-12 border-4 border-pink bg-paper/80 px-3 py-1 text-4xl text-pink" aria-hidden>
          Booked
        </span>
      )}
    </div>
  );
}

function Field({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <dt className="eyebrow opacity-70">{label}</dt>
      <dd className="truncate font-black uppercase">{value}</dd>
    </div>
  );
}
