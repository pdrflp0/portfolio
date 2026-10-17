import { ImageResponse } from "next/og";
import { loadGoogleFont, ogFonts } from "@/lib/og-fonts";

export const alt = "Pedro Felipe — back-end";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return [{ lang: "pt" }, { lang: "en" }];
}

const TITLE = "Pedro Felipe";
const ROLE = "Back-end · Java & TypeScript · PostgreSQL";
const HANDLE = "github.com/pdrflp0";

export default async function Image({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const STATUS = lang === "en" ? "Open to internships and junior roles · Fortaleza, Brazil" : "Buscando estágio ou vaga júnior · Fortaleza, CE";
  const [serif, sans] = await Promise.all([
    loadGoogleFont("Instrument+Serif", TITLE),
    loadGoogleFont("Geist", STATUS + ROLE + HANDLE),
  ]);
  const fonts = ogFonts(serif, sans);

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
