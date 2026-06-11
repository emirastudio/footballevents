// Replace the broken KIT SIZE options + size chart on the event
// `fp-universal-campus-2026` with the official Macron chart (3XS → M).
//
// Why: the current form stores fabricated codes (e.g. "XSY", "2XS") and a
// height ladder that doesn't match any real Macron size guide. Source for the
// correct values: https://www.macron.com/uk/size-guide
//
// Behaviour:
//   • finds the event by slug
//   • parses Event.registrationForm JSON
//   • locates the size field (type === "size"; if the form has more than one,
//     the script aborts and lists them — fail loud, not silent)
//   • replaces options + sizeChart on the base field
//   • clears `options` and `sizeChart` overrides from i18n.{locale}.{fieldId}
//     so localised renders fall back to the new base values (labels and other
//     translations are preserved). Auto-translation can re-populate later.
//
// Dry-run by default. Pass --apply to actually write.
//
// Local:   DATABASE_URL=… pnpm tsx scripts/fix-fp-universal-kit-sizes.ts [--apply]
// Prod:    ssh fe-prod 'cd … && pnpm tsx scripts/fix-fp-universal-kit-sizes.ts --apply'

import { db } from "../src/lib/db";
import { parseForm, type FormField, type RegistrationForm } from "../src/lib/forms/types";

const EVENT_SLUG = "fp-universal-campus-2026";

const NEW_OPTIONS = [
  "3XS (7-8 yrs, 120-132 cm)",
  "XXS (9-10 yrs, 133-146 cm)",
  "XS (11-12 yrs, 147-160 cm)",
  "JR S (13-14 yrs, 160-172 cm)",
  "S (Adult, 165-172 cm)",
  "M (Adult, 171-179 cm)",
];

const NEW_SIZE_CHART = {
  headers: ["Size", "Age", "Height (cm)", "Chest (cm)"],
  rows: [
    ["3XS", "7-8", "120-132", "64-72"],
    ["XXS", "9-10", "133-146", "72-80"],
    ["XS", "11-12", "147-160", "80-88"],
    ["JR S", "13-14", "160-172", "88-96"],
    ["S", "Adult", "165-172", "92-96"],
    ["M", "Adult", "171-179", "96-100"],
  ],
};

async function main() {
  const apply = process.argv.includes("--apply");

  const event = await db.event.findUnique({
    where: { slug: EVENT_SLUG },
    select: {
      id: true,
      slug: true,
      registrationForm: true,
      translations: { select: { locale: true, title: true } },
    },
  });

  if (!event) {
    console.error(`✗ Event not found: slug=${EVENT_SLUG}`);
    process.exit(1);
  }

  const form: RegistrationForm = parseForm(event.registrationForm);
  if (form.fields.length === 0) {
    console.error(`✗ Event ${EVENT_SLUG} has no registrationForm fields.`);
    process.exit(1);
  }

  const sizeFields = form.fields.filter((f) => f.type === "size");
  if (sizeFields.length === 0) {
    console.error(`✗ No 'size' field found on event ${EVENT_SLUG}.`);
    console.error(`  Existing fields: ${form.fields.map((f) => `${f.id}/${f.type}/${f.label}`).join(", ")}`);
    process.exit(1);
  }
  if (sizeFields.length > 1) {
    console.error(`✗ More than one 'size' field on event ${EVENT_SLUG} — won't guess which to update. Fix manually.`);
    console.error(sizeFields.map((f) => `  - id=${f.id} label="${f.label}"`).join("\n"));
    process.exit(1);
  }
  const target = sizeFields[0];

  // --- diff preview -------------------------------------------------------
  const title =
    event.translations.find((t) => t.locale === "en")?.title ?? event.slug;
  console.log(`Event: ${title} (id=${event.id})`);
  console.log(`Size field: id=${target.id} label="${target.label}"\n`);

  console.log("Current options:");
  (target.options ?? []).forEach((o) => console.log(`  - ${o}`));
  console.log("\nNew options:");
  NEW_OPTIONS.forEach((o) => console.log(`  + ${o}`));

  console.log("\nCurrent size chart:");
  console.log(JSON.stringify(target.sizeChart, null, 2));
  console.log("\nNew size chart:");
  console.log(JSON.stringify(NEW_SIZE_CHART, null, 2));

  // --- patch ---------------------------------------------------------------
  const newFields: FormField[] = form.fields.map((f) =>
    f.id === target.id ? { ...f, options: NEW_OPTIONS, sizeChart: NEW_SIZE_CHART } : f,
  );

  // Strip stale options/sizeChart overrides for this field across all locales
  // so localised renders fall back to the new base values. Other overrides
  // (label/help/placeholder translations) are preserved.
  const newI18n = form.i18n ? structuredClone(form.i18n) : undefined;
  if (newI18n) {
    for (const locale of Object.keys(newI18n)) {
      const fieldOverride = newI18n[locale]?.[target.id];
      if (fieldOverride) {
        delete fieldOverride.options;
        delete fieldOverride.sizeChart;
      }
    }
  }

  const newForm: RegistrationForm = {
    ...form,
    fields: newFields,
    ...(newI18n ? { i18n: newI18n } : {}),
  };

  if (!apply) {
    console.log("\n— DRY RUN — pass --apply to write changes.");
    return;
  }

  await db.event.update({
    where: { id: event.id },
    data: { registrationForm: newForm as never },
  });
  console.log("\n✓ Updated.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
