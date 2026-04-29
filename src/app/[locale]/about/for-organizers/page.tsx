import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/site/PageHeader";
import { Button } from "@/components/ui/Button";
import {
  BarChart3,
  Globe,
  ClipboardList,
  Zap,
  Star,
  Shield,
  CheckCircle2,
  ArrowRight,
  Trophy,
  Users,
  Megaphone,
  CreditCard,
} from "lucide-react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://footballevents.eu";

export function generateMetadata(): Metadata {
  return {
    title: "Для организаторов футбольных мероприятий | footballevents.eu",
    description:
      "Инструменты для организаторов футбольных турниров, лагерей и фестивалей: онлайн-заявки, продвижение через Featured и бусты, аналитика. Бесплатный старт — платные возможности по запросу.",
    alternates: { canonical: `${SITE_URL}/ru/about/for-organizers` },
    openGraph: {
      type: "website",
      url: `${SITE_URL}/ru/about/for-organizers`,
      title: "Для организаторов | footballevents.eu",
      description: "Онлайн-заявки, Featured, бусты и аналитика для организаторов футбольных мероприятий.",
    },
  };
}

const features = [
  {
    icon: Globe,
    title: "Международная аудитория",
    desc: "Ваше мероприятие увидят участники из 50+ стран. Без таргетированной рекламы и языковых барьеров — платформа сама мультиязычная.",
  },
  {
    icon: ClipboardList,
    title: "Онлайн-заявки",
    desc: "Участники подают заявку прямо на сайте. Вы видите все запросы в кабинете, отвечаете, меняете статус. Ничего лишнего.",
  },
  {
    icon: Zap,
    title: "Бусты и Featured",
    desc: "Хотите больше просмотров? Поднимите мероприятие на первую позицию или в карусель главной страницы — за один клик.",
  },
  {
    icon: BarChart3,
    title: "Аналитика",
    desc: "Просмотры страницы, количество заявок, источники трафика. Понимайте, что работает, и улучшайте события с каждым разом.",
  },
  {
    icon: Shield,
    title: "Верифицированный профиль",
    desc: "Бейдж Verified показывает участникам, что организатор прошёл модерацию и является надёжным. Доверие = больше заявок.",
  },
  {
    icon: Star,
    title: "Галерея и медиа",
    desc: "Добавляйте фото, программу, YouTube-видео (тариф Premium). Страница события — ваша витрина, а не строчка в таблице.",
  },
];

const tiers = [
  {
    name: "Free",
    price: "€0",
    desc: "Попробовать без риска",
    features: [
      "До 3 активных событий",
      "Базовая страница события",
      "Онлайн-заявки",
      "Профиль организатора",
    ],
    cta: "Начать бесплатно",
    href: "/sign-up",
    highlight: false,
  },
  {
    name: "Pro",
    price: "€9.90/мес",
    desc: "Для тех, кто проводит несколько мероприятий",
    features: [
      "Неограниченные события",
      "Галерея фото",
      "Расписание и программа",
      "1 бесплатный Basic-буст/мес",
      "Аналитика события",
      "Приоритетная поддержка",
    ],
    cta: "Начать",
    href: "/pricing",
    highlight: true,
  },
  {
    name: "Premium",
    price: "€49/мес",
    desc: "Для агентств и крупных операторов",
    features: [
      "Всё из Pro",
      "YouTube/Vimeo embed в hero",
      "3 бесплатных Basic-буста/мес",
      "Featured-карусель главной",
      "Sharing Kit для соцсетей",
      "Персональный менеджер",
    ],
    cta: "Начать",
    href: "/pricing",
    highlight: false,
  },
  {
    name: "Enterprise",
    price: "По запросу",
    desc: "Федерации и white-label",
    features: [
      "Всё из Premium",
      "White-label решение",
      "Выделенный менеджер",
      "SLA и интеграции",
    ],
    cta: "Связаться с нами",
    href: "/contact",
    highlight: false,
  },
];

const steps = [
  { num: "01", title: "Создай профиль", desc: "Название, описание, логотип. 5 минут — и ты на платформе." },
  { num: "02", title: "Опубликуй мероприятие", desc: "Дата, место, категория, цена, описание. Черновик перед публикацией." },
  { num: "03", title: "Получай заявки", desc: "Уведомление на email и в кабинете при каждой новой заявке." },
  { num: "04", title: "Управляй участниками", desc: "Подтверждай, отклоняй, переписывайся прямо в платформе." },
];

