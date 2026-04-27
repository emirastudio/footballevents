// Mock data for development — will be replaced with Prisma queries once DB is up.
// Structure mirrors the Prisma schema closely so swap-in is trivial.

export type MockEvent = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  type: "TOURNAMENT" | "CAMP" | "FESTIVAL" | "MASTERCLASS" | "MATCH_TOUR" | "SHOWCASE" | "CLINIC" | "TRAINING_CAMP" | "TRYOUT";
  categorySlug: string;
  organizerSlug: string;
  venueSlug?: string;
  countryCode: string;
  city: string;
  startDate: string;   // ISO
  endDate: string;
  ageGroups: string[]; // U10, U12...
  gender: "MALE" | "FEMALE" | "MIXED";
  format?: string;     // 5x5, 8x8, 11x11
  skillLevel: "AMATEUR" | "SEMI_PRO" | "PROFESSIONAL" | "ALL_LEVELS";
  priceFrom: number;
  priceTo?: number;
  currency: string;
  isFree: boolean;
  coverUrl: string;
  galleryUrls: string[];
  rating: number;
  reviewsCount: number;
  isPremium: boolean;
  isFeatured: boolean;
  logoUrl?: string;
  savesCount?: number;
  program?: { day: number; title: string; items: string[] }[];
  included?: string[];
  notIncluded?: string[];
  faq?: { q: string; a: string }[];
  divisions?: MockDivision[];
};

export type MockDivision = {
  id: string;
  name: string;
  ageGroup: string;
  gender: "MALE" | "FEMALE" | "MIXED";
  format: string;
  priceFrom?: number;
  priceTo?: number;
  currency: string;
  isFree: boolean;
  maxTeams?: number;
  spotsLeft?: number;
  startDate?: string;
  endDate?: string;
  externalUrl?: string;
};

export type MockOrganizer = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  about: string;
  countryCode: string;
  city: string;
  logoUrl: string;
  coverUrl: string;
  isVerified: boolean;
  subscriptionTier: "FREE" | "PRO" | "PREMIUM";
  eventsCount: number;
  rating: number;
  reviewsCount: number;
  followersCount?: number;
  website?: string;
  socials?: {
    instagram?: string;
    facebook?: string;
    x?: string;
    tiktok?: string;
    youtube?: string;
    whatsapp?: string;
  };
};

export type MockVenue = {
  id: string;
  slug: string;
  name: string;
  countryCode: string;
  city: string;
  address: string;
  capacity?: number;
  surfaceType?: string;
  coverUrl: string;
  galleryUrls: string[];
  description: string;
  eventsCount: number;
  lat?: number;
  lng?: number;
};

export type MockReview = {
  id: string;
  eventId: string;
  authorName: string;
  authorAvatar?: string;
  rating: number;
  title?: string;
  body: string;
  createdAt: string;
  organizerReply?: string;
};

