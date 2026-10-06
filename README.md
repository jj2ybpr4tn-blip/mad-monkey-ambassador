# Mad Monkey ambassador sites: working demo

Two sites in one project, sharing one list of people:

- **Giveaway site** (`/`, `/exeter`): "Want to win a free trip to SE Asia?" The big one. Ambassador story links and campus QR codes land here. Uni students give **just their WhatsApp number**, verify it with one tap (a pre-written WhatsApp message), and are in two draws: **7 free nights every month** and **a free trip of their choice every term**. More entries for mates who get in on their link (+5); adding Instagram afterwards unlocks follow (+1) and a weekly story share (+3).
- **Uni trip site** (`/trip`, `/trip/exeter`): the end-of-year trip for students who want to go. Spots counter, payment plans, £50 deposit, mates ladder. Anyone at the uni can book, with or without entering the giveaway.

In production these become two subdomains (for example win.madmonkeyhostels.com and trip.madmonkeyhostels.com) pointing at the same app and database.

It runs locally with seed data and **no outside accounts**: email, WhatsApp, Instagram and Stripe are stubbed. It is for the team to review, not to ship as is.

## Run it

```bash
npm install
cp .env.example .env
npm run db:setup   # creates the SQLite database and seeds Exeter + Loughborough
npm run dev        # http://localhost:3100
```

## Try it

| Page | What to do |
| --- | --- |
| `/exeter?src=library` | Enter the giveaway as if from the library poster: one WhatsApp box. |
| `/verify/whatsapp` | The one-tap WhatsApp verify (simulated in the demo, including the WhatsApp profile name). |
| `/exeter/me` | Monthly and termly entries, optional Instagram, weekly story share, share link and QR code. |
| `/exeter?r=CODE` | Your share link. Sign up as a mate and verify: you get +5. |
| `/trip`, `/trip/exeter` | The trip site. Book with your details, pay the demo deposit, see the mates ladder. |
| `/admin` | Universities, entrants (with verification status and source) + CSV, monthly and termly draws, bookings, leaderboards, poster QR codes, demo tools. |
| `/demo/inbox` | Every email the site would have sent. |

## Giveaway rules in the code

| Rule | File |
| --- | --- |
| In the draws once the WhatsApp number is verified | `src/lib/giveaway.ts` (`verifyWhatsApp`) |
| One person per WhatsApp number (and per Instagram account, if added) | `src/lib/giveaway.ts`, `src/app/[uni]/actions.ts` |
| Standing entries (verified, follow) count in every draw; earned ones (mates, story) in the month and term they were earned | `src/lib/giveaway.ts` (`tally`, `drawSnapshot`) |
| Story shares: +3, once a week | `src/lib/giveaway.ts` (`recordStoryShare`) |
| Term dates (placeholders) | `src/lib/dates.ts` (`TERMS`) |
| Poster QR codes and source tracking (`?src=`) | `src/app/admin/page.tsx`, `src/proxy.ts` |

## Verification in production

