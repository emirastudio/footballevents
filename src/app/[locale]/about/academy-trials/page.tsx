import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/site/PageHeader";
import { Button } from "@/components/ui/Button";
import {
  Target,
  Star,
  Users,
  GraduationCap,
  Globe,
  CheckCircle2,
  ArrowRight,
  Trophy,
  Zap,
  ClipboardList,
} from "lucide-react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://footballevents.eu";

export function generateMetadata(): Metadata {
  return {
    title: "Просмотры в футбольных академиях | footballevents.eu",
    description:
      "Открытые просмотры в футбольных академиях Европы и мира. Шанс для талантливых игроков попасть в профессиональную систему. Для детей, подростков и взрослых от U8 до U21+.",
    alternates: { canonical: `${SITE_URL}/ru/about/academy-trials` },
    openGraph: {
      type: "website",
      url: `${SITE_URL}/ru/about/academy-trials`,
      title: "Просмотры в футбольных академиях | footballevents.eu",
      description: "Просмотры в академиях Европы — шанс для талантливых игроков попасть в профессиональную систему.",
    },
  };
}

const trialTypes = [
  {
    icon: Globe,
    title: "Международные просмотры",
    desc: "Академии топ-клубов Испании, Португалии, Германии, Нидерландов проводят открытые отборы для игроков из всего мира.",
  },
  {
    icon: GraduationCap,
    title: "Академические программы",
    desc: "Длительные программы с погружением в академическую среду. Не просто просмотр — полноценный тренировочный период.",
  },
  {
    icon: Users,
    title: "Региональные просмотры",
    desc: "Клубы низших лиг и региональные академии ищут местные таланты. Для тех, кто начинает профессиональный путь.",
  },
  {
    icon: Trophy,
    title: "Элитные отборы",
    desc: "Закрытые просмотры от профессиональных клубов. Требуют видеозаявки или рекомендации. Высокий уровень — высокие требования.",
  },
  {
    icon: Zap,
    title: "Скаутские дни",
    desc: "Организованные мероприятия, куда приглашают профессиональных скаутов. Один день — несколько сотен глаз на тебя.",
  },
  {
    icon: ClipboardList,
    title: "Онлайн-скаутинг",
    desc: "Платформы с видеозаявкой: закружи видео, скаут оценивает удалённо. Если понравишься — приглашение на очный просмотр.",
  },
];

const ageGroups = [
  { label: "U8–U10", note: "Первые шаги: оценка координации, обучаемости, любви к игре" },
  { label: "U11–U13", note: "Техническая база и понимание игры — ключевые критерии" },
  { label: "U14–U16", note: "Тактика, физические данные, командная игра" },
  { label: "U17–U19", note: "Близко к юношескому профессиональному уровню. Серьёзный отбор" },
  { label: "U20–U21", note: "Последний шанс попасть в систему. Высокие требования" },
  { label: "Взрослые", note: "Любительские клубы и полупрофессиональные команды" },
];

const howPrepare = [
  "Физическая форма: выносливость, скорость, взрывная сила — на пике",
  "Видеозаявка: 3–5 минут лучших игровых моментов. Первые 30 секунд решают",
  "Резюме игрока: возраст, позиция, клубная история, достижения, рост/вес",
  "Психология: просмотр — это опыт. Первый редко бывает последним",
  "Языки: базовый английский сильно помогает на международных просмотрах",
  "Рекомендации от тренера — часто ценятся выше любого видео",
];

