import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { marked } from "marked";
import { promises as fs } from "fs";
import path from "path";

const ALLOWED = new Set(["terms", "privacy", "refund", "cookies", "imprint"]);

export async function generateStaticParams() {
  return [...ALLOWED].map((doc) => ({ doc }));
}

// Localized files live as `<doc>.<locale>.md`; falls back to EN if missing.
async function readLocalizedDoc(doc: string, locale: string): Promise<string | null> {
  const dir = path.join(process.cwd(), "content", "legal");
  const candidates = [
    path.join(dir, `${doc}.${locale}.md`),
    path.join(dir, `${doc}.md`),
  ];
  for (const p of candidates) {
    try {
      return await fs.readFile(p, "utf8");
    } catch {}
  }
  return null;
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ locale: string; doc: string }>;
}) {
  const { locale, doc } = await params;
  setRequestLocale(locale);
  if (!ALLOWED.has(doc)) notFound();

  const raw = await readLocalizedDoc(doc, locale);
  if (!raw) notFound();
  const html = await marked.parse(raw, { gfm: true });

  const PREVAIL: Record<string, string> = {
    en: "In case of any discrepancy between translations and this English version, the English version prevails.",
    ru: "В случае расхождений между переводами и английской версией приоритет имеет английская версия.",
    de: "Bei Abweichungen zwischen Übersetzungen und der englischen Fassung ist die englische Fassung maßgeblich.",
    es: "En caso de discrepancia entre las traducciones y la versión en inglés, prevalece la versión en inglés.",
  };

  return (
    <Container className="py-12">
      <article
        className="legal-doc mx-auto max-w-3xl"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <p className="mx-auto mt-8 max-w-3xl text-xs text-[var(--color-muted)]">
        {PREVAIL[locale] ?? PREVAIL.en}
      </p>
    </Container>
  );
}
