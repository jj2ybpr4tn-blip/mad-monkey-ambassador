"use client";

import { useEffect, useRef, useState } from "react";
import { toneFor, type Spots } from "@/lib/spots";

const TONE_BG = { green: "bg-green", yellow: "bg-yellow", orange: "bg-orange" } as const;

/**
 * The spots counter as a departure board: split-flap digits over a grid with
 * one square per spot, crossed off as they go. The first time it scrolls into
 * view it counts DOWN from full to what's left, so scarcity lands instantly.
 */
export function SpotsBoard({
  spots,
  eyebrow,
  heading,
  recent = 0,
  size = "lg",
  children,
}: {
  spots: Spots;
  eyebrow: string;
  heading?: string;
  recent?: number;
  size?: "lg" | "sm";
  children?: React.ReactNode;
}) {
  const { remaining, capacity, tiles, booked, released } = spots;
  const [shown, setShown] = useState(capacity);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        if (reduceMotion) return setShown(remaining);
        // About a second end to end, however many spots have gone.
        const gap = Math.max(30, Math.min(120, 1000 / Math.max(1, capacity - remaining)));
        let n = capacity;
        const tick = () => {
          n -= 1;
          setShown(n);
          if (n > remaining) timer = setTimeout(tick, gap);
        };
        setShown(n);
        if (n > remaining) timer = setTimeout(tick, 450);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      clearTimeout(timer);
    };
  }, [remaining, capacity]);

  const tone = toneFor(capacity > 0 ? shown / capacity : 0);
  const digits = String(shown).padStart(String(capacity).length, " ").split("");
  const full = shown === 0;
  const lg = size === "lg";

  return (
    <section ref={ref} aria-label={`${remaining} ${remaining === 1 ? "spot" : "spots"} left. ${eyebrow}`} className={`card relative ${lg ? "p-5" : "p-4"}`}>
      {released && (
        <span className="absolute -top-4 right-3 rotate-6 rounded-full border-3 border-ink bg-lime px-3 py-1 text-xs font-black uppercase">
          +{capacity} just released
        </span>
      )}
      {heading && (
        <div className="flex items-baseline justify-between gap-3">
          <p className="display min-w-0 text-[1.7rem]">{heading}</p>
          <span aria-hidden className="display shrink-0 text-2xl">→</span>
        </div>
      )}
      <p className={`eyebrow ${heading ? "mt-1" : ""}`}>{eyebrow}</p>

      <div aria-hidden className="mt-3 flex items-center gap-3">
        <span className={`flex gap-1 ${lg ? "text-[4.75rem]" : "text-[3.5rem]"}`}>
          {digits.map((d, i) => (
            <span key={`${i}-${d}`} className="flap">
              {d === " " ? " " : d}
            </span>
          ))}
        </span>
        <span className={`display leading-[0.95] ${lg ? "text-3xl" : "text-2xl"}`}>
          {full ? (
            "Sold out"
          ) : (
            <>
              {shown === 1 ? "Spot" : "Spots"}
              <br />
              left
            </>
          )}
        </span>
      </div>

      <div aria-hidden className={`relative mt-4 grid grid-cols-10 ${lg ? "gap-1.5" : "gap-1"}`}>
        {Array.from({ length: tiles }, (_, i) => (
          <span key={i} className={i < shown ? `spot ${TONE_BG[tone]}` : "spot spot-off"} />
        ))}
        {full && (
          <span className="display absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-6 border-3 border-ink bg-orange px-4 py-1 text-3xl shadow-[5px_5px_0_0_#0a0a0a]">
            Full
          </span>
        )}
      </div>

      <p className="mt-3 text-sm font-semibold">
        {booked} gone{recent > 0 && ` · ${recent} this week`}
      </p>
      {children}
    </section>
  );
}
