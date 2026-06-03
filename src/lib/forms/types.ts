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
  | "size"        // apparel size pick + optional size chart
  | "country"     // country name (free text / list)
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

export type RegistrationForm = { fields: FormField[] };

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
  size: "Size (with chart)",
  country: "Country",
  heading: "Section heading",
  info: "Info text",
};

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
    return { fields: (raw as RegistrationForm).fields.filter((f) => f && f.id && f.type && f.label) };
  }
  return { fields: [] };
}
