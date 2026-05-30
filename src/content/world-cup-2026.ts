import type { Locale } from "@/i18n/config";

export type WcLocaleContent = {
  seoTitle: string;
  metaDescription: string;
  h1: string;
  tagline: string; // short banner line
  intro: string;
  facts: {
    hosts: string;
    dates: string;
    teams: string;
    matches: string;
    format: string;
    final: string;
  };
  whyFollow: { title: string; text: string }[];
  historyHtml: string;
  faq: { q: string; a: string }[];
};

export const WC2026 = {
  slug: "world-cup-2026",
  locales: {
    en: {
      seoTitle: "FIFA World Cup 2026 — Schedule, Teams & Guide",
      metaDescription:
        "FIFA World Cup 2026 in the USA, Canada and Mexico: dates, host cities, the 48-team format, live fixtures and everything your team needs to follow the tournament.",
      h1: "FIFA World Cup 2026",
      tagline: "Follow the tournament — schedule, teams and live fixtures.",
      intro:
        "The 2026 FIFA World Cup is the biggest in history: 48 teams, 104 matches and three host nations — the United States, Canada and Mexico. Played across 16 cities from 11 June to 19 July 2026, it's the must-follow football event of the year.",
      facts: {
        hosts: "USA · Canada · Mexico",
        dates: "11 Jun – 19 Jul 2026",
        teams: "48",
        matches: "104",
        format: "12 groups of 4",
        final: "MetLife Stadium, New Jersey",
      },
      whyFollow: [
        { title: "Biggest ever", text: "First 48-team World Cup — more teams, more matches, more nations than ever before." },
        { title: "Three nations", text: "Hosted across the USA, Canada and Mexico in 16 world-class cities." },
        { title: "New format", text: "12 groups of four; the top two plus the eight best third-placed teams reach the round of 32." },
        { title: "Live fixtures", text: "Follow the full schedule below — kickoff times, venues and results update automatically." },
      ],
      historyHtml:
        "<p>The 2026 tournament marks a new era for the World Cup: expanded to 48 teams and shared by three host nations for the first time. The opening match is in Mexico City and the final is at MetLife Stadium near New York on 19 July 2026.</p><p>With 104 matches across North America, 2026 is the largest football tournament ever staged — a once-in-a-generation event for players, coaches and fans to follow.</p>",
      faq: [
        { q: "When is the 2026 World Cup?", a: "From 11 June to 19 July 2026, across the USA, Canada and Mexico." },
        { q: "How many teams play in the 2026 World Cup?", a: "48 teams — the first expanded edition — playing 104 matches in 16 host cities." },
        { q: "Where is the 2026 World Cup final?", a: "At MetLife Stadium in New Jersey, near New York City, on 19 July 2026." },
      ],
    },
    de: {
      seoTitle: "FIFA Fußball-WM 2026 — Spielplan, Teams & Guide",
      metaDescription:
        "FIFA Fußball-WM 2026 in den USA, Kanada und Mexiko: Termine, Austragungsstädte, das 48-Team-Format, Live-Spiele und alles, um das Turnier zu verfolgen.",
      h1: "FIFA Fußball-WM 2026",
      tagline: "Verfolge das Turnier — Spielplan, Teams und Live-Spiele.",
      intro:
        "Die FIFA Fußball-WM 2026 ist die größte der Geschichte: 48 Teams, 104 Spiele und drei Gastgebernationen — die USA, Kanada und Mexiko. Vom 11. Juni bis 19. Juli 2026 in 16 Städten ist sie das Fußball-Highlight des Jahres.",
      facts: {
        hosts: "USA · Kanada · Mexiko",
        dates: "11. Juni – 19. Juli 2026",
        teams: "48",
        matches: "104",
        format: "12 Vierergruppen",
        final: "MetLife Stadium, New Jersey",
      },
      whyFollow: [
        { title: "Größte aller Zeiten", text: "Erste WM mit 48 Teams — mehr Mannschaften, mehr Spiele, mehr Nationen denn je." },
        { title: "Drei Nationen", text: "Ausgetragen in den USA, Kanada und Mexiko in 16 Weltklasse-Städten." },
        { title: "Neues Format", text: "12 Vierergruppen; die besten zwei plus die acht besten Gruppendritten erreichen die Runde der letzten 32." },
        { title: "Live-Spiele", text: "Verfolge den kompletten Spielplan unten — Anstoßzeiten, Stadien und Ergebnisse aktualisieren sich automatisch." },
      ],
      historyHtml:
        "<p>Das Turnier 2026 läutet eine neue Ära ein: auf 48 Teams erweitert und erstmals von drei Nationen gemeinsam ausgerichtet. Das Eröffnungsspiel findet in Mexiko-Stadt statt, das Finale am 19. Juli 2026 im MetLife Stadium bei New York.</p><p>Mit 104 Spielen in Nordamerika ist 2026 das größte je ausgetragene Fußballturnier — ein Jahrhundertereignis für Spieler, Trainer und Fans.</p>",
      faq: [
        { q: "Wann ist die WM 2026?", a: "Vom 11. Juni bis 19. Juli 2026 in den USA, Kanada und Mexiko." },
        { q: "Wie viele Teams spielen bei der WM 2026?", a: "48 Teams — die erste erweiterte Ausgabe — mit 104 Spielen in 16 Städten." },
        { q: "Wo ist das WM-Finale 2026?", a: "Im MetLife Stadium in New Jersey bei New York, am 19. Juli 2026." },
      ],
    },
    es: {
      seoTitle: "Copa Mundial FIFA 2026 — Calendario, Equipos y Guía",
      metaDescription:
        "Copa Mundial FIFA 2026 en EE. UU., Canadá y México: fechas, ciudades sede, el formato de 48 equipos, partidos en vivo y todo para seguir el torneo.",
      h1: "Copa Mundial FIFA 2026",
      tagline: "Sigue el torneo — calendario, equipos y partidos en vivo.",
      intro:
        "La Copa Mundial FIFA 2026 es la más grande de la historia: 48 equipos, 104 partidos y tres países anfitriones — Estados Unidos, Canadá y México. Del 11 de junio al 19 de julio de 2026 en 16 ciudades, es el evento futbolístico del año.",
      facts: {
        hosts: "EE. UU. · Canadá · México",
        dates: "11 jun – 19 jul 2026",
        teams: "48",
        matches: "104",
        format: "12 grupos de 4",
        final: "MetLife Stadium, Nueva Jersey",
      },
      whyFollow: [
        { title: "La más grande", text: "Primer Mundial de 48 equipos: más selecciones, más partidos y más naciones que nunca." },
        { title: "Tres países", text: "Disputado en EE. UU., Canadá y México, en 16 ciudades de primer nivel." },
        { title: "Nuevo formato", text: "12 grupos de cuatro; los dos primeros más los ocho mejores terceros llegan a los dieciseisavos." },
        { title: "Partidos en vivo", text: "Sigue el calendario completo abajo — horarios, sedes y resultados se actualizan solos." },
      ],
      historyHtml:
        "<p>El torneo de 2026 abre una nueva era: ampliado a 48 equipos y compartido por tres anfitriones por primera vez. El partido inaugural es en Ciudad de México y la final, el 19 de julio de 2026 en el MetLife Stadium, cerca de Nueva York.</p><p>Con 104 partidos por Norteamérica, 2026 es el mayor torneo de fútbol jamás celebrado — un acontecimiento único para jugadores, entrenadores y aficionados.</p>",
      faq: [
        { q: "¿Cuándo es el Mundial 2026?", a: "Del 11 de junio al 19 de julio de 2026, en EE. UU., Canadá y México." },
        { q: "¿Cuántos equipos juegan el Mundial 2026?", a: "48 equipos — la primera edición ampliada — con 104 partidos en 16 ciudades." },
        { q: "¿Dónde es la final del Mundial 2026?", a: "En el MetLife Stadium de Nueva Jersey, cerca de Nueva York, el 19 de julio de 2026." },
      ],
    },
    ru: {
      seoTitle: "Чемпионат мира по футболу 2026 — расписание, команды, гид",
      metaDescription:
        "Чемпионат мира FIFA 2026 в США, Канаде и Мексике: даты, города, формат на 48 команд, матчи в реальном времени и всё, чтобы следить за турниром.",
      h1: "Чемпионат мира по футболу 2026",
      tagline: "Следите за турниром — расписание, команды и матчи онлайн.",
      intro:
        "Чемпионат мира FIFA 2026 — крупнейший в истории: 48 команд, 104 матча и три страны-хозяйки — США, Канада и Мексика. С 11 июня по 19 июля 2026 года в 16 городах — главное футбольное событие года.",
      facts: {
        hosts: "США · Канада · Мексика",
        dates: "11 июн – 19 июл 2026",
        teams: "48",
        matches: "104",
        format: "12 групп по 4",
        final: "MetLife Stadium, Нью-Джерси",
      },
      whyFollow: [
        { title: "Крупнейший в истории", text: "Первый ЧМ на 48 команд — больше сборных, матчей и стран, чем когда-либо." },
        { title: "Три страны", text: "Принимают США, Канада и Мексика — 16 городов мирового уровня." },
        { title: "Новый формат", text: "12 групп по четыре; две лучшие плюс восемь лучших третьих команд выходят в 1/16." },
        { title: "Матчи онлайн", text: "Следите за полным расписанием ниже — время, стадионы и результаты обновляются автоматически." },
      ],
      historyHtml:
        "<p>Турнир 2026 года открывает новую эру: расширен до 48 команд и впервые проводится тремя странами-хозяйками. Матч открытия — в Мехико, финал — 19 июля 2026 года на стадионе MetLife под Нью-Йорком.</p><p>104 матча по всей Северной Америке делают 2026 год крупнейшим футбольным турниром в истории — событием поколения для игроков, тренеров и болельщиков.</p>",
      faq: [
        { q: "Когда пройдёт ЧМ-2026?", a: "С 11 июня по 19 июля 2026 года в США, Канаде и Мексике." },
        { q: "Сколько команд играет на ЧМ-2026?", a: "48 команд — первый расширенный формат — 104 матча в 16 городах." },
        { q: "Где финал ЧМ-2026?", a: "На стадионе MetLife в Нью-Джерси под Нью-Йорком, 19 июля 2026 года." },
      ],
    },
  } satisfies Record<Locale, WcLocaleContent>,
};
