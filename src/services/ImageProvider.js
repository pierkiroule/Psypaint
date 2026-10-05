const COMMONS_ENDPOINT = "https://commons.wikimedia.org/w/api.php";

export const RESONANCE_TERMS = {
  wave: ["water reflection", "fluid light", "mist texture"], growth: ["tender foliage", "organic detail", "diffused green light"],
  fire: ["ember glow", "warm mineral", "moving light"], stone: ["weathered texture", "mineral detail", "quiet geology"],
  moon: ["night haze", "silver reflection", "quiet darkness"], sun: ["golden diffusion", "light through matter", "warm atmosphere"],
  tree: ["light through branches", "bark detail", "forest shadow"], bubble: ["iridescent reflection", "floating translucence", "soft refraction"],
  vortex: ["flowing cloud", "spiral current", "motion texture"], sparkle: ["bokeh darkness", "glimmer detail", "scattered light"],
  feather: ["soft filament", "delicate texture", "weightless detail"], drop: ["wet reflection", "rain glass", "liquid macro"]
};

export function semanticKeywords(symbols = [], seed = 0) {
  const terms = symbols.slice(0, 2).flatMap((symbol, index) => {
    const pool = RESONANCE_TERMS[symbol] || [];
    return pool.length ? [pool[(Math.floor(seed * pool.length) + index) % pool.length]] : [];
  });
  return terms.length ? [...terms, "atmospheric close up"] : ["abstract nature texture", "diffused light"];
}

const text = value => String(value?.value || value || "").replace(/<[^>]+>/g, "");
const reusableWithoutCredit = metadata => /public domain|cc0/i.test(text(metadata?.LicenseShortName));

/** Network-only image retrieval. Rendering and WebGL concerns deliberately live elsewhere. */
export class WikimediaImageProvider {
  constructor(fetcher = globalThis.fetch) { this.fetcher = fetcher; this.controller = null; this.bitmaps = new Set(); }
  async search(keywords, limit = 24) {
    this.controller?.abort(); this.controller = new AbortController();
    const resonances = [...new Set(keywords.flatMap(keyword => keyword.split(" ")))].join(" OR ");
    const params = new URLSearchParams({ origin: "*", action: "query", format: "json", generator: "search", gsrnamespace: "6", gsrsearch: `(${resonances}) filetype:bitmap`, gsrlimit: String(Math.min(50, Math.max(limit, 40))), prop: "imageinfo", iiprop: "url|extmetadata", iiurlwidth: "640" });
    const response = await this.fetcher(`${COMMONS_ENDPOINT}?${params}`, { signal: this.controller.signal });
    if (!response.ok) throw new Error(`Image search failed: ${response.status}`);
    const payload = await response.json();
    return Object.values(payload.query?.pages || {}).flatMap(page => {
      const info = page.imageinfo?.[0], metadata = info?.extmetadata;
      if (!info?.thumburl || !reusableWithoutCredit(metadata)) return [];
      return [{ id: page.pageid, title: page.title, url: info.thumburl, source: info.descriptionurl, width: info.thumbwidth, height: info.thumbheight, license: text(metadata.LicenseShortName), author: text(metadata.Artist) }];
    });
  }
  getOptimizedImage(result) { return result?.url || ""; }
  async preload(result) {
    const response = await this.fetcher(this.getOptimizedImage(result), { signal: this.controller?.signal });
    if (!response.ok) throw new Error(`Image preload failed: ${response.status}`);
    const bitmap = await createImageBitmap(await response.blob()); this.bitmaps.add(bitmap); return bitmap;
  }
  release(bitmap) { if (!bitmap) return; bitmap.close?.(); this.bitmaps.delete(bitmap); }
  dispose() { this.controller?.abort(); this.bitmaps.forEach(bitmap => bitmap.close?.()); this.bitmaps.clear(); }
}