export default async function ForOrganizersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <PageHeader
        eyebrow="Для организаторов"
        title="Размести мероприятие — получи участников со всего мира"
        subtitle="footballevents.eu — это международная витрина для вашего турнира, лагеря или фестиваля. Онлайн-заявки, продвижение, аналитика — всё в одном месте."
        breadcrumbs={[
          { href: "/", label: "Главная" },
          { href: "/about", label: "О проекте" },
          { label: "Для организаторов" },
        ]}
      >
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="accent" size="lg">
            <Link href="/onboarding">Стать организатором</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/pricing">Посмотреть тарифы</Link>
          </Button>
        </div>
      </PageHeader>

      {/* Problem/Solution */}
      <Container className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
            Вы устали от Facebook, таблиц и мессенджеров?
          </h2>
          <p className="mt-4 leading-relaxed text-[var(--color-muted-strong)]">
            Большинство организаторов собирают заявки через Google Forms, ведут участников в Excel,
            анонсируют в группах Facebook где пост живёт 2 дня — и теряют потенциальных участников,
            которые просто не нашли информацию вовремя.
          </p>
          <p className="mt-4 leading-relaxed text-[var(--color-muted-strong)]">
            footballevents.eu заменяет всю эту цепочку. Страница события работает круглосуточно,
            принимает заявки автоматически, ранжируется в поисковиках — и показывает ваше мероприятие
            аудитории, которая уже ищет именно то, что вы предлагаете.
          </p>
        </div>
      </Container>

      {/* Features */}
      <div className="bg-[var(--color-surface-muted,#F4F6FA)] py-16 sm:py-20">
        <Container>
          <h2 className="mb-10 font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
            Что даёт платформа организатору
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
              >
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-pitch-50)]">
                  <f.icon className="h-5 w-5 text-[var(--color-pitch-700)]" />
                </div>
                <h3 className="font-[family-name:var(--font-manrope)] font-semibold text-[var(--color-foreground)]">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">{f.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </div>

      {/* How it works */}
      <Container className="py-16 sm:py-20">
        <h2 className="mb-10 font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
          Как начать за 10 минут
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.num}>
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

      {/* Tiers */}
      <div className="bg-[var(--color-surface-muted,#F4F6FA)] py-16 sm:py-20">
        <Container>
          <div className="mb-10 text-center">
            <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
              Тарифы
            </h2>
            <p className="mt-3 text-[var(--color-muted-strong)]">
              Бесплатный старт. Платите только когда хотите расти быстрее.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {tiers.map((t) => (
              <div
                key={t.name}
                className={`flex flex-col rounded-[var(--radius-xl)] border p-7 ${
                  t.highlight
                    ? "border-[var(--color-pitch-700)] bg-[var(--color-surface)] shadow-[var(--shadow-lg)]"
                    : "border-[var(--color-border)] bg-[var(--color-surface)]"
                }`}
              >
                {t.highlight && (
                  <div className="mb-4 inline-flex w-fit items-center rounded-full bg-[var(--color-pitch-700)] px-3 py-1 text-xs font-semibold text-white">
                    Популярный
                  </div>
                )}
                <div className="font-[family-name:var(--font-manrope)] text-lg font-bold text-[var(--color-foreground)]">
                  {t.name}
                </div>
                <div className="mt-1 font-[family-name:var(--font-manrope)] text-3xl font-bold text-[var(--color-foreground)]">
                  {t.price}
                </div>
                <div className="mt-1 text-sm text-[var(--color-muted)]">{t.desc}</div>
                <ul className="mt-6 flex-1 space-y-2">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-[var(--color-muted-strong)]">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-pitch-700)]" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  variant={t.highlight ? "accent" : "outline"}
                  className="mt-8"
                >
                  <Link href={t.href}>{t.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
        </Container>
      </div>

      {/* Testimonial */}
      <Container className="py-16">
        <div className="mx-auto max-w-2xl rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8">
          <Megaphone className="mb-4 h-8 w-8 text-[var(--color-pitch-700)]" />
          <blockquote className="text-lg font-medium leading-relaxed text-[var(--color-foreground)]">
            «После размещения на footballevents.eu мы получили заявки из 7 стран, которых раньше
            вообще не было в нашей аудитории. Весь процесс — регистрация, публикация и первая заявка —
            занял меньше дня.»
          </blockquote>
          <div className="mt-4 text-sm text-[var(--color-muted)]">Организатор ежегодного турнира U14, Варшава</div>
        </div>
      </Container>

      {/* CTA */}
      <div className="bg-[var(--color-foreground)] py-16">
        <Container>
          <div className="text-center">
            <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-white sm:text-3xl">
              Готов разместить своё мероприятие?
            </h2>
            <p className="mt-3 text-white/70">Бесплатный старт — никаких обязательств</p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button asChild variant="accent" size="lg">
                <Link href="/onboarding">Создать профиль организатора</Link>
              </Button>
              <Button asChild variant="white" size="lg">
                <Link href="/pricing">Подробнее о тарифах</Link>
              </Button>
            </div>
          </div>
        </Container>
      </div>
    </>
  );
}
