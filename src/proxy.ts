import { NextResponse, type NextRequest } from "next/server";

/** "/" não tem conteúdo próprio: manda para /pt ou /en (cookie da última escolha, senão o idioma do navegador). */
export function proxy(request: NextRequest) {
  const saved = request.cookies.get("pf.lang")?.value;
  const lang = saved === "pt" || saved === "en" ? saved : preferred(request.headers.get("accept-language"));
  const url = request.nextUrl.clone();
  url.pathname = `/${lang}`;
  return NextResponse.redirect(url, 307);
}

function preferred(header: string | null): "pt" | "en" {
  if (!header) return "pt";
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { tag: tag.toLowerCase(), q: q ? Number(q) : 1 };
    })
    .filter((l) => l.tag.startsWith("pt") || l.tag.startsWith("en"))
    .sort((a, b) => b.q - a.q);
  // quem não fala nem português nem inglês provavelmente lê melhor em inglês
  if (!ranked[0]) return "en";
  return ranked[0].tag.startsWith("en") ? "en" : "pt";
}

export const config = {
  matcher: ["/"],
};
