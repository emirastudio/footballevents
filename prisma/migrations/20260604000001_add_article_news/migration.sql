-- Article — AI-rewritten news (WC2026 + general football).
-- One Article = one SEO page; ArticleTranslation per locale (EN at
-- create-time, RU/DE/ES generated on-demand on first non-EN page hit).
-- IngestedSource tracks the upstream feed item for dedup + provenance.

CREATE TYPE "ArticleCategory" AS ENUM ('WC2026', 'GENERAL');
CREATE TYPE "ArticleStatus"   AS ENUM ('DRAFT', 'PUBLISHED', 'REJECTED');

CREATE TABLE "IngestedSource" (
  "id"         TEXT         NOT NULL PRIMARY KEY,
  "externalId" TEXT         NOT NULL,
  "url"        TEXT         NOT NULL,
  "publisher"  TEXT         NOT NULL,
  "fetchedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "titleHash"  TEXT         NOT NULL
);
CREATE UNIQUE INDEX "IngestedSource_externalId_key" ON "IngestedSource"("externalId");
CREATE INDEX "IngestedSource_titleHash_idx"  ON "IngestedSource"("titleHash");
CREATE INDEX "IngestedSource_fetchedAt_idx"  ON "IngestedSource"("fetchedAt");

CREATE TABLE "Article" (
  "id"          TEXT              NOT NULL PRIMARY KEY,
  "slug"        TEXT              NOT NULL,
  "category"    "ArticleCategory" NOT NULL,
  "status"      "ArticleStatus"   NOT NULL DEFAULT 'DRAFT',
  "publishedAt" TIMESTAMP(3),
  "createdAt"   TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3)      NOT NULL,
  "tags"        TEXT[]            DEFAULT ARRAY[]::TEXT[],
  "sourceId"    TEXT,
  CONSTRAINT "Article_sourceId_fkey"
    FOREIGN KEY ("sourceId") REFERENCES "IngestedSource"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Article_slug_key"     ON "Article"("slug");
CREATE UNIQUE INDEX "Article_sourceId_key" ON "Article"("sourceId");
CREATE INDEX "Article_category_status_publishedAt_idx"
  ON "Article"("category","status","publishedAt");

CREATE TABLE "ArticleTranslation" (
  "id"              TEXT         NOT NULL PRIMARY KEY,
  "articleId"       TEXT         NOT NULL,
  "locale"          "Locale"     NOT NULL,
  "title"           TEXT         NOT NULL,
  "metaDescription" TEXT         NOT NULL,
  "lead"            TEXT         NOT NULL,
  "body"            TEXT         NOT NULL,
  "generatedByAi"   BOOLEAN      NOT NULL DEFAULT TRUE,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ArticleTranslation_articleId_fkey"
    FOREIGN KEY ("articleId") REFERENCES "Article"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ArticleTranslation_articleId_locale_key"
  ON "ArticleTranslation"("articleId","locale");
CREATE INDEX "ArticleTranslation_locale_idx" ON "ArticleTranslation"("locale");
