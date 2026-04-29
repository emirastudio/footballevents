import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/site/PageHeader";
import { Button } from "@/components/ui/Button";
import {
  Building2,
  Trophy,
  Dumbbell,
  Users,
  Globe,
  CheckCircle2,
  ArrowRight,
  Target,
  CalendarDays,
  BarChart3,
  Star,
} from "lucide-react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://footballevents.eu";

export function generateMetadata(): Metadata {
  return {
    title: "footballevents.eu для футбольных клубов | Турниры, сборы, игроки",
    description:
      "Как футбольный клуб может использовать footballevents.eu: поиск турниров для команд, организация тренировочных сборов, привлечение игроков через просмотры, продвижение клубных событий.",
    alternates: { canonical: `${SITE_URL}/ru/about/for-clubs` },
    openGraph: {
      type: "website",
      url: `${SITE_URL}/ru/about/for-clubs`,
      title: "footballevents.eu для клубов | Турниры, сборы, игроки",
      description: "Всё что нужно футбольному клубу: турниры, сборы, просмотры и продвижение — на одной платформе.",
    },
  };
}

const useCases = [
  {
    icon: Trophy,
    title: "Найди турниры для команд",
    desc: "Регистрируй одну или несколько команд клуба на турниры — от городских кубков до международных соревнований. Фильтрация по возрасту, уровню, стране.",
  },
  {
    icon: Dumbbell,
    title: "Организуй сборы",
    desc: "Найди тренировочные базы и программы сборов — предсезонные, тактические, международные. Одна форма заявки для всей команды.",
  },
  {
    icon: Target,
    title: "Проводи просмотры",
    desc: "Публикуй открытые просмотры в академию или основной состав. Получай заявки от игроков со всего мира — с данными, возрастом и позицией.",
  },
  {
    icon: Globe,
    title: "Продвигай клубные события",
    desc: "Проводишь турнир, лагерь, день открытых дверей? Размести на платформе — и получи аудиторию из 50+ стран без рекламного бюджета.",
  },
  {
    icon: Users,
    title: "Привлекай игроков",
    desc: "Открытые просмотры и клубные события на footballevents.eu — это лучший способ заявить о клубе для новых игроков, особенно международных.",
  },
  {
    icon: CalendarDays,
    title: "Планируй сезон",
    desc: "Каталог мероприятий помогает выстроить календарь команды: турниры, сборы, фестивали — всё в одном месте с фильтром по датам.",
  },
];

const clubBenefits = [
  "Единая платформа для всех активностей клуба",
  "Международная аудитория без рекламных вложений",
  "Онлайн-заявки на турниры и сборы — без бумаги",
  "Командные заявки: один раз — вся группа",
  "Верифицированный профиль организатора для доверия",
  "Аналитика по каждому мероприятию клуба",
];

const clubTypes = [
  { icon: "🏆", label: "Профессиональные клубы", desc: "Академии с системой юношеских команд" },
  { icon: "⚽", label: "Любительские клубы", desc: "Городские и районные клубы с несколькими составами" },
  { icon: "🎓", label: "Футбольные школы", desc: "Частные школы и секции, работающие с детьми" },
  { icon: "🤝", label: "Корпоративные команды", desc: "Корпоративные лиги и команды компаний" },
];

export default async function ForClubsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <PageHeader
        eyebrow="Для клубов"
        title="footballevents.eu для футбольных клубов"
        subtitle="Регистрируй команды на турниры, организуй сборы, проводи просмотры и продвигай клубные события — всё на одной платформе."
        breadcrumbs={[
          { href: "/", label: "Главная" },
          { href: "/about", label: "О проекте" },
          { label: "Для клубов" },
        ]}
      >
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="accent" size="lg">
            <Link href="/onboarding">Зарегистрировать клуб</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/events">Найти турнир</Link>
          </Button>
        </div>
      </PageHeader>

      {/* Intro */}
      <Container className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
            Один инструмент — все задачи клуба
          </h2>
          <p className="mt-4 leading-relaxed text-[var(--color-muted-strong)]">
            Современный футбольный клуб занимается сразу многим: играет в турнирах, ищет новых игроков,
            проводит сборы, организует собственные мероприятия. Всё это обычно рассыпано по разным
            таблицам, мессенджерам и сайтам.
          </p>
          <p className="mt-4 leading-relaxed text-[var(--color-muted-strong)]">
            footballevents.eu закрывает весь этот цикл: как инструмент поиска (находи турниры и сборы)
            и как инструмент продвижения (публикуй свои мероприятия и просмотры для международной аудитории).
          </p>
        </div>
      </Container>

      {/* Who is it for */}
      <div className="bg-[var(--color-surface-muted,#F4F6FA)] py-12">
        <Container>
          <h2 className="mb-8 font-[family-name:var(--font-manrope)] text-xl font-bold text-[var(--color-foreground)]">
            Кому подходит
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {clubTypes.map((c) => (
              <div
                key={c.label}
                className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
              >
                <div className="mb-2 text-3xl">{c.icon}</div>
                <div className="font-semibold text-[var(--color-foreground)]">{c.label}</div>
                <div className="mt-1 text-sm text-[var(--color-muted)]">{c.desc}</div>
              </div>
            ))}
          </div>
        </Container>
      </div>

      {/* Use cases */}
      <Container className="py-16 sm:py-20">
        <h2 className="mb-10 font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
          Что делает клуб на платформе
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {useCases.map((u) => (
            <div
              key={u.title}
              className="flex gap-4 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-pitch-50)]">
                <u.icon className="h-5 w-5 text-[var(--color-pitch-700)]" />
              </div>
              <div>
                <h3 className="font-[family-name:var(--font-manrope)] font-semibold text-[var(--color-foreground)]">
                  {u.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-[var(--color-muted)]">{u.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>

      {/* Benefits */}
      <div className="bg-[var(--color-surface-muted,#F4F6FA)] py-16">
        <Container>
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
                Преимущества для клуба
              </h2>
              <ul className="mt-6 space-y-3">
                {clubBenefits.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm text-[var(--color-muted-strong)]">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-pitch-700)]" />
                    {b}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Button asChild variant="accent">
                  <Link href="/onboarding">Зарегистрировать клуб <ArrowRight className="ml-1 h-4 w-4" /></Link>
                </Button>
              </div>
            </div>
            <div className="rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8">
              <Star className="mb-4 h-8 w-8 text-amber-500" />
              <blockquote className="text-lg font-medium leading-relaxed text-[var(--color-foreground)]">
                «Раньше мы искали турниры через знакомых или в Facebook-группах. Теперь открываем каталог,
                фильтруем по возрасту команды — и через 5 минут уже подаём заявку. Плюс сами разместили
                свой летний турнир и получили команды из трёх стран.»
              </blockquote>
              <div className="mt-4 text-sm text-[var(--color-muted)]">Директор любительского клуба, Рига</div>
            </div>
          </div>
        </Container>
      </div>

      {/* CTA */}
      <div className="bg-[var(--color-foreground)] py-16">
        <Container>
          <div className="text-center">
            <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-white sm:text-3xl">
              Зарегистрируй клуб — это бесплатно
            </h2>
            <p className="mt-3 text-white/70">Первые мероприятия и профиль организатора — бесплатно навсегда</p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button asChild variant="accent" size="lg">
                <Link href="/onboarding">Создать профиль клуба</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10">
                <Link href="/events">Найти турниры и сборы</Link>
              </Button>
            </div>
          </div>
        </Container>
      </div>
    </>
  );
}
