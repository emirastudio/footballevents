export type AdLang = "en" | "ru" | "es";
export type AdFormat = "portrait" | "story" | "landscape";
export type AdVisual = "cinematic" | "split" | "card" | "stats" | "world" | "quote";

export type AdTheme = {
  id: number;
  slug: string;
  visual: AdVisual;
  content: Record<AdLang, { headline: string; sub: string; body: string; cta: string }>;
};

export const AD_THEMES: AdTheme[] = [
  {
    id: 1,
    slug: "hero",
    visual: "cinematic",
    content: {
      en: {
        headline: "The world's football events. One place.",
        sub: "Tournaments · Camps · Festivals · Academy Trials",
        body: "Discover, filter and book football events from 50+ countries.",
        cta: "Explore Events",
      },
      ru: {
        headline: "Футбольные события мира. Одно место.",
        sub: "Турниры · Кемпы · Фестивали · Просмотры в академии",
        body: "Найдите, отфильтруйте и запишитесь на футбольные события из 50+ стран.",
        cta: "Смотреть события",
      },
      es: {
        headline: "Los eventos de fútbol del mundo. Un lugar.",
        sub: "Torneos · Campamentos · Festivales · Pruebas en academias",
        body: "Descubre, filtra y reserva eventos de fútbol de más de 50 países.",
        cta: "Explorar eventos",
      },
    },
  },
  {
    id: 2,
    slug: "before-after",
    visual: "split",
    content: {
      en: {
        headline: "Stop managing applications in spreadsheets.",
        sub: "Online applications, dashboard, analytics — all in one place.",
        body: "Replace Facebook groups, Google Forms and WhatsApp chats with a professional platform.",
        cta: "Start free →",
      },
      ru: {
        headline: "Перестаньте принимать заявки в таблицах.",
        sub: "Онлайн-заявки, дашборд, аналитика — всё в одном месте.",
        body: "Замените Facebook-группы, Google Forms и WhatsApp-чаты профессиональной платформой.",
        cta: "Начать бесплатно →",
      },
      es: {
        headline: "Deja de gestionar solicitudes en hojas de cálculo.",
        sub: "Solicitudes online, panel de control, analítica — todo en un lugar.",
        body: "Reemplaza grupos de Facebook, Google Forms y WhatsApp con una plataforma profesional.",
        cta: "Empieza gratis →",
      },
    },
  },
  {
    id: 3,
    slug: "world-map",
    visual: "world",
    content: {
      en: {
        headline: "50+ countries. Thousands of players looking for your event.",
        sub: "Post once — reach an international audience.",
        body: "Your tournament, camp or festival — visible to players from every continent.",
        cta: "List your event free",
      },
      ru: {
        headline: "50+ стран. Тысячи игроков ищут ваш ивент.",
        sub: "Разместите один раз — охватите международную аудиторию.",
        body: "Ваш турнир, кемп или фестиваль — виден игрокам со всех континентов.",
        cta: "Разместить ивент бесплатно",
      },
      es: {
        headline: "50+ países. Miles de jugadores buscan tu evento.",
        sub: "Publica una vez — llega a una audiencia internacional.",
        body: "Tu torneo, campamento o festival — visible para jugadores de todos los continentes.",
        cta: "Publica tu evento gratis",
      },
    },
  },
  {
    id: 4,
    slug: "pro-plan",
    visual: "card",
    content: {
      en: {
        headline: "Less than a coffee a day. More participants every month.",
        sub: "Pro plan — €9.90/month",
        body: "10 active events · Online applications & chat · Verified badge · 1 free boost/month · No competitor ads",
        cta: "Go Pro →",
      },
      ru: {
        headline: "Дешевле кофе в день. Больше участников каждый месяц.",
        sub: "План Pro — €9.90/месяц",
        body: "10 активных событий · Заявки и чат · Значок Verified · 1 буст в месяц бесплатно · Без рекламы конкурентов",
        cta: "Перейти на Pro →",
      },
      es: {
        headline: "Menos que un café al día. Más participantes cada mes.",
        sub: "Plan Pro — €9.90/mes",
        body: "10 eventos activos · Solicitudes y chat · Insignia Verified · 1 boost gratis/mes · Sin anuncios de competidores",
        cta: "Ir a Pro →",
      },
    },
  },
  {
    id: 5,
    slug: "boost",
    visual: "card",
    content: {
      en: {
        headline: "Need more applications? Boost your event.",
        sub: "One-time visibility push — no subscription needed.",
        body: "Basic €5 · Featured €19 · Premium €59 (homepage hero). Included free in Pro & Premium plans.",
        cta: "Boost now →",
      },
      ru: {
        headline: "Нужно больше заявок? Поднимите свой ивент.",
        sub: "Разовый буст видимости — подписка не нужна.",
        body: "Basic €5 · Featured €19 · Premium €59 (карусель на главной). Включено в планы Pro и Premium.",
        cta: "Поднять сейчас →",
      },
      es: {
        headline: "¿Necesitas más solicitudes? Impulsa tu evento.",
        sub: "Un empuje de visibilidad puntual — sin suscripción.",
        body: "Basic €5 · Featured €19 · Premium €59 (héroe en inicio). Incluido en planes Pro y Premium.",
        cta: "Impulsar ahora →",
      },
    },
  },
  {
    id: 6,
    slug: "parents",
    visual: "quote",
    content: {
      en: {
        headline: "Find the right camp for your child. Safely.",
        sub: "Verified organizers · Full programme info · Reviews from other parents",
        body: "\"One week in Spain gave my son more than three years at his local club.\" — Parent, Moscow",
        cta: "Find camps →",
      },
      ru: {
        headline: "Найдите правильный кемп для ребёнка. Безопасно.",
        sub: "Верифицированные организаторы · Полная программа · Отзывы других родителей",
        body: "«Одна неделя в Испании дала сыну больше, чем три года в местной секции.» — Мама, Москва",
        cta: "Найти кемпы →",
      },
      es: {
        headline: "Encuentra el campamento ideal para tu hijo. Con seguridad.",
        sub: "Organizadores verificados · Programa completo · Reseñas de otros padres",
        body: "\"Una semana en España le dio a mi hijo más que tres años en su club local.\" — Madre, Moscú",
        cta: "Encontrar campamentos →",
      },
    },
  },
  {
    id: 7,
    slug: "trials",
    visual: "cinematic",
    content: {
      en: {
        headline: "Your trial starts here.",
        sub: "Open trials at academies across Europe. Filter by age, level and country.",
        body: "Apply in 2 minutes. No calls, no messengers — just your football.",
        cta: "Find trials →",
      },
      ru: {
        headline: "Твой просмотр начинается здесь.",
        sub: "Открытые просмотры в академиях по всей Европе. Фильтр по возрасту, уровню и стране.",
        body: "Подайте заявку за 2 минуты. Без звонков и мессенджеров — только ваш футбол.",
        cta: "Найти просмотры →",
      },
      es: {
        headline: "Tu prueba empieza aquí.",
        sub: "Pruebas abiertas en academias de toda Europa. Filtra por edad, nivel y país.",
        body: "Solicita en 2 minutos. Sin llamadas ni mensajería — solo tu fútbol.",
        cta: "Encontrar pruebas →",
      },
    },
  },
  {
    id: 8,
    slug: "match-tours",
    visual: "cinematic",
    content: {
      en: {
        headline: "Stop watching. Start being there.",
        sub: "Champions League · Premier League · La Liga · Bundesliga",
        body: "Organised tours with tickets, hotel and transfers — all sorted.",
        cta: "Explore match tours →",
      },
      ru: {
        headline: "Перестань смотреть. Начни присутствовать.",
        sub: "Лига чемпионов · Премьер-лига · Ла Лига · Бундеслига",
        body: "Организованные туры с билетами, отелем и трансфером — всё включено.",
        cta: "Матч-туры →",
      },
      es: {
        headline: "Deja de ver. Empieza a estar allí.",
        sub: "Champions League · Premier League · La Liga · Bundesliga",
        body: "Tours organizados con entradas, hotel y traslados — todo resuelto.",
        cta: "Ver match tours →",
      },
    },
  },
  {
    id: 9,
    slug: "analytics",
    visual: "stats",
    content: {
      en: {
        headline: "Know exactly what's working.",
        sub: "Views, applications, conversion — per event, per month.",
        body: "Real-time analytics for every event you publish. Available on Pro and above.",
        cta: "See your analytics →",
      },
      ru: {
        headline: "Знайте точно, что работает.",
        sub: "Просмотры, заявки, конверсия — по каждому ивенту, каждый месяц.",
        body: "Аналитика в реальном времени для каждого опубликованного события. Доступно с плана Pro.",
        cta: "Посмотреть аналитику →",
      },
      es: {
        headline: "Saber exactamente qué funciona.",
        sub: "Vistas, solicitudes, conversión — por evento, por mes.",
        body: "Analítica en tiempo real para cada evento que publicas. Disponible en Pro y superior.",
        cta: "Ver analítica →",
      },
    },
  },
  {
    id: 10,
    slug: "festivals",
    visual: "quote",
    content: {
      en: {
        headline: "Football is a celebration.",
        sub: "Tournaments · Masterclasses · Music · Food · Culture",
        body: "\"We arrived as a team — we left as a family. The festival created memories we still talk about.\" — Captain, Berlin",
        cta: "Browse festivals →",
      },
      ru: {
        headline: "Футбол — это праздник.",
        sub: "Турниры · Мастер-классы · Музыка · Еда · Культура",
        body: "«Мы приехали командой — уехали семьёй. Фестиваль создал воспоминания, о которых мы всё ещё говорим.» — Капитан, Берлин",
        cta: "Смотреть фестивали →",
      },
      es: {
        headline: "El fútbol es una celebración.",
        sub: "Torneos · Masterclasses · Música · Comida · Cultura",
        body: "\"Llegamos como equipo — nos fuimos como familia. El festival creó recuerdos de los que aún hablamos.\" — Capitán, Berlín",
        cta: "Ver festivales →",
      },
    },
  },
  {
    id: 11,
    slug: "verified",
    visual: "card",
    content: {
      en: {
        headline: "Trust converts. Get Verified.",
        sub: "The Verified badge shows participants you've been reviewed by our team.",
        body: "Verified organizers get more applications. Available on Pro and above.",
        cta: "Upgrade to Pro →",
      },
      ru: {
        headline: "Доверие конвертирует. Получите Verified.",
        sub: "Значок Verified показывает участникам, что вы прошли модерацию платформы.",
        body: "Верифицированные организаторы получают больше заявок. Доступно с плана Pro.",
        cta: "Перейти на Pro →",
      },
      es: {
        headline: "La confianza convierte. Obtén la verificación.",
        sub: "La insignia Verified muestra que has sido revisado por nuestro equipo.",
        body: "Los organizadores verificados reciben más solicitudes. Disponible en Pro y superior.",
        cta: "Actualizar a Pro →",
      },
    },
  },
  {
    id: 12,
    slug: "clubs",
    visual: "stats",
    content: {
      en: {
        headline: "One platform. Every club need.",
        sub: "Register for tournaments · Book camps · Hold trials · Promote events",
        body: "From amateur clubs to professional academies — manage your entire season in one dashboard.",
        cta: "Start for free →",
      },
      ru: {
        headline: "Одна платформа. Все потребности клуба.",
        sub: "Регистрируйтесь на турниры · Бронируйте сборы · Проводите просмотры · Продвигайте события",
        body: "От любительских клубов до профессиональных академий — управляйте всем сезоном в одном дашборде.",
        cta: "Начать бесплатно →",
      },
      es: {
        headline: "Una plataforma. Todo lo que necesita un club.",
        sub: "Regístrate en torneos · Reserva stages · Realiza pruebas · Promociona eventos",
        body: "Desde clubes amateur hasta academias profesionales — gestiona toda tu temporada en un panel.",
        cta: "Empieza gratis →",
      },
    },
  },
  {
    id: 13,
    slug: "summer-camps",
    visual: "quote",
    content: {
      en: {
        headline: "One great camp can change everything.",
        sub: "Find summer football camps near you or abroad.",
        body: "\"One week in Spain gave my son more than three years at his local club. He came back a completely different player.\" — Mother, St. Petersburg",
        cta: "Find camps for your child →",
      },
      ru: {
        headline: "Один хороший кемп может изменить всё.",
        sub: "Найдите летний футбольный кемп рядом или за рубежом.",
        body: "«Одна неделя в Испании дала сыну больше, чем три года в местной секции. Он вернулся другим игроком.» — Мама, Санкт-Петербург",
        cta: "Найти кемп для ребёнка →",
      },
      es: {
        headline: "Un gran campamento puede cambiarlo todo.",
        sub: "Encuentra campamentos de fútbol de verano cerca o en el extranjero.",
        body: "\"Una semana en España le dio a mi hijo más que tres años en su club local. Volvió siendo un jugador completamente diferente.\" — Madre, San Petersburgo",
        cta: "Encontrar campamento →",
      },
    },
  },
  {
    id: 14,
    slug: "training-camps",
    visual: "quote",
    content: {
      en: {
        headline: "Teams that camp together, win together.",
        sub: "Pre-season · Tactical · Physical · Video-analysis camps",
        body: "Spain · Portugal · Turkey · UAE · Germany · Croatia — find the best base for your team.",
        cta: "Find training camps →",
      },
      ru: {
        headline: "Команды, которые вместе на сборах, вместе побеждают.",
        sub: "Предсезонные · Тактические · Физические · Видеоаналитические сборы",
        body: "Испания · Португалия · Турция · ОАЭ · Германия · Хорватия — найдите лучшую базу для команды.",
        cta: "Найти тренировочные сборы →",
      },
      es: {
        headline: "Los equipos que hacen stages juntos, ganan juntos.",
        sub: "Stages de pretemporada · Tácticos · Físicos · Análisis de vídeo",
        body: "España · Portugal · Turquía · EAU · Alemania · Croacia — encuentra la mejor base para tu equipo.",
        cta: "Encontrar stages →",
      },
    },
  },
  {
    id: 15,
    slug: "free-start",
    visual: "card",
    content: {
      en: {
        headline: "List your first event in under 10 minutes.",
        sub: "No credit card. No commitment. Free forever to start.",
        body: "Create profile → Publish event → Receive applications. Join 200+ organizers already on the platform.",
        cta: "Start free →",
      },
      ru: {
        headline: "Разместите первый ивент за 10 минут.",
        sub: "Без карты. Без обязательств. Бесплатно навсегда для старта.",
        body: "Создайте профиль → Опубликуйте ивент → Получайте заявки. Присоединяйтесь к 200+ организаторам на платформе.",
        cta: "Начать бесплатно →",
      },
      es: {
        headline: "Publica tu primer evento en menos de 10 minutos.",
        sub: "Sin tarjeta. Sin compromiso. Gratis para siempre al inicio.",
        body: "Crea perfil → Publica evento → Recibe solicitudes. Únete a más de 200 organizadores ya en la plataforma.",
        cta: "Empieza gratis →",
      },
    },
  },
  {
    id: 16,
    slug: "tournaments",
    visual: "cinematic",
    content: {
      en: {
        headline: "One weekend. More growth than a month of training.",
        sub: "Youth · Amateur · International · Semi-professional tournaments",
        body: "Filter by age, level and country. Apply online in 2 minutes.",
        cta: "Find a tournament →",
      },
      ru: {
        headline: "Один уикенд. Больше роста, чем за месяц тренировок.",
        sub: "Юношеские · Любительские · Международные · Полупрофессиональные турниры",
        body: "Фильтр по возрасту, уровню и стране. Подайте заявку онлайн за 2 минуты.",
        cta: "Найти турнир →",
      },
      es: {
        headline: "Un fin de semana. Más crecimiento que un mes de entrenamiento.",
        sub: "Torneos juveniles · Amateur · Internacionales · Semiprofesionales",
        body: "Filtra por edad, nivel y país. Solicita online en 2 minutos.",
        cta: "Encontrar un torneo →",
      },
    },
  },
  {
    id: 17,
    slug: "free-for-all",
    visual: "world",
    content: {
      en: {
        headline: "Search. Apply. Participate. Always free.",
        sub: "No fees for players or parents. Ever.",
        body: "footballevents.eu is free for everyone looking for an event — always was, always will be.",
        cta: "Find your event →",
      },
      ru: {
        headline: "Найди. Подай заявку. Участвуй. Всегда бесплатно.",
        sub: "Никаких комиссий для игроков и родителей. Никогда.",
        body: "footballevents.eu бесплатен для всех, кто ищет событие — всегда был и всегда будет.",
        cta: "Найти своё событие →",
      },
      es: {
        headline: "Busca. Solicita. Participa. Siempre gratis.",
        sub: "Sin comisiones para jugadores ni padres. Nunca.",
        body: "footballevents.eu es gratuito para todos los que buscan un evento — siempre lo fue y siempre lo será.",
        cta: "Encontrar tu evento →",
      },
    },
  },
  {
    id: 18,
    slug: "enterprise",
    visual: "stats",
    content: {
      en: {
        headline: "Running events at scale? Let's talk.",
        sub: "Enterprise plan for federations, leagues and agencies.",
        body: "White-label solution · Dedicated manager · Full API · SLA-backed moderation · 50% off all boosts",
        cta: "Contact us →",
      },
      ru: {
        headline: "Проводите мероприятия в масштабе? Поговорим.",
        sub: "Тариф Enterprise для федераций, лиг и агентств.",
        body: "White-label решение · Персональный менеджер · Полный API · Модерация по SLA · Скидка 50% на бусты",
        cta: "Связаться с нами →",
      },
      es: {
        headline: "¿Gestionas eventos a gran escala? Hablemos.",
        sub: "Plan Enterprise para federaciones, ligas y agencias.",
        body: "Solución white-label · Manager dedicado · API completa · Moderación con SLA · 50% dto. en todos los boosts",
        cta: "Contáctanos →",
      },
    },
  },
  {
    id: 19,
    slug: "sharing-kit",
    visual: "card",
    content: {
      en: {
        headline: "Your event, beautifully promoted.",
        sub: "Generate branded social media images for every event.",
        body: "Download and post to Instagram, Facebook or TikTok in one click. Premium feature.",
        cta: "Upgrade to Premium →",
      },
      ru: {
        headline: "Ваш ивент — красиво продвинут.",
        sub: "Генерируйте фирменные изображения для соцсетей для каждого события.",
        body: "Скачайте и опубликуйте в Instagram, Facebook или TikTok одним кликом. Функция Premium.",
        cta: "Перейти на Premium →",
      },
      es: {
        headline: "Tu evento, promocionado con estilo.",
        sub: "Genera imágenes de marca para redes sociales para cada evento.",
        body: "Descarga y publica en Instagram, Facebook o TikTok con un clic. Función Premium.",
        cta: "Actualizar a Premium →",
      },
    },
  },
  {
    id: 20,
    slug: "launch-promo",
    visual: "card",
    content: {
      en: {
        headline: "First 50 organizers get 3 months of Premium free.",
        sub: "Sign up now and unlock the full platform.",
        body: "25 events · Video embed · Featured carousel · Sharing kit · Account manager · 3 boosts/month",
        cta: "Claim your Premium →",
      },
      ru: {
        headline: "Первые 50 организаторов — 3 месяца Premium бесплатно.",
        sub: "Зарегистрируйтесь сейчас и разблокируйте полную платформу.",
        body: "25 событий · Видео-эмбед · Featured-карусель · Шэринг-кит · Аккаунт-менеджер · 3 буста/месяц",
        cta: "Получить Premium →",
      },
      es: {
        headline: "Los primeros 50 organizadores obtienen 3 meses de Premium gratis.",
        sub: "Regístrate ahora y desbloquea la plataforma completa.",
        body: "25 eventos · Embed de vídeo · Carrusel Featured · Kit de difusión · Account manager · 3 boosts/mes",
        cta: "Reclamar Premium →",
      },
    },
  },
];

export const SIZES: Record<AdFormat, { width: number; height: number }> = {
  portrait:  { width: 1080, height: 1350 },
  story:     { width: 1080, height: 1920 },
  landscape: { width: 1920, height: 1080 },
};
