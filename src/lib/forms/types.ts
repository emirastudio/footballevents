// Registration form builder — field schema shared by the organizer builder,
// the public renderer and the server-side validator/exporter.
//
// The form DEFINITION lives on Event.registrationForm (JSON). A submission's
// ANSWERS live on Booking.customFields (JSON) keyed by field id.

export type FieldType =
  | "text"        // short text
  | "textarea"    // paragraph
  | "email"
  | "phone"
  | "number"
  | "date"
  | "select"      // single dropdown
  | "multiselect" // multiple from a list
  | "checkboxes"  // multiple choice (array)
  | "radio"       // single choice
  | "consent"     // single required checkbox (agree)
  | "rules"       // event rules text + an agreement checkbox
  | "file"        // file upload (image / PDF) → stores a URL
  | "size"        // apparel size pick + optional size chart
  | "country"     // country name (free text / list)
  | "countrycity" // combined: searchable country (with flag) + city
  | "yesno"       // a single Yes / No choice
  | "heading"     // section heading — display only
  | "info";       // info paragraph — display only

/** A size chart shown next to a `size` field. */
export type SizeChart = { headers: string[]; rows: string[][] };

export type FormField = {
  id: string;            // stable key used in Booking.customFields
  type: FieldType;
  label: string;
  required?: boolean;
  help?: string;         // hint / description under the field
  placeholder?: string;
  options?: string[];    // select / multiselect / checkboxes / radio / size
  sizeChart?: SizeChart; // size only
};

/** Per-locale text overrides for a field (filled by auto-translation). */
export type FieldI18n = Partial<Pick<FormField, "label" | "help" | "placeholder" | "options">> & {
  sizeChart?: SizeChart;
};

export type RegistrationForm = {
  fields: FormField[];          // base language (as authored)
  baseLocale?: string;          // locale the fields were authored in
  i18n?: Record<string, Record<string, FieldI18n>>; // locale → fieldId → overrides
};

/** Field types that don't collect input (display only). */
export const DISPLAY_TYPES: FieldType[] = ["heading", "info"];

/** Field types whose config needs a list of options. */
export const OPTION_TYPES: FieldType[] = ["select", "multiselect", "checkboxes", "radio", "size"];

/** Answers that are arrays (multiple values). */
export const MULTI_VALUE_TYPES: FieldType[] = ["multiselect", "checkboxes"];

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: "Short text",
  textarea: "Paragraph",
  email: "Email",
  phone: "Phone",
  number: "Number",
  date: "Date",
  select: "Dropdown",
  multiselect: "Multi-select",
  checkboxes: "Checkboxes",
  radio: "Single choice",
  consent: "Consent checkbox",
  rules: "Event rules (+ agree)",
  file: "File upload",
  size: "Size (with chart)",
  country: "Country",
  countrycity: "Country & city",
  yesno: "Yes / No",
  heading: "Section heading",
  info: "Info text",
};

/** Some older saved forms stored the raw i18n key ("formBuilder.types.yesno") as
 *  the field label because the translation was missing when the field was added.
 *  Fall back to a readable type label so a raw key is never shown to users. */
export function fieldLabel(label: string, typeLabels?: Partial<Record<FieldType, string>>): string {
  const m = /^formBuilder\.types\.([a-z]+)$/.exec(label ?? "");
  if (!m) return label;
  const t = m[1] as FieldType;
  return typeLabels?.[t] ?? FIELD_TYPE_LABELS[t] ?? label;
}

export function isDisplayField(t: FieldType): boolean {
  return DISPLAY_TYPES.includes(t);
}
export function hasOptions(t: FieldType): boolean {
  return OPTION_TYPES.includes(t);
}
export function isMultiValue(t: FieldType): boolean {
  return MULTI_VALUE_TYPES.includes(t);
}

/** Parse Event.registrationForm JSON into a typed form (safe). */
export function parseForm(raw: unknown): RegistrationForm {
  if (raw && typeof raw === "object" && Array.isArray((raw as RegistrationForm).fields)) {
    const r = raw as RegistrationForm;
    return {
      fields: r.fields.filter((f) => f && f.id && f.type && f.label),
      baseLocale: typeof r.baseLocale === "string" ? r.baseLocale : undefined,
      i18n: r.i18n && typeof r.i18n === "object" ? r.i18n : undefined,
    };
  }
  return { fields: [] };
}

/** Apply auto-translation overrides for `locale`, falling back to base text. */
export function localizeFields(form: RegistrationForm, locale: string): FormField[] {
  if (!form.i18n || locale === form.baseLocale) return form.fields;
  const overrides = form.i18n[locale];
  if (!overrides) return form.fields;
  return form.fields.map((f) => {
    const o = overrides[f.id];
    if (!o) return f;
    return {
      ...f,
      label: o.label ?? f.label,
      help: o.help ?? f.help,
      placeholder: o.placeholder ?? f.placeholder,
      options: o.options ?? f.options,
      sizeChart: o.sizeChart ?? f.sizeChart,
    };
  });
}
