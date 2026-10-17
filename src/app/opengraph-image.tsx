import { ImageResponse } from "next/og";
import { cacheLife } from "next/cache";

export const alt = "Pedro Felipe — Desenvolvedor back-end";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const TITLE = "Pedro Felipe";
const STATUS = "Buscando estágio ou vaga júnior · Fortaleza, CE";
const ROLE = "Back-end · Java & TypeScript · PostgreSQL";
const HANDLE = "github.com/pdrflp0";

/** Busca só os glifos usados de uma fonte do Google Fonts; sem rede, cai na fonte padrão. */
async function loadFont(family: string, text: string) {
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

export default async function Image() {
  const [serif, sans] = await Promise.all([
    loadFont("Instrument+Serif", TITLE),
    loadFont("Geist", STATUS + ROLE + HANDLE),
  ]);
  const fonts = [
    ...(serif ? [{ name: "Instrument Serif", data: serif, style: "normal" as const, weight: 400 as const }] : []),
    ...(sans ? [{ name: "Geist", data: sans, style: "normal" as const, weight: 400 as const }] : []),
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f3f0e8",
          color: "#15171b",
          padding: "72px 80px",
          fontFamily: sans ? "Geist" : undefined,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 24, color: "#4a4e57" }}>
          <div style={{ width: 12, height: 12, borderRadius: 12, background: "#5fb98e" }} />
          {STATUS}
        </div>
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <div
            style={{
              fontSize: 190,
              lineHeight: 0.9,
              letterSpacing: "-0.035em",
              fontFamily: serif ? "Instrument Serif" : undefined,
            }}
          >
            {TITLE}
          </div>
          {/* o ponto final é a textura faltando */}
          <div style={{ display: "flex", flexWrap: "wrap", width: 30, height: 30, marginLeft: 8, marginBottom: 26 }}>
            <div style={{ width: 15, height: 15, background: "#ff00dc" }} />
            <div style={{ width: 15, height: 15, background: "#000" }} />
            <div style={{ width: 15, height: 15, background: "#000" }} />
            <div style={{ width: 15, height: 15, background: "#ff00dc" }} />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, color: "#4a4e57" }}>
          <span style={{ color: "#9a5640" }}>{ROLE}</span>
          <span>{HANDLE}</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fonts.length ? fonts : undefined,
    },
  );
}
