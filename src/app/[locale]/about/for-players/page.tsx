import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/site/PageHeader";
import { Button } from "@/components/ui/Button";
import {
  Users,
  Search,
  ClipboardList,
  Target,
  Globe,
  Heart,
  Star,
  CheckCircle2,
  ArrowRight,
  Trophy,
  Tent,
  Filter,
  BellRing,
} from "lucide-react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://footballevents.eu";

export function generateMetadata(): Metadata {
  return {
    title: "Для игроков и родителей | footballevents.eu — Найди мероприятие",
    description:
      "Каталог футбольных мероприятий для игроков и родителей: турниры, лагеря, просмотры в академиях, тренировочные сборы. Фильтруй по возрасту, уровню и стране. Подавай заявку онлайн.",
    alternates: { canonical: `${SITE_URL}/ru/about/for-players` },
    openGraph: {
      type: "website",
      url: `${SITE_URL}/ru/about/for-players`,
      title: "Для игроков и родителей | footballevents.eu",
      description: "Находи турниры, лагеря и просмотры в академиях — фильтр по возрасту, уровню и стране.",
    },
  };
}

const features = [
  {
    icon: Search,
    title: "Умный поиск",
    desc: "Введи город, возраст или формат — система покажет релевантные мероприятия. Без лишнего шума.",
  },
  {
    icon: Filter,
    title: "Точные фильтры",
    desc: "Возрастная группа, уровень игры, тип события, страна, даты, стоимость. Находи именно то, что нужно.",
  },
  {
    icon: ClipboardList,
    title: "Заявка в один клик",
    desc: "Никаких email-переписок и мессенджеров. Форма на сайте — и организатор получит запрос автоматически.",
  },
  {
    icon: BellRing,
    title: "Трекинг статуса",
    desc: "Подал заявку — следи за статусом в личном кабинете. Организатор ответит прямо на платформе.",
  },
  {
    icon: Heart,
    title: "Избранное",
    desc: "Сохраняй мероприятия, которые понравились. Возвращайся, когда будешь готов записаться.",
  },
  {
    icon: Globe,
    title: "Весь мир в одном месте",
    desc: "Местные турниры и международные кэмпы в Испании — рядом, в одном каталоге. Выбирай масштаб.",
  },
];

const journeySteps = [
  { icon: Search, label: "Ищи", desc: "Используй поиск и фильтры — по возрасту, типу, стране, дате" },
  { icon: ClipboardList, label: "Подавай заявку", desc: "Заполни форму прямо на странице мероприятия" },
  { icon: BellRing, label: "Жди ответа", desc: "Организатор рассмотрит заявку и ответит в кабинете" },
  { icon: Trophy, label: "Участвуй", desc: "Получи подтверждение — и готовься к мероприятию!" },
];

const forParents = [
  "Прозрачная информация: цена, программа, тренеры, адрес",
  "Верифицированные организаторы — платформа проверила каждого",
  "Онлайн-оплата через безопасный платёжный шлюз (Stripe)",
  "Контакт с организатором прямо через платформу",
  "Отзывы других родителей о мероприятиях",
  "Уведомления об изменениях в событии",
];

const eventTypes = [
  { href: "/about/tournaments", icon: Trophy, label: "Турниры", desc: "Соревнования от U7 до взрослых" },
  { href: "/about/camps", icon: Tent, label: "Лагеря", desc: "Летние кэмпы и интенсивы" },
  { href: "/about/academy-trials", icon: Target, label: "Просмотры", desc: "В академии Европы" },
  { href: "/about/training-camps", icon: Users, label: "Сборы", desc: "Для команд и групп" },
];