// ───────────────── Countries ─────────────────
export const countries = [
  { code: "ES", name: "Spain",       flag: "🇪🇸" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "DE", name: "Germany",     flag: "🇩🇪" },
  { code: "IT", name: "Italy",       flag: "🇮🇹" },
  { code: "FR", name: "France",      flag: "🇫🇷" },
  { code: "PT", name: "Portugal",    flag: "🇵🇹" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱" },
  { code: "AT", name: "Austria",     flag: "🇦🇹" },
  { code: "CZ", name: "Czechia",     flag: "🇨🇿" },
  { code: "PL", name: "Poland",      flag: "🇵🇱" },
  { code: "GR", name: "Greece",      flag: "🇬🇷" },
  { code: "BR", name: "Brazil",      flag: "🇧🇷" },
  { code: "AR", name: "Argentina",   flag: "🇦🇷" },
  { code: "US", name: "USA",         flag: "🇺🇸" },
  { code: "JP", name: "Japan",       flag: "🇯🇵" },
];

export const ageGroups = ["U6","U8","U10","U12","U14","U16","U18","U21","ADULT"];
export const formats = ["5x5", "7x7", "8x8", "9x9", "11x11"];
export const skillLevels = ["AMATEUR", "SEMI_PRO", "PROFESSIONAL", "ALL_LEVELS"];

// ───────────────── Categories ─────────────────
export const categories = [
  { slug: "tournaments",  type: "TOURNAMENT",  iconKey: "trophy",     count: 248 },
  { slug: "camps",        type: "CAMP",        iconKey: "tent",       count: 132 },
  { slug: "festivals",    type: "FESTIVAL",    iconKey: "party",      count: 64 },
  { slug: "masterclasses", type: "MASTERCLASS", iconKey: "graduation", count: 89 },
  { slug: "match-tours",  type: "MATCH_TOUR",  iconKey: "plane",      count: 47 },
  { slug: "showcases",    type: "SHOWCASE",    iconKey: "sparkles",   count: 18 },
  { slug: "training-camps", type: "TRAINING_CAMP", iconKey: "dumbbell", count: 0 },
  { slug: "tryouts",      type: "TRYOUT",      iconKey: "search",     count: 0 },
];

// ───────────────── Images pool ─────────────────
const eventImages = [
  "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=1200&q=80",
  "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=1200&q=80",
  "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&q=80",
  "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1200&q=80",
  "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&q=80",
  "https://images.unsplash.com/photo-1517747614396-d21a78b850e8?w=1200&q=80",
  "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1200&q=80",
  "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1200&q=80",
  "https://images.unsplash.com/photo-1487466365202-1afdb86c764e?w=1200&q=80",
  "https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=1200&q=80",
];

const stadiumImages = [
  "https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=1200&q=80",
  "https://images.unsplash.com/photo-1459865264687-595d652de67e?w=1200&q=80",
  "https://images.unsplash.com/photo-1518604666860-9ed391f76460?w=1200&q=80",
  "https://images.unsplash.com/photo-1486286701208-1d58e9338013?w=1200&q=80",
  "https://images.unsplash.com/photo-1493106819501-66d381c466f1?w=1200&q=80",
];

const orgLogos = [
  "https://api.dicebear.com/9.x/initials/svg?seed=FCB&backgroundColor=00D26A",
  "https://api.dicebear.com/9.x/initials/svg?seed=AFA&backgroundColor=1A2540",
  "https://api.dicebear.com/9.x/initials/svg?seed=EFC&backgroundColor=D4AF37",
  "https://api.dicebear.com/9.x/initials/svg?seed=PSG&backgroundColor=00B85B",
  "https://api.dicebear.com/9.x/initials/svg?seed=RMD&backgroundColor=475569",
  "https://api.dicebear.com/9.x/initials/svg?seed=JUV&backgroundColor=0F1E36",
  "https://api.dicebear.com/9.x/initials/svg?seed=BAY&backgroundColor=DC2626",
  "https://api.dicebear.com/9.x/initials/svg?seed=AJX&backgroundColor=2563EB",
];

// ───────────────── Organizers ─────────────────
export const organizers: MockOrganizer[] = [
  { id: "org-1", slug: "iberian-football-academy", name: "Iberian Football Academy", tagline: "Elite youth football in Spain", about: "Founded in 2008, IFA runs premium football camps and tournaments for players aged 8–18 across the Iberian peninsula. Our programs combine high-level coaching with cultural immersion.", countryCode: "ES", city: "Barcelona", logoUrl: orgLogos[0], coverUrl: eventImages[0], isVerified: true,  subscriptionTier: "PREMIUM", eventsCount: 14, rating: 4.8, reviewsCount: 124 },
  { id: "org-2", slug: "alpine-sports-group",       name: "Alpine Sports Group",       tagline: "Football camps in the Austrian Alps",  about: "ASG operates summer and winter football camps in Innsbruck, Salzburg and Tyrol. State-of-the-art facilities and UEFA-licensed coaches.",                                       countryCode: "AT", city: "Innsbruck", logoUrl: orgLogos[1], coverUrl: eventImages[1], isVerified: true,  subscriptionTier: "PRO",     eventsCount: 9,  rating: 4.7, reviewsCount: 86 },
  { id: "org-3", slug: "wembley-events-uk",         name: "Wembley Events UK",         tagline: "Premium match-day experiences",         about: "Match-day tours, hospitality packages and stadium experiences across England's top venues. Official partnerships with major clubs.",                                  countryCode: "GB", city: "London",     logoUrl: orgLogos[2], coverUrl: eventImages[2], isVerified: true,  subscriptionTier: "PREMIUM", eventsCount: 22, rating: 4.9, reviewsCount: 211 },
  { id: "org-4", slug: "calcio-italiano-eventi",     name: "Calcio Italiano Eventi",    tagline: "Italian football, world-class events",  about: "Tournaments, festivals, masterclasses across Italy with legendary coaches and former Serie A players.",                                                              countryCode: "IT", city: "Milan",      logoUrl: orgLogos[3], coverUrl: eventImages[3], isVerified: true,  subscriptionTier: "PRO",     eventsCount: 11, rating: 4.6, reviewsCount: 73 },
  { id: "org-5", slug: "fcdvolution-france",         name: "FCDvolution France",        tagline: "Youth development in Île-de-France",     about: "Paris-based youth development organization with programs for U10 to U18 players.",                                                                                  countryCode: "FR", city: "Paris",      logoUrl: orgLogos[4], coverUrl: eventImages[4], isVerified: false, subscriptionTier: "FREE",    eventsCount: 5,  rating: 4.4, reviewsCount: 28 },
  { id: "org-6", slug: "lisboa-football-tours",      name: "Lisboa Football Tours",     tagline: "Discover Portuguese football",          about: "Match-day tours across Lisbon and Porto, with stadium visits, training session attendances and Portuguese football culture immersion.",                              countryCode: "PT", city: "Lisbon",     logoUrl: orgLogos[5], coverUrl: eventImages[5], isVerified: true,  subscriptionTier: "PRO",     eventsCount: 8,  rating: 4.7, reviewsCount: 64 },
  { id: "org-7", slug: "bundesliga-experience",      name: "Bundesliga Experience",     tagline: "Authentic German football events",      about: "Premium German football tournaments and Bundesliga match tours. Based in Munich with operations across Bavaria and beyond.",                                            countryCode: "DE", city: "Munich",     logoUrl: orgLogos[6], coverUrl: eventImages[6], isVerified: true,  subscriptionTier: "PREMIUM", eventsCount: 17, rating: 4.8, reviewsCount: 142 },
  { id: "org-8", slug: "ajax-academy-events",        name: "Ajax Academy Events",       tagline: "Total football, total training",        about: "Inspired by the Ajax youth philosophy. Camps, masterclasses and clinics across the Netherlands.",                                                                       countryCode: "NL", city: "Amsterdam",  logoUrl: orgLogos[7], coverUrl: eventImages[7], isVerified: true,  subscriptionTier: "PRO",     eventsCount: 10, rating: 4.7, reviewsCount: 95 },
];

// ───────────────── Venues ─────────────────
export const venues: MockVenue[] = [
  { id: "v-1",  slug: "camp-nou-experience",       name: "Camp Nou Experience Center", countryCode: "ES", city: "Barcelona", address: "C. d'Arístides Maillol, 12, 08028 Barcelona", capacity: 99354, surfaceType: "Natural grass",     coverUrl: stadiumImages[0], galleryUrls: stadiumImages, description: "Home of FC Barcelona — one of the most iconic football venues in the world.",            eventsCount: 8, lat: 41.3809, lng: 2.1228 },
  { id: "v-2",  slug: "santiago-bernabeu",          name: "Santiago Bernabéu",          countryCode: "ES", city: "Madrid",    address: "Av. de Concha Espina, 1, 28036 Madrid",        capacity: 81044, surfaceType: "Hybrid grass",      coverUrl: stadiumImages[1], galleryUrls: stadiumImages, description: "The legendary home of Real Madrid, recently renovated to a futuristic marvel.",            eventsCount: 6, lat: 40.4531, lng: -3.6883 },
  { id: "v-3",  slug: "wembley-stadium",            name: "Wembley Stadium",            countryCode: "GB", city: "London",    address: "Olympic Way, Wembley HA9 0WS, UK",             capacity: 90000, surfaceType: "Hybrid grass",      coverUrl: stadiumImages[2], galleryUrls: stadiumImages, description: "England's national stadium — host of FA Cup finals, internationals and global events.",     eventsCount: 12, lat: 51.5560, lng: -0.2796 },
  { id: "v-4",  slug: "old-trafford",               name: "Old Trafford",               countryCode: "GB", city: "Manchester", address: "Sir Matt Busby Way, Stretford, Manchester M16 0RA", capacity: 74310, surfaceType: "Hybrid grass", coverUrl: stadiumImages[3], galleryUrls: stadiumImages, description: "Manchester United's historic 'Theatre of Dreams' since 1910.",                              eventsCount: 7, lat: 53.4631, lng: -2.2913 },
  { id: "v-5",  slug: "allianz-arena",              name: "Allianz Arena",              countryCode: "DE", city: "Munich",    address: "Werner-Heisenberg-Allee 25, 80939 München",     capacity: 75024, surfaceType: "Natural grass",     coverUrl: stadiumImages[4], galleryUrls: stadiumImages, description: "Bayern Munich's iconic illuminated home, glowing red on matchdays.",                       eventsCount: 9, lat: 48.2188, lng: 11.6248 },
  { id: "v-6",  slug: "san-siro",                   name: "San Siro (Giuseppe Meazza)", countryCode: "IT", city: "Milan",     address: "Piazzale Angelo Moratti, 20151 Milano",         capacity: 75923, surfaceType: "Hybrid grass",      coverUrl: stadiumImages[0], galleryUrls: stadiumImages, description: "Shared home of AC Milan and Inter — one of football's great cathedrals.",                  eventsCount: 5, lat: 45.4781, lng: 9.1240 },
  { id: "v-7",  slug: "parc-des-princes",           name: "Parc des Princes",            countryCode: "FR", city: "Paris",     address: "24 Rue du Commandant Guilbaud, 75016 Paris",   capacity: 47929, surfaceType: "Hybrid grass",      coverUrl: stadiumImages[1], galleryUrls: stadiumImages, description: "PSG's home in the heart of Paris.",                                                          eventsCount: 4, lat: 48.8414, lng: 2.2530 },
  { id: "v-8",  slug: "estadio-da-luz",              name: "Estádio da Luz",              countryCode: "PT", city: "Lisbon",    address: "Av. Eusébio da Silva Ferreira, 1500-313 Lisboa", capacity: 64642, surfaceType: "Natural grass",   coverUrl: stadiumImages[2], galleryUrls: stadiumImages, description: "Benfica's grand stadium and one of Portugal's largest sporting venues.",                  eventsCount: 6, lat: 38.7527, lng: -9.1845 },
  { id: "v-9",  slug: "johan-cruyff-arena",         name: "Johan Cruijff ArenA",          countryCode: "NL", city: "Amsterdam", address: "ArenA Boulevard 1, 1101 AX Amsterdam-Zuidoost", capacity: 55865, surfaceType: "Hybrid grass",    coverUrl: stadiumImages[3], galleryUrls: stadiumImages, description: "Ajax's stadium — named in honor of one of football's greatest minds.",                     eventsCount: 7, lat: 52.3143, lng: 4.9419 },
  { id: "v-10", slug: "tivoli-stadion-tirol",       name: "Tivoli Stadion Tirol",         countryCode: "AT", city: "Innsbruck", address: "Stadionstraße 1B, 6020 Innsbruck",            capacity: 17400, surfaceType: "Natural grass",     coverUrl: stadiumImages[4], galleryUrls: stadiumImages, description: "Innsbruck's modern stadium nestled in the Austrian Alps.",                                eventsCount: 3, lat: 47.2607, lng: 11.4101 },
  { id: "v-11", slug: "olympiakos-piraeus-stadium", name: "Karaiskakis Stadium",          countryCode: "GR", city: "Piraeus",   address: "Karaiskaki, Piraeus 185 47",                  capacity: 32115, surfaceType: "Natural grass",     coverUrl: stadiumImages[0], galleryUrls: stadiumImages, description: "Olympiakos' historic home in the port of Piraeus.",                                         eventsCount: 2, lat: 37.9456, lng: 23.6671 },
  { id: "v-12", slug: "stadion-narodowy",           name: "PGE Narodowy",                countryCode: "PL", city: "Warsaw",    address: "al. Księcia Józefa Poniatowskiego 1",         capacity: 58580, surfaceType: "Hybrid grass",      coverUrl: stadiumImages[1], galleryUrls: stadiumImages, description: "Poland's national stadium with retractable roof, host of Euro 2012 matches.",             eventsCount: 4, lat: 52.2395, lng: 21.0455 },
];

// ───────────────── Events ─────────────────
const eventTitles = [
  "Iberia Cup", "Costa Brava Trophy", "London Youth Open", "Manchester Cup",
  "Bavaria Junior Cup", "Allianz Arena Camp", "San Siro Showcase", "Milan Derby Camp",
  "Paris Football Festival", "Lyon Masterclass", "Lisbon Sun Tour", "Porto Spring Cup",
  "Roma Masterclass", "Napoli Coastal Cup", "Amsterdam Showcase", "Rotterdam Open",
  "Berlin International", "Hamburg Festival", "Vienna Winter Cup", "Salzburg Camp",
  "Wembley Match-Day Tour", "Anfield Match Tour", "Bernabéu Tour", "Camp Nou Day",
  "Prague Spring Trophy", "Warsaw Junior Open", "Hellas Football Festival", "Athens Cup",
  "Mediterranean Cup", "Atlantic Trophy", "Northern Lights Camp", "Copa Iberica",
  "Bundesliga Experience Tour", "Eredivisie Tour", "Serie A Tour", "Ligue 1 Tour",
  "Champions League Final Trip", "Europa League Camp", "Youth World Stage", "Elite Goalkeeper Clinic",
  "Striker Masterclass", "Defensive Tactics Camp", "Coaches Conference", "Womens Football Festival",
  "Beach Football Tour", "Futsal World Showcase", "Veterans Cup", "All-Stars Showcase",
  "Pro-Am Tournament", "Family Football Weekend",
];

const ages = ["U10", "U12", "U14", "U16", "U18", "U21"];
const fmts = ["5x5", "7x7", "8x8", "9x9", "11x11"];

export const events: MockEvent[] = Array.from({ length: 60 }, (_, i) => {
  const cat = categories[i % categories.length];
  const org = organizers[i % organizers.length];
  const venue = venues[i % venues.length];
  const country = countries.find(c => c.code === venue.countryCode) ?? countries[i % countries.length];
  const month = ((i % 12) + 1).toString().padStart(2, "0");
  const day = (8 + (i % 18)).toString().padStart(2, "0");
  const start = `2026-${month}-${day}T09:00:00Z`;
  const endDay = (parseInt(day) + 3).toString().padStart(2, "0");
  const end = `2026-${month}-${endDay}T18:00:00Z`;
  const isFree = i % 11 === 0;
  const price = isFree ? 0 : 90 + (i * 23) % 700;
  const ageGroup = ages[i % ages.length];

  return {
    id: `evt-${i + 1}`,
    slug: `${eventTitles[i % eventTitles.length].toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${i + 1}`,
    title: `${eventTitles[i % eventTitles.length]} ${ageGroup}`,
    shortDescription: `Premium ${cat.slug.replace("-", " ")} hosted by ${org.name} in ${country.name}.`,
    description: `Join ${eventTitles[i % eventTitles.length]} ${ageGroup} — a flagship ${cat.slug.replace("-", " ")} organized by ${org.name}. Set in ${venue.city}, this multi-day event combines elite-level competition, professional coaching and an unforgettable football experience for participants aged ${ageGroup}. Players, families and coaches from across the world attend, making it a true global stage. Includes accommodation options, official kit, and award ceremony.`,
    type: cat.type as MockEvent["type"],
    categorySlug: cat.slug,
    organizerSlug: org.slug,
    venueSlug: venue.slug,
    countryCode: country.code,
    city: venue.city,
    startDate: start,
    endDate: end,
    ageGroups: [ageGroup],
    gender: i % 5 === 0 ? "FEMALE" : i % 7 === 0 ? "MIXED" : "MALE",
    format: fmts[i % fmts.length],
    skillLevel: ["AMATEUR","SEMI_PRO","PROFESSIONAL","ALL_LEVELS"][i % 4] as MockEvent["skillLevel"],
    priceFrom: price,
    priceTo: isFree ? undefined : price + 200,
    currency: "EUR",
    isFree,
    coverUrl: eventImages[i % eventImages.length],
    galleryUrls: eventImages.slice(0, 5),
    rating: parseFloat((4.0 + (i % 9) / 10).toFixed(1)),
    reviewsCount: 6 + (i * 3) % 120,
    isPremium: i < 6,
    isFeatured: i >= 6 && i % 4 === 0,
  };
});

// ───────────────── Reviews ─────────────────
export const reviews: MockReview[] = [
  { id: "r-1", eventId: "evt-1", authorName: "Marco P.",  rating: 5, title: "World-class organization", body: "Everything was on point — accommodation, food, training pitches, coaches. My son had the best week of his football life. Highly recommended for any U14 player serious about the sport.", createdAt: "2026-03-12", organizerReply: "Thank you, Marco! It was a pleasure hosting your son. See you next year." },
  { id: "r-2", eventId: "evt-1", authorName: "Elena K.",   rating: 5, title: "Magical experience",         body: "From the welcome ceremony to the final award gala — every detail was thought through. The level of competition was high but fair. We're already booking for next summer.",            createdAt: "2026-03-08" },
  { id: "r-3", eventId: "evt-1", authorName: "James W.",   rating: 4, title: "Great, with small notes",    body: "Excellent overall. Coaches were superb, facilities top-tier. Only feedback: lunch options could be more varied for kids with dietary restrictions.",                                  createdAt: "2026-03-01", organizerReply: "Thanks James — we're updating the catering for next edition." },
  { id: "r-4", eventId: "evt-1", authorName: "Sofia M.",   rating: 5, title: "Truly premium",              body: "Worth every euro. The coaching staff included two former La Liga players — incredible role models for the kids.",                                                                       createdAt: "2026-02-22" },
  { id: "r-5", eventId: "evt-1", authorName: "Carlos D.",  rating: 4, title: "Well organized",             body: "Excellent tournament. Great mix of competitive matches and skill-building sessions. Will definitely return.",                                                                            createdAt: "2026-02-14" },
];

// ───────────────── Helpers ─────────────────
export function getEventBySlug(slug: string) {
  return events.find(e => e.slug === slug);
}
export function getOrganizerBySlug(slug: string) {
  return organizers.find(o => o.slug === slug);
}
export function getVenueBySlug(slug: string) {
  return venues.find(v => v.slug === slug);
}
export function getCountry(code: string) {
  return countries.find(c => c.code === code);
}
export function getEventsByCategory(slug: string) {
  return events.filter(e => e.categorySlug === slug);
}
export function getEventsByOrganizer(slug: string) {
  return events.filter(e => e.organizerSlug === slug);
}
export function getEventsByVenue(slug: string) {
  return events.filter(e => e.venueSlug === slug);
}
export function getReviewsByEvent(eventId: string) {
  return reviews.filter(r => r.eventId === eventId);
}
export function getStadiumsByCountry() {
  const grouped: Record<string, MockVenue[]> = {};
  for (const v of venues) {
    (grouped[v.countryCode] ??= []).push(v);
  }
  return grouped;
}
