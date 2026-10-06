import { Footer, Header } from "@/components/Chrome";

// Placeholder structure only. Mad Monkey drafts and signs off the real wording, and a lawyer reads it before launch.
const DRAW_TERMS = [
  "Two prize draws: monthly (7 free nights at Mad Monkey) and termly (one free Mad Monkey trip of the winner's choice).",
  "Who can enter: 18 and over, a current student at a participating university, UK resident. By entering, you confirm you're 18 or over and accept these terms.",
  "Entry is free and no purchase is necessary. The free route is the same route everyone uses.",
  "To enter, give your UK WhatsApp number and verify it by sending us one WhatsApp message. You're in both draws once it's verified. One entry per person and per WhatsApp number.",
  "How entries are earned: 1 for verifying your WhatsApp, 5 for each friend who enters on your link and verifies theirs, and, if you add your Instagram, 1 for following @madmonkeyhostels and 3 for sharing the weekly post to your story with @madmonkeyhostels tagged (once a week). Bonus entries may be checked and voided if they cannot be confirmed.",
  "Standing entries (verified and follow) count in every draw. Other entries count in the month and term they were earned.",
  "The monthly draw closes at 23:59 on the last day of each month. The termly draw closes at 23:59 on the last day of term: [term dates].",
  "Winners are picked at random, weighted by entries, contacted on WhatsApp, and have [X] days to reply.",
  "7 free nights: [which hostels, room type, dates and blackout periods]. Free trip: any scheduled Mad Monkey trip (currently Indonesia, Vietnam, Cambodia, Thailand and Laos), to be taken by [date]. Flights and travel insurance are not included.",
  "By entering, you agree that Mad Monkey can message you on WhatsApp about this giveaway and about Mad Monkey trips and events. Reply STOP at any time.",
  "No cash alternative. The promoter may substitute a prize of equal or greater value.",
  "Promoter: [Mad Monkey entity name and address].",
  "This promotion is not sponsored, endorsed or administered by, or associated with, Instagram. Entrants release Instagram from any liability.",
];

const BOOKING_TERMS = [
  "A £50 deposit secures a place. The balance is due 30 days before departure, whichever payment plan you choose.",
  "Referral discounts come off the balance, never the deposit. They are provisional until the final balance date and are recalculated against bookings that are confirmed and not refunded.",
  "Referral discounts do not stack with any other offer. There is a maximum total discount per booking.",
  "Cancellations and refunds: [to be confirmed by Mad Monkey].",
];

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-md px-4">
      <Header />
      <p className="mt-4 border-3 border-dashed border-bone p-3 text-sm font-semibold">Draft for the demo. Mad Monkey writes and signs off the real terms.</p>
      <h1 className="display mt-8 text-5xl">The terms.</h1>
      <h2 className="display mt-10 text-2xl text-lime">Prize draw</h2>
      <ol className="mt-4 list-decimal space-y-3 pl-5 font-medium">
        {DRAW_TERMS.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ol>
      <h2 className="display mt-10 text-2xl text-lime">Trip booking</h2>
      <ol className="mt-4 list-decimal space-y-3 pl-5 font-medium">
        {BOOKING_TERMS.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ol>
      <h2 className="display mt-10 text-2xl text-lime">Your data</h2>
      <p className="mt-4 font-medium">
        For the giveaway we only ask for your WhatsApp number (plus your Instagram, if you choose to add it). Entering includes WhatsApp messages from Mad Monkey about the giveaway, trips and events; reply STOP any time. To delete your data, email [privacy contact]. Full privacy policy: [link].
      </p>
      <Footer />
    </main>
  );
}
