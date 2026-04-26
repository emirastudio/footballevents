import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { marked } from "marked";
import { promises as fs } from "fs";
import path from "path";

const ALLOWED = new Set(["terms", "privacy", "refund", "cookies"]);

export async function generateStaticParams() {
  return [...ALLOWED].map((doc) => ({ doc }));
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ locale: string; doc: string }>;
}) {
  const { locale, doc } = await params;
  setRequestLocale(locale);
  if (!ALLOWED.has(doc)) notFound();

  const file = path.join(process.cwd(), "content", "legal", `${doc}.md`);
  let raw: string;
  try {
    raw = await fs.readFile(file, "utf8");
  } catch {
    notFound();
  }
  const html = await marked.parse(raw, { gfm: true });

  return (
    <Container className="py-12">
      <article
        className="legal-doc mx-auto max-w-3xl"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </Container>
  );
}
