import { setRequestLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/site/PageHeader";
import { Mail, MessageSquare } from "lucide-react";

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contact");
  const tNav = await getTranslations("nav");

  return (
    <>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        breadcrumbs={[{ href: "/", label: tNav("events") }, { label: t("title") }]}
      />
      <Container className="py-12">
        <div className="mx-auto max-w-xl space-y-4">
          <a
            href="mailto:hello@footballevents.eu"
            className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition hover:border-[var(--color-pitch-300)]"
          >
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--color-pitch-50)] text-[var(--color-pitch-700)]">
              <Mail className="h-4 w-4" />
            </span>
            <span>
              <span className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{t("email")}</span>
              <span className="block font-semibold text-[var(--color-foreground)]">hello@footballevents.eu</span>
            </span>
          </a>
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--color-pitch-50)] text-[var(--color-pitch-700)]">
                <MessageSquare className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{t("supportTitle")}</span>
                <span className="block font-semibold text-[var(--color-foreground)]">{t("supportBody")}</span>
              </span>
            </div>
          </div>
        </div>
      </Container>
    </>
  );
}
