import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/site/PageHeader";
import { Button } from "@/components/ui/Button";
import {
  Trophy,
  Tent,
  Star,
  Plane,
  Dumbbell,
  Target,
  Globe,
  Users,
  Building2,
  CheckCircle2,
  ArrowRight,
  Zap,
  Shield,
  BarChart3,
} from "lucide-react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://footballevents.eu";

export function generateMetadata(): Metadata {
  return {
    title: "О проекте | footballevents.eu — Премиум-каталог футбольных мероприятий",
    description:
      "footballevents.eu — международный каталог футбольных мероприятий: турниры, лагеря, сборы, фестивали, туры на матчи и просмотры в академиях по всему миру. Для организаторов, клубов и игроков.",
    alternates: { canonical: `${SITE_URL}/ru/about` },
    openGraph: {
      type: "website",
      url: `${SITE_URL}/ru/about`,
      title: "О проекте | footballevents.eu",
      description:
        "Международный каталог футбольных мероприятий — турниры, лагеря, сборы, фестивали, туры на матчи и просмотры в академиях.",
    },
  };
}

const categories = [
  {
    href: "/about/tournaments",
    icon: Trophy,
    label: "Турниры",
    desc: "Любительские, юношеские и профессиональные соревнования со всех континентов",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    href: "/about/camps",
    icon: Tent,
    label: "Лагеря",
    desc: "Футбольные кэмпы с топовыми тренерами для детей, подростков и взрослых",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    href: "/about/festivals",
    icon: Star,
    label: "Фестивали",
    desc: "Многодневные праздники футбола с турнирами, мастер-классами и культурой игры",
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    href: "/about/match-tours",
    icon: Plane,
    label: "Туры на матчи",
    desc: "Организованные поездки на матчи топовых лиг: АПЛ, Примера, Лига Чемпионов",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    href: "/about/training-camps",
    icon: Dumbbell,
    label: "Сборы",
    desc: "Тренировочные сборы для команд и клубов. Предсезонная и тактическая подготовка",
    color: "text-rose-600",
    bg: "bg-rose-50",
  },
  {
    href: "/about/academy-trials",
    icon: Target,
    label: "Просмотры",
    desc: "Просмотры в футбольных академиях — шанс попасть в профессиональную систему",
    color: "text-cyan-600",
    bg: "bg-cyan-50",
  },
];

const forWhom = [
  {
    href: "/about/for-organizers",
    icon: BarChart3,
    title: "Организаторам",
    desc: "Размести мероприятие, принимай заявки онлайн, продвигай через Featured и бусты — и получай участников со всего мира.",
    cta: "Подробнее для организаторов",
  },
  {
    href: "/about/for-clubs",
    icon: Building2,
    title: "Клубам",
    desc: "Регистрируй команды на турниры, организуй сборы на лучших базах Европы, продвигай собственные события клуба.",
    cta: "Подробнее для клубов",
  },
  {
    href: "/about/for-players",
    icon: Users,
    title: "Игрокам и родителям",
    desc: "Находи турниры, лагеря и просмотры в академиях. Фильтруй по возрасту, уровню и стране. Подавай заявку в один клик.",
    cta: "Подробнее для игроков",
  },
];

