import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/site/PageHeader";
import { EventCard } from "@/components/cards/EventCard";
import { categories } from "@/lib/mock-data";
import { getEventsByCategory } from "@/lib/queries";

export async function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:6969";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const cat = categories.find((c) => c.slug === slug);
  if (!cat) return {};
  let title = slug, description = "";
  try {
    const t = await getTranslations({ locale, namespace: `categoryHeaders.${slug}` });
    title = t("title");
    description = t("subtitle");
  } catch { /* fall back to slug if translation missing */ }
  const url = `${SITE_URL}/${locale}/categories/${slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "website", url, title, description, images: [{ url: `${SITE_URL}/og-default.jpg`, width: 1200, height: 630, alt: title }] },
    twitter: { card: "summary_large_image", title, description, images: [`${SITE_URL}/og-default.jpg`] },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const cat = categories.find((c) => c.slug === slug);
  if (!cat) notFound();

  const tHeaders = await getTranslations(`categoryHeaders.${slug}` as any);
  const tCommon  = await getTranslations("common");
  const tNav     = await getTranslations("nav");

  const items = await getEventsByCategory(slug, locale);

  const cardLabels = {
    from: tCommon("from"), free: tCommon("free"),
    premium: tCommon("premium"), featured: tCommon("featured"),
  };

  return (
    <>
      <PageHeader
        eyebrow={`${items.length} ${items.length === 1 ? tCommon("result") : tCommon("results")}`}
        title={tHeaders("title")}
        subtitle={tHeaders("subtitle")}
        breadcrumbs={[
          { href: "/", label: tNav("events") },
          { href: "/events", label: tNav("events") },
          { label: tHeaders("title") },
        ]}
      />

      <Container className="py-10">
        {items.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">{tCommon("noResults")}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((e) => (
              <EventCard key={e.id} event={e} locale={locale} labels={cardLabels} size="sm" />
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
