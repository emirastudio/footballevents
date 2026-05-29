import type { CountryContent } from "./types";

export const england: CountryContent = {
  slug: "england",
  countryCode: "GB", // England is not a separate ISO country; events use GB
  flagEmoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  published: true,
  logistics: {
    bookingUrl: "https://www.booking.com/searchresults.html?ss=England",
    flightsUrl: "https://www.google.com/travel/flights?q=flights%20to%20England",
  },
  locales: {
    en: {
      seoTitle: "Youth Football Tournaments in England",
      metaDescription:
        "Find youth football tournaments in England for your team — plus facts, climate, pitches and travel tips for bringing a squad to the home of football.",
      h1: "Youth Football Tournaments in England",
      intro:
        "England is the birthplace of organised football and one of Europe's most popular destinations for youth tournament trips. From grassroots festivals to elite invitationals, English tournaments give travelling teams competitive matches, excellent pitches and an unmatched football atmosphere.",
      whyVisit: [
        { title: "Football culture", text: "The home of the game: passionate crowds, historic clubs and a youth scene in every town." },
        { title: "Pitches & facilities", text: "Thousands of grass and 3G pitches, club academies and training grounds open to visiting squads." },
        { title: "Climate for play", text: "A mild, temperate climate keeps pitches playable across the spring, summer and autumn tournament seasons." },
        { title: "Easy to reach", text: "Major international airports and dense rail links make travel between host cities simple for teams." },
      ],
      facts: {
        capital: "London",
        population: "~57 million",
        uefaMember: "Yes (since 1954)",
        nationalTeam: "England",
        topLeague: "Premier League",
        proClubs: "92 (top four divisions)",
        faFounded: "The FA, 1863",
      },
      historyHtml:
        "<p>Modern football was codified in England in 1863, when The Football Association — the oldest football association in the world — published the first unified Laws of the Game. That heritage is still visible at every level of the English game.</p><p>Today England runs 92 professional clubs across four divisions led by the Premier League, the most-watched league in the world. For visiting youth teams this depth means a tournament for every level — from welcoming grassroots festivals to high-level invitational cups followed by academy scouts.</p>",
      faq: [
        { q: "What are the biggest youth football tournaments in England?", a: "England hosts everything from local grassroots festivals to international invitational cups. As organisers add tournaments to footballevents.eu, they appear on this page automatically." },
        { q: "When is the football tournament season in England?", a: "Most youth tournaments run from spring through early autumn (roughly April to September), with some indoor events in winter." },
        { q: "Can foreign teams take part in English tournaments?", a: "Yes. Many English youth tournaments welcome international teams — check each tournament's page for age groups, eligibility and registration." },
      ],
    },
    de: {
      seoTitle: "Jugendfußball-Turniere in England",
      metaDescription:
        "Finde Jugendfußball-Turniere in England für dein Team — plus Fakten, Klima, Plätze und Reisetipps für die Mannschaftsreise ins Mutterland des Fußballs.",
      h1: "Jugendfußball-Turniere in England",
      intro:
        "England ist die Wiege des organisierten Fußballs und eines der beliebtesten Ziele Europas für Turnierreisen im Jugendbereich. Von Grassroots-Festivals bis zu Elite-Einladungsturnieren bieten englische Turniere reisenden Teams umkämpfte Spiele, hervorragende Plätze und eine einzigartige Fußballatmosphäre.",
      whyVisit: [
        { title: "Fußballkultur", text: "Das Mutterland des Fußballs: leidenschaftliche Fans, traditionsreiche Klubs und eine Jugendszene in jeder Stadt." },
        { title: "Plätze & Anlagen", text: "Tausende Rasen- und Kunstrasenplätze, Klubakademien und Trainingsgelände stehen Gastteams offen." },
        { title: "Klima zum Spielen", text: "Ein mildes, gemäßigtes Klima hält die Plätze in den Turniersaisons im Frühling, Sommer und Herbst bespielbar." },
        { title: "Gut erreichbar", text: "Große internationale Flughäfen und ein dichtes Bahnnetz machen die Anreise zwischen den Gastgeberstädten einfach." },
      ],
      facts: {
        capital: "London",
        population: "~57 Mio.",
        uefaMember: "Ja (seit 1954)",
        nationalTeam: "England",
        topLeague: "Premier League",
        proClubs: "92 (vier höchste Ligen)",
        faFounded: "The FA, 1863",
      },
      historyHtml:
        "<p>Der moderne Fußball wurde 1863 in England kodifiziert, als The Football Association — der älteste Fußballverband der Welt — die ersten einheitlichen Spielregeln veröffentlichte. Dieses Erbe ist auf jeder Ebene des englischen Fußballs spürbar.</p><p>Heute zählt England 92 Profiklubs in vier Ligen, angeführt von der Premier League, der meistgesehenen Liga der Welt. Für reisende Jugendteams bedeutet diese Tiefe ein Turnier für jedes Niveau — von einladenden Grassroots-Festivals bis zu hochkarätigen Einladungsturnieren mit Akademie-Scouts.</p>",
      faq: [
        { q: "Was sind die größten Jugendfußball-Turniere in England?", a: "England bietet alles von lokalen Grassroots-Festivals bis zu internationalen Einladungsturnieren. Sobald Veranstalter Turniere auf footballevents.eu eintragen, erscheinen sie automatisch auf dieser Seite." },
        { q: "Wann ist die Turniersaison in England?", a: "Die meisten Jugendturniere finden vom Frühjahr bis zum frühen Herbst statt (etwa April bis September), einige Hallenturniere im Winter." },
        { q: "Dürfen ausländische Teams an englischen Turnieren teilnehmen?", a: "Ja. Viele englische Jugendturniere heißen internationale Teams willkommen — Altersklassen, Voraussetzungen und Anmeldung findest du auf der jeweiligen Turnierseite." },
      ],
    },
    es: {
      seoTitle: "Torneos de fútbol juvenil en Inglaterra",
      metaDescription:
        "Encuentra torneos de fútbol juvenil en Inglaterra para tu equipo — además de datos, clima, campos y consejos de viaje para llevar a tu plantilla a la cuna del fútbol.",
      h1: "Torneos de fútbol juvenil en Inglaterra",
      intro:
        "Inglaterra es la cuna del fútbol organizado y uno de los destinos más populares de Europa para los viajes de torneos juveniles. Desde festivales de base hasta torneos de élite por invitación, los torneos ingleses ofrecen a los equipos visitantes partidos competitivos, campos excelentes y una atmósfera futbolística inigualable.",
      whyVisit: [
        { title: "Cultura futbolística", text: "La casa del fútbol: afición apasionada, clubes históricos y una escena juvenil en cada ciudad." },
        { title: "Campos e instalaciones", text: "Miles de campos de césped y de hierba artificial, academias de clubes y centros de entrenamiento abiertos a equipos visitantes." },
        { title: "Clima para jugar", text: "Un clima templado y suave mantiene los campos jugables durante las temporadas de torneos de primavera, verano y otoño." },
        { title: "Fácil de llegar", text: "Grandes aeropuertos internacionales y una densa red ferroviaria facilitan los viajes entre las ciudades anfitrionas." },
      ],
      facts: {
        capital: "Londres",
        population: "~57 millones",
        uefaMember: "Sí (desde 1954)",
        nationalTeam: "Inglaterra",
        topLeague: "Premier League",
        proClubs: "92 (cuatro primeras divisiones)",
        faFounded: "The FA, 1863",
      },
      historyHtml:
        "<p>El fútbol moderno se codificó en Inglaterra en 1863, cuando The Football Association — la federación de fútbol más antigua del mundo — publicó las primeras Reglas del Juego unificadas. Esa herencia sigue presente en todos los niveles del fútbol inglés.</p><p>Hoy Inglaterra cuenta con 92 clubes profesionales en cuatro divisiones, encabezadas por la Premier League, la liga más vista del mundo. Para los equipos juveniles visitantes, esta profundidad significa un torneo para cada nivel: desde acogedores festivales de base hasta copas de élite por invitación seguidas por ojeadores de academias.</p>",
      faq: [
        { q: "¿Cuáles son los mayores torneos de fútbol juvenil en Inglaterra?", a: "Inglaterra acoge desde festivales locales de base hasta copas internacionales por invitación. A medida que los organizadores añaden torneos a footballevents.eu, aparecen automáticamente en esta página." },
        { q: "¿Cuándo es la temporada de torneos en Inglaterra?", a: "La mayoría de los torneos juveniles se celebran de primavera a principios de otoño (aproximadamente de abril a septiembre), con algunos eventos de sala en invierno." },
        { q: "¿Pueden participar equipos extranjeros en los torneos ingleses?", a: "Sí. Muchos torneos juveniles ingleses dan la bienvenida a equipos internacionales — consulta las categorías, los requisitos y la inscripción en la página de cada torneo." },
      ],
    },
    ru: {
      seoTitle: "Детские и юношеские футбольные турниры в Англии",
      metaDescription:
        "Найдите детские и юношеские футбольные турниры в Англии для своей команды — а также факты, климат, поля и советы по поездке на родину футбола.",
      h1: "Детские и юношеские футбольные турниры в Англии",
      intro:
        "Англия — родина организованного футбола и одно из самых популярных направлений Европы для турнирных поездок детских и юношеских команд. От массовых фестивалей до элитных турниров по приглашению — английские турниры дают приезжим командам конкурентные матчи, отличные поля и непревзойдённую футбольную атмосферу.",
      whyVisit: [
        { title: "Футбольная культура", text: "Родина игры: страстные болельщики, исторические клубы и детский футбол в каждом городе." },
        { title: "Поля и инфраструктура", text: "Тысячи натуральных и искусственных полей, клубные академии и тренировочные базы, открытые для гостевых команд." },
        { title: "Климат для игры", text: "Мягкий умеренный климат сохраняет поля пригодными для игры в весенний, летний и осенний турнирные сезоны." },
        { title: "Удобно добираться", text: "Крупные международные аэропорты и плотная сеть железных дорог упрощают переезды команд между городами-хозяевами." },
      ],
      facts: {
        capital: "Лондон",
        population: "~57 млн",
        uefaMember: "Да (с 1954)",
        nationalTeam: "Англия",
        topLeague: "Премьер-лига",
        proClubs: "92 (четыре высших дивизиона)",
        faFounded: "The FA, 1863",
      },
      historyHtml:
        "<p>Современный футбол был кодифицирован в Англии в 1863 году, когда Футбольная ассоциация (The FA) — старейшая футбольная ассоциация в мире — опубликовала первые единые правила игры. Это наследие ощущается на каждом уровне английского футбола.</p><p>Сегодня в Англии 92 профессиональных клуба в четырёх дивизионах во главе с Премьер-лигой — самой просматриваемой лигой мира. Для приезжих юношеских команд такая глубина означает турнир для любого уровня: от радушных массовых фестивалей до турниров по приглашению высокого уровня, за которыми следят скауты академий.</p>",
      faq: [
        { q: "Какие крупнейшие юношеские футбольные турниры проходят в Англии?", a: "В Англии проводят самые разные турниры — от местных массовых фестивалей до международных турниров по приглашению. По мере того как организаторы добавляют турниры на footballevents.eu, они автоматически появляются на этой странице." },
        { q: "Когда сезон футбольных турниров в Англии?", a: "Большинство юношеских турниров проходит с весны до начала осени (примерно с апреля по сентябрь), часть зальных турниров — зимой." },
        { q: "Могут ли иностранные команды участвовать в английских турнирах?", a: "Да. Многие английские юношеские турниры принимают международные команды — возрастные категории, условия и регистрацию смотрите на странице каждого турнира." },
      ],
    },
  },
};