export default async function ForPlayersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <PageHeader
        eyebrow="Для игроков и родителей"
        title="Найди мероприятие мечты"
        subtitle="Турниры, лагеря, просмотры в академиях — в одном каталоге. Фильтруй по возрасту, уровню и стране, подавай заявку онлайн без звонков."
        breadcrumbs={[
          { href: "/", label: "Главная" },
          { href: "/about", label: "О проекте" },
          { label: "Для игроков" },
        ]}
      >
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="accent" size="lg">
            <Link href="/events">Найти мероприятие</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/sign-up">Создать аккаунт — бесплатно</Link>
          </Button>
        </div>
      </PageHeader>

      {/* What types */}
      <Container className="py-16 sm:py-20">
        <div className="mb-10 text-center">
          <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
            Что найдёшь в каталоге
          </h2>
          <p className="mt-3 text-[var(--color-muted-strong)]">
            Все форматы футбольных событий — в одном месте
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {eventTypes.map((e) => (
            <Link
              key={e.href}
              href={e.href}
              className="group flex flex-col items-center gap-3 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center transition-shadow hover:shadow-[var(--shadow-md)]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-pitch-50)]">
                <e.icon className="h-6 w-6 text-[var(--color-pitch-700)]" />
              </div>
              <div>
                <div className="font-[family-name:var(--font-manrope)] font-bold text-[var(--color-foreground)] group-hover:text-[var(--color-pitch-700)]">
                  {e.label}
                </div>
                <div className="mt-1 text-sm text-[var(--color-muted)]">{e.desc}</div>
              </div>
              <ArrowRight className="h-4 w-4 text-[var(--color-muted)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--color-pitch-700)]" />
            </Link>
          ))}
        </div>
      </Container>

      {/* Features */}
      <div className="bg-[var(--color-surface-muted,#F4F6FA)] py-16 sm:py-20">
        <Container>
          <h2 className="mb-10 font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
            Почему удобно искать на footballevents.eu
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="flex gap-4 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-pitch-50)]">
                  <f.icon className="h-5 w-5 text-[var(--color-pitch-700)]" />
                </div>
                <div>
                  <h3 className="font-[family-name:var(--font-manrope)] font-semibold text-[var(--color-foreground)]">
                    {f.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--color-muted)]">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </div>

      {/* Journey */}
      <Container className="py-16 sm:py-20">
        <h2 className="mb-10 font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
          От поиска до участия — 4 шага
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {journeySteps.map((s, i) => (
            <div key={s.label} className="relative">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-pitch-50)]">
                <s.icon className="h-5 w-5 text-[var(--color-pitch-700)]" />
              </div>
              <div className="mb-1 font-[family-name:var(--font-manrope)] text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                Шаг {i + 1}
              </div>
              <h3 className="font-[family-name:var(--font-manrope)] font-semibold text-[var(--color-foreground)]">
                {s.label}
              </h3>
              <p className="mt-1 text-sm text-[var(--color-muted)]">{s.desc}</p>
            </div>
          ))}
        </div>
      </Container>

      {/* For parents */}
      <div className="bg-[var(--color-surface-muted,#F4F6FA)] py-16">
        <Container>
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
                Для родителей: безопасно и прозрачно
              </h2>
              <p className="mt-4 leading-relaxed text-[var(--color-muted-strong)]">
                Записать ребёнка в лагерь или на турнир — ответственное решение. footballevents.eu
                делает этот процесс максимально понятным: проверенные организаторы, полная информация
                о событии, безопасная оплата и прямая связь через платформу.
              </p>
              <ul className="mt-6 space-y-2">
                {forParents.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm text-[var(--color-muted-strong)]">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-pitch-700)]" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8">
              <Star className="mb-4 h-8 w-8 text-amber-500" />
              <blockquote className="text-lg font-medium leading-relaxed text-[var(--color-foreground)]">
                «Сын мечтал поехать в лагерь в Испании. Нашли через footballevents.eu — всё
                прозрачно: тренеры, программа, фото, отзывы других родителей. Подали заявку,
                получили ответ за день. Поехал — вернулся совсем другим игроком.»
              </blockquote>
              <div className="mt-4 text-sm text-[var(--color-muted)]">Мама игрока U13, Санкт-Петербург</div>
            </div>
          </div>
        </Container>
      </div>

      {/* CTA */}
      <div className="bg-[var(--color-foreground)] py-16">
        <Container>
          <div className="text-center">
            <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-white sm:text-3xl">
              Регистрация бесплатна
            </h2>
            <p className="mt-3 text-white/70">Создай аккаунт — сохраняй мероприятия и следи за заявками</p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button asChild variant="accent" size="lg">
                <Link href="/events">Найти мероприятие</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10">
                <Link href="/sign-up">Создать аккаунт</Link>
              </Button>
            </div>
          </div>
        </Container>
      </div>
    </>
  );
}
