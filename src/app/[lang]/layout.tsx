import type { Metadata, Viewport } from "next";
import { LANGS, isLang } from "@/content/site";
import { SITE_URL } from "@/lib/site-url";
import { fontVars } from "../fonts";
import "../globals.css";

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  authors: [{ name: "Pedro Felipe de Oliveira", url: "https://github.com/pdrflp0" }],
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#f3f0e8",
};

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang: raw } = await params;
  // idioma inválido: a página responde 404 dentro deste layout
  const lang = isLang(raw) ? raw : "pt";

  return (
    <html
      lang={lang === "pt" ? "pt-BR" : "en"}
      className={`${fontVars} antialiased`}
    >
      <body>{children}</body>
    </html>
  );
}
