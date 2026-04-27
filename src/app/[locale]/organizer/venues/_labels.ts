import type { VenueLabels } from "@/components/organizer/VenueForm";

type T = (k: string) => string;

export function buildVenueLabels(t: T): VenueLabels {
  return {
    name: t("name"),
    country: t("country"),
    city: t("city"),
    address: t("address"),
    capacity: t("capacity"),
    surfaceType: t("surfaceType"),
    surfaceGrass: t("surfaceGrass"),
    surfaceArtificial: t("surfaceArtificial"),
    surfaceHybrid: t("surfaceHybrid"),
    surfaceIndoor: t("surfaceIndoor"),
    website: t("website"),
    isStadium: t("isStadium"),
    isStadiumHint: t("isStadiumHint"),
    cover: t("cover"),
    submit: t("submit"),
    saving: t("saving"),
    errors: {
      nameRequired: t("errors.nameRequired"),
      countryRequired: t("errors.countryRequired"),
    },
  };
}
