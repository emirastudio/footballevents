import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/site/PageHeader";
import { Button } from "@/components/ui/Button";
import {
  Tent,
  GraduationCap,
  Heart,
  Globe,
  Sun,
  Users,
  CheckCircle2,
  ArrowRight,
  Dumbbell,
  Star,
} from "lucide-react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://footballevents.eu";

export function generateMetadata(): Metadata {
  return {
    title: "Футбольные лагеря и кэмпы | footballevents.eu",
    description:
      "Футбольные лагеря для детей и взрослых: летние кэмпы, интенсивные тренировки, международные программы. Профессиональные тренеры, современные поля, незабываемый опыт.",
    alternates: { canonical: `${SITE_URL}/ru/about/camps` },
    openGraph: {
      type: "website",
      url: `${SITE_URL}/ru/about/camps`,
      title: "Футбольные лагеря и кэмпы | footballevents.eu",
      description: "Футбольные лагеря с профессиональными тренерами — для детей, подростков и взрослых по всему миру.",
    },
  };
}

const campTypes = [
  {
    icon: Sun,
    title: "Летние лагеря",
    desc: "Классический формат: неделя или две на хорошей базе. Тренировки, игры, дружба. Для детей от 6 до 17 лет.",
  },
  {
    icon: Dumbbell,
    title: "Интенсивные кэмпы",
    desc: "3–5 дней концентрированной работы над техникой, тактикой или физической подготовкой. Для серьёзно настроенных игроков.",
  },
  {
    icon: Globe,
    title: "Международные программы",
    desc: "Лагеря в Испании, Португалии, Германии, Англии. Тренировки в академиях топ-клубов. Жизнь в профессиональной среде.",
  },
  {
    icon: GraduationCap,
    title: "Академические кэмпы",
    desc: "Программы при футбольных академиях с профессиональными тренерами и возможностью попасть в систему клуба.",
  },
  {
    icon: Users,
    title: "Командные кэмпы",
    desc: "Лагерь для всей команды — сочетание тренировок, командообразования и турниров против других групп.",
  },
  {
    icon: Heart,
    title: "Семейные лагеря",
    desc: "Форматы с участием родителей: наблюдение, лекции, тренировки вместе. Спорт как семейное приключение.",
  },
];

const whyLagery = [
  "Концентрированный прогресс за 1–2 недели",
  "Обратная связь от профессиональных тренеров каждый день",
  "Новые друзья из разных стран — навсегда",
  "Погружение в языковую среду при международном участии",
  "Опыт жизни в профессиональной спортивной среде",
  "Самостоятельность и ответственность вне дома",
];

export default async function CampsAboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <PageHeader
        eyebrow="Категория"
        title="Футбольные лагеря и кэмпы"
        subtitle="Неделя в правильном лагере может изменить игру навсегда. Найди интенсив с тренерами мирового уровня — рядом или за рубежом."
        breadcrumbs={[
          { href: "/", label: "Главная" },
          { href: "/about", label: "О проекте" },
          { label: "Лагеря" },
        ]}
      >
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="accent" size="lg">
            <Link href="/categories/camps">Смотреть лагеря</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/organizer/events/new">Разместить лагерь</Link>
          </Button>
        </div>
      </PageHeader>

      {/* Opening */}
      <Container className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
            Лагерь — это не просто тренировки
          </h2>
          <p className="mt-4 leading-relaxed text-[var(--color-muted-strong)]">
            Футбольный лагерь — уникальная среда, где ребёнок или взрослый игрок полностью погружается в
            спорт. Каждый день — несколько тренировочных сессий, разбор игр, работа с тренером и общение
            с игроками из других команд, городов, стран. Такого не даёт ни один кружок, ни одна секция.
          </p>
          <p className="mt-4 leading-relaxed text-[var(--color-muted-strong)]">
            На footballevents.eu вы найдёте лагеря от проверенных организаторов по всему миру: летние кэмпы
            в Испании и Португалии, интенсивы в академиях, недельные программы на лучших полях Европы —
            и локальные лагеря в своём городе для тех, кто хочет начать с ближнего.
          </p>
        </div>
      </Container>

      {/* Camp types */}
      <div className="bg-[var(--color-surface-muted,#F4F6FA)] py-16 sm:py-20">
        <Container>
          <h2 className="mb-10 font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
            Форматы лагерей в каталоге
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {campTypes.map((c) => (
              <div
                key={c.title}
                className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
              >
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-[var(--radius-lg)] bg-emerald-50">
                  <c.icon className="h-5 w-5 text-emerald-600" />
                </div>
                <h3 className="font-[family-name:var(--font-manrope)] font-semibold text-[var(--color-foreground)]">
                  {c.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">{c.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </div>

      {/* Why camp */}
      <Container className="py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
              Что даёт футбольный лагерь
            </h2>
            <p className="mt-4 leading-relaxed text-[var(--color-muted-strong)]">
              Игроки, которые регулярно ездят на лагеря, опережают сверстников в развитии — это
              подтверждают тренеры академий по всей Европе. Причина проста: интенсивность и концентрация
              опыта, недостижимые в обычном режиме тренировок.
            </p>
            <ul className="mt-6 space-y-2">
              {whyLagery.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm text-[var(--color-muted-strong)]">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface-muted,#F4F6FA)] p-8">
            <Star className="mb-4 h-8 w-8 text-amber-500" />
            <blockquote className="text-lg font-medium leading-relaxed text-[var(--color-foreground)]">
              «Один хороший летний лагерь в Испании дал моему сыну больше, чем три года в местной секции.
              Тренеры, поля, соперники — совсем другой уровень.»
            </blockquote>
            <div className="mt-4 text-sm text-[var(--color-muted)]">Родитель игрока U14, Москва</div>
          </div>
        </div>
      </Container>

      {/* For organizers */}
      <div className="bg-[var(--color-surface-muted,#F4F6FA)] py-16">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-3 inline-flex items-center rounded-full border border-[var(--color-pitch-200)] bg-[var(--color-pitch-50)] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-pitch-700)]">
              Для организаторов лагерей
            </div>
            <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
              Заполни лагерь участниками из всего мира
            </h2>
            <p className="mt-4 leading-relaxed text-[var(--color-muted-strong)]">
              Разместите лагерь на footballevents.eu и получайте заявки от родителей и игроков из 50+ стран.
              Управляйте заявками в удобном кабинете, продвигайте через Featured и показывайте программу,
              тренеров и фотографии на профессиональной странице.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button asChild variant="accent">
                <Link href="/about/for-organizers">Разместить лагерь <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/pricing">Посмотреть тарифы</Link>
              </Button>
            </div>
          </div>
        </Container>
      </div>

      {/* CTA */}
      <div className="bg-[var(--color-foreground)] py-16">
        <Container>
          <div className="text-center">
            <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-white sm:text-3xl">
              Найди лагерь мечты
            </h2>
            <p className="mt-3 text-white/70">Лагеря для детей, подростков и взрослых — со всего мира</p>
            <div className="mt-8">
              <Button asChild variant="accent" size="lg">
                <Link href="/categories/camps">Смотреть все лагеря</Link>
              </Button>
            </div>
          </div>
        </Container>
      </div>
    </>
  );
}
