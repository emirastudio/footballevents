import { setRequestLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/site/PageHeader";
import { OrganizerCard } from "@/components/cards/OrganizerCard";
import { getOrganizers } from "@/lib/queries";

export default async function OrganizersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t       = await getTranslations("organizers");
  const tCommon = await getTranslations("common");
  const tNav    = await getTranslations("nav");

  const organizers = await getOrganizers();

  const labels = {
    verified: tCommon("verified"),
    events:   tCommon("events"),
    reviews:  tCommon("reviews"),
  };

  return (
    <>
      <PageHeader
        title={t("pageTitle")}
        subtitle={t("pageSubtitle")}
        breadcrumbs={[{ href: "/", label: tNav("events") }, { label: t("pageTitle") }]}
      />
      <Container className="py-10">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {organizers.map((o) => (
            <OrganizerCard key={o.id} organizer={o} labels={labels} />
          ))}
        </div>
      </Container>
    </>
  );
}