- **WhatsApp (the only required step):** Mad Monkey's WhatsApp Business number (Cloud API or Twilio). The verify button opens WhatsApp with `VERIFY <code>` ready to send; the webhook calls `verifyWhatsApp` with the sender's number and WhatsApp profile name (that's where names come from). Reply with their link straight away. Set `MM_WHATSAPP_NUMBER`.
- **Instagram (optional):** entrants add their handle after sign-up. Instagram's story-mention webhook (or ManyChat) calls `recordStoryShare` for that handle, which also proves it's theirs. Follows can't be checked automatically, so they're checked by hand for winners only.
- Students can only reshare a story they're tagged in, so ambassadors should post a Reel or post each week for students to share.
- **Email:** only the trip site uses it (booking confirmations). Swap `src/lib/mail.ts` for a real provider.

## Open questions

- **Thailand and Laos trips:** shown as "new for 2027" with no route yet. Add days and route in `src/lib/prizes.ts` once they're published.
- **WhatsApp marketing:** entering now includes agreeing to WhatsApp messages about trips and events (in the T&Cs, with "reply STOP"). UK data law usually needs marketing consent to be a separate, optional choice, so the lawyer should check this before launch.
- **Age:** the single T&Cs box reads "I'm 18+ and I've read the T&Cs", so there's still a record that each entrant confirmed their age.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind 4 · Prisma 6 on SQLite.
Swap `provider = "sqlite"` for `"postgresql"` in `prisma/schema.prisma` and set
`DATABASE_URL` to move to Postgres.

## Where the spec lives in the code

| Rule | File |
| --- | --- |
| Entries are a ledger, confirmed by double opt-in | `src/lib/giveaway.ts` |
| Referral codes (6 chars, no O/0/I/1), 30-day first-touch cookie | `src/lib/codes.ts`, `src/proxy.ts` |
| Anti-gaming: Gmail normalising, disposable domains, IP rate limit, self-referral | `src/app/[uni]/actions.ts`, `src/lib/validate.ts` |
| Spots counter counts down; hard cap release | `src/lib/trip.ts` (`spotsState`) |
| Payment plans all end 30 days before departure; instalments are recalculated from the day each person books, so the weekly and monthly figures rise on their own as departure gets closer | `src/lib/plans.ts`, `src/lib/dates.ts` |
| Trip referral ladder; discounts off the balance, never the deposit; refunds drop the rung | `src/lib/trip.ts` (`recalcBooking`) |
| Weighted, seeded, reproducible draw with snapshot | `src/lib/draw.ts`, `src/app/admin/actions.ts` |

## Changed since the spec doc

- **Trip referrals:** every mate who books gets £15 off. The booker's ladder is 1 mate free-flow drinks voucher on arrival night, 2 mates 10% off food and drink, 3 mates £30 off, 4 mates £60 off. Nothing above 4. Whoever brings the most at each uni goes free. Cash rungs were given in dollars ($50, $100); converted at the spec's 1.27 rate they were £40 and £80 against a £475 trip, and they were re-scaled to £30 and £60 (same share of the trip, rounded down to the nearest £5) when the price moved to £365. **Re-scale them again if the price moves** — they live in `LADDER` in `src/lib/trip.ts`, and the mate's own £15 is `FRIEND_DISCOUNT_PENCE` in `src/lib/money.ts`.
- **Spots counter** shows from the first page (pick your uni, and each uni's sign-up page), not only after sign-up.
- **Giveaway asks for one thing:** a WhatsApp number. Their name arrives with the message they send to verify, so it's never typed. Instagram is an optional extra afterwards for more entries.
- **Booking asks only for the gaps.** A booking needs a full name for the passenger list and an email for the ticket; the WhatsApp number is only asked for when we don't already hold it, so a giveaway entrant who books types one field. The 18+ and terms tick boxes are now a line of text under the Pay button.
- **Trip highlights are ordered for uni students:** the boat party, Nestival, fireshows and the pub crawl lead; Angkor Wat, the floating village and S21 sit behind them. The order lives in `highlights` in `src/lib/itineraries.ts`, and the first four are also the chips on the checkout page. The day-by-day stays in real date order.
- **Every uni runs its own trip.** Destination, route, days, departure date, price, caps, ambassador and live/not-live are all per university and all editable in Admin → Universities, so two unis can go to different places on different dates at different prices. Where they share a destination they share one itinerary by default; `itineraryKey` on `University` overrides that, so a second Cambodia uni can have its own version. The itineraries themselves live in `src/lib/itineraries.ts` and are the one thing that still needs a developer — **only Cambodia is written so far**, pulled from Mad Monkey's own trip page. A uni on any other destination shows "details coming once the trip's locked in" and everything else on the page still works.
- **The weekly price is the hook, everywhere.** It leads the front door headline, every uni card, the trip headline, the ticker and the pay block. It is never hard-coded: `weeklyPrice()` in `src/lib/trip.ts` works it out from the day you ask, so it climbs on its own as departure nears and the "under a tenner a week" line stops being said the moment it stops being true. Under £10 the pence are kept (£9.85 is the point); above it the figure rounds up so the headline never promises less than they'll pay.
- **Price reads as what they pay, not the total.** The deposit and the weekly figure lead; the full price sits underneath with a per-day figure. The number itself is set per uni in Admin → Universities.

## Stubbed or missing: needed before launch

- **Email.** `src/lib/mail.ts` writes to an outbox table. Swap for a real provider.
- **Stripe.** `/checkout/[id]` is a fake page. Replace with Stripe Checkout for the deposit and subscriptions or scheduled payment intents for instalments, on Mad Monkey's account. The success handler is `payDeposit` in `src/app/checkout/[id]/actions.ts`.
- **Browser fingerprint** for self-referral is not built. Only same email and same IP are checked.
- **IP checks are skipped on localhost** so the demo can be clicked through from one machine.
- **Admin auth** is one shared password in an env var. Fine for a concept only.
- **Logo** loads from design.madmonkeyhostels.com. Put the official file in `/public` for production.
- **Terms page** is placeholder wording. Mad Monkey writes and signs off the real terms.
- **No booking cut-off.** Nothing stops a booking being taken after the final balance date, or after departure: the plan picker just collapses to a single payment of the whole balance. The only way to close a trip today is to untick "Live" in Admin → Universities. Decide the cut-off (last sign-up date, and whether instalments stop being offered before that) and enforce it in `startBooking`.
- **No instalment floor.** As departure nears, the weekly figure climbs on its own. Decide whether a plan should disappear once each payment passes some amount, rather than offering "£200 a week × 2".
- **Koh Rong boat party photo** is a stand-in (a Koh Rong sea shot). Swap in a real boat party picture. The Nestival and pub crawl photos are real ones pulled from Mad Monkey's own tour pages (`/tours/P8AZJ0/…` and `/tours/PJDUEJ/…` on the WordPress CDN); for production, copy every photo into `/public` rather than hotlinking.
- **Open questions** from the spec still apply: land-only pricing (shown as "Flights not included", from the trip data), the refund policy, the maximum discount per booking (currently capped at the full balance) and the monthly giveaway prize.
