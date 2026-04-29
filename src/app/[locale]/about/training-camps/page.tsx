import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/site/PageHeader";
import { Button } from "@/components/ui/Button";
import {
  Dumbbell,
  Target,
  Users,
  MapPin,
  CalendarDays,
  Shield,
  CheckCircle2,
  BarChart3,
  Zap,
  ArrowRight,
} from "lucide-react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://footballevents.eu";

export function generateMetadata(): Metadata {
  return {
    title: "Тренировочные сборы для футбольных команд | footballevents.eu",
    description:
      "Организация тренировочных сборов для футбольных команд и клубов. Предсезонная подготовка, тактические сборы, международные тренировочные базы в Испании, Турции, ОАЭ и по всей Европе.",
    alternates: { canonical: `${SITE_URL}/ru/about/training-camps` },
    openGraph: {
      type: "website",
      url: `${SITE_URL}/ru/about/training-camps`,
      title: "Тренировочные сборы для футбольных команд | footballevents.eu",
      description: "Тренировочные сборы для команд и клубов: предсезонная подготовка, тактические сборы, международные базы.",
    },
  };
}

const campTypes = [
  {
    icon: Zap,
    title: "Предсезонные сборы",
    desc: "Фундамент успешного сезона. 7–14 дней интенсивных тренировок, контрольные матчи, выстраивание игровых связей в команде.",
  },
  {
    icon: Target,
    title: "Тактические сборы",
    desc: "Работа над конкретной игровой схемой, стандартными положениями, прессингом или позиционной атакой — глубокий тренировочный фокус.",
  },
  {
    icon: Dumbbell,
    title: "Физические сборы",
    desc: "Целенаправленная работа на физическую форму: выносливость, скорость, силовая подготовка. С профессиональными тренерами по физподготовке.",
  },
  {
    icon: Users,
    title: "Командообразующие сборы",
    desc: "Психология команды, доверие, коммуникация. Сочетание тренировок, командных активностей и разбора конфликтных ситуаций.",
  },
  {
    icon: BarChart3,
    title: "Сборы с видеоанализом",
    desc: "Базы, оснащённые системами видеозаписи. Каждая тренировка и матч — в разборе с тренерами. Ускоренный прогресс через данные.",
  },
  {
    icon: Shield,
    title: "Детские и юношеские сборы",
    desc: "Специализированные программы развития для клубной академии. Работа с группами U8–U21 по методикам ведущих школ Европы.",
  },
];

const destinations = [
  { flag: "🇪🇸", country: "Испания", note: "Малага, Аликанте, Барселона" },
  { flag: "🇵🇹", country: "Португалия", note: "Алгарве, Лиссабон" },
  { flag: "🇹🇷", country: "Турция", note: "Анталья — популярный зимний вариант" },
  { flag: "🇦🇪", country: "ОАЭ", note: "Дубай — январь-февраль" },
  { flag: "🇨🇿", country: "Чехия", note: "Прага и регионы" },
  { flag: "🇵🇱", country: "Польша", note: "Поморье, Силезия" },
  { flag: "🇭🇷", country: "Хорватия", note: "Адриатическое побережье" },
  { flag: "🇩🇪", country: "Германия", note: "Бавария, Северный Рейн" },
];

const benefitsForOrg = [
  "Публикуй программу сборов с полным описанием баз и услуг",
  "Принимай заявки от команд из любой страны онлайн",
  "Видимость в каталоге без рекламных вложений",
  "Featured-страница с фото полей, питания, жилья",
  "Инструменты для командных заявок — несколько игроков в одной форме",
];

