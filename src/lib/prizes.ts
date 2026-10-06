// The two giveaways. Every verified entrant is in both.
export const MONTHLY_PRIZE = "7 free nights at Mad Monkey";
export const TERMLY_PRIZE = "A free Mad Monkey trip, any trip you like";

const TRIP_ASSETS = "https://madmonkeyhostels.com/all-in-trips/assets";
const HOSTEL_CDN = "https://madmonkey-wp.sgp1.cdn.digitaloceanspaces.com";

// Official photos from the design system and madmonkeyhostels.com. Swap for local copies in /public when built.
export const PHOTOS = {
  volleyball: { src: "https://design.madmonkeyhostels.com/img/sunset-volleyball-nacpan.jpg", alt: "Sunset volleyball with Mad Monkey guests" },
  indonesia: { src: `${TRIP_ASSETS}/indo-gili-new-C3nlEJGP.jpg`, alt: "Beach swing on Gili T, Indonesia" },
  vietnam: { src: `${TRIP_ASSETS}/preview-vn-hero-D4_M3U9K.jpg`, alt: "Riding the Ha Giang Loop, Vietnam" },
  cambodia: { src: `${TRIP_ASSETS}/kh-kohrong-BmZ3gEHl.jpg`, alt: "Running into the sea on Koh Rong, Cambodia" },
  thailand: { src: `${HOSTEL_CDN}/destinations/8/1790741900995-1.jpeg`, alt: "Pool party at Mad Monkey Bangkok, Thailand" },
  laos: { src: `${HOSTEL_CDN}/destinations/20/1790739327829-1.png`, alt: "Pool volleyball at Mad Monkey Vang Vieng, Laos" },
};

// The full-length trips the termly winner can pick from. Thailand and Laos launch
// before this goes live: add their days and route once they're published.
export const TRIPS: { name: string; days?: number; route?: string; isNew?: boolean; photo: keyof typeof PHOTOS }[] = [
  { name: "Indonesia", days: 12, route: "Bali → Gili T → Lombok → Uluwatu", photo: "indonesia" },
  { name: "Vietnam", days: 14, route: "Hanoi → Ha Long Bay → Ha Giang Loop → Danang → Hoi An", photo: "vietnam" },
  { name: "Cambodia", days: 14, route: "Phnom Penh → Siem Reap → Koh Rong → Koh Sdach", photo: "cambodia" },
  { name: "Thailand", isNew: true, photo: "thailand" },
  { name: "Laos", isNew: true, photo: "laos" },
];
