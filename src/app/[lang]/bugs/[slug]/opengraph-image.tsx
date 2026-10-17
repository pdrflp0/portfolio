import { ImageResponse } from "next/og";
import { DIARY, POSTS } from "@/content/bugs";
import { PROJECTS, isLang } from "@/content/site";
import { loadGoogleFont, ogFonts } from "@/lib/og-fonts";

export const alt = "Post-mortem — Pedro Felipe";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export default async function Image({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang: raw, slug } = await params;
  const lang = isLang(raw) ? raw : "pt";
  const post = POSTS.find((p) => p.slug === slug) ?? POSTS[0];
  const project = PROJECTS.find((p) => p.id === post.project)!;
  const title = post.title[lang];
  const kicker = `post-mortem · ${project.name[lang]}`;
  const footer = `Pedro Felipe · ${DIARY[lang].title}`;

  const [serif, sans] = await Promise.all([loadGoogleFont("Instrument+Serif", title), loadGoogleFont("Geist", kicker + footer)]);

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
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 26, color: "#9a5640" }}>
          <div style={{ display: "flex", flexWrap: "wrap", width: 18, height: 18 }}>
            <div style={{ width: 9, height: 9, background: "#ff00dc" }} />
            <div style={{ width: 9, height: 9, background: "#000" }} />
            <div style={{ width: 9, height: 9, background: "#000" }} />
            <div style={{ width: 9, height: 9, background: "#ff00dc" }} />
          </div>
          {kicker}
        </div>
        <div style={{ fontSize: 96, lineHeight: 1, letterSpacing: "-0.02em", fontFamily: serif ? "Instrument Serif" : undefined, display: "flex" }}>
          {title}
        </div>
        <div style={{ fontSize: 26, color: "#4a4e57", display: "flex" }}>{footer}</div>
      </div>
    ),
    { ...size, fonts: ogFonts(serif, sans).length ? ogFonts(serif, sans) : undefined },
  );
}