const benefits = [
  { icon: Globe, title: "50+ стран", desc: "Мероприятия со всех континентов в едином каталоге" },
  { icon: Zap, title: "Заявки онлайн", desc: "Без звонков и мессенджеров — форма, подтверждение, трекинг" },
  { icon: Shield, title: "Верифицированные организаторы", desc: "Каждый организатор проходит модерацию платформы" },
  { icon: CheckCircle2, title: "Бесплатно для участников", desc: "Регистрация и поиск событий всегда бесплатны" },
];

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <PageHeader
        eyebrow="Кто мы"
        title="Здесь играет весь мир"
        subtitle="footballevents.eu — международный каталог футбольных мероприятий. Помогаем организаторам находить участников, а игрокам — правильные события."
        breadcrumbs={[{ href: "/", label: "Главная" }, { label: "О проекте" }]}
      />

      {/* Stats strip */}
      <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <Container>
          <div className="grid grid-cols-2 divide-x divide-[var(--color-border)] py-8 sm:grid-cols-4">
            {[
              { num: "50+", label: "стран" },
              { num: "1 000+", label: "мероприятий" },
              { num: "200+", label: "организаторов" },
              { num: "6", label: "форматов событий" },
            ].map((s) => (
              <div key={s.label} className="px-6 text-center first:pl-0 last:pr-0">
                <div className="font-[family-name:var(--font-manrope)] text-3xl font-bold text-[var(--color-foreground)]">
                  {s.num}
                </div>
                <div className="mt-1 text-sm text-[var(--color-muted)]">{s.label}</div>
              </div>
            ))}
          </div>
        </Container>
      </div>

      {/* Mission */}
      <Container className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
            Зачем мы создали этот каталог
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[var(--color-muted-strong)] sm:text-lg">
            Мы сами организаторы. Проводим футбольные кэмпы и знаем, как сложно найти участников без дорогой
            рекламы. Информация о событиях расползается по группам в Facebook, устаревшим сайтам и разрозненным
            чатам. Хорошие мероприятия остаются невидимыми — просто потому что негде показаться.
          </p>
          <p className="mt-4 text-base leading-relaxed text-[var(--color-muted-strong)] sm:text-lg">
            footballevents.eu — это каталог, которого нам самим не хватало. Премиум-витрина для организаторов и
            удобный поиск для игроков, клубов и родителей. Одна платформа — все форматы футбольных событий.
          </p>
        </div>
      </Container>

      {/* 6 formats */}
      <div className="bg-[var(--color-surface-muted,#F4F6FA)] py-16 sm:py-20">
        <Container>
          <div className="mb-10 text-center">
            <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
              Шесть форматов — одна платформа
            </h2>
            <p className="mt-3 text-[var(--color-muted-strong)]">
              Найди нужный формат или размести своё мероприятие в соответствующей категории
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="group flex gap-4 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 transition-shadow hover:shadow-[var(--shadow-md)]"
              >
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-lg)] ${c.bg}`}>
                  <c.icon className={`h-5 w-5 ${c.color}`} />
                </div>
                <div>
                  <div className="font-[family-name:var(--font-manrope)] font-semibold text-[var(--color-foreground)] group-hover:text-[var(--color-pitch-700)]">
                    {c.label}
                  </div>
                  <div className="mt-1 text-sm leading-relaxed text-[var(--color-muted)]">{c.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </div>

      {/* For whom */}
      <Container className="py-16 sm:py-20">
        <div className="mb-10 text-center">
          <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
            Для кого
          </h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {forWhom.map((f) => (
            <div
              key={f.href}
              className="flex flex-col rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-7"
            >
              <f.icon className="mb-4 h-8 w-8 text-[var(--color-pitch-700)]" />
              <h3 className="font-[family-name:var(--font-manrope)] text-lg font-bold text-[var(--color-foreground)]">
                {f.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--color-muted-strong)]">{f.desc}</p>
              <Link
                href={f.href}
                className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-pitch-700)] hover:underline"
              >
                {f.cta} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </Container>

      {/* Benefits */}
      <div className="bg-[var(--color-surface-muted,#F4F6FA)] py-16 sm:py-20">
        <Container>
          <div className="mb-10 text-center">
            <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
              Почему footballevents.eu
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((b) => (
              <div key={b.title} className="rounded-[var(--radius-xl)] bg-[var(--color-surface)] p-6 text-center">
                <b.icon className="mx-auto mb-3 h-8 w-8 text-[var(--color-pitch-700)]" />
                <div className="font-[family-name:var(--font-manrope)] font-bold text-[var(--color-foreground)]">
                  {b.title}
                </div>
                <div className="mt-1 text-sm text-[var(--color-muted)]">{b.desc}</div>
              </div>
            ))}
          </div>
        </Container>
      </div>

      {/* About company */}
      <Container className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
            О компании
          </h2>
          <p className="mt-4 leading-relaxed text-[var(--color-muted-strong)]">
            Платформу развивает <strong>Goality Sport Group OÜ</strong> — спортивная компания из Таллинна, Эстония.
            Мы организуем собственные футбольные кэмпы и прекрасно понимаем, с какими трудностями сталкиваются
            организаторы: разрозненные анонсы, хаотичный сбор заявок, нулевая аналитика.
          </p>
          <p className="mt-4 leading-relaxed text-[var(--color-muted-strong)]">
            Для участников всё бесплатно. Для организаторов — бесплатный старт и платные инструменты продвижения
            (Featured-размещения, бусты, карусель на главной). Вопросы, пресса, партнёрства —
            пишите на <a href="mailto:support@footballevents.eu" className="font-medium text-[var(--color-pitch-700)] hover:underline">support@footballevents.eu</a>.
          </p>
        </div>
      </Container>

      {/* CTA */}
      <div className="bg-[var(--color-foreground)] py-16">
        <Container>
          <div className="text-center">
            <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-white sm:text-3xl">
              Начни прямо сейчас
            </h2>
            <p className="mt-3 text-white/70">Ищи мероприятие или размести своё — это бесплатно</p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button asChild variant="accent" size="lg">
                <Link href="/events">Найти мероприятие</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10">
                <Link href="/organizer/events/new">Разместить событие</Link>
              </Button>
            </div>
          </div>
        </Container>
      </div>
    </>
  );
}
