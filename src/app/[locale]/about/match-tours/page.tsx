import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/site/PageHeader";
import { Button } from "@/components/ui/Button";
import {
  Plane,
  Ticket,
  Hotel,
  Users,
  Star,
  Globe,
  CheckCircle2,
  Camera,
  Mic,
  Trophy,
} from "lucide-react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://footballevents.eu";

export function generateMetadata(): Metadata {
  return {
    title: "Туры на футбольные матчи | footballevents.eu",
    description:
      "Организованные туры на матчи Лиги Чемпионов, Примеры, АПЛ, Серии А и других топ-лиг. Билеты, отель, трансфер — живой стадион незабываем. Выбирай тур и бронируй онлайн.",
    alternates: { canonical: `${SITE_URL}/ru/about/match-tours` },
    openGraph: {
      type: "website",
      url: `${SITE_URL}/ru/about/match-tours`,
      title: "Туры на футбольные матчи | footballevents.eu",
      description: "Организованные туры на матчи топовых лиг — Лига Чемпионов, АПЛ, Примера, Серия А.",
    },
  };
}

const leagues = [
  { label: "Лига Чемпионов", flag: "🏆" },
  { label: "Английская Премьер-лига", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { label: "Ла Лига (Испания)", flag: "🇪🇸" },
  { label: "Бундеслига (Германия)", flag: "🇩🇪" },
  { label: "Серия А (Италия)", flag: "🇮🇹" },
  { label: "Лига 1 (Франция)", flag: "🇫🇷" },
  { label: "Эредивизие (Нидерланды)", flag: "🇳🇱" },
  { label: "Primeira Liga (Португалия)", flag: "🇵🇹" },
];

const included = [
  { icon: Ticket, title: "Билеты на матч", desc: "Организатор тура берёт на себя поиск и бронирование официальных билетов" },
  { icon: Hotel, title: "Размещение", desc: "Отель рядом со стадионом или в центре города — выбирается вместе с туром" },
  { icon: Plane, title: "Трансфер", desc: "Трансфер из аэропорта и до стадиона — без стресса и навигации в чужом городе" },
  { icon: Camera, title: "Экскурсии", desc: "Посещение стадиона, музея клуба, тренировочной базы — в зависимости от тура" },
  { icon: Mic, title: "Гид и организация", desc: "Профессиональный гид на месте, готовый отвечать на вопросы и решать вопросы" },
  { icon: Users, title: "Группа единомышленников", desc: "Едешь не один — рядом такие же фанаты, с которыми уже есть общая тема" },
];

const forWhom = [
  {
    title: "Для болельщиков",
    desc: "Мечтаешь увидеть Real Madrid или Manchester United вживую? Тур убирает все сложности — визы, билеты, отель — и оставляет только эмоции.",
  },
  {
    title: "Для семей",
    desc: "Семейные туры с продуманной программой: матч, экскурсия по стадиону, музей клуба, прогулка по городу. Незабываемые воспоминания для детей.",
  },
  {
    title: "Для корпораций",
    desc: "VIP-туры на матчи топ-клубов — лучший вариант корпоративного мероприятия для команды или партнёров. Бизнес-среда + футбол = работает безупречно.",
  },
];

export default async function MatchToursAboutPage({
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
        title="Туры на футбольные матчи"
        subtitle="Живой стадион — это незабываемо. Организованные туры на матчи Лиги Чемпионов, АПЛ, Примеры и других топ-лиг мира — с билетами, отелем и трансфером."
        breadcrumbs={[
          { href: "/", label: "Главная" },
          { href: "/about", label: "О проекте" },
          { label: "Туры на матчи" },
        ]}
      >
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="accent" size="lg">
            <Link href="/categories/match-tours">Смотреть туры</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/organizer/events/new">Разместить тур</Link>
          </Button>
        </div>
      </PageHeader>

      {/* Why live */}
      <Container className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
            Живой матч — другой мир
          </h2>
          <p className="mt-4 leading-relaxed text-[var(--color-muted-strong)]">
            Смотреть футбол по телевизору и быть на стадионе — это два совершенно разных опыта. Рёв трибун,
            запах газона, физическое присутствие тысяч болельщиков, которые переживают то же самое —
            это невозможно передать ни одним HD-трансляцией.
          </p>
          <p className="mt-4 leading-relaxed text-[var(--color-muted-strong)]">
            Туры на матчи убирают всё сложное: поиск официальных билетов (которых нет в свободной продаже),
            бронирование отеля, навигацию в незнакомом городе, языковой барьер. Ты просто приезжаешь —
            и получаешь незабываемые эмоции.
          </p>
        </div>
      </Container>

      {/* Leagues */}
      <div className="bg-[var(--color-surface-muted,#F4F6FA)] py-16">
        <Container>
          <h2 className="mb-8 font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
            Лиги и турниры
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {leagues.map((l) => (
              <div
                key={l.label}
                className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
              >
                <span className="text-2xl">{l.flag}</span>
                <span className="text-sm font-medium text-[var(--color-foreground)]">{l.label}</span>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-[var(--color-muted)]">
            Организаторы также предлагают туры на матчи местных лиг и кубков — уточняйте в каталоге.
          </p>
        </Container>
      </div>

      {/* What's included */}
      <Container className="py-16 sm:py-20">
        <h2 className="mb-10 font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
          Что обычно входит в тур
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {included.map((it) => (
            <div
              key={it.title}
              className="flex gap-4 rounded-[var(--radius-xl)] border border-[var(--color-border)] p-6"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-blue-50">
                <it.icon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--color-foreground)]">{it.title}</h3>
                <p className="mt-1 text-sm text-[var(--color-muted)]">{it.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-[var(--color-muted)]">
          * Точный состав тура зависит от организатора и выбранной программы. Уточняйте на странице события.
        </p>
      </Container>

      {/* For whom */}
      <div className="bg-[var(--color-surface-muted,#F4F6FA)] py-16">
        <Container>
          <h2 className="mb-8 font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
            Кому подойдёт тур на матч
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {forWhom.map((f) => (
              <div
                key={f.title}
                className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
              >
                <Trophy className="mb-3 h-6 w-6 text-amber-500" />
                <h3 className="font-[family-name:var(--font-manrope)] font-semibold text-[var(--color-foreground)]">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">{f.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </div>

      {/* Testimonial */}
      <Container className="py-16">
        <div className="mx-auto max-w-2xl rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
          <div className="mb-2 flex justify-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <blockquote className="text-lg font-medium leading-relaxed text-[var(--color-foreground)]">
            «Впервые попал на Камп Ноу — это было невероятно. Организаторы тура сделали всё:
            билеты в нужный сектор, отель в 10 минутах ходьбы, экскурсия по стадиону за день до матча.
            Уже планирую следующий тур.»
          </blockquote>
          <div className="mt-4 text-sm text-[var(--color-muted)]">Алексей, болельщик, Минск</div>
        </div>
      </Container>

      {/* CTA */}
      <div className="bg-[var(--color-foreground)] py-16">
        <Container>
          <div className="text-center">
            <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-white sm:text-3xl">
              Выбери тур на матч мечты
            </h2>
            <p className="mt-3 text-white/70">Матчи АПЛ, Примеры, Лига Чемпионов — прямо сейчас в каталоге</p>
            <div className="mt-8">
              <Button asChild variant="accent" size="lg">
                <Link href="/categories/match-tours">Смотреть все туры</Link>
              </Button>
            </div>
          </div>
        </Container>
      </div>
    </>
  );
}
