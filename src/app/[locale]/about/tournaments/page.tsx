import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/site/PageHeader";
import { Button } from "@/components/ui/Button";
import {
  Trophy,
  Globe,
  Users,
  ClipboardList,
  Filter,
  Star,
  ArrowRight,
  CheckCircle2,
  MapPin,
  CalendarDays,
} from "lucide-react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://footballevents.eu";

export function generateMetadata(): Metadata {
  return {
    title: "Футбольные турниры по всему миру | footballevents.eu",
    description:
      "Каталог футбольных турниров для любителей, юношей, корпораций и полупрофессионалов. Соревнования со всех континентов — фильтруй по возрасту, уровню и стране, подавай заявку онлайн.",
    alternates: { canonical: `${SITE_URL}/ru/about/tournaments` },
    openGraph: {
      type: "website",
      url: `${SITE_URL}/ru/about/tournaments`,
      title: "Футбольные турниры по всему миру | footballevents.eu",
      description:
        "Турниры по футболу для любителей, юношей и полупрофессионалов — каталог соревнований со всего мира.",
    },
  };
}

const types = [
  {
    icon: Users,
    title: "Юношеские турниры",
    desc: "Соревнования от U7 до U21. Развивающие форматы, международные чемпионаты, академические отборы. Для детей и подростков.",
  },
  {
    icon: Trophy,
    title: "Любительские кубки",
    desc: "Лиги выходного дня, городские кубки, корпоративные чемпионаты. Играй без профессионального контракта — в своё удовольствие.",
  },
  {
    icon: Globe,
    title: "Международные турниры",
    desc: "Приглашённые команды из разных стран. Настоящий international experience — новые соперники, новые связи, новый уровень.",
  },
  {
    icon: Star,
    title: "Полупрофессиональные",
    desc: "Соревнования для игроков с серьёзными амбициями. Качественный уровень игры, профессиональные судьи, разбор матчей.",
  },
];

const howItWorks = [
  { num: "01", title: "Найди турнир", desc: "Используй фильтры по стране, возрастной группе, уровню и датам" },
  { num: "02", title: "Изучи детали", desc: "Расписание, правила, взносы, место проведения — всё на странице события" },
  { num: "03", title: "Подай заявку", desc: "Онлайн-форма за 2 минуты. Никаких звонков, мессенджеров и ожидания" },
  { num: "04", title: "Получи подтверждение", desc: "Организатор рассмотрит заявку и свяжется с тобой на платформе" },
];

const organizerBenefits = [
  "Аудитория с 50+ стран — без дорогой рекламы",
  "Онлайн-заявки и управление участниками в кабинете",
  "Featured-размещение и бусты для максимальной видимости",
  "Аналитика: просмотры, заявки, конверсия",
  "Верифицированный бейдж — доверие участников",
];

export default async function TournamentsAboutPage({
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
        title="Футбольные турниры со всего мира"
        subtitle="От дворовых кубков до международных чемпионатов — находи соревнование своего уровня в любой стране мира и подавай заявку онлайн."
        breadcrumbs={[
          { href: "/", label: "Главная" },
          { href: "/about", label: "О проекте" },
          { label: "Турниры" },
        ]}
      >
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="accent" size="lg">
            <Link href="/categories/tournaments">Смотреть турниры</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/organizer/events/new">Разместить турнир</Link>
          </Button>
        </div>
      </PageHeader>

      {/* Why tournaments */}
      <Container className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
            Почему турнир — лучший способ расти
          </h2>
          <p className="mt-4 leading-relaxed text-[var(--color-muted-strong)]">
            Турнир — это концентрат опыта. За один уикенд игрок получает больше игровых ситуаций, давления и
            обратной связи, чем за месяц тренировок. Именно поэтому лучшие академии мира строят свои программы
            развития вокруг соревновательной практики.
          </p>
          <p className="mt-4 leading-relaxed text-[var(--color-muted-strong)]">
            На footballevents.eu собраны турниры из более чем 50 стран — от локальных городских кубков до
            крупных международных турниров с участием команд из 20+ государств. Фильтруй по возрасту, уровню,
            формату и стране — находи именно то, что нужно тебе или твоей команде.
          </p>
        </div>
      </Container>

      {/* Types grid */}
      <div className="bg-[var(--color-surface-muted,#F4F6FA)] py-16 sm:py-20">
        <Container>
          <h2 className="mb-10 font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
            Какие турниры найдёшь в каталоге
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {types.map((t) => (
              <div
                key={t.title}
                className="flex gap-5 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-amber-50">
                  <t.icon className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-[family-name:var(--font-manrope)] font-semibold text-[var(--color-foreground)]">
                    {t.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--color-muted)]">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </div>

      {/* How it works */}
      <Container className="py-16 sm:py-20">
        <h2 className="mb-10 font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
          Как найти и подать заявку
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {howItWorks.map((s) => (
            <div key={s.num} className="relative">
              <div className="mb-3 font-[family-name:var(--font-manrope)] text-4xl font-bold text-[var(--color-border)]">
                {s.num}
              </div>
              <h3 className="font-[family-name:var(--font-manrope)] font-semibold text-[var(--color-foreground)]">
                {s.title}
              </h3>
              <p className="mt-1 text-sm text-[var(--color-muted)]">{s.desc}</p>
            </div>
          ))}
        </div>
      </Container>

      {/* For organizers */}
      <div className="bg-[var(--color-surface-muted,#F4F6FA)] py-16 sm:py-20">
        <Container>
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="mb-3 inline-flex items-center rounded-full border border-[var(--color-pitch-200)] bg-[var(--color-pitch-50)] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-pitch-700)]">
                Для организаторов
              </div>
              <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
                Размести турнир — и получи заявки из 50+ стран
              </h2>
              <p className="mt-4 leading-relaxed text-[var(--color-muted-strong)]">
                footballevents.eu — это лучший способ дать турниру международную видимость без дорогостоящей
                рекламы. Организаторы с Premium-тарифом регулярно получают заявки из стран, куда
                они никогда не «заходили» самостоятельно.
              </p>
              <ul className="mt-6 space-y-2">
                {organizerBenefits.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm text-[var(--color-muted-strong)]">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-pitch-700)]" />
                    {b}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Button asChild variant="accent">
                  <Link href="/about/for-organizers">Подробнее для организаторов <ArrowRight className="ml-1 h-4 w-4" /></Link>
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              {[
                { icon: MapPin, label: "Любая страна", val: "Укажи город или страну — участники найдут тебя" },
                { icon: Filter, label: "Умные фильтры", val: "Возраст, формат, уровень — твой турнир точно в нужной выдаче" },
                { icon: ClipboardList, label: "Заявки в кабинете", val: "Все запросы, контакты и статусы — в одном месте" },
                { icon: CalendarDays, label: "Живой каталог", val: "Страница мероприятия обновляется в реальном времени" },
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
              Найди свой турнир
            </h2>
            <p className="mt-3 text-white/70">Более 1 000 мероприятий из 50+ стран — прямо сейчас</p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button asChild variant="accent" size="lg">
                <Link href="/categories/tournaments">Смотреть все турниры</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10">
                <Link href="/organizer/events/new">Разместить турнир</Link>
              </Button>
            </div>
          </div>
        </Container>
      </div>
    </>
  );
}
