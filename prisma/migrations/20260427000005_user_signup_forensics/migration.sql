-- Capture signup metadata for spam/bot triage
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "signupIp"        TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "signupCountry"   TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "signupUserAgent" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "signupMethod"    TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLoginAt"     TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLoginIp"     TEXT;
