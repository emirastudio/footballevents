import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/site/PageHeader";
import { Button } from "@/components/ui/Button";
import {
  Star,
  Music,
  Users,
  Sun,
  Globe,
  Heart,
  Trophy,
  Zap,
  Camera,
} from "lucide-react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://footballevents.eu";

export function generateMetadata(): Metadata {
  return {
    title: "Футбольные фестивали | footballevents.eu",
    description:
      "Многодневные футбольные фестивали: стритбол, пляжный футбол, семейные события, культура игры. Находи фестивали по всему миру — от городских праздников до международных шоу-событий.",
    alternates: { canonical: `${SITE_URL}/ru/about/festivals` },
    openGraph: {
      type: "website",
      url: `${SITE_URL}/ru/about/festivals`,
      title: "Футбольные фестивали | footballevents.eu",
      description: "Многодневные футбольные фестивали — стритбол, пляжный футбол, семейный формат, культура игры.",
    },
  };
}

const festivalTypes = [
  {
    icon: Globe,
    title: "Уличный футбол",
    desc: "Стритбол, freekick-соревнования, freestyle. Асфальт, маленькие ворота, большие эмоции. Для тех, кто вырос с мячом во дворе.",
  },
  {
    icon: Sun,
    title: "Пляжный футбол",
    desc: "Песок, море, летний турнир. Пляжный футбол объединяет профессионалов и любителей — правила для всех одинаковы.",
  },
  {
    icon: Users,
    title: "Семейные фестивали",
    desc: "Форматы для всей семьи: дети играют, родители болеют, все вместе едят и веселятся. Праздник, а не просто турнир.",
  },
  {
    icon: Music,
    title: "Футбол + культура",
    desc: "Мероприятия, где футбол — часть большой культурной программы. Музыка, еда, арт, выставки. Атмосфера, а не только счёт.",
  },
  {
    icon: Trophy,
    title: "Мультиформатные события",
    desc: "Несколько турниров, возрастных категорий и форматов на одной площадке. Три дня — тысячи участников и болельщиков.",
  },
  {
    icon: Camera,
    title: "Медиа-фестивали",
    desc: "Соревнования с полноценной медиапродукцией: трансляции, фотографы, YouTube. Твои голы попадут в хайлайты.",
  },
];

const whyFestival = [
  "Атмосфера, которой нет в обычном турнире",
  "Множество активностей помимо игры",
  "Новые знакомства и нетворкинг",
  "Контент для соцсетей — фото, видео, впечатления",
  "Для всей команды — не только для игроков",
  "Незабываемый опыт выходного дня",
];

export default async function FestivalsAboutPage({
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
        title="Футбольные фестивали"
        subtitle="Футбол — это праздник. Фестивали объединяют турниры, мастер-классы, культуру и атмосферу, которую невозможно создать в рамках обычного матча."
        breadcrumbs={[
          { href: "/", label: "Главная" },
          { href: "/about", label: "О проекте" },
          { label: "Фестивали" },
        ]}
      >
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="accent" size="lg">
            <Link href="/categories/festivals">Смотреть фестивали</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/organizer/events/new">Разместить фестиваль</Link>
          </Button>
        </div>
      </PageHeader>

      {/* Opening */}
      <Container className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
            Больше, чем просто турнир
          </h2>
          <p className="mt-4 leading-relaxed text-[var(--color-muted-strong)]">
            Футбольный фестиваль — это когда спорт встречается с культурой. Два-три дня на большой
            площадке, несколько турниров параллельно, мастер-классы, музыка, еда — и объединяющая
            атмосфера, которую создают тысячи людей, искренне любящих игру.
          </p>
          <p className="mt-4 leading-relaxed text-[var(--color-muted-strong)]">
            В каталоге footballevents.eu вы найдёте фестивали разных форматов — от городских праздников
            с пяти-минутным стрит-футболом до многодневных международных событий с командами из десятков
            стран. Всё на одной платформе, с онлайн-заявкой.
          </p>
        </div>
      </Container>

      {/* Types */}
      <div className="bg-[var(--color-surface-muted,#F4F6FA)] py-16 sm:py-20">
        <Container>
          <h2 className="mb-10 font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
            Форматы фестивалей
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {festivalTypes.map((f) => (
              <div
                key={f.title}
                className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
              >
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-[var(--radius-lg)] bg-purple-50">
                  <f.icon className="h-5 w-5 text-purple-600" />
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

      {/* Why festival */}
      <Container className="py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-gradient-to-br from-purple-50 to-pink-50 p-8">
            <Zap className="mb-4 h-8 w-8 text-purple-600" />
            <blockquote className="text-lg font-medium leading-relaxed text-[var(--color-foreground)]">
              «Приехали как команда — уехали как семья. Фестиваль не просто дал нам игровое время,
              он создал воспоминания, которые мы обсуждаем до сих пор.»
            </blockquote>
            <div className="mt-4 text-sm text-[var(--color-muted)]">Капитан любительской команды, Берлин</div>
          </div>
          <div>
            <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
              Почему стоит ехать на фестиваль
            </h2>
            <p className="mt-4 leading-relaxed text-[var(--color-muted-strong)]">
              Фестиваль — это событие, которое объединяет команду, создаёт общую историю и остаётся
              в памяти на годы. Это не просто соревнование — это опыт.
            </p>
            <ul className="mt-6 space-y-2">
              {whyFestival.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm text-[var(--color-muted-strong)]">
                  <Heart className="mt-0.5 h-4 w-4 shrink-0 text-purple-500" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>

      {/* CTA */}
      <div className="bg-[var(--color-foreground)] py-16">
        <Container>
          <div className="text-center">
            <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-white sm:text-3xl">
              Найди свой фестиваль
            </h2>
            <p className="mt-3 text-white/70">Стритбол, пляжный футбол, семейные форматы — всё в каталоге</p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button asChild variant="accent" size="lg">
                <Link href="/categories/festivals">Смотреть все фестивали</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10">
                <Link href="/organizer/events/new">Разместить фестиваль</Link>
              </Button>
            </div>
          </div>
        </Container>
      </div>
    </>
  );
}
