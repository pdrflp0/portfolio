import type { Metadata } from "next";
import { OffTheMap } from "@/components/OffTheMap";
import { fontVars } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "404 — fora do mapa",
  description: "Esta página não existe. / This page does not exist.",
};

export default function GlobalNotFound() {
  return (
    <html lang="pt-BR" className={`${fontVars} antialiased`}>
      <body>
        <OffTheMap />
      </body>
    </html>
  );
}
