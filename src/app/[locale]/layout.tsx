import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale, getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { CookieBanner } from "@/components/site/CookieBanner";
import { BugReportButton } from "@/components/feedback/BugReportButton";
import { WebSiteJsonLd, OrganizationJsonLd } from "@/components/seo/JsonLd";
import "../globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#00D26A" },
    { media: "(prefers-color-scheme: dark)", color: "#0A1628" },
  ],
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const title = `${t("siteName")} — ${t("tagline")}`;

  // Locale → OG locale code (Facebook expects xx_XX form)
  const OG_LOCALE: Record<string, string> = { en: "en_US", ru: "ru_RU", de: "de_DE", es: "es_ES" };

  return {
    title: { default: title, template: `%s · ${t("siteName")}` },
    description: t("tagline"),
    metadataBase: new URL(siteUrl),
    applicationName: t("siteName"),
    keywords: ["football events", "football tournaments", "football camps", "soccer events", "youth football"],
    icons: { icon: "/favicon.ico", apple: "/apple-touch-icon.png" },
    other: {
      "format-detection": "telephone=no",
    },
    openGraph: {
      type: "website",
      siteName: t("siteName"),
      title,
      description: t("tagline"),
      url: siteUrl,
      locale: OG_LOCALE[locale] ?? "en_US",
      alternateLocale: Object.values(OG_LOCALE).filter((l) => l !== (OG_LOCALE[locale] ?? "en_US")),
      images: [{ url: "/og-default.jpg", width: 1200, height: 630, alt: t("siteName") }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: t("tagline"),
      images: ["/og-default.jpg"],
    },
    // NOTE: no canonical/hreflang here — those are PAGE-specific. Setting them
    // in the shared layout canonicalised every page without its own metadata to
    // the homepage. The homepage sets its own alternates (see [locale]/page.tsx).
    // RSS auto-discovery (page-agnostic) stays here.
    alternates: {
      types: {
        "application/rss+xml": `${siteUrl}/feed.xml`,
      },
    },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
      yandex: process.env.YANDEX_SITE_VERIFICATION || undefined,
      other: {
        ...(process.env.BING_SITE_VERIFICATION
          ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION }
          : {}),
        ...(process.env.YANDEX_SITE_VERIFICATION
          ? { "yandex-verification": process.env.YANDEX_SITE_VERIFICATION }
          : {}),
      },
    },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();

  // Embed routes (/[locale]/embed/...) render without site chrome so they sit
  // cleanly inside a third-party <iframe>.
  const { headers } = await import("next/headers");
  const pathname = (await headers()).get("x-pathname") ?? "";
  const isEmbed = /\/embed(\/|$)/.test(pathname);

  const tBug = await getTranslations({ locale, namespace: "bugReport" });
  const bugReportLabels = {
    buttonLabel: tBug("buttonLabel"),
    modal: {
      title: tBug("title"),
      subtitle: tBug("subtitle"),
      categoryLabel: tBug("categoryLabel"),
      categories: {
        BUG: tBug("categoryBug"),
        TRANSLATION: tBug("categoryTranslation"),
        WRONG_INFO: tBug("categoryWrongInfo"),
        FORM: tBug("categoryForm"),
        OTHER: tBug("categoryOther"),
      },
      messageLabel: tBug("messageLabel"),
      messagePlaceholder: tBug("messagePlaceholder"),
      emailLabel: tBug("emailLabel"),
      emailHint: tBug("emailHint"),
      screenshotLabel: tBug("screenshotLabel"),
      screenshotCapturing: tBug("screenshotCapturing"),
      screenshotAttached: tBug("screenshotAttached"),
      screenshotRemove: tBug("screenshotRemove"),
      submit: tBug("submit"),
      submitting: tBug("submitting"),
      sentTitle: tBug("sentTitle"),
      sentBody: tBug("sentBody"),
      sentClose: tBug("sentClose"),
      cancel: tBug("cancel"),
    },
  };

  return (
    <html lang={locale} className={`${inter.variable} ${manrope.variable}`}>
      <head>
        {/* Plausible Analytics — privacy-friendly, no cookies. Configure with:
            NEXT_PUBLIC_PLAUSIBLE_DOMAIN (your verified domain in Plausible)
            NEXT_PUBLIC_PLAUSIBLE_SCRIPT (defaults to plausible.io; override for self-hosted) */}
        {process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN && (
          <script
            defer
            data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
            src={process.env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT ?? "https://plausible.io/js/script.js"}
          />
        )}
        {/* Umami alternative — set NEXT_PUBLIC_UMAMI_WEBSITE_ID + NEXT_PUBLIC_UMAMI_SCRIPT */}
        {process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID && process.env.NEXT_PUBLIC_UMAMI_SCRIPT && (
          <script
            defer
            data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
            src={process.env.NEXT_PUBLIC_UMAMI_SCRIPT}
          />
        )}
        {/* Google Analytics 4 with Consent Mode v2 — gtag is loaded on every page,
            but consent defaults to "denied" so no cookies are written until the user
            clicks "Accept" in the cookie banner. The banner then dispatches an event
            that the inline script below listens for to flip consent to "granted". */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  window.gtag = gtag;
                  gtag('consent', 'default', {
                    ad_storage: 'denied',
                    ad_user_data: 'denied',
                    ad_personalization: 'denied',
                    analytics_storage: 'denied',
                    wait_for_update: 500,
                  });
                  try {
                    var c = JSON.parse(localStorage.getItem('fe_cookie_consent_v1') || 'null');
                    if (c && c.v === 'accept') {
                      gtag('consent', 'update', { analytics_storage: 'granted' });
                    }
                  } catch (e) {}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', { anonymize_ip: true });
                `,
              }}
            />
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`} />
          </>
        )}
        {/* Yandex.Metrika — primary analytics for RU/CIS audience. webvisor + clickmap on.
            Counter ID via NEXT_PUBLIC_YANDEX_METRIKA_ID. */}
        {process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID && (
          <>
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
                  m[i].l=1*new Date();
                  for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
                  k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
                  (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
                  ym(${process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID}, "init", {
                    clickmap:true, trackLinks:true, accurateTrackBounce:true, webvisor:true
                  });
                `,
              }}
            />
            <noscript>
              <div>
                <img src={`https://mc.yandex.ru/watch/${process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID}`} style={{ position: "absolute", left: "-9999px" }} alt="" />
              </div>
            </noscript>
          </>
        )}
      </head>
      <body className="flex min-h-screen flex-col overflow-x-clip bg-[var(--color-background)] text-[var(--color-foreground)] antialiased">
        <WebSiteJsonLd locale={locale} />
        <OrganizationJsonLd locale={locale} />
        <NextIntlClientProvider locale={locale} messages={messages}>
          {isEmbed ? (
            <main className="flex-1">{children}</main>
          ) : (
            <>
              <SiteHeader />
              <main className="flex-1">{children}</main>
              <SiteFooter />
              <CookieBanner />
              <BugReportButton labels={bugReportLabels} locale={locale} />
            </>
          )}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
