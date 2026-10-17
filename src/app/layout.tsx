import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

const description =
  "Portfólio de Pedro Felipe de Oliveira, desenvolvedor back-end (Java/Spring Boot, TypeScript/NestJS, PostgreSQL) em Fortaleza, CE. Buscando estágio ou vaga júnior.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Pedro Felipe — Desenvolvedor back-end",
  description,
  authors: [{ name: "Pedro Felipe de Oliveira", url: "https://github.com/pdrflp0" }],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    alternateLocale: "en_US",
    title: "Pedro Felipe — Desenvolvedor back-end",
    description,
    siteName: "Pedro Felipe",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#f3f0e8",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} antialiased`}
    >
      <body>{children}</body>
    </html>
  );
}