export default async function AcademyTrialsAboutPage({
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
        title="Просмотры в футбольных академиях"
        subtitle="Каждый профессиональный футболист когда-то прошёл просмотр. Найди свой шанс — от региональных клубов до топ-академий Европы."
        breadcrumbs={[
          { href: "/", label: "Главная" },
          { href: "/about", label: "О проекте" },
          { label: "Просмотры" },
        ]}
      >
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="accent" size="lg">
            <Link href="/events">Найти просмотры</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/organizer/events/new">Разместить просмотр</Link>
          </Button>
        </div>
      </PageHeader>

      {/* Opening */}
      <Container className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
            Почему просмотр — это важно
          </h2>
          <p className="mt-4 leading-relaxed text-[var(--color-muted-strong)]">
            Профессиональный футбол начинается с момента, когда тебя кто-то увидел. Скауты ездят по
            всему миру — но хорошие игроки часто просто не знают, где и как попасть на радар. Открытые
            просмотры — это организованный шанс, который можно найти, подготовиться и использовать.
          </p>
          <p className="mt-4 leading-relaxed text-[var(--color-muted-strong)]">
            footballevents.eu собирает просмотры от академий и клубов по всей Европе. Здесь нет
            «закрытого клуба» — только открытые мероприятия с понятным форматом и онлайн-заявкой.
            Каждый достойный игрок заслуживает шанса быть замеченным.
          </p>
        </div>
      </Container>

      {/* Types */}
      <div className="bg-[var(--color-surface-muted,#F4F6FA)] py-16 sm:py-20">
        <Container>
          <h2 className="mb-10 font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
            Форматы просмотров
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {trialTypes.map((t) => (
              <div
                key={t.title}
                className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
              >
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-[var(--radius-lg)] bg-cyan-50">
                  <t.icon className="h-5 w-5 text-cyan-600" />
                </div>
                <h3 className="font-[family-name:var(--font-manrope)] font-semibold text-[var(--color-foreground)]">
                  {t.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">{t.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </div>

      {/* Age groups */}
      <Container className="py-16 sm:py-20">
        <h2 className="mb-8 font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
          Возрастные группы
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ageGroups.map((a) => (
            <div
              key={a.label}
              className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
            >
              <div className="mb-2 font-[family-name:var(--font-manrope)] text-xl font-bold text-[var(--color-pitch-700)]">
                {a.label}
              </div>
              <div className="text-sm text-[var(--color-muted)]">{a.note}</div>
            </div>
          ))}
        </div>
      </Container>

      {/* How to prepare */}
      <div className="bg-[var(--color-surface-muted,#F4F6FA)] py-16">
        <Container>
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
                Как подготовиться к просмотру
              </h2>
              <p className="mt-4 leading-relaxed text-[var(--color-muted-strong)]">
                Хороший просмотр — это не случайность, а результат подготовки. Академии и скауты
                смотрят на десятки игроков одновременно. Выделиться помогают физическая готовность,
                правильная подача себя и профессиональный подход к процессу.
              </p>
              <ul className="mt-6 space-y-3">
                {howPrepare.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm text-[var(--color-muted-strong)]">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8">
              <Star className="mb-4 h-8 w-8 text-amber-500" />
              <blockquote className="text-lg font-medium leading-relaxed text-[var(--color-foreground)]">
                «Я прошёл три просмотра, прежде чем меня взяли. Каждый учил чему-то новому.
                Последний — в Португалии, нашёл через footballevents.eu. Сейчас тренируюсь
                в академии и не жалею ни о чём.»
              </blockquote>
              <div className="mt-4 text-sm text-[var(--color-muted)]">Игрок U17, Киев → Лиссабон</div>
            </div>
          </div>
        </Container>
      </div>

      {/* For academies */}
      <Container className="py-16">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-3 inline-flex items-center rounded-full border border-[var(--color-pitch-200)] bg-[var(--color-pitch-50)] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-pitch-700)]">
            Для академий и скаутов
          </div>
          <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
            Публикуй просмотры — находи таланты
          </h2>
          <p className="mt-4 leading-relaxed text-[var(--color-muted-strong)]">
            Размести просмотр на footballevents.eu и получи заявки от игроков из 50+ стран.
            Фильтрация по возрасту и уровню позволит сразу отсеять нерелевантные кандидатуры.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button asChild variant="accent">
              <Link href="/about/for-organizers">Разместить просмотр <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/pricing">Посмотреть тарифы</Link>
            </Button>
          </div>
        </div>
      </Container>

      {/* CTA */}
      <div className="bg-[var(--color-foreground)] py-16">
        <Container>
          <div className="text-center">
            <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-white sm:text-3xl">
              Найди свой просмотр
            </h2>
            <p className="mt-3 text-white/70">Академии Европы и мира ищут таланты прямо сейчас</p>
            <div className="mt-8">
              <Button asChild variant="accent" size="lg">
                <Link href="/events">Смотреть просмотры</Link>
              </Button>
            </div>
          </div>
        </Container>
      </div>
    </>
  );
}
