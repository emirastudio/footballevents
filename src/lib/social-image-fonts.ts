// Lightweight in-memory font cache for Satori (`next/og`). Bebas Neue is the
// accent display face; Inter is the body workhorse with full Latin/Cyrillic
// coverage (events span EN/RU/DE/ES). Fonts are fetched once per cold start.

let cache: Promise<{ name: string; data: ArrayBuffer; weight: 400 | 700; style: "normal" }[]> | null = null;

const URLS = {
  bebas:    "https://fonts.gstatic.com/s/bebasneue/v16/JTUSjIg69CK48gW7PXooxW4.ttf",
  interReg: "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZg.ttf",
  interBold:"https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYMZg.ttf",
};

async function fetchFont(url: string): Promise<ArrayBuffer> {
  const r = await fetch(url, { cache: "force-cache" });
  if (!r.ok) throw new Error(`font fetch failed: ${url}`);
  return r.arrayBuffer();
}

export function getSocialImageFonts() {
  if (!cache) {
    cache = (async () => {
      const [bebas, interReg, interBold] = await Promise.all([
        fetchFont(URLS.bebas),
        fetchFont(URLS.interReg),
        fetchFont(URLS.interBold),
      ]);
      return [
        { name: "Bebas Neue", data: bebas,    weight: 400 as const, style: "normal" as const },
        { name: "Inter",      data: interReg, weight: 400 as const, style: "normal" as const },
        { name: "Inter",      data: interBold, weight: 700 as const, style: "normal" as const },
      ];
    })();
  }
  return cache;
}
