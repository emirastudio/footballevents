import { PrismaClient, Locale } from "@prisma/client";
import {
  countries,
  categories as mockCategories,
  organizers as mockOrganizers,
  venues as mockVenues,
  events as mockEvents,
  reviews as mockReviews,
} from "../src/lib/mock-data";

const db = new PrismaClient();

const CATEGORY_NAMES_EN: Record<string, string> = {
  tournaments: "Tournaments",
  camps: "Camps",
  festivals: "Festivals",
  masterclasses: "Masterclasses",
  "match-tours": "Match Tours",
  showcases: "Showcases",
  "training-camps": "Training Camps",
  tryouts: "Tryouts",
};

async function main() {
  console.log("🧹 Wiping existing data…");
  // Order matters due to FKs
  await db.eventSave.deleteMany();
  await db.organizerFollow.deleteMany();
  await db.eventTranslation.deleteMany();
  await db.review.deleteMany();
  await db.eventDivision.deleteMany();
  await db.event.deleteMany();
  await db.venueTranslation.deleteMany();
  await db.venue.deleteMany();
  await db.categoryTranslation.deleteMany();
  await db.category.deleteMany();
  await db.organizerTranslation.deleteMany();
  await db.organizer.deleteMany();
  await db.user.deleteMany();
  await db.city.deleteMany();
  await db.country.deleteMany();

  console.log("🌍 Countries…");
  for (const c of countries) {
    await db.country.create({
      data: { code: c.code, nameEn: c.name, flagEmoji: c.flag },
    });
  }

  console.log("📂 Categories…");
  const categoryBySlug = new Map<string, string>();
  for (let i = 0; i < mockCategories.length; i++) {
    const c = mockCategories[i];
    const created = await db.category.create({
      data: {
        slug: c.slug,
        iconKey: c.iconKey,
        order: i,
        type: c.type as never,
        translations: {
          create: {
            locale: Locale.en,
            name: CATEGORY_NAMES_EN[c.slug] ?? c.slug,
          },
        },
      },
    });
    categoryBySlug.set(c.slug, created.id);
  }

  console.log("👤 Users + Organizers…");
  const organizerBySlug = new Map<string, string>();
  for (const o of mockOrganizers) {
    const user = await db.user.create({
      data: {
        email: `${o.slug}@example.com`,
        name: o.name,
        role: "ORGANIZER",
      },
    });
    const org = await db.organizer.create({
      data: {
        userId: user.id,
        slug: o.slug,
        name: o.name,
        email: user.email,
        logoUrl: o.logoUrl,
        coverUrl: o.coverUrl,
        countryCode: o.countryCode,
        city: o.city,
        isVerified: o.isVerified,
        subscriptionTier: o.subscriptionTier,
        website: `https://www.${o.slug}.com`,
        instagramUrl: `https://instagram.com/${o.slug}`,
        facebookUrl: `https://facebook.com/${o.slug}`,
        xUrl: `https://x.com/${o.slug.replace(/-/g, "_")}`,
        youtubeUrl: o.subscriptionTier === "PREMIUM" ? `https://youtube.com/@${o.slug}` : null,
        tiktokUrl: o.subscriptionTier !== "FREE" ? `https://tiktok.com/@${o.slug}` : null,
        whatsappUrl: `https://wa.me/49${(1700000000 + Math.floor(Math.random() * 99999999))}`,
        translations: {
          create: {
            locale: Locale.en,
            tagline: o.tagline,
            about: o.about,
          },
        },
      },
    });
    organizerBySlug.set(o.slug, org.id);
  }

  console.log("🏟  Venues…");
  const venueBySlug = new Map<string, string>();
  for (const v of mockVenues) {
    const venue = await db.venue.create({
      data: {
        slug: v.slug,
        name: v.name,
        countryCode: v.countryCode,
        address: v.address,
        capacity: v.capacity,
        surfaceType: v.surfaceType,
        coverUrl: v.coverUrl,
        galleryUrls: v.galleryUrls,
        lat: v.lat,
        lng: v.lng,
        translations: {
          create: { locale: Locale.en, description: v.description },
        },
      },
    });
    venueBySlug.set(v.slug, venue.id);
  }

  console.log("⚽ Events…");
  const eventIdByMockId = new Map<string, string>();
  const sampleProgram = (start: Date) => [
    { day: 1, title: "Arrival & Welcome", items: ["Check-in from 14:00", "Team registration", "Welcome dinner & briefing"] },
    { day: 2, title: "Group Stage", items: ["Morning warm-up", "Group matches (3 games)", "Recovery & coaches Q&A"] },
    { day: 3, title: "Knockouts", items: ["Quarter-finals", "Skills clinic with featured coach", "Semi-finals"] },
    { day: 4, title: "Finals & Awards", items: ["3rd-place match", "Grand final", "Award ceremony & farewell"] },
  ];
  const sampleIncluded = ["Accommodation (3 nights)", "Daily meals", "Official tournament kit", "Professional referees", "Match insurance", "Award ceremony"];
  const sampleNotIncluded = ["Flights & airport transfer", "Travel insurance", "Personal expenses"];
  const sampleFaq = [
    { q: "What's the age verification policy?", a: "Players must present a valid ID/passport at check-in matching their declared age group." },
    { q: "Are accommodations near the venue?", a: "Yes — official partner hotels are within 10–15 minutes from the venue with shuttle service." },
    { q: "What happens in case of bad weather?", a: "Matches may be rescheduled within the event window. Refunds are issued only if the entire event is cancelled by the organizer." },
    { q: "Do parents/coaches have access?", a: "All coaches and accompanying adults receive complimentary access to all matches and the award ceremony." },
  ];
  for (const e of mockEvents) {
    const categoryId = categoryBySlug.get(e.categorySlug);
    const organizerId = organizerBySlug.get(e.organizerSlug);
    const venueId = e.venueSlug ? venueBySlug.get(e.venueSlug) : undefined;
    if (!categoryId || !organizerId) continue;

    const created = await db.event.create({
      data: {
        slug: e.slug,
        organizerId,
        categoryId,
        type: e.type,
        status: "PUBLISHED",
        publishedAt: new Date(),
        startDate: new Date(e.startDate),
        endDate: new Date(e.endDate),
        countryCode: e.countryCode,
        venueId,
        ageGroups: e.ageGroups as never,
        gender: e.gender,
        skillLevel: e.skillLevel,
        format: e.format,
        priceFrom: e.priceFrom,
        priceTo: e.priceTo,
        currency: e.currency,
        isFree: e.isFree,
        logoUrl: e.coverUrl
          ? `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(e.title)}&backgroundColor=00D26A,1A2540,D4AF37,DC2626,2563EB&backgroundType=gradientLinear&fontFamily=Manrope&fontWeight=700`
          : null,
        coverUrl: e.coverUrl,
        galleryUrls: e.galleryUrls,
        ratingAvg: e.rating,
        ratingCount: e.reviewsCount,
        isFeatured: e.isFeatured,
        isDemo: true,
        boostTier: e.isPremium ? "PREMIUM" : null,
        featuredUntil: e.isFeatured ? new Date(Date.now() + 1000 * 60 * 60 * 24 * 90) : null,
        program: sampleProgram(new Date(e.startDate)) as never,
        included: sampleIncluded,
        notIncluded: sampleNotIncluded,
        faq: sampleFaq as never,
        translations: {
          create: {
            locale: Locale.en,
            title: e.title,
            shortDescription: e.shortDescription,
            description: e.description,
          },
        },
      },
    });
    eventIdByMockId.set(e.id, created.id);
  }

  console.log("⭐ Reviews…");
  // Create one user per review author, then attach review.
  for (const r of mockReviews) {
    const eventId = eventIdByMockId.get(r.eventId);
    if (!eventId) continue;
    const email = `reviewer-${r.id}@example.com`;
    const user = await db.user.upsert({
      where: { email },
      update: {},
      create: { email, name: r.authorName, role: "USER" },
    });
    await db.review.create({
      data: {
        eventId,
        authorId: user.id,
        rating: r.rating,
        title: r.title,
        body: r.body,
        status: "APPROVED",
        organizerReply: r.organizerReply,
        organizerRepliedAt: r.organizerReply ? new Date() : null,
        moderatedAt: new Date(),
        createdAt: new Date(r.createdAt),
      },
    });
  }

  console.log("👥 Followers & saves (fake fan users)…");
  const fanUsers = await Promise.all(
    Array.from({ length: 60 }, (_, i) =>
      db.user.upsert({
        where: { email: `fan-${i}@example.com` },
        update: {},
        create: { email: `fan-${i}@example.com`, name: `Fan #${i}`, role: "USER" },
      }),
    ),
  );
  // Followers per organizer: scale with subscription tier
  const allOrgs = await db.organizer.findMany();
  for (const org of allOrgs) {
    const target = org.subscriptionTier === "PREMIUM" ? 50 : org.subscriptionTier === "PRO" ? 25 : 8;
    const picks = fanUsers.slice(0, target);
    await db.organizerFollow.createMany({
      data: picks.map((u) => ({ userId: u.id, organizerId: org.id })),
      skipDuplicates: true,
    });
  }
  // Saves per event: 3..30 random
  const allEvents = await db.event.findMany({ select: { id: true } });
  for (const e of allEvents) {
    const n = 3 + Math.floor(Math.random() * 28);
    const picks = fanUsers.slice(0, n);
    await db.eventSave.createMany({
      data: picks.map((u) => ({ userId: u.id, eventId: e.id })),
      skipDuplicates: true,
    });
  }

  const counts = {
    countries: await db.country.count(),
    categories: await db.category.count(),
    organizers: await db.organizer.count(),
    venues: await db.venue.count(),
    events: await db.event.count(),
    reviews: await db.review.count(),
    users: await db.user.count(),
    follows: await db.organizerFollow.count(),
    saves: await db.eventSave.count(),
    divisions: await db.eventDivision.count(),
  };
  console.log("✅ Done:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
