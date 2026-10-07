// What each trip actually includes, keyed by destination. Taken from Mad Monkey's
// own trip pages (madmonkeyhostels.com/all-in-trips). A uni whose destination has
// no entry here shows "details coming once the trip's locked in".

const ASSETS = "https://madmonkeyhostels.com/all-in-trips/assets";
// Mad Monkey's own photo library, behind the hostel and tour pages.
const CDN = "https://madmonkey-wp.sgp1.cdn.digitaloceanspaces.com";

export type Day = {
  day: number;
  place: string;
  line: string;
  included?: string[];
  meals?: string[];
  transport?: string;
};

export type Itinerary = {
  tripCode: string;
  hero: { src: string; alt: string };
  pitch: string;
  vibe: string;
  physical: string;
  stops: { name: string; nights: number }[];
  highlights: { name: string; photo?: string }[];
  included: string[];
  notIncluded: string[];
  days: Day[];
  source: string;
};

export const ITINERARIES: Record<string, Itinerary> = {
  Cambodia: {
    tripCode: "CAM07",
    // A night out leads: it's what sells a uni trip. The aerial beach shot this
    // replaced now sits on the Koh Sdach card further down.
    hero: { src: `${CDN}/tours/PJDUEJ/1788355594683-3.jpg`, alt: "A big group on the Mad Monkey Siem Reap pub crawl, drinks up under the neon" },
    pitch:
      "Pool parties in Phnom Penh, the messiest pub crawl in Siem Reap, then a week on the islands: boat party, beach raves till sunrise, your own private beach. The temples and the history are in there too, for the mornings you fancy it.",
    vibe: "High energy and social",
    physical: "Light to moderate. Some hangovers, some sunrise raves.",
    stops: [
      { name: "Phnom Penh", nights: 3 },
      { name: "Siem Reap", nights: 3 },
      { name: "Sleeper bus", nights: 1 },
      { name: "Koh Rong", nights: 4 },
      { name: "Koh Sdach", nights: 3 },
    ],
    // Order matters: this is a uni trip, so the nights out lead and the temples
    // and history sit behind them. The first four also become the checkout chips.
    highlights: [
      // Placeholder photo: a Koh Rong sea shot until a real boat party picture lands.
      { name: "Koh Rong boat party", photo: `${ASSETS}/kh-kohrong-BmZ3gEHl.jpg` },
      { name: "Nestival beach and jungle rave", photo: `${CDN}/tours/P8AZJ0/1785981805804-3.JPEG` },
      { name: "The Siem Reap pub crawl", photo: `${CDN}/tours/PJDUEJ/1788355593509-2.jpg` },
      { name: "Private beach, Koh Sdach", photo: `${ASSETS}/preview-kh-hero-Dpe96RL9.jpg` },
      { name: "Angkor Wat at sunrise", photo: `${ASSETS}/kh-hl-angkor-DCgzjoKR.jpg` },
      { name: "Floating village", photo: `${ASSETS}/kh-hl-floating-B0OfZikr.jpg` },
      { name: "S21 and the Killing Fields", photo: `${ASSETS}/kh-hl-s21-COUAyy5j.jpg` },
      { name: "Beach fireshows and free-flow drinks", photo: `${ASSETS}/kh-hl-fireshow-Luw36gVt.jpg` },
    ],
    included: [
      "Dorm beds at Mad Monkey, every night",
      "All transport: bus to Siem Reap, overnight VIP sleeper bus, ferries to Koh Rong and Koh Sdach, e-bikes, transfer back",
      "Every activity on the plan, Nestival ticket included",
      "1 breakfast, 3 lunches and 5 dinners",
      "Lots of free drinks",
      "24/7 local crew",
      "Free pre-night: arrive the night before, it's on us",
    ],
    notIncluded: ["Flights", "Travel insurance", "Angkor Wat entry pass (bought on the day, bring ID)", "Spending money", "Upgrades and add-ons"],
    days: [
      { day: 1, place: "Phnom Penh", line: "Land, check in, then the welcome Khmer family dinner.", meals: ["Welcome dinner + free-flow drinks"] },
      { day: 2, place: "Phnom Penh", line: "Guided S21 and Killing Fields tour. Sunset boat cruise on the river.", included: ["S21 & Killing Fields tour", "Sunset boat cruise"] },
      { day: 3, place: "Phnom Penh", line: "Your day: markets, old streets or the pool. Hostel BBQ and pool party.", included: ["BBQ & pool party"] },
      { day: 4, place: "Phnom Penh → Siem Reap", line: "Bus north through the countryside. Make-your-own pizza night.", transport: "Bus to Siem Reap", included: ["Pizza night"] },
      { day: 5, place: "Siem Reap", line: "Pool day. Then the legendary messy pub crawl.", included: ["Pub crawl"] },
      { day: 6, place: "Siem Reap", line: "Floating village tour on Tonle Sap lake. Music quiz and bingo for a cause.", included: ["Floating village tour", "Quiz & bingo"], meals: ["Lunch on tour"] },
      { day: 7, place: "Siem Reap → overnight bus", line: "Angkor Wat at sunrise with a guide. Then the overnight sleeper bus south.", transport: "Overnight VIP sleeper bus", included: ["Angkor Wat sunrise tour"], meals: ["Lunch on tour"] },
      { day: 8, place: "Koh Rong", line: "Fast ferry to the island. Beach olympics, free-flow drinks, beach fireshow.", transport: "Fast ferry to Koh Rong", included: ["Beach olympics", "Fireshow"], meals: ["Free-flow drinks"] },
      { day: 9, place: "Koh Rong", line: "Volleyball tournament, then the Koh Rong boat party. Caribbean dinner feast after.", included: ["Volleyball tournament", "Koh Rong boat party"], meals: ["Caribbean dinner"] },
      { day: 10, place: "Koh Rong", line: "Bottomless brunch with a live DJ. Then Nestival: beach and jungle rave till sunrise.", included: ["Nestival ticket"], meals: ["Bottomless brunch"] },
      { day: 11, place: "Koh Rong", line: "Recovery day. Free kayaks and paddleboards. Sunday roast, beer tower, fireshow.", included: ["Kayaks & paddleboards", "Fireshow"], meals: ["Sunday roast + beer tower"] },
      { day: 12, place: "Koh Rong → Koh Sdach", line: "Ferry to Koh Sdach. Wellness challenge, then the e-bike island loop at sunset.", transport: "Ferry to Koh Sdach", included: ["E-bike island loop"] },
      { day: 13, place: "Koh Sdach", line: "Waterpolo challenge. Island-hopping sunset cruise. Pub quiz.", included: ["Sunset cruise", "Pub quiz"] },
      { day: 14, place: "Koh Sdach", line: "Beach fishing. One last sunset cruise. Final pizza night.", included: ["Sunset cruise", "Pizza night"] },
      { day: 15, place: "Koh Sdach → Phnom Penh", line: "Transfer back to Phnom Penh for your flight home.", transport: "Transfer to Phnom Penh" },
    ],
    source: "https://madmonkeyhostels.com/all-in-trips/cambodia",
  },

  Indonesia: {
    tripCode: "IND",
    // The boat party leads: it's what sells a uni trip.
    hero: { src: `${CDN}/tours/PSX1UK/1780404760900-3.JPG`, alt: "The Mad Monkey boat party off Gili Trawangan, everyone piled on the deck" },
    pitch:
      "Boat party off Gili T, a foam party with a live DJ, then three days of surf camp in Lombok. Manta rays, island hopping round Nusa Penida and a sunrise hike up Mt Batur in between, for the mornings you want more than a hangover.",
    vibe: "High energy and social",
    physical: "Light to moderate. Some hangovers, some hikes.",
    stops: [
      { name: "Uluwatu", nights: 2 },
      { name: "Nusa Lembongan", nights: 3 },
      { name: "Gili Trawangan", nights: 3 },
      { name: "Kuta Lombok", nights: 4 },
    ],
    // Order matters: this is a uni trip, so the nights out lead and the
    // sunrises and snorkelling sit behind them.
    highlights: [
      { name: "Mad Monkey boat party", photo: `${CDN}/tours/PSX1UK/1780404760291-2.jpg` },
      { name: "Foam party with a live DJ", photo: `${ASSETS}/hl-foam-party-Dj1CtWwE.jpg` },
      { name: "Three-day surf camp", photo: `${ASSETS}/hl-surf-camp-GxUsBC-o.jpg` },
      { name: "Island hopping, Nusa Penida", photo: `${ASSETS}/hl-nusa-penida-CfIETXkg.jpg` },
      { name: "Snorkelling with manta rays", photo: `${ASSETS}/hl-snorkeling-Bwm7Bfwr.jpg` },
      { name: "Mt Batur at sunrise", photo: `${ASSETS}/hl-mt-batur-DISzDskn.jpg` },
      { name: "Mexican family dinner", photo: `${ASSETS}/i7-hl-mexican-DwQ8o51y.jpg` },
    ],
    included: [
      "Dorm beds at Mad Monkey, every night",
      "All transfers, fast boats between the islands and the airport shuttle",
      "Every activity on the plan, the three-day surf camp included",
      "4 breakfasts, 5 lunches and 5 dinners",
      "Lots of free drinks",
      "24/7 local crew",
      "Free pre-night: arrive the night before, it's on us",
    ],
    notIncluded: ["Flights", "Travel insurance", "Extra food, drink and spending money", "Upgrades and add-ons"],
    days: [
      { day: 1, place: "Uluwatu", line: "Land at Denpasar and get to Mad Monkey Uluwatu. Welcome sunset session at Panorama Point.", included: ["Welcome sunset at Panorama Point"], meals: ["Welcome drink"] },
      { day: 2, place: "Uluwatu", line: "Very early start for the Mt Batur sunrise trek. Recover in the sauna, hot tub and ice bath, then family dinner.", included: ["Mt Batur sunrise trek", "Sauna, hot tub & ice bath"], meals: ["Family dinner + 2 drinks"] },
      { day: 3, place: "Uluwatu → Nusa Lembongan", line: "Taxi to Sanur, then a 30-minute fast boat to the island. Pool, gym, sauna and ice baths when you land.", transport: "Taxi & fast boat to Nusa Lembongan", included: ["Pool, gym, sauna & ice baths"] },
      { day: 4, place: "Nusa Lembongan", line: "Out early to snorkel with manta rays off Nusa Penida. Afternoon on the beach or in a hammock, then family dinner.", included: ["Manta ray snorkelling"], meals: ["Family dinner"] },
      { day: 5, place: "Nusa Penida", line: "Full day island hopping round the cliffs of Nusa Penida, 8:30 to 5. Karaoke night back at the hostel.", included: ["Nusa Penida island hopping", "Karaoke night"] },
      { day: 6, place: "Nusa Lembongan → Gili Trawangan", line: "Early fast boat to Gili T, the island with no cars. Mexican family dinner and drinks.", transport: "Fast boat to Gili Trawangan", meals: ["Mexican family dinner + 2 drinks"] },
      { day: 7, place: "Gili Trawangan", line: "Chill morning, explore the island at your own pace. Then the foam party with a live DJ.", included: ["Foam party with live DJ"] },
      { day: 8, place: "Gili Trawangan", line: "The Mad Monkey boat party, 2 till 6. Swim, dance, stay out on the water. Unlimited BBQ and drinks after.", included: ["Mad Monkey boat party"], meals: ["Unlimited BBQ & drinks"] },
      { day: 9, place: "Gili Trawangan → Kuta Lombok", line: "Monkey See, Monkey Do snorkelling trip, then a boat and shuttle over to Lombok.", transport: "Boat & shuttle to Kuta Lombok", included: ["Monkey See, Monkey Do snorkelling"] },
      { day: 10, place: "Kuta Lombok", line: "Surf camp starts. Breakfast, then in the water by 9. Lunch, video analysis of your form, another session, hostel night.", included: ["Surf camp day 1"], meals: ["Breakfast, family dinner + 2 drinks"] },
      { day: 11, place: "Kuta Lombok", line: "Surf camp day two. A different beach depending on the swell, same rhythm.", included: ["Surf camp day 2"], meals: ["Breakfast, family dinner + 2 drinks"] },
      { day: 12, place: "Kuta Lombok", line: "Last surf camp day. One more session, one last night with the crew.", included: ["Surf camp day 3"], meals: ["Breakfast, family dinner + 2 drinks"] },
      { day: 13, place: "Kuta Lombok → home", line: "A 30-minute shuttle to Lombok airport for your flight home.", transport: "Shuttle to Lombok Airport" },
    ],
    source: "https://madmonkeyhostels.com/all-in-trips/indonesia",
  },
};

/** Every itinerary we hold, for the picker in Admin → Universities. */
export const ITINERARY_KEYS = Object.keys(ITINERARIES);

/**
 * The itinerary for one university's trip.
 *
 * Keyed per uni, not per destination, so two unis can both go to Cambodia on
 * their own route and dates. A uni with no key falls back to its destination,
 * which is what most will want; set `itineraryKey` in admin only when a uni
 * needs its own version of a trip someone else is also running.
 */
export function itineraryFor(uni: { destination: string; itineraryKey?: string | null }): Itinerary | null {
  return ITINERARIES[uni.itineraryKey || uni.destination] ?? null;
}