export default async function TrainingCampsAboutPage({
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
        title="Тренировочные сборы для команд"
        subtitle="Предсезонная подготовка, тактические и физические сборы, международные базы — находи программу и базу для своей команды в любой точке мира."
        breadcrumbs={[
          { href: "/", label: "Главная" },
          { href: "/about", label: "О проекте" },
          { label: "Сборы" },
        ]}
      >
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="accent" size="lg">
            <Link href="/events">Найти сборы</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/organizer/events/new">Разместить программу сборов</Link>
          </Button>
        </div>
      </PageHeader>

      {/* Why */}
      <Container className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
            Сборы решают
          </h2>
          <p className="mt-4 leading-relaxed text-[var(--color-muted-strong)]">
            Команды, которые проводят сборы, стартуют в сезон с преимуществом. Не просто физическим —
            тактическим и психологическим. Общее время вне привычной обстановки, совместный разбор
            игры, доверие, которое строится на поле — это то, что нельзя купить, но можно создать
            на правильном сборе.
          </p>
          <p className="mt-4 leading-relaxed text-[var(--color-muted-strong)]">
            footballevents.eu собирает организаторов сборов с лучших тренировочных баз Европы и мира.
            Фильтруй по стране, датам, вместимости, уровню оснащения — и находи программу,
            которая подойдёт твоей команде.
          </p>
        </div>
      </Container>

      {/* Types */}
      <div className="bg-[var(--color-surface-muted,#F4F6FA)] py-16 sm:py-20">
        <Container>
          <h2 className="mb-10 font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
            Форматы сборов
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {campTypes.map((c) => (
              <div
                key={c.title}
                className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
              >
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-[var(--radius-lg)] bg-rose-50">
                  <c.icon className="h-5 w-5 text-rose-600" />
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

      {/* Destinations */}
      <Container className="py-16 sm:py-20">
        <h2 className="mb-8 font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
          Популярные направления
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {destinations.map((d) => (
            <div
              key={d.country}
              className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
            >
              <div className="mb-1 flex items-center gap-2">
                <span className="text-2xl">{d.flag}</span>
                <span className="font-semibold text-[var(--color-foreground)]">{d.country}</span>
              </div>
              <div className="text-xs text-[var(--color-muted)]">{d.note}</div>
            </div>
          ))}
        </div>
        <p className="mt-6 flex items-center gap-2 text-sm text-[var(--color-muted)]">
          <MapPin className="h-4 w-4" />
          Это лишь часть направлений — в каталоге регулярно появляются новые базы.
        </p>
      </Container>

      {/* For providers */}
      <div className="bg-[var(--color-surface-muted,#F4F6FA)] py-16">
        <Container>
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="mb-3 inline-flex items-center rounded-full border border-[var(--color-pitch-200)] bg-[var(--color-pitch-50)] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-pitch-700)]">
                Для организаторов сборов
              </div>
              <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
                Заполни базу командами со всего мира
              </h2>
              <p className="mt-4 leading-relaxed text-[var(--color-muted-strong)]">
                Организаторы тренировочных баз и сборов используют footballevents.eu как канал привлечения
                международных команд. Без языковых барьеров и сложной логистики продаж — страница на платформе
                говорит сама за себя.
              </p>
              <ul className="mt-6 space-y-2">
                {benefitsForOrg.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm text-[var(--color-muted-strong)]">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-pitch-700)]" />
                    {b}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Button asChild variant="accent">
                  <Link href="/about/for-organizers">Разместить программу <ArrowRight className="ml-1 h-4 w-4" /></Link>
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              {[
                { icon: CalendarDays, label: "Гибкие даты", val: "Несколько программ в разные периоды сезона" },
                { icon: Users, label: "Командные заявки", val: "Форма для команды целиком — не отдельных игроков" },
                { icon: MapPin, label: "Карта и инфраструктура", val: "Показывай поля, залы, питание, жильё" },
                { icon: BarChart3, label: "Аналитика", val: "Просмотры, заявки, конверсия — в кабинете организатора" },
              ].map((f) => (
                <div
                  key={f.label}
                  className="flex items-center gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4"
                >
                  <f.icon className="h-5 w-5 shrink-0 text-[var(--color-pitch-700)]" />
                  <div>
                    <div className="text-sm font-semibold text-[var(--color-foreground)]">{f.label}</div>
                    <div className="text-xs text-[var(--color-muted)]">{f.val}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </div>

      {/* CTA */}
      <div className="bg-[var(--color-foreground)] py-16">
        <Container>
          <div className="text-center">
            <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-white sm:text-3xl">
              Найди сборы для своей команды
            </h2>
            <p className="mt-3 text-white/70">Тренировочные базы и программы по всей Европе и миру</p>
            <div className="mt-8">
              <Button asChild variant="accent" size="lg">
                <Link href="/events">Смотреть все сборы</Link>
              </Button>
            </div>
          </div>
        </Container>
      </div>
    </>
  );
}
