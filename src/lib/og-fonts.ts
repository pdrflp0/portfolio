import { cacheLife } from "next/cache";

export async function loadGoogleFont(family: string, text: string) {
  "use cache";
  cacheLife("max");
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=${family}&text=${encodeURIComponent(text)}`,
    ).then((r) => r.text());
    const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    if (!url) return null;
    return await fetch(url).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

export function ogFonts(serif: ArrayBuffer | null, sans: ArrayBuffer | null) {
  return [
    ...(serif ? [{ name: "Instrument Serif", data: serif, style: "normal" as const, weight: 400 as const }] : []),
    ...(sans ? [{ name: "Geist", data: sans, style: "normal" as const, weight: 400 as const }] : []),
  ];
}
